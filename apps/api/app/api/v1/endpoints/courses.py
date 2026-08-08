from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import CourseModality, DifficultyLevel
from app.db.session import get_db
from app.models.discovery import Course
from app.schemas import CourseOut, PaginatedResponse
from app.services.core import page_meta, paginate

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=PaginatedResponse[CourseOut])
async def list_courses(
    db: Annotated[AsyncSession, Depends(get_db)],
    country: str | None = None,
    technology: str | None = None,
    provider: str | None = None,
    modality: CourseModality | None = None,
    is_free: bool | None = None,
    difficulty: DifficultyLevel | None = None,
    language: str | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[CourseOut]:
    stmt = select(Course)
    if country:
        stmt = stmt.where(Course.country_code == country.upper())
    if technology:
        stmt = stmt.where(Course.technologies.any(technology))
    if provider:
        stmt = stmt.where(Course.provider.ilike(f"%{provider}%"))
    if modality:
        stmt = stmt.where(Course.modality == modality)
    if is_free is not None:
        stmt = stmt.where(Course.is_free.is_(is_free))
    if difficulty:
        stmt = stmt.where(Course.difficulty == difficulty)
    if language:
        stmt = stmt.where(Course.language == language)
    if q:
        stmt = stmt.where(Course.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Course.is_promoted.desc(), Course.created_at.desc())
    items, total = await paginate(db, stmt, page, page_size)
    meta = page_meta(total, page, page_size)
    return PaginatedResponse[CourseOut](items=[CourseOut.model_validate(i) for i in items], **meta)
