from datetime import datetime, timezone

from jinja2 import Template
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base.agent import AgentContext
from app.agents.editorial.agents import NewsletterAgent
from app.core.enums import ArticleStatus, NewsletterFrequency
from app.models.content import Article
from app.models.monetization import Newsletter, NewsletterSubscription

EMAIL_TEMPLATE = Template(
    """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>{{ subject }}</title>
  <style>
    body { font-family: 'Source Serif 4', Georgia, serif; background:#0b1220; color:#e8eef8; margin:0; }
    .wrap { max-width:640px; margin:0 auto; padding:32px 24px; }
    .brand { font-family: 'IBM Plex Sans', sans-serif; letter-spacing:0.08em; text-transform:uppercase; color:#7dd3fc; font-size:12px; }
    h1 { font-size:28px; line-height:1.25; margin:12px 0 8px; }
    .item { border-top:1px solid #1f2a44; padding:18px 0; }
    .item h2 { font-size:18px; margin:0 0 6px; }
    .meta { color:#94a3b8; font-size:12px; font-family:'IBM Plex Sans',sans-serif; }
    a { color:#38bdf8; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">The Logical Agent — Technology. Research. Intelligence.</div>
    <h1>{{ subject }}</h1>
    <p>{{ intro }}</p>
    {% for article in articles %}
      <div class="item">
        <div class="meta">{{ article.reading_time_minutes }} min · {{ article.technologies[:3]|join(', ') }}</div>
        <h2><a href="{{ app_url }}/articles/{{ article.slug }}">{{ article.title }}</a></h2>
        <p>{{ article.summary }}</p>
      </div>
    {% endfor %}
  </div>
</body>
</html>
"""
)


class NewsletterService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.agent = NewsletterAgent()

    async def subscribe(self, email: str, frequency: NewsletterFrequency, preferences: dict) -> NewsletterSubscription:
        existing = (
            await self.db.execute(
                select(NewsletterSubscription).where(NewsletterSubscription.email == email.lower())
            )
        ).scalar_one_or_none()
        if existing:
            existing.frequency = frequency
            existing.preferences = preferences
            existing.is_active = True
            return existing
        sub = NewsletterSubscription(
            email=email.lower(),
            frequency=frequency,
            preferences=preferences,
            confirmed_at=datetime.now(timezone.utc),
        )
        self.db.add(sub)
        await self.db.flush()
        return sub

    async def generate(
        self,
        frequency: NewsletterFrequency,
        *,
        preferences: dict | None = None,
        app_url: str = "http://localhost:3000",
    ) -> Newsletter:
        articles = (
            await self.db.execute(
                select(Article)
                .where(Article.status == ArticleStatus.PUBLISHED)
                .order_by(Article.published_at.desc().nullslast())
                .limit(12)
            )
        ).scalars().all()
        agent_result = await self.agent.run(
            AgentContext(
                payload={
                    "frequency": frequency.value,
                    "articles": [{"title": a.title, "summary": a.summary} for a in articles],
                    "preferences": preferences or {},
                }
            )
        )
        subject = f"The Logical Agent — {frequency.value.title()} Briefing"
        html = EMAIL_TEMPLATE.render(
            subject=subject,
            intro=agent_result.output.get("newsletter", "Your personalized technology intelligence."),
            articles=articles,
            app_url=app_url,
        )
        newsletter = Newsletter(
            title=subject,
            frequency=frequency,
            subject=subject,
            html_body=html,
            text_body=agent_result.output.get("newsletter"),
            article_ids=[a.id for a in articles],
            status="ready",
            scheduled_at=datetime.now(timezone.utc),
        )
        self.db.add(newsletter)
        await self.db.flush()
        return newsletter
