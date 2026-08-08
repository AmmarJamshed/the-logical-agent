from datetime import date, datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.enums import (
    ArticleStatus,
    ArticleType,
    CourseModality,
    DifficultyLevel,
    NewsletterFrequency,
    SubscriptionPlan,
    UserRole,
)

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = None
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    gdpr_consent: bool = True

    @field_validator("username")
    @classmethod
    def username_slug(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not cleaned.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumeric with - or _")
        return cleaned


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str | None = None


class UserOut(ORMModel):
    id: UUID
    email: EmailStr
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    country_code: str | None
    role: UserRole
    plan: SubscriptionPlan
    is_verified: bool
    interests: list[str]
    followed_technologies: list[str]
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    country_code: str | None = None
    city: str | None = None
    website: str | None = None
    interests: list[str] | None = None
    followed_technologies: list[str] | None = None
    notification_settings: dict | None = None
    privacy_settings: dict | None = None


class ArticleCreate(BaseModel):
    title: str = Field(min_length=5, max_length=512)
    subtitle: str | None = None
    summary: str | None = None
    body_markdown: str
    article_type: ArticleType = ArticleType.USER
    technologies: list[str] = Field(default_factory=list)
    country_codes: list[str] = Field(default_factory=list)
    category_slugs: list[str] = Field(default_factory=list)
    tag_names: list[str] = Field(default_factory=list)
    is_sponsored: bool = False


class ArticleOut(ORMModel):
    id: UUID
    title: str
    slug: str
    subtitle: str | None
    summary: str | None
    body_html: str
    hero_image_url: str | None
    article_type: ArticleType
    status: ArticleStatus
    reading_time_minutes: int
    ai_confidence_score: float | None
    seo_title: str | None
    seo_description: str | None
    technologies: list[str]
    country_codes: list[str]
    sources: list
    is_sponsored: bool
    sponsored_label: str | None
    published_at: datetime | None
    view_count: int
    like_count: int
    comment_count: int
    language: str
    created_at: datetime


class CourseFilter(BaseModel):
    country: str | None = None
    technology: str | None = None
    provider: str | None = None
    modality: CourseModality | None = None
    is_free: bool | None = None
    difficulty: DifficultyLevel | None = None
    language: str | None = None
    q: str | None = None
    page: int = 1
    page_size: int = 20


class CourseOut(ORMModel):
    id: UUID
    name: str
    slug: str
    provider: str
    instructor: str | None
    country_code: str | None
    city: str | None
    modality: CourseModality
    launch_date: date | None
    registration_deadline: date | None
    duration: str | None
    difficulty: DifficultyLevel
    skills: list[str]
    technologies: list[str]
    price: float | None
    is_free: bool
    scholarships: str | None
    has_certificate: bool
    language: str
    official_website: str | None
    ai_summary: str | None
    course_type: str
    is_promoted: bool


class SearchQuery(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    filters: dict = Field(default_factory=dict)
    limit: int = Field(default=20, ge=1, le=100)


class SearchResult(BaseModel):
    entity_type: str
    id: str
    title: str
    summary: str | None = None
    score: float
    url: str | None = None
    metadata: dict = Field(default_factory=dict)


class SemanticSearchResponse(BaseModel):
    query: str
    interpretation: str
    results: list[SearchResult]
    knowledge_graph_hops: list[dict] = Field(default_factory=list)


class NewsletterSubscribe(BaseModel):
    email: EmailStr
    frequency: NewsletterFrequency = NewsletterFrequency.WEEKLY
    preferences: dict = Field(default_factory=dict)


class SocialPostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10000)
    title: str | None = None
    post_type: str = "post"
    community_id: UUID | None = None
    technologies: list[str] = Field(default_factory=list)
    media_urls: list[str] = Field(default_factory=list)


class SocialPostOut(ORMModel):
    id: UUID
    author_id: UUID
    community_id: UUID | None
    post_type: str
    title: str | None
    body: str
    technologies: list[str]
    like_count: int
    comment_count: int
    created_at: datetime


class CompanyCreate(BaseModel):
    name: str
    overview: str | None = None
    website: str | None = None
    country_code: str | None = None
    city: str | None = None
    industry: str | None = None
    technologies: list[str] = Field(default_factory=list)


class CompanyOut(ORMModel):
    id: UUID
    name: str
    slug: str
    overview: str | None
    logo_url: str | None
    website: str | None
    country_code: str | None
    industry: str | None
    technologies: list[str]
    is_verified: bool
    is_premium: bool


class AgentRunOut(ORMModel):
    id: UUID
    agent_type: str
    status: str
    started_at: datetime | None
    finished_at: datetime | None
    tokens_used: int
    error_message: str | None


class DashboardMetrics(BaseModel):
    latest_news_count: int
    ai_investment: float | None
    startup_activity: int
    universities: int
    courses: int
    certifications: int
    conferences: int
    research: int
    funding_total: float | None
    technology_rankings: dict
