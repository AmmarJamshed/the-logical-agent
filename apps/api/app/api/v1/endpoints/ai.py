from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.llm.pool import get_model_pool, reset_model_pool
from app.agents.llm.providers import analyze_sentiment, generate_with_free_providers
from app.api.deps import require_permission
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["ai"])


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=20000)
    system: str | None = None


class SentimentRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)


@router.get("/models")
async def list_ai_models(
    user: Annotated[User, Depends(require_permission("agents:monitor"))],
) -> dict:
    _ = user
    pool = get_model_pool()
    catalog = await pool.refresh_catalog(force=True)
    return {
        "providers": ["groq", "huggingface"],
        "models": catalog,
        "policy": "auto-switch on HTTP 429/503 with cooldown escalation",
    }


@router.post("/generate")
async def generate_text(
    data: GenerateRequest,
    user: Annotated[User, Depends(require_permission("search:basic"))],
) -> dict:
    _ = user
    result = await generate_with_free_providers(data.prompt, system=data.system)
    return {
        "content": result.content,
        "provider": result.provider,
        "model": result.model,
        "tokens_used": result.tokens_used,
    }


@router.post("/sentiment")
async def sentiment(
    data: SentimentRequest,
    user: Annotated[User, Depends(require_permission("search:basic"))],
) -> dict:
    _ = user
    result = await analyze_sentiment(data.text)
    return {
        "content": result.content,
        "provider": result.provider,
        "model": result.model,
        "tokens_used": result.tokens_used,
        "sentiment": result.sentiment,
    }


@router.post("/models/reset-cooldowns")
async def reset_cooldowns(
    user: Annotated[User, Depends(require_permission("agents:control"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    _ = user, db
    reset_model_pool()
    pool = get_model_pool()
    catalog = await pool.refresh_catalog(force=True)
    return {"status": "reset", "models": catalog}
