from fastapi import APIRouter

from app.api.v1.endpoints import ai, articles, auth, courses, intelligence, platform, search, social

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(articles.router)
api_router.include_router(courses.router)
api_router.include_router(search.router)
api_router.include_router(social.router)
api_router.include_router(intelligence.router)
api_router.include_router(platform.router)
api_router.include_router(ai.router)
