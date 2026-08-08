"""Publishing orchestrator — research → fact check → editorial → SEO → image → queue → distribute."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

import structlog

from app.agents.base.agent import AgentContext, AgentResult, BaseAgent
from app.agents.distribution.agents import DistributionFormatterAgent
from app.agents.editorial.agents import (
    EditorialAgent,
    FactVerificationAgent,
    ImageGenerationAgent,
    SEOAgent,
)
from app.core.enums import AgentType, ArticleStatus

logger = structlog.get_logger(__name__)


PIPELINE_STEPS = (
    ArticleStatus.RESEARCH,
    ArticleStatus.FACT_CHECK,
    ArticleStatus.EDITORIAL,
    ArticleStatus.SEO,
    ArticleStatus.IMAGE,
    ArticleStatus.QUEUED,
    ArticleStatus.PUBLISHED,
)


@dataclass
class PipelineState:
    article_id: str | None = None
    title: str = ""
    draft: str = ""
    sources: list[Any] = field(default_factory=list)
    status: ArticleStatus = ArticleStatus.DRAFT
    seo: dict[str, Any] = field(default_factory=dict)
    image: dict[str, Any] = field(default_factory=dict)
    distribution: dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    step_results: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


class PublishingOrchestratorAgent(BaseAgent):
    agent_type = AgentType.PUBLISHING_ORCHESTRATOR
    name = "Publishing Orchestrator Agent"

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.fact_checker = FactVerificationAgent()
        self.editor = EditorialAgent()
        self.seo = SEOAgent()
        self.images = ImageGenerationAgent()
        self.distributor = DistributionFormatterAgent()

    async def execute(self, context: AgentContext) -> AgentResult:
        state = PipelineState(
            article_id=context.payload.get("article_id") or str(uuid4()),
            title=context.payload.get("title", "Untitled"),
            draft=context.payload.get("draft", ""),
            sources=context.payload.get("sources", []),
            status=ArticleStatus.RESEARCH,
        )

        # Research step is assumed upstream; orchestrator starts at fact verification.
        fact = await self.fact_checker.run(
            AgentContext(payload={"draft": state.draft, "sources": state.sources})
        )
        state.step_results["fact_check"] = fact.output
        state.confidence = float(fact.output.get("confidence", 0.8))
        state.status = ArticleStatus.FACT_CHECK
        if not fact.success:
            state.errors.append(fact.error or "fact_check_failed")
            return self._fail(state, fact)

        editorial = await self.editor.run(
            AgentContext(
                payload={
                    "draft": fact.output.get("verification", state.draft),
                    "article_type": context.payload.get("article_type", "analysis"),
                }
            )
        )
        state.draft = editorial.output.get("edited", state.draft)
        state.step_results["editorial"] = editorial.output
        state.status = ArticleStatus.EDITORIAL
        if not editorial.success:
            state.errors.append(editorial.error or "editorial_failed")
            return self._fail(state, editorial)

        seo = await self.seo.run(AgentContext(payload={"title": state.title, "body": state.draft}))
        state.seo = seo.output
        state.step_results["seo"] = seo.output
        state.status = ArticleStatus.SEO

        image = await self.images.run(AgentContext(payload={"title": state.title}))
        state.image = image.output.get("image", {})
        state.step_results["image"] = image.output
        state.status = ArticleStatus.IMAGE

        dist = await self.distributor.run(
            AgentContext(
                payload={
                    "title": state.title,
                    "body": state.draft,
                    "url": context.payload.get("url"),
                    "channels": context.payload.get("channels"),
                }
            )
        )
        state.distribution = dist.output.get("channel_content", {})
        state.step_results["distribution"] = dist.output
        state.status = ArticleStatus.QUEUED

        tokens = sum(
            r.tokens_used
            for r in (fact, editorial, seo, image, dist)
        )
        logger.info("pipeline.complete", article_id=state.article_id, confidence=state.confidence)
        return AgentResult(
            success=True,
            agent_type=self.agent_type,
            output={
                "article_id": state.article_id,
                "status": state.status.value,
                "draft": state.draft,
                "seo": state.seo,
                "image": state.image,
                "distribution": state.distribution,
                "confidence": state.confidence,
                "pipeline": state.step_results,
            },
            artifacts=[
                {"kind": "publish_ready", "article_id": state.article_id, "status": state.status.value}
            ],
            tokens_used=tokens,
        )

    def _fail(self, state: PipelineState, result: AgentResult) -> AgentResult:
        return AgentResult(
            success=False,
            agent_type=self.agent_type,
            output={"status": state.status.value, "pipeline": state.step_results, "errors": state.errors},
            error=result.error,
            tokens_used=result.tokens_used,
        )
