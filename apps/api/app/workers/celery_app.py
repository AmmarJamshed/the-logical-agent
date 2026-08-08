from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "the_logical_agent",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    beat_schedule={
        "global-tech-news-hourly": {
            "task": "app.workers.tasks.enqueue_agent_run",
            "schedule": crontab(minute=0),
            "args": ("global_tech_news", {}),
        },
        "ai-research-every-6h": {
            "task": "app.workers.tasks.enqueue_agent_run",
            "schedule": crontab(minute=15, hour="*/6"),
            "args": ("ai_research", {}),
        },
        "course-discovery-daily": {
            "task": "app.workers.tasks.enqueue_agent_run",
            "schedule": crontab(minute=30, hour=6),
            "args": ("course_discovery", {}),
        },
        "funding-agent-every-4h": {
            "task": "app.workers.tasks.enqueue_agent_run",
            "schedule": crontab(minute=45, hour="*/4"),
            "args": ("funding", {}),
        },
        "daily-newsletter": {
            "task": "app.workers.tasks.generate_newsletter_task",
            "schedule": crontab(minute=0, hour=7),
            "args": ("daily",),
        },
        "weekly-newsletter": {
            "task": "app.workers.tasks.generate_newsletter_task",
            "schedule": crontab(minute=0, hour=8, day_of_week="mon"),
            "args": ("weekly",),
        },
    },
)
