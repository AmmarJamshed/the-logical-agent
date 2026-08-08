"""Multi-agent foundation for The Logical Agent newsroom."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import structlog

from app.agents.llm.providers import generate_with_free_providers, resolve_provider
from app.core.config import get_settings
from app.core.enums import AgentType

logger = structlog.get_logger(__name__)
settings = get_settings()


@dataclass
class AgentContext:
    run_id: str = field(default_factory=lambda: str(uuid4()))
    triggered_by: str = "scheduler"
    payload: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentResult:
    success: bool
    agent_type: AgentType
    output: dict[str, Any] = field(default_factory=dict)
    artifacts: list[dict[str, Any]] = field(default_factory=list)
    tokens_used: int = 0
    error: str | None = None
    finished_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class BaseAgent(ABC):
    """Independent agent with a single responsibility."""

    agent_type: AgentType
    name: str
    description: str = ""

    def __init__(self, llm_provider: str | None = None, llm_model: str | None = None) -> None:
        auto_provider, auto_model = resolve_provider(settings)
        self.llm_provider = llm_provider or auto_provider
        self.llm_model = llm_model or auto_model

    async def run(self, context: AgentContext) -> AgentResult:
        logger.info(
            "agent.start",
            agent=self.agent_type.value,
            run_id=context.run_id,
            llm_provider=self.llm_provider,
            llm_model=self.llm_model,
        )
        try:
            result = await self.execute(context)
            logger.info(
                "agent.success",
                agent=self.agent_type.value,
                run_id=context.run_id,
                artifacts=len(result.artifacts),
            )
            return result
        except Exception as exc:  # noqa: BLE001 — top-level agent boundary
            logger.exception("agent.failed", agent=self.agent_type.value, run_id=context.run_id)
            return AgentResult(
                success=False,
                agent_type=self.agent_type,
                error=str(exc),
            )

    @abstractmethod
    async def execute(self, context: AgentContext) -> AgentResult:
        raise NotImplementedError

    async def generate_text(self, prompt: str, *, system: str | None = None) -> tuple[str, int]:
        """Generate via free-first providers (Groq, Gemini, OpenRouter, Ollama, HF)."""
        result = await generate_with_free_providers(
            prompt,
            system=system,
            provider=self.llm_provider if self.llm_provider != "offline" else None,
            model=self.llm_model if self.llm_model != "none" else None,
        )
        return result.content, result.tokens_used
