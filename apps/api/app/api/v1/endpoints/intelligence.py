from typing import Annotated

from fastapi import APIRouter, Depends, Query
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.db.session import get_db
from app.models.content import Company, FundingRound, ResearchPaper
from app.models.monetization import JobListing
from app.models.user import User
from app.schemas import CompanyCreate, CompanyOut
from app.services.core import paginate

router = APIRouter(tags=["intelligence"])


@router.post("/companies", response_model=CompanyOut, status_code=201)
async def create_company(
    data: CompanyCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("company:manage"))],
) -> Company:
    company = Company(
        name=data.name,
        slug=slugify(data.name),
        overview=data.overview,
        website=data.website,
        country_code=data.country_code.upper() if data.country_code else None,
        city=data.city,
        industry=data.industry,
        technologies=data.technologies,
        owner_user_id=user.id,
    )
    db.add(company)
    await db.flush()
    return company


@router.get("/companies", response_model=list[CompanyOut])
async def list_companies(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str | None = None,
    country: str | None = None,
    limit: int = Query(50, le=200),
) -> list[Company]:
    stmt = select(Company)
    if q:
        stmt = stmt.where(Company.name.ilike(f"%{q}%"))
    if country:
        stmt = stmt.where(Company.country_code == country.upper())
    rows = (await db.execute(stmt.order_by(Company.is_premium.desc()).limit(limit))).scalars().all()
    return list(rows)


@router.get("/research", response_model=list[dict])
async def list_research(
    db: Annotated[AsyncSession, Depends(get_db)],
    source: str | None = None,
    limit: int = Query(50, le=200),
) -> list[dict]:
    stmt = select(ResearchPaper).order_by(ResearchPaper.published_at.desc().nullslast()).limit(limit)
    if source:
        stmt = select(ResearchPaper).where(ResearchPaper.source == source).order_by(
            ResearchPaper.published_at.desc().nullslast()
        ).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "source": r.source,
            "executive_summary": r.executive_summary,
            "url": r.url,
            "published_at": r.published_at,
            "technologies": r.technologies,
        }
        for r in rows
    ]


@router.get("/funding", response_model=list[dict])
async def list_funding(
    db: Annotated[AsyncSession, Depends(get_db)],
    country: str | None = None,
    limit: int = Query(50, le=200),
) -> list[dict]:
    stmt = select(FundingRound).order_by(FundingRound.announced_at.desc().nullslast()).limit(limit)
    if country:
        stmt = select(FundingRound).where(FundingRound.country_code == country.upper()).order_by(
            FundingRound.announced_at.desc().nullslast()
        ).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": str(f.id),
            "company_name": f.company_name,
            "round_type": f.round_type,
            "amount": float(f.amount) if f.amount else None,
            "currency": f.currency,
            "announced_at": f.announced_at,
            "ai_summary": f.ai_summary,
            "country_code": f.country_code,
        }
        for f in rows
    ]


@router.get("/jobs", response_model=list[dict])
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    technology: str | None = None,
    country: str | None = None,
    featured_only: bool = False,
    limit: int = Query(50, le=200),
) -> list[dict]:
    stmt = select(JobListing).where(JobListing.status == "open")
    if technology:
        stmt = stmt.where(JobListing.technologies.any(technology))
    if country:
        stmt = stmt.where(JobListing.country_code == country.upper())
    if featured_only:
        stmt = stmt.where(JobListing.is_featured.is_(True))
    rows = (await db.execute(stmt.order_by(JobListing.is_featured.desc()).limit(limit))).scalars().all()
    return [
        {
            "id": str(j.id),
            "title": j.title,
            "company_id": str(j.company_id),
            "location": j.location,
            "is_remote": j.is_remote,
            "technologies": j.technologies,
            "is_featured": j.is_featured,
        }
        for j in rows
    ]
