from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.core.enums import ArticleStatus
from app.db.session import get_db
from app.models.content import Article
from app.models.user import User
from app.schemas import ArticleCreate, ArticleOut, PaginatedResponse
from app.services.core import ArticleService

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=PaginatedResponse[ArticleOut])
async def list_articles(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    technology: str | None = None,
    country: str | None = None,
    q: str | None = None,
) -> PaginatedResponse[ArticleOut]:
    return await ArticleService.list_published(
        db, page=page, page_size=page_size, technology=technology, country=country, q=q
    )


@router.get("/{slug}", response_model=ArticleOut)
async def get_article(slug: str, db: Annotated[AsyncSession, Depends(get_db)]) -> Article:
    article = (await db.execute(select(Article).where(Article.slug == slug))).scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.view_count += 1
    return article


@router.post("", response_model=ArticleOut, status_code=201)
async def create_article(
    data: ArticleCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("articles:write"))],
) -> Article:
    return await ArticleService.create(db, user, data)


@router.post("/{article_id}/publish-pipeline", response_model=dict)
async def run_publish_pipeline(
    article_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("articles:write"))],
) -> dict:
    article = (await db.execute(select(Article).where(Article.id == article_id))).scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.author_id != user.id and user.role.value not in {"admin", "superadmin", "editor"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    from app.workers.tasks import enqueue_publish_pipeline

    task = enqueue_publish_pipeline.delay(str(article.id))
    article.status = ArticleStatus.RESEARCH
    return {"task_id": task.id, "article_id": str(article.id), "status": article.status.value}


@router.post("/{article_id}/publish", response_model=ArticleOut)
async def publish_article(
    article_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("articles:moderate"))],
) -> Article:
    article = (await db.execute(select(Article).where(Article.id == article_id))).scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.status = ArticleStatus.PUBLISHED
    article.published_at = datetime.now(timezone.utc)
    return article
