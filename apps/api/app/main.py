from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from starlette.responses import Response

from app.api.v1.router import api_router
from app.core.config import get_settings

try:
    from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest

    REQUEST_COUNT: Counter | None = Counter(
        "tla_http_requests_total",
        "Total HTTP requests",
        ["method", "endpoint", "status"],
    )
    PROMETHEUS_AVAILABLE = True
except ImportError:  # pragma: no cover
    CONTENT_TYPE_LATEST = "text/plain"
    REQUEST_COUNT = None
    generate_latest = None  # type: ignore[assignment]
    PROMETHEUS_AVAILABLE = False

settings = get_settings()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logger.info("startup", app=settings.app_name, env=settings.app_env)
    yield
    logger.info("shutdown")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered media, research, and social intelligence platform",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    response = await call_next(request)
    if settings.prometheus_enabled and PROMETHEUS_AVAILABLE and REQUEST_COUNT is not None:
        REQUEST_COUNT.labels(request.method, request.url.path, str(response.status_code)).inc()
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name, "env": settings.app_env}


@app.get("/metrics")
async def metrics():
    if not settings.prometheus_enabled or not PROMETHEUS_AVAILABLE or generate_latest is None:
        return JSONResponse({"detail": "disabled"}, status_code=404)
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/rss")
async def rss_feed():
    """Public RSS entrypoint — populated from published articles in production."""
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Logical Agent</title>
    <link>{app_url}</link>
    <description>Technology. Research. Intelligence.</description>
  </channel>
</rss>""".format(app_url=settings.app_url)
    return Response(content=xml, media_type="application/rss+xml")


app.include_router(api_router)
