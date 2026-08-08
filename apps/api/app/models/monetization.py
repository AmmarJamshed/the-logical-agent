from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
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

from app.core.enums import AdPlacement, NewsletterFrequency, PaymentStatus, SubscriptionPlan
from app.db.base import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan, name="sub_plan", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="active", index=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class Payment(Base):
    __tablename__ = "payments"

    user_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    company_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("companies.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status", values_callable=lambda x: [e.value for e in x]),
        default=PaymentStatus.PENDING,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(32))  # stripe|paypal|apple|google|bank
    provider_payment_id: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    product_type: Mapped[str] = mapped_column(String(64), index=True)
    product_id: Mapped[Optional[str]] = mapped_column(String(64))
    invoice_url: Mapped[Optional[str]] = mapped_column(String(1024))
    receipt_url: Mapped[Optional[str]] = mapped_column(String(1024))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class Advertisement(Base):
    __tablename__ = "advertisements"

    advertiser_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    company_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(255))
    placement: Mapped[AdPlacement] = mapped_column(
        Enum(AdPlacement, name="ad_placement", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    creative_url: Mapped[Optional[str]] = mapped_column(String(1024))
    headline: Mapped[Optional[str]] = mapped_column(String(255))
    body: Mapped[Optional[str]] = mapped_column(Text)
    cta_url: Mapped[str] = mapped_column(String(1024))
    targeting: Mapped[dict] = mapped_column(JSONB, default=dict)
    budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    spent: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class SponsoredContent(Base):
    __tablename__ = "sponsored_content"

    company_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("companies.id"), index=True)
    content_type: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(512))
    body: Mapped[str] = mapped_column(Text)
    article_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("articles.id"))
    targeting: Mapped[dict] = mapped_column(JSONB, default=dict)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    labeled: Mapped[bool] = mapped_column(Boolean, default=True)


class JobListing(Base):
    __tablename__ = "job_listings"

    company_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("companies.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[Optional[str]] = mapped_column(String(255))
    country_code: Mapped[Optional[str]] = mapped_column(String(2), index=True)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False)
    employment_type: Mapped[str] = mapped_column(String(64), default="full_time")
    salary_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    salary_max: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="open", index=True)
    apply_url: Mapped[Optional[str]] = mapped_column(String(1024))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class JobApplication(Base):
    __tablename__ = "job_applications"

    job_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("job_listings.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    resume_url: Mapped[Optional[str]] = mapped_column(String(1024))
    cover_letter: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="submitted")


class AffiliateOffer(Base):
    __tablename__ = "affiliate_offers"

    name: Mapped[str] = mapped_column(String(255))
    partner: Mapped[str] = mapped_column(String(128), index=True)
    category: Mapped[str] = mapped_column(String(64), index=True)
    url: Mapped[str] = mapped_column(String(1024))
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    tracking_code: Mapped[str] = mapped_column(String(64), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AffiliateClick(Base):
    __tablename__ = "affiliate_clicks"

    offer_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("affiliate_offers.id"), index=True)
    user_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    converted: Mapped[bool] = mapped_column(Boolean, default=False)
    commission_earned: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class Newsletter(Base):
    __tablename__ = "newsletters"

    title: Mapped[str] = mapped_column(String(255))
    frequency: Mapped[NewsletterFrequency] = mapped_column(
        Enum(NewsletterFrequency, name="newsletter_frequency", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(512))
    html_body: Mapped[str] = mapped_column(Text)
    text_body: Mapped[Optional[str]] = mapped_column(Text)
    article_ids: Mapped[list] = mapped_column(ARRAY(PGUUID(as_uuid=True)), default=list)
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    recipient_count: Mapped[int] = mapped_column(Integer, default=0)
    open_count: Mapped[int] = mapped_column(Integer, default=0)
    click_count: Mapped[int] = mapped_column(Integer, default=0)


class NewsletterSubscription(Base):
    __tablename__ = "newsletter_subscriptions"

    user_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    email: Mapped[str] = mapped_column(String(320), index=True)
    frequency: Mapped[NewsletterFrequency] = mapped_column(
        Enum(NewsletterFrequency, name="nl_sub_frequency", values_callable=lambda x: [e.value for e in x]),
        default=NewsletterFrequency.WEEKLY,
    )
    preferences: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class MarketplaceReport(Base):
    __tablename__ = "marketplace_reports"

    title: Mapped[str] = mapped_column(String(512))
    report_type: Mapped[str] = mapped_column(String(64), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    content_url: Mapped[Optional[str]] = mapped_column(String(1024))
    preview: Mapped[Optional[str]] = mapped_column(Text)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    is_on_demand: Mapped[bool] = mapped_column(Boolean, default=True)
    generated_by_agent: Mapped[bool] = mapped_column(Boolean, default=True)
