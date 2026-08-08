from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.core.enums import AgentType, NewsletterFrequency
from app.db.session import get_db
from app.models.agents import AgentDefinition
from app.models.discovery import CountryDashboard
from app.models.user import User
from app.schemas import DashboardMetrics, NewsletterSubscribe
from app.services.newsletter import NewsletterService
from app.services.monetization import MonetizationService
from app.core.enums import SubscriptionPlan

router = APIRouter(tags=["platform"])


@router.get("/dashboards/countries/{country_code}", response_model=DashboardMetrics)
async def country_dashboard(
    country_code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardMetrics:
    dash = (
        await db.execute(
            select(CountryDashboard).where(CountryDashboard.country_code == country_code.upper())
        )
    ).scalar_one_or_none()
    if not dash:
        raise HTTPException(status_code=404, detail="Country dashboard not found")
    return DashboardMetrics(
        latest_news_count=int(dash.metrics.get("latest_news_count", 0)),
        ai_investment=float(dash.ai_investment) if dash.ai_investment else None,
        startup_activity=dash.startup_count,
        universities=dash.university_count,
        courses=dash.course_count,
        certifications=int(dash.metrics.get("certifications", 0)),
        conferences=int(dash.metrics.get("conferences", 0)),
        research=dash.research_count,
        funding_total=float(dash.funding_total_ytd) if dash.funding_total_ytd else None,
        technology_rankings=dash.technology_rankings or {},
    )


@router.get("/dashboards/topics/{topic}", response_model=dict)
async def topic_dashboard(topic: str) -> dict:
    return {
        "topic": topic,
        "sections": [
            "latest_news",
            "research",
            "startups",
            "funding",
            "courses",
            "conferences",
            "trending",
        ],
        "message": f"Topic dashboard for {topic} — hydrate via search & content APIs",
    }


@router.post("/newsletters/subscribe", response_model=dict)
async def subscribe_newsletter(
    data: NewsletterSubscribe,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    service = NewsletterService(db)
    sub = await service.subscribe(data.email, data.frequency, data.preferences)
    return {"id": str(sub.id), "email": sub.email, "frequency": sub.frequency.value}


@router.post("/newsletters/generate", response_model=dict)
async def generate_newsletter(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("newsletter:manage"))],
    frequency: NewsletterFrequency = NewsletterFrequency.DAILY,
) -> dict:
    _ = user
    service = NewsletterService(db)
    newsletter = await service.generate(frequency)
    return {
        "id": str(newsletter.id),
        "subject": newsletter.subject,
        "status": newsletter.status,
        "article_count": len(newsletter.article_ids or []),
    }


@router.get("/agents", response_model=list[dict])
async def list_agents(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("agents:monitor"))],
) -> list[dict]:
    rows = (await db.execute(select(AgentDefinition))).scalars().all()
    return [
        {
            "agent_type": a.agent_type.value,
            "name": a.name,
            "is_enabled": a.is_enabled,
            "schedule_cron": a.schedule_cron,
            "last_run_at": a.last_run_at,
            "success_count": a.success_count,
            "failure_count": a.failure_count,
        }
        for a in rows
    ]


@router.post("/agents/{agent_type}/run", response_model=dict)
async def run_agent(
    agent_type: AgentType,
    user: Annotated[User, Depends(require_permission("agents:control"))],
    payload: dict | None = None,
) -> dict:
    from app.workers.tasks import enqueue_agent_run

    _ = user
    task = enqueue_agent_run.delay(agent_type.value, payload or {})
    return {"task_id": task.id, "agent_type": agent_type.value}


@router.post("/billing/subscribe/{plan}", response_model=dict)
async def subscribe_plan(
    plan: SubscriptionPlan,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("profile:self"))],
) -> dict:
    service = MonetizationService(db)
    sub = await service.create_subscription(user, plan)
    return {"subscription_id": str(sub.id), "plan": sub.plan.value, "status": sub.status}


@router.get("/analytics/revenue", response_model=dict)
async def revenue_analytics(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permission("analytics:admin"))],
) -> dict:
    return await MonetizationService(db).revenue_summary()


@router.get("/admin/health", response_model=dict)
async def system_health(
    user: Annotated[User, Depends(require_permission("system:health"))],
) -> dict:
    return {
        "status": "ok",
        "services": {
            "api": "up",
            "database": "up",
            "redis": "up",
            "elasticsearch": "up",
            "workers": "up",
        },
    }
