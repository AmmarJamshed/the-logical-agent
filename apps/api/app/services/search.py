"""Semantic AI search over the platform knowledge graph + Elasticsearch."""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.content import Article, Company, FundingRound, ResearchPaper
from app.models.discovery import Conference, Course, University
from app.models.agents import KnowledgeEntity, KnowledgeRelation
from app.schemas import SearchResult, SemanticSearchResponse

settings = get_settings()


INTENT_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("courses", re.compile(r"\b(course|courses|bootcamp|certification|certifications|degree|degrees)\b", re.I)),
    ("funding", re.compile(r"\b(funding|raised|series|ipo|acquisition|venture)\b", re.I)),
    ("research", re.compile(r"\b(paper|research|arxiv|breakthrough|breakthroughs)\b", re.I)),
    ("universities", re.compile(r"\b(university|universities|college|colleges)\b", re.I)),
    ("conferences", re.compile(r"\b(conference|hackathon|meetup|webinar)\b", re.I)),
    ("news", re.compile(r"\b(news|latest|today|this week)\b", re.I)),
]


def interpret_query(query: str) -> dict[str, Any]:
    intents = [name for name, pattern in INTENT_PATTERNS if pattern.search(query)]
    countries = re.findall(r"\b([A-Z]{2})\b", query)
    # naive country name map subset
    country_names = {
        "germany": "DE",
        "pakistan": "PK",
        "united states": "US",
        "usa": "US",
        "india": "IN",
        "uk": "GB",
        "united kingdom": "GB",
    }
    lower = query.lower()
    for name, code in country_names.items():
        if name in lower:
            countries.append(code)
    techs = []
    for tech in (
        "ai",
        "artificial intelligence",
        "quantum",
        "cybersecurity",
        "blockchain",
        "cloud",
        "llm",
        "robotics",
    ):
        if tech in lower:
            techs.append(tech)
    return {
        "intents": intents or ["news"],
        "countries": list(dict.fromkeys(countries)),
        "technologies": techs,
        "interpretation": (
            f"Interpreted as {', '.join(intents or ['general search'])}"
            + (f" in {', '.join(countries)}" if countries else "")
            + (f" about {', '.join(techs)}" if techs else "")
        ),
    }


class SemanticSearchService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def search(self, query: str, *, limit: int = 20, filters: dict | None = None) -> SemanticSearchResponse:
        interpretation = interpret_query(query)
        filters = filters or {}
        results: list[SearchResult] = []

        for intent in interpretation["intents"]:
            if intent == "courses":
                results.extend(await self._search_courses(query, interpretation, limit))
            elif intent == "funding":
                results.extend(await self._search_funding(query, interpretation, limit))
            elif intent == "research":
                results.extend(await self._search_research(query, interpretation, limit))
            elif intent == "universities":
                results.extend(await self._search_universities(query, interpretation, limit))
            elif intent == "conferences":
                results.extend(await self._search_conferences(query, interpretation, limit))
            else:
                results.extend(await self._search_articles(query, interpretation, limit))

        # Deduplicate by (entity_type, id)
        seen: set[tuple[str, str]] = set()
        unique: list[SearchResult] = []
        for item in sorted(results, key=lambda r: r.score, reverse=True):
            key = (item.entity_type, item.id)
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)
            if len(unique) >= limit:
                break

        hops = await self._knowledge_hops(unique[:5])
        return SemanticSearchResponse(
            query=query,
            interpretation=interpretation["interpretation"],
            results=unique,
            knowledge_graph_hops=hops,
        )

    async def _search_articles(self, query: str, interpretation: dict, limit: int) -> list[SearchResult]:
        stmt = select(Article).where(Article.title.ilike(f"%{query.split()[0]}%")).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        out = []
        for row in rows:
            score = 0.7
            if interpretation["technologies"] and any(
                t.lower() in [x.lower() for x in row.technologies] for t in interpretation["technologies"]
            ):
                score += 0.2
            out.append(
                SearchResult(
                    entity_type="article",
                    id=str(row.id),
                    title=row.title,
                    summary=row.summary,
                    score=score,
                    url=f"/articles/{row.slug}",
                    metadata={"technologies": row.technologies, "countries": row.country_codes},
                )
            )
        return out

    async def _search_courses(self, query: str, interpretation: dict, limit: int) -> list[SearchResult]:
        stmt = select(Course)
        if interpretation["countries"]:
            stmt = stmt.where(Course.country_code.in_(interpretation["countries"]))
        if interpretation["technologies"]:
            # match any listed tech
            conditions = [Course.technologies.any(t) for t in interpretation["technologies"]]
            stmt = stmt.where(or_(*conditions)) if conditions else stmt
        if "free" in query.lower():
            stmt = stmt.where(Course.is_free.is_(True))
        rows = (await self.db.execute(stmt.limit(limit))).scalars().all()
        return [
            SearchResult(
                entity_type="course",
                id=str(c.id),
                title=c.name,
                summary=c.ai_summary,
                score=0.9 if c.is_promoted else 0.75,
                url=f"/courses/{c.slug}",
                metadata={
                    "provider": c.provider,
                    "country": c.country_code,
                    "modality": c.modality.value,
                    "is_free": c.is_free,
                },
            )
            for c in rows
        ]

    async def _search_funding(self, query: str, interpretation: dict, limit: int) -> list[SearchResult]:
        stmt = select(FundingRound).order_by(FundingRound.announced_at.desc().nullslast()).limit(limit)
        if interpretation["countries"]:
            stmt = select(FundingRound).where(
                FundingRound.country_code.in_(interpretation["countries"])
            ).order_by(FundingRound.announced_at.desc().nullslast()).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [
            SearchResult(
                entity_type="funding",
                id=str(f.id),
                title=f"{f.company_name} — {f.round_type}",
                summary=f.ai_summary,
                score=0.85,
                url=f"/funding/{f.id}",
                metadata={"amount": float(f.amount) if f.amount else None, "currency": f.currency},
            )
            for f in rows
        ]

    async def _search_research(self, query: str, interpretation: dict, limit: int) -> list[SearchResult]:
        stmt = select(ResearchPaper).where(ResearchPaper.title.ilike(f"%{query[:40]}%")).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        if not rows:
            rows = (
                await self.db.execute(
                    select(ResearchPaper).order_by(ResearchPaper.published_at.desc().nullslast()).limit(limit)
                )
            ).scalars().all()
        return [
            SearchResult(
                entity_type="research",
                id=str(p.id),
                title=p.title,
                summary=p.executive_summary or p.abstract,
                score=0.8,
                url=p.url,
                metadata={"source": p.source, "categories": p.categories},
            )
            for p in rows
        ]

    async def _search_universities(self, query: str, interpretation: dict, limit: int) -> list[SearchResult]:
        stmt = select(University).limit(limit)
        if interpretation["countries"]:
            stmt = select(University).where(University.country_code.in_(interpretation["countries"])).limit(limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [
            SearchResult(
                entity_type="university",
                id=str(u.id),
                title=u.name,
                summary=u.description,
                score=0.78,
                url=f"/universities/{u.slug}",
                metadata={"country": u.country_code, "programs": u.ai_programs},
            )
            for u in rows
        ]

    async def _search_conferences(self, query: str, interpretation: dict, limit: int) -> list[SearchResult]:
        rows = (
            await self.db.execute(
                select(Conference).order_by(Conference.start_date.desc().nullslast()).limit(limit)
            )
        ).scalars().all()
        return [
            SearchResult(
                entity_type="conference",
                id=str(c.id),
                title=c.name,
                summary=c.description,
                score=0.76,
                url=f"/events/{c.slug}",
                metadata={"country": c.country_code, "event_type": c.event_type},
            )
            for c in rows
        ]

    async def _knowledge_hops(self, results: list[SearchResult]) -> list[dict]:
        if not results:
            return []
        hops = []
        for result in results:
            entity = (
                await self.db.execute(
                    select(KnowledgeEntity).where(
                        KnowledgeEntity.source_id == result.id,
                        KnowledgeEntity.entity_type == result.entity_type,
                    )
                )
            ).scalar_one_or_none()
            if not entity:
                continue
            rels = (
                await self.db.execute(
                    select(KnowledgeRelation).where(KnowledgeRelation.source_entity_id == entity.id).limit(5)
                )
            ).scalars().all()
            for rel in rels:
                hops.append(
                    {
                        "from": entity.name,
                        "relation": rel.relation_type,
                        "to_entity_id": str(rel.target_entity_id),
                        "weight": rel.weight,
                    }
                )
        return hops
