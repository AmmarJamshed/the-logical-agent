from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_optional, require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas import SearchQuery, SemanticSearchResponse
from app.services.search import SemanticSearchService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SemanticSearchResponse)
async def semantic_search(
    data: SearchQuery,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> SemanticSearchResponse:
    # Free plan: basic; Pro+: unlimited (enforced lightly here)
    limit = data.limit
    if user is None or user.plan.value == "free":
        limit = min(limit, 10)
    service = SemanticSearchService(db)
    return await service.search(data.query, limit=limit, filters=data.filters)
