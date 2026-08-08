from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import AgentRunStatus, AgentType, DistributionChannel
from app.db.base import Base


class AgentDefinition(Base):
    __tablename__ = "agent_definitions"

    agent_type: Mapped[AgentType] = mapped_column(
        Enum(AgentType, name="agent_type", values_callable=lambda x: [e.value for e in x]),
        unique=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    schedule_cron: Mapped[Optional[str]] = mapped_column(String(64))
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    llm_provider: Mapped[Optional[str]] = mapped_column(String(64))
    llm_model: Mapped[Optional[str]] = mapped_column(String(128))
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    failure_count: Mapped[int] = mapped_column(Integer, default=0)


class AgentRun(Base):
    __tablename__ = "agent_runs"

    agent_type: Mapped[AgentType] = mapped_column(
        Enum(AgentType, name="agent_run_type", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    status: Mapped[AgentRunStatus] = mapped_column(
        Enum(AgentRunStatus, name="agent_run_status", values_callable=lambda x: [e.value for e in x]),
        default=AgentRunStatus.PENDING,
        index=True,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    input_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    output_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[Optional[str]] = mapped_column(String(32))
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    parent_run_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("agent_runs.id"))


class DistributionJob(Base):
    __tablename__ = "distribution_jobs"

    article_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("articles.id"), index=True)
    channel: Mapped[DistributionChannel] = mapped_column(
        Enum(DistributionChannel, name="distribution_channel", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    response: Mapped[dict] = mapped_column(JSONB, default=dict)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[Optional[str]] = mapped_column(Text)


class KnowledgeEntity(Base):
    """Nodes in the live knowledge graph used by semantic search."""

    __tablename__ = "knowledge_entities"

    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(512), index=True)
    slug: Mapped[str] = mapped_column(String(512), index=True)
    properties: Mapped[dict] = mapped_column(JSONB, default=dict)
    embeddings_id: Mapped[Optional[str]] = mapped_column(String(128))
    source_table: Mapped[Optional[str]] = mapped_column(String(64))
    source_id: Mapped[Optional[str]] = mapped_column(String(64), index=True)


class KnowledgeRelation(Base):
    __tablename__ = "knowledge_relations"

    source_entity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("knowledge_entities.id"), index=True
    )
    target_entity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("knowledge_entities.id"), index=True
    )
    relation_type: Mapped[str] = mapped_column(String(64), index=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    properties: Mapped[dict] = mapped_column(JSONB, default=dict)
