from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ArticleStatus, ArticleType
from app.db.base import Base


class Category(Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    parent_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("categories.id"))
    icon: Mapped[Optional[str]] = mapped_column(String(64))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Tag(Base):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(64), unique=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)


class Article(Base):
    __tablename__ = "articles"

    title: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    subtitle: Mapped[Optional[str]] = mapped_column(String(1024))
    summary: Mapped[Optional[str]] = mapped_column(Text)
    body_markdown: Mapped[str] = mapped_column(Text, default="")
    body_html: Mapped[str] = mapped_column(Text, default="")
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(1024))
    article_type: Mapped[ArticleType] = mapped_column(
        Enum(ArticleType, name="article_type", values_callable=lambda x: [e.value for e in x]),
        default=ArticleType.ANALYSIS,
        index=True,
    )
    status: Mapped[ArticleStatus] = mapped_column(
        Enum(ArticleStatus, name="article_status", values_callable=lambda x: [e.value for e in x]),
        default=ArticleStatus.DRAFT,
        index=True,
    )
    author_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    agent_source: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    country_codes: Mapped[list] = mapped_column(ARRAY(String), default=list)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    companies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    universities: Mapped[list] = mapped_column(ARRAY(String), default=list)
    reading_time_minutes: Mapped[int] = mapped_column(Integer, default=1)
    ai_confidence_score: Mapped[Optional[float]] = mapped_column(Float)
    seo_title: Mapped[Optional[str]] = mapped_column(String(256))
    seo_description: Mapped[Optional[str]] = mapped_column(String(512))
    seo_keywords: Mapped[list] = mapped_column(ARRAY(String), default=list)
    sources: Mapped[list] = mapped_column(JSONB, default=list)
    related_article_ids: Mapped[list] = mapped_column(ARRAY(PGUUID(as_uuid=True)), default=list)
    is_sponsored: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    sponsored_label: Mapped[Optional[str]] = mapped_column(String(64))
    sponsor_company_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("companies.id"))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    share_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    pipeline_state: Mapped[dict] = mapped_column(JSONB, default=dict)
    embeddings_id: Mapped[Optional[str]] = mapped_column(String(128))
    language: Mapped[str] = mapped_column(String(8), default="en")
    translations: Mapped[dict] = mapped_column(JSONB, default=dict)

    categories: Mapped[list["ArticleCategory"]] = relationship(back_populates="article")
    tags: Mapped[list["ArticleTag"]] = relationship(back_populates="article")


class ArticleCategory(Base):
    __tablename__ = "article_categories"

    article_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("articles.id"), index=True)
    category_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("categories.id"), index=True)
    article: Mapped[Article] = relationship(back_populates="categories")


class ArticleTag(Base):
    __tablename__ = "article_tags"

    article_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("articles.id"), index=True)
    tag_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tags.id"), index=True)
    article: Mapped[Article] = relationship(back_populates="tags")


class Company(Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    overview: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024))
    website: Mapped[Optional[str]] = mapped_column(String(512))
    country_code: Mapped[Optional[str]] = mapped_column(String(2), index=True)
    city: Mapped[Optional[str]] = mapped_column(String(128))
    industry: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    products: Mapped[list] = mapped_column(JSONB, default=list)
    funding_total: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    employee_count: Mapped[Optional[int]] = mapped_column(Integer)
    founded_year: Mapped[Optional[int]] = mapped_column(Integer)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    owner_user_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    careers_url: Mapped[Optional[str]] = mapped_column(String(512))
    social_links: Mapped[dict] = mapped_column(JSONB, default=dict)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class ResearchPaper(Base):
    __tablename__ = "research_papers"

    title: Mapped[str] = mapped_column(String(1024), nullable=False, index=True)
    abstract: Mapped[Optional[str]] = mapped_column(Text)
    authors: Mapped[list] = mapped_column(JSONB, default=list)
    source: Mapped[str] = mapped_column(String(64), index=True)  # arxiv|ieee|acm|nature|science|university
    source_id: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    url: Mapped[Optional[str]] = mapped_column(String(1024))
    pdf_url: Mapped[Optional[str]] = mapped_column(String(1024))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True)
    categories: Mapped[list] = mapped_column(ARRAY(String), default=list)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    executive_summary: Mapped[Optional[str]] = mapped_column(Text)
    beginner_version: Mapped[Optional[str]] = mapped_column(Text)
    technical_version: Mapped[Optional[str]] = mapped_column(Text)
    key_findings: Mapped[list] = mapped_column(JSONB, default=list)
    business_impact: Mapped[Optional[str]] = mapped_column(Text)
    future_predictions: Mapped[Optional[str]] = mapped_column(Text)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_confidence_score: Mapped[Optional[float]] = mapped_column(Float)
    embeddings_id: Mapped[Optional[str]] = mapped_column(String(128))


class FundingRound(Base):
    __tablename__ = "funding_rounds"

    company_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("companies.id"), index=True)
    company_name: Mapped[str] = mapped_column(String(255), index=True)
    round_type: Mapped[str] = mapped_column(String(64), index=True)  # seed|series_a|ipo|acquisition
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    investors: Mapped[list] = mapped_column(JSONB, default=list)
    announced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(2), index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(128))
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    market_analysis: Mapped[Optional[str]] = mapped_column(Text)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    industry_impact: Mapped[Optional[str]] = mapped_column(Text)
    source_url: Mapped[Optional[str]] = mapped_column(String(1024))
