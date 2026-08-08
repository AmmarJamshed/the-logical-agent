from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Community(Base):
    __tablename__ = "communities"

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    cover_url: Mapped[Optional[str]] = mapped_column(String(1024))
    owner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    member_count: Mapped[int] = mapped_column(Integer, default=0)
    rules: Mapped[list] = mapped_column(JSONB, default=list)


class CommunityMember(Base):
    __tablename__ = "community_members"
    __table_args__ = (UniqueConstraint("community_id", "user_id", name="uq_community_member"),)

    community_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("communities.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(32), default="member")  # member|moderator|admin


class SocialPost(Base):
    __tablename__ = "social_posts"

    author_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    community_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("communities.id"), index=True
    )
    post_type: Mapped[str] = mapped_column(String(32), default="post")  # post|research|blog|project
    title: Mapped[Optional[str]] = mapped_column(String(512))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    media_urls: Mapped[list] = mapped_column(JSONB, default=list)
    technologies: Mapped[list] = mapped_column(ARRAY(String), default=list)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    share_count: Mapped[int] = mapped_column(Integer, default=0)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    moderation_status: Mapped[str] = mapped_column(String(32), default="approved")

    author: Mapped["User"] = relationship(back_populates="posts")  # noqa: F821


class Comment(Base):
    __tablename__ = "comments"

    author_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(32), index=True)  # article|post
    target_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    parent_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("comments.id"))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", "reaction_type", name="uq_reaction"),
    )

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(32), index=True)
    target_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    reaction_type: Mapped[str] = mapped_column(String(32), default="like")


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "target_type", "target_id", name="uq_bookmark"),)

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(32))
    target_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    folder: Mapped[Optional[str]] = mapped_column(String(64))


class DirectMessage(Base):
    __tablename__ = "direct_messages"

    conversation_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)
    sender_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    recipient_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class DebateRoom(Base):
    __tablename__ = "debate_rooms"

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    host_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    is_ai_moderated: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    participant_count: Mapped[int] = mapped_column(Integer, default=0)
    messages: Mapped[list] = mapped_column(JSONB, default=list)
