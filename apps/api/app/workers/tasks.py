import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select

from app.agents.base.agent import AgentContext
from app.agents.orchestration.publisher import PublishingOrchestratorAgent
from app.agents.registry import get_agent
from app.core.enums import AgentRunStatus, AgentType, ArticleStatus, NewsletterFrequency
from app.db.session import SyncSessionLocal
from app.models.agents import AgentDefinition, AgentRun, DistributionJob
from app.models.content import Article
from app.services.newsletter import NewsletterService
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.enqueue_agent_run", bind=True)
def enqueue_agent_run(self, agent_type: str, payload: dict | None = None) -> dict:
    payload = payload or {}
    agent_enum = AgentType(agent_type)
    with SyncSessionLocal() as db:
        run = AgentRun(
            agent_type=agent_enum,
            status=AgentRunStatus.RUNNING,
            started_at=datetime.now(timezone.utc),
            input_payload=payload,
            celery_task_id=self.request.id,
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        run_id = run.id

    agent = get_agent(agent_enum)

    async def _execute():
        return await agent.run(AgentContext(run_id=str(run_id), payload=payload))

    try:
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(_execute())
        loop.close()
    except Exception as exc:  # noqa: BLE001
        with SyncSessionLocal() as db:
            run = db.get(AgentRun, run_id)
            if run:
                run.status = AgentRunStatus.FAILED
                run.error_message = str(exc)
                run.finished_at = datetime.now(timezone.utc)
                db.commit()
        raise

    with SyncSessionLocal() as db:
        run = db.get(AgentRun, run_id)
        if run:
            run.status = AgentRunStatus.SUCCESS if result.success else AgentRunStatus.FAILED
            run.output_payload = result.output
            run.error_message = result.error
            run.tokens_used = result.tokens_used
            run.finished_at = datetime.now(timezone.utc)
        definition = db.execute(
            select(AgentDefinition).where(AgentDefinition.agent_type == agent_enum)
        ).scalar_one_or_none()
        if definition:
            definition.last_run_at = datetime.now(timezone.utc)
            if result.success:
                definition.success_count += 1
            else:
                definition.failure_count += 1
        db.commit()

    return {"run_id": str(run_id), "success": result.success, "output": result.output}


@celery_app.task(name="app.workers.tasks.enqueue_publish_pipeline")
def enqueue_publish_pipeline(article_id: str) -> dict:
    article_uuid = UUID(article_id)
    with SyncSessionLocal() as db:
        article = db.get(Article, article_uuid)
        if not article:
            return {"error": "article_not_found"}
        title = article.title
        draft = article.body_markdown
        sources = article.sources or []
        article.status = ArticleStatus.RESEARCH
        db.commit()

    orchestrator = PublishingOrchestratorAgent()

    async def _run():
        return await orchestrator.run(
            AgentContext(
                payload={
                    "article_id": article_id,
                    "title": title,
                    "draft": draft,
                    "sources": sources,
                }
            )
        )

    loop = asyncio.new_event_loop()
    result = loop.run_until_complete(_run())
    loop.close()

    with SyncSessionLocal() as db:
        article = db.get(Article, article_uuid)
        if article and result.success:
            article.body_markdown = result.output.get("draft", article.body_markdown)
            article.pipeline_state = result.output.get("pipeline", {})
            article.ai_confidence_score = result.output.get("confidence")
            article.status = ArticleStatus.QUEUED
            article.hero_image_url = (result.output.get("image") or {}).get("url")
            for channel, content in (result.output.get("distribution") or {}).items():
                db.add(
                    DistributionJob(
                        article_id=article.id,
                        channel=channel,
                        status="pending",
                        payload={"content": content},
                    )
                )
        elif article:
            article.status = ArticleStatus.REJECTED
            article.pipeline_state = {"error": result.error}
        db.commit()

    return {"article_id": article_id, "success": result.success, "status": result.output.get("status")}


@celery_app.task(name="app.workers.tasks.generate_newsletter_task")
def generate_newsletter_task(frequency: str = "daily") -> dict:
    freq = NewsletterFrequency(frequency)

    async def _gen():
        from app.db.session import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            service = NewsletterService(db)
            newsletter = await service.generate(freq)
            await db.commit()
            return str(newsletter.id)

    loop = asyncio.new_event_loop()
    newsletter_id = loop.run_until_complete(_gen())
    loop.close()
    return {"newsletter_id": newsletter_id, "frequency": frequency}
