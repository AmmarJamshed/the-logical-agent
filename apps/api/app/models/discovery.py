from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import CourseModality, DifficultyLevel
from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(255), index=True)
    instructor: Mapped[Optional[str]] = mapped_column(String(255))
    country_code: Mapped[Optional[str]] = mapped_column(String(2), index=True)
    city: Mapped[Optional[str]] = mapped_column(String(128))
    modality: Mapped[CourseModality] = mapped_column(
        Enum(CourseModality, name="course_modality", values_callable=lambda x: [e.value for e in x]),
        default=CourseModality.ONLINE,
        index=True,
    )
    launch_date: Mapped[Optional[date]] = mapped_column(Date)
    registration_deadline: Mapped[Optional[date]] = mapped_column(Date)
    duration: Mapped[Optional[str]] = mapped_column(String(128))
    difficulty: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel, name="difficulty_level", values_callable=lambda x: [e.value for e in x]),
        default=DifficultyLevel.BEGINNER,
        index=True,
    )
    skills: Mapped[list] = mapped_column(ARRAY(String), default=list)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    scholarships: Mapped[Optional[str]] = mapped_column(Text)
    has_certificate: Mapped[bool] = mapped_column(Boolean, default=False)
    language: Mapped[str] = mapped_column(String(8), default="en", index=True)
    official_website: Mapped[Optional[str]] = mapped_column(String(1024))
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    course_type: Mapped[str] = mapped_column(
        String(64), default="course", index=True
    )  # course|program|certification|bootcamp|workshop|fellowship|scholarship
    is_promoted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    promotion_score: Mapped[int] = mapped_column(Integer, default=0)
    source_agent: Mapped[Optional[str]] = mapped_column(String(64))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class University(Base):
    __tablename__ = "universities"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    country_code: Mapped[str] = mapped_column(String(2), index=True)
    city: Mapped[Optional[str]] = mapped_column(String(128))
    website: Mapped[Optional[str]] = mapped_column(String(512))
    ranking: Mapped[Optional[int]] = mapped_column(Integer)
    ai_programs: Mapped[list] = mapped_column(JSONB, default=list)
    research_focus: Mapped[list] = mapped_column(ARRAY(String), default=list)
    description: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024))


class Conference(Base):
    __tablename__ = "conferences"

    name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_date: Mapped[Optional[date]] = mapped_column(Date, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    country_code: Mapped[Optional[str]] = mapped_column(String(2), index=True)
    city: Mapped[Optional[str]] = mapped_column(String(128))
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    website: Mapped[Optional[str]] = mapped_column(String(1024))
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    organizers: Mapped[list] = mapped_column(JSONB, default=list)
    ticket_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    is_promoted: Mapped[bool] = mapped_column(Boolean, default=False)
    event_type: Mapped[str] = mapped_column(String(64), default="conference")  # conference|meetup|webinar|hackathon


class CountryDashboard(Base):
    __tablename__ = "country_dashboards"

    country_code: Mapped[str] = mapped_column(String(2), unique=True, index=True)
    country_name: Mapped[str] = mapped_column(String(128))
    ai_investment: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    startup_count: Mapped[int] = mapped_column(Integer, default=0)
    university_count: Mapped[int] = mapped_column(Integer, default=0)
    course_count: Mapped[int] = mapped_column(Integer, default=0)
    research_count: Mapped[int] = mapped_column(Integer, default=0)
    funding_total_ytd: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    technology_rankings: Mapped[dict] = mapped_column(JSONB, default=dict)
    government_policies: Mapped[list] = mapped_column(JSONB, default=list)
    metrics: Mapped[dict] = mapped_column(JSONB, default=dict)
    last_refreshed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class TechnologyTopic(Base):
    __tablename__ = "technology_topics"

    name: Mapped[str] = mapped_column(String(128), unique=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    parent_slug: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    article_count: Mapped[int] = mapped_column(Integer, default=0)
    trending_score: Mapped[float] = mapped_column(Numeric(10, 4), default=0)
