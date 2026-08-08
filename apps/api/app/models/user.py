from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import SubscriptionPlan, UserRole
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024))
    cover_url: Mapped[Optional[str]] = mapped_column(String(1024))
    country_code: Mapped[Optional[str]] = mapped_column(String(2), index=True)
    city: Mapped[Optional[str]] = mapped_column(String(128))
    website: Mapped[Optional[str]] = mapped_column(String(512))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=lambda x: [e.value for e in x]),
        default=UserRole.READER,
        index=True,
    )
    plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan, name="subscription_plan", values_callable=lambda x: [e.value for e in x]),
        default=SubscriptionPlan.FREE,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(64))
    oauth_providers: Mapped[dict] = mapped_column(JSONB, default=dict)
    interests: Mapped[list] = mapped_column(ARRAY(String), default=list)
    followed_technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    followed_countries: Mapped[list] = mapped_column(ARRAY(String), default=list)
    privacy_settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    notification_settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    gdpr_consent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(128), index=True)

    profile: Mapped[Optional["UserProfile"]] = relationship(back_populates="user", uselist=False)
    posts: Mapped[list["SocialPost"]] = relationship(back_populates="author")  # noqa: F821


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    headline: Mapped[Optional[str]] = mapped_column(String(255))
    about: Mapped[Optional[str]] = mapped_column(Text)
    skills: Mapped[list] = mapped_column(ARRAY(String), default=list)
    experience: Mapped[list] = mapped_column(JSONB, default=list)
    education: Mapped[list] = mapped_column(JSONB, default=list)
    projects: Mapped[list] = mapped_column(JSONB, default=list)
    certifications: Mapped[list] = mapped_column(JSONB, default=list)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(512))
    github_url: Mapped[Optional[str]] = mapped_column(String(512))
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(512))
    resume_url: Mapped[Optional[str]] = mapped_column(String(1024))
    open_to_work: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="profile")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow_pair"),)

    follower_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    following_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    follow_type: Mapped[str] = mapped_column(String(32), default="user")  # user|technology|company|university


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512))
    ip_address: Mapped[Optional[str]] = mapped_column(String(64))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    actor_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    resource_type: Mapped[str] = mapped_column(String(64), index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(64))
    ip_address: Mapped[Optional[str]] = mapped_column(String(64))
    user_agent: Mapped[Optional[str]] = mapped_column(String(512))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    severity: Mapped[str] = mapped_column(String(16), default="info")
