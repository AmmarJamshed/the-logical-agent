"""Seed demo data for local development."""

from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from slugify import slugify
from sqlalchemy import select

from app.core.enums import (
    AgentType,
    ArticleStatus,
    ArticleType,
    CourseModality,
    DifficultyLevel,
    UserRole,
)
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models import (
    AgentDefinition,
    Article,
    Category,
    Company,
    Conference,
    CountryDashboard,
    Course,
    FundingRound,
    ResearchPaper,
    TechnologyTopic,
    University,
    User,
)


AGENTS = [
    (AgentType.GLOBAL_TECH_NEWS, "Global Technology News Agent", "0 * * * *"),
    (AgentType.AI_RESEARCH, "AI Research Agent", "15 */6 * * *"),
    (AgentType.RESEARCH_PAPER, "Research Paper Agent", "0 */12 * * *"),
    (AgentType.STARTUP_INTELLIGENCE, "Startup Intelligence Agent", "30 */4 * * *"),
    (AgentType.VENTURE_CAPITAL, "Venture Capital Agent", "45 */6 * * *"),
    (AgentType.FUNDING, "Funding Agent", "45 */4 * * *"),
    (AgentType.QUANTUM, "Quantum Computing Agent", "0 9 * * *"),
    (AgentType.CYBERSECURITY, "Cybersecurity Agent", "0 */8 * * *"),
    (AgentType.BLOCKCHAIN, "Blockchain Agent", "0 10 * * *"),
    (AgentType.OPEN_SOURCE, "Open Source Agent", "0 11 * * *"),
    (AgentType.SOFTWARE_ENGINEERING, "Software Engineering Agent", "0 12 * * *"),
    (AgentType.PROGRAMMING_LANGUAGES, "Programming Languages Agent", "0 13 * * *"),
    (AgentType.CLOUD, "Cloud Computing Agent", "0 14 * * *"),
    (AgentType.UNIVERSITY, "University Agent", "0 6 * * 1"),
    (AgentType.COURSE_DISCOVERY, "Course Discovery Agent", "30 6 * * *"),
    (AgentType.CERTIFICATION, "Certification Discovery Agent", "0 7 * * *"),
    (AgentType.GOVERNMENT_POLICY, "Government Policy Agent", "0 8 * * 1"),
    (AgentType.CONFERENCE, "Conference Agent", "0 9 * * 2"),
    (AgentType.HACKATHON, "Hackathon Agent", "0 9 * * 3"),
    (AgentType.SEO, "SEO Agent", None),
    (AgentType.EDITORIAL, "Editorial Agent", None),
    (AgentType.FACT_VERIFICATION, "Fact Verification Agent", None),
    (AgentType.IMAGE_GENERATION, "Image Generation Agent", None),
    (AgentType.NEWSLETTER, "Newsletter Agent", "0 7 * * *"),
    (AgentType.TRANSLATION, "Translation Agent", None),
    (AgentType.ANALYTICS, "Analytics Agent", "0 1 * * *"),
    (AgentType.COMMUNITY_MODERATION, "Community Moderation Agent", "*/15 * * * *"),
    (AgentType.PUBLISHING_ORCHESTRATOR, "Publishing Orchestrator Agent", None),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == "admin@thelogicalagent.com"))).scalar_one_or_none()
        if existing:
            print("Seed already applied.")
            return

        admin = User(
            email="admin@thelogicalagent.com",
            username="admin",
            hashed_password=hash_password("ChangeMeAdmin123!"),
            full_name="Platform Admin",
            role=UserRole.SUPERADMIN,
            is_verified=True,
            is_email_verified=True,
            country_code="US",
            interests=["ai", "quantum", "cybersecurity"],
            followed_technologies=["ai", "llm", "agents"],
            gdpr_consent_at=datetime.now(timezone.utc),
        )
        editor = User(
            email="editor@thelogicalagent.com",
            username="editor",
            hashed_password=hash_password("ChangeMeEditor123!"),
            full_name="Editorial Desk",
            role=UserRole.EDITOR,
            is_verified=True,
            is_email_verified=True,
            country_code="GB",
        )
        db.add_all([admin, editor])
        await db.flush()

        for agent_type, name, cron in AGENTS:
            db.add(
                AgentDefinition(
                    agent_type=agent_type,
                    name=name,
                    description=f"Autonomous agent: {name}",
                    is_enabled=True,
                    schedule_cron=cron,
                    config={},
                )
            )

        categories = [
            ("Artificial Intelligence", "artificial-intelligence"),
            ("Quantum Computing", "quantum-computing"),
            ("Cybersecurity", "cybersecurity"),
            ("Startups", "startups"),
            ("Research", "research"),
            ("Cloud", "cloud"),
        ]
        for name, slug in categories:
            db.add(Category(name=name, slug=slug, description=f"{name} coverage"))

        for topic in ["AI", "Quantum", "Cybersecurity", "Cloud", "Blockchain", "Open Source"]:
            db.add(
                TechnologyTopic(
                    name=topic,
                    slug=slugify(topic),
                    description=f"{topic} intelligence dashboard",
                    trending_score=Decimal("80.5"),
                )
            )

        company = Company(
            name="Aurora Neural",
            slug="aurora-neural",
            overview="Enterprise agentic AI platform.",
            website="https://example.com/aurora",
            country_code="US",
            city="San Francisco",
            industry="Artificial Intelligence",
            technologies=["ai", "agents", "llm"],
            is_verified=True,
            is_premium=True,
            funding_total=Decimal("120000000"),
        )
        db.add(company)
        await db.flush()

        article = Article(
            title="Agentic AI Moves From Demo to Production Infrastructure",
            slug="agentic-ai-production-infrastructure",
            subtitle="Enterprises are wiring autonomous agents into mission-critical workflows.",
            summary="A new wave of production deployments signals the maturation of agentic AI stacks.",
            body_markdown=(
                "# Agentic AI in Production\n\n"
                "Enterprises are shifting from prototypes to governed multi-agent systems.\n\n"
                "## Why it matters\n\n"
                "Reliability, evaluation, and orchestration are now first-class concerns."
            ),
            body_html="<h1>Agentic AI in Production</h1><p>Enterprises are shifting from prototypes...</p>",
            article_type=ArticleType.ANALYSIS,
            status=ArticleStatus.PUBLISHED,
            author_id=editor.id,
            agent_source="global_tech_news",
            country_codes=["US", "GB", "DE"],
            technologies=["ai", "agents", "llm"],
            companies=["Aurora Neural"],
            reading_time_minutes=4,
            ai_confidence_score=0.91,
            seo_title="Agentic AI Production Infrastructure",
            seo_description="How agentic AI is entering enterprise production stacks.",
            seo_keywords=["agentic ai", "llm", "orchestration"],
            sources=[{"title": "Industry brief", "url": "https://example.com/source"}],
            published_at=datetime.now(timezone.utc) - timedelta(hours=3),
            hero_image_url="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600",
        )
        db.add(article)

        db.add(
            Course(
                name="Applied Agentic AI Engineering",
                slug="applied-agentic-ai-engineering",
                provider="Logical Academy",
                instructor="Dr. Maya Chen",
                country_code="DE",
                city="Berlin",
                modality=CourseModality.ONLINE,
                launch_date=date.today() + timedelta(days=14),
                registration_deadline=date.today() + timedelta(days=10),
                duration="8 weeks",
                difficulty=DifficultyLevel.ADVANCED,
                skills=["orchestration", "evaluation", "tool use"],
                technologies=["ai", "python", "langgraph"],
                price=Decimal("899"),
                is_free=False,
                has_certificate=True,
                language="en",
                official_website="https://example.com/courses/agentic",
                ai_summary="Hands-on program for building production multi-agent systems.",
                course_type="course",
                is_promoted=True,
            )
        )
        db.add(
            Course(
                name="Cybersecurity Fundamentals for AI Systems",
                slug="cybersecurity-fundamentals-ai",
                provider="TU Munich Extension",
                instructor="Prof. Keller",
                country_code="DE",
                modality=CourseModality.HYBRID,
                difficulty=DifficultyLevel.INTERMEDIATE,
                skills=["threat modeling", "secure ml"],
                technologies=["cybersecurity", "ai"],
                price=Decimal("0"),
                is_free=True,
                has_certificate=True,
                language="en",
                ai_summary="Free certification-oriented course on securing AI systems.",
                course_type="certification",
            )
        )

        db.add(
            University(
                name="MIT",
                slug="mit",
                country_code="US",
                city="Cambridge",
                website="https://mit.edu",
                ranking=1,
                ai_programs=[{"name": "AI & Decision Making", "level": "graduate"}],
                research_focus=["ai", "robotics", "quantum"],
                description="Leading research university.",
            )
        )
        db.add(
            ResearchPaper(
                title="Scalable Multi-Agent Evaluation Protocols",
                abstract="We propose evaluation protocols for autonomous agent fleets.",
                authors=[{"name": "A. Rivera"}, {"name": "S. Okonkwo"}],
                source="arxiv",
                source_id="2608.12345",
                url="https://arxiv.org/abs/2608.12345",
                published_at=datetime.now(timezone.utc) - timedelta(days=2),
                categories=["cs.AI"],
                technologies=["ai", "agents"],
                executive_summary="A practical framework for evaluating multi-agent reliability.",
                beginner_version="Researchers propose better ways to test AI agent teams.",
                technical_version="Protocol defines trajectory metrics, tool-use fidelity, and regression suites.",
                key_findings=["Evaluation must be continuous", "Tool fidelity dominates failures"],
                business_impact="Enterprises can gate agent releases with measurable SLOs.",
                future_predictions="Agent eval benchmarks become procurement requirements.",
                ai_confidence_score=0.88,
            )
        )
        db.add(
            FundingRound(
                company_id=company.id,
                company_name="Aurora Neural",
                round_type="series_b",
                amount=Decimal("80000000"),
                currency="USD",
                investors=[{"name": "Horizon Ventures"}, {"name": "Northwind Capital"}],
                announced_at=datetime.now(timezone.utc) - timedelta(days=1),
                country_code="US",
                industry="Artificial Intelligence",
                technologies=["ai", "agents"],
                ai_summary="Aurora Neural raised $80M to scale enterprise agent infrastructure.",
                market_analysis="Agent infra category consolidating around observability and orchestration.",
                industry_impact="Accelerates enterprise adoption of multi-agent workflows.",
            )
        )
        db.add(
            Conference(
                name="Agent Summit 2026",
                slug="agent-summit-2026",
                description="Global conference on autonomous AI systems.",
                start_date=date.today() + timedelta(days=60),
                end_date=date.today() + timedelta(days=62),
                country_code="US",
                city="Austin",
                technologies=["ai", "agents"],
                is_promoted=True,
                event_type="conference",
            )
        )
        db.add(
            CountryDashboard(
                country_code="DE",
                country_name="Germany",
                ai_investment=Decimal("4500000000"),
                startup_count=1280,
                university_count=85,
                course_count=420,
                research_count=3100,
                funding_total_ytd=Decimal("2100000000"),
                technology_rankings={"ai": 8, "cybersecurity": 5, "quantum": 4},
                government_policies=[{"title": "AI Act alignment", "year": 2026}],
                metrics={"latest_news_count": 42, "certifications": 65, "conferences": 18},
                last_refreshed_at=datetime.now(timezone.utc),
            )
        )
        db.add(
            CountryDashboard(
                country_code="US",
                country_name="United States",
                ai_investment=Decimal("62000000000"),
                startup_count=18400,
                university_count=420,
                course_count=9200,
                research_count=48000,
                funding_total_ytd=Decimal("78000000000"),
                technology_rankings={"ai": 1, "cloud": 1, "cybersecurity": 1},
                metrics={"latest_news_count": 210, "certifications": 900, "conferences": 140},
                last_refreshed_at=datetime.now(timezone.utc),
            )
        )

        await db.commit()
        print("Seed complete.")
        print("Admin: admin@thelogicalagent.com / ChangeMeAdmin123!")
        print("Editor: editor@thelogicalagent.com / ChangeMeEditor123!")


if __name__ == "__main__":
    asyncio.run(seed())
