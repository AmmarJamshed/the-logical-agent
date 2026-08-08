"""NewsAPI.org client for The Logical Agent discovery layer."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)

DEFAULT_QUERIES = [
    "artificial intelligence OR LLM OR agentic AI",
    "cybersecurity OR ransomware",
    "quantum computing",
    "startup funding OR venture capital",
    "cloud computing OR DevOps",
    "blockchain OR web3",
    "open source software",
]


async def fetch_newsapi(
    query: str | None = None,
    *,
    page_size: int = 25,
    sort_by: str = "publishedAt",
) -> list[dict[str, Any]]:
    settings = get_settings()
    api_key = settings.news_api_key
    if not api_key:
        logger.warning("newsapi.missing_key")
        return []

    queries = [query] if query else DEFAULT_QUERIES
    items: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=45.0) as client:
        for q in queries:
            if not q:
                continue
            try:
                response = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": q,
                        "language": "en",
                        "sortBy": sort_by,
                        "pageSize": page_size,
                    },
                    headers={"X-Api-Key": api_key},
                )
                if response.status_code == 429:
                    logger.warning("newsapi.rate_limited", query=q)
                    break
                response.raise_for_status()
                data = response.json()
                for article in data.get("articles") or []:
                    title = article.get("title")
                    if not title or title == "[Removed]":
                        continue
                    items.append(
                        {
                            "source": "newsapi",
                            "source_name": (article.get("source") or {}).get("name") or "NewsAPI",
                            "title": title,
                            "summary": article.get("description") or article.get("content") or "",
                            "url": article.get("url"),
                            "image": article.get("urlToImage"),
                            "published_at": article.get("publishedAt"),
                            "author": article.get("author"),
                            "query": q,
                        }
                    )
            except Exception as exc:  # noqa: BLE001
                logger.warning("newsapi.fetch_failed", query=q, error=str(exc))
    return items


async def fetch_newsapi_headlines(*, category: str = "technology", page_size: int = 30) -> list[dict[str, Any]]:
    settings = get_settings()
    api_key = settings.news_api_key
    if not api_key:
        return []
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.get(
            "https://newsapi.org/v2/top-headlines",
            params={"category": category, "language": "en", "pageSize": page_size},
            headers={"X-Api-Key": api_key},
        )
        if response.status_code >= 400:
            logger.warning("newsapi.headlines_failed", status=response.status_code)
            return []
        data = response.json()
    items = []
    for article in data.get("articles") or []:
        title = article.get("title")
        if not title or title == "[Removed]":
            continue
        items.append(
            {
                "source": "newsapi_headlines",
                "source_name": (article.get("source") or {}).get("name") or "NewsAPI",
                "title": title,
                "summary": article.get("description") or "",
                "url": article.get("url"),
                "image": article.get("urlToImage"),
                "published_at": article.get("publishedAt"),
            }
        )
    return items
