from __future__ import annotations

import math
import re
from typing import Sequence
from uuid import UUID

from slugify import slugify
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ArticleStatus
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.content import Article, Category, Company, Tag
from app.models.user import AuditLog, User
from app.schemas import ArticleCreate, PaginatedResponse, UserRegister


def estimate_reading_time(text: str) -> int:
    words = len(re.findall(r"\w+", text))
    return max(1, math.ceil(words / 220))


def markdown_to_html(markdown: str) -> str:
    # Lightweight converter; production can swap to mistune/markdown-it.
    html = markdown
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)
    paragraphs = [f"<p>{p.strip()}</p>" for p in html.split("\n\n") if p.strip()]
    return "\n".join(paragraphs)


async def paginate(db: AsyncSession, stmt: Select, page: int, page_size: int) -> tuple[Sequence, int]:
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))
    return result.scalars().all(), total


def page_meta(total: int, page: int, page_size: int) -> dict:
    pages = max(1, math.ceil(total / page_size)) if page_size else 1
    return {"total": total, "page": page, "page_size": page_size, "pages": pages}


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, data: UserRegister) -> User:
        existing = await db.execute(
            select(User).where((User.email == data.email) | (User.username == data.username))
        )
        if existing.scalar_one_or_none():
            raise ValueError("Email or username already registered")
        user = User(
            email=data.email.lower(),
            username=data.username,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            country_code=data.country_code.upper() if data.country_code else None,
            is_email_verified=False,
            gdpr_consent_at=__import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            )
            if data.gdpr_consent
            else None,
        )
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> User:
        result = await db.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
        if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")
        if not user.is_active:
            raise ValueError("Account disabled")
        return user

    @staticmethod
    def issue_tokens(user: User) -> dict[str, str]:
        return {
            "access_token": create_access_token(user.id, extra={"role": user.role.value}),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
        }


class ArticleService:
    @staticmethod
    async def create(db: AsyncSession, author: User, data: ArticleCreate) -> Article:
        base_slug = slugify(data.title)[:200]
        slug = base_slug
        i = 1
        while (await db.execute(select(Article).where(Article.slug == slug))).scalar_one_or_none():
            slug = f"{base_slug}-{i}"
            i += 1
        article = Article(
            title=data.title,
            slug=slug,
            subtitle=data.subtitle,
            summary=data.summary,
            body_markdown=data.body_markdown,
            body_html=markdown_to_html(data.body_markdown),
            article_type=data.article_type,
            status=ArticleStatus.DRAFT,
            author_id=author.id,
            technologies=data.technologies,
            country_codes=[c.upper() for c in data.country_codes],
            reading_time_minutes=estimate_reading_time(data.body_markdown),
            is_sponsored=data.is_sponsored,
            sponsored_label="Sponsored" if data.is_sponsored else None,
        )
        db.add(article)
        await db.flush()
        return article

    @staticmethod
    async def list_published(
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        technology: str | None = None,
        country: str | None = None,
        q: str | None = None,
    ) -> PaginatedResponse:
        stmt = select(Article).where(Article.status == ArticleStatus.PUBLISHED)
        if technology:
            stmt = stmt.where(Article.technologies.any(technology))
        if country:
            stmt = stmt.where(Article.country_codes.any(country.upper()))
        if q:
            stmt = stmt.where(Article.title.ilike(f"%{q}%"))
        stmt = stmt.order_by(Article.published_at.desc().nullslast())
        items, total = await paginate(db, stmt, page, page_size)
        meta = page_meta(total, page, page_size)
        from app.schemas import ArticleOut

        return PaginatedResponse[ArticleOut](
            items=[ArticleOut.model_validate(i) for i in items],
            **meta,
        )


class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        *,
        actor_id: UUID | None,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        db.add(
            AuditLog(
                actor_id=actor_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata_=metadata or {},
            )
        )
