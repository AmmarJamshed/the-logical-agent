"""Free public data sources for discovery agents (no paid news APIs required)."""

from __future__ import annotations

from typing import Any
from xml.etree import ElementTree

import feedparser
import httpx
import structlog

logger = structlog.get_logger(__name__)

USER_AGENT = "TheLogicalAgent/1.0 (+https://thelogicalagent.com; research-bot)"

# Curated free RSS feeds for tech intelligence
FREE_RSS_FEEDS = {
    "global_tech": [
        "https://hnrss.org/frontpage",
        "https://www.technologyreview.com/feed/",
        "https://feeds.arstechnica.com/arstechnica/technology-lab",
    ],
    "ai_research": [
        "https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=15",
        "https://hnrss.org/newest?q=AI+OR+LLM+OR+agent",
    ],
    "cybersecurity": [
        "https://krebsonsecurity.com/feed/",
        "https://www.bleepingcomputer.com/feed/",
    ],
    "open_source": [
        "https://github.blog/feed/",
        "https://hnrss.org/newest?q=open+source",
    ],
    "cloud": [
        "https://aws.amazon.com/blogs/aws/feed/",
        "https://cloud.google.com/blog/rss",
    ],
}


async def fetch_hacker_news(limit: int = 20) -> list[dict[str, Any]]:
    """Hacker News Firebase API — fully free, no key."""
    async with httpx.AsyncClient(timeout=30.0, headers={"User-Agent": USER_AGENT}) as client:
        ids_resp = await client.get("https://hacker-news.firebaseio.com/v0/topstories.json")
        ids_resp.raise_for_status()
        ids = ids_resp.json()[:limit]
        items: list[dict[str, Any]] = []
        for story_id in ids:
            item_resp = await client.get(f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json")
            if item_resp.status_code != 200:
                continue
            item = item_resp.json() or {}
            if item.get("type") != "story":
                continue
            items.append(
                {
                    "source": "hacker_news",
                    "id": str(item.get("id")),
                    "title": item.get("title"),
                    "url": item.get("url") or f"https://news.ycombinator.com/item?id={item.get('id')}",
                    "score": item.get("score"),
                    "by": item.get("by"),
                }
            )
        return items


async def fetch_arxiv(query: str = "cat:cs.AI", max_results: int = 15) -> list[dict[str, Any]]:
    """arXiv Atom API — free, no key. https://info.arxiv.org/help/api/index.html"""
    url = (
        "https://export.arxiv.org/api/query"
        f"?search_query={query}&sortBy=submittedDate&sortOrder=descending&max_results={max_results}"
    )
    async with httpx.AsyncClient(timeout=45.0, headers={"User-Agent": USER_AGENT}) as client:
        response = await client.get(url)
        response.raise_for_status()
        root = ElementTree.fromstring(response.text)

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    papers: list[dict[str, Any]] = []
    for entry in root.findall("atom:entry", ns):
        title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        summary = (entry.findtext("atom:summary", default="", namespaces=ns) or "").strip()
        link = ""
        for link_el in entry.findall("atom:link", ns):
            if link_el.attrib.get("type") == "text/html" or link_el.attrib.get("rel") == "alternate":
                link = link_el.attrib.get("href", "")
                break
        authors = [
            {"name": a.findtext("atom:name", default="", namespaces=ns)}
            for a in entry.findall("atom:author", ns)
        ]
        papers.append(
            {
                "source": "arxiv",
                "title": " ".join(title.split()),
                "abstract": " ".join(summary.split()),
                "url": link,
                "authors": authors,
            }
        )
    return papers


async def fetch_semantic_scholar(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """Semantic Scholar Graph API — free tier, no key required for light use."""
    async with httpx.AsyncClient(timeout=45.0, headers={"User-Agent": USER_AGENT}) as client:
        response = await client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={
                "query": query,
                "limit": limit,
                "fields": "title,abstract,url,year,authors,venue",
            },
        )
        if response.status_code == 429:
            logger.warning("semantic_scholar.rate_limited")
            return []
        response.raise_for_status()
        data = response.json()
    papers = []
    for item in data.get("data") or []:
        papers.append(
            {
                "source": "semantic_scholar",
                "title": item.get("title"),
                "abstract": item.get("abstract"),
                "url": item.get("url"),
                "year": item.get("year"),
                "authors": item.get("authors") or [],
                "venue": item.get("venue"),
            }
        )
    return papers


async def fetch_rss(urls: list[str], limit_per_feed: int = 8) -> list[dict[str, Any]]:
    """RSS/Atom feeds — free, no key."""
    items: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=30.0, headers={"User-Agent": USER_AGENT}, follow_redirects=True) as client:
        for url in urls:
            try:
                response = await client.get(url)
                response.raise_for_status()
                parsed = feedparser.parse(response.text)
                for entry in parsed.entries[:limit_per_feed]:
                    items.append(
                        {
                            "source": "rss",
                            "feed": url,
                            "title": getattr(entry, "title", None),
                            "summary": getattr(entry, "summary", None) or getattr(entry, "description", None),
                            "url": getattr(entry, "link", None),
                            "published": getattr(entry, "published", None),
                        }
                    )
            except Exception as exc:  # noqa: BLE001
                logger.warning("rss.fetch_failed", url=url, error=str(exc))
    return items


async def fetch_github_repos(query: str = "artificial intelligence", limit: int = 10) -> list[dict[str, Any]]:
    """GitHub Search API — free without token (low rate limit); better with GITHUB token."""
    headers = {"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"}
    from app.core.config import get_settings

    token = get_settings().github_client_secret or get_settings().github_api_token
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        response = await client.get(
            "https://api.github.com/search/repositories",
            params={"q": query, "sort": "updated", "order": "desc", "per_page": limit},
        )
        if response.status_code >= 400:
            logger.warning("github.search_failed", status=response.status_code)
            return []
        data = response.json()
    return [
        {
            "source": "github",
            "title": repo.get("full_name"),
            "summary": repo.get("description"),
            "url": repo.get("html_url"),
            "stars": repo.get("stargazers_count"),
            "language": repo.get("language"),
        }
        for repo in data.get("items") or []
    ]


async def discover_for_domain(domain: str, focus: str | None = None) -> list[dict[str, Any]]:
    """Aggregate NewsAPI + free social/public sources for a discovery agent domain."""
    from app.services.newsapi import fetch_newsapi, fetch_newsapi_headlines

    domain_key = domain.lower().replace(" ", "_")
    results: list[dict[str, Any]] = []

    try:
        # NewsAPI is the primary info fetch for all desks
        news_query = focus or domain
        results.extend(await fetch_newsapi(news_query, page_size=20))
        if "global" in domain_key or "tech" in domain_key or "news" in domain_key:
            results.extend(await fetch_newsapi_headlines())

        if "research" in domain_key or "paper" in domain_key or "ai" in domain_key:
            q = focus or "cat:cs.AI OR cat:cs.LG"
            if " " in q and not q.startswith("cat:"):
                q = f"all:{q}"
            results.extend(
                await fetch_arxiv(
                    query=q if "cat:" in q or "all:" in q else f"all:{focus or 'large language models'}"
                )
            )
            results.extend(await fetch_semantic_scholar(focus or "large language models agents", limit=8))
        elif "open_source" in domain_key or "software" in domain_key:
            results.extend(await fetch_github_repos(focus or "ai agent framework", limit=10))
            results.extend(await fetch_rss(FREE_RSS_FEEDS["open_source"]))
        elif "cyber" in domain_key:
            results.extend(await fetch_rss(FREE_RSS_FEEDS["cybersecurity"]))
            results.extend(await fetch_hacker_news(limit=10))
        elif "cloud" in domain_key:
            results.extend(await fetch_rss(FREE_RSS_FEEDS["cloud"]))
        else:
            results.extend(await fetch_hacker_news(limit=15))
            feed_urls = FREE_RSS_FEEDS.get("global_tech", FREE_RSS_FEEDS["global_tech"])
            if "ai" in domain_key:
                feed_urls = FREE_RSS_FEEDS["ai_research"]
            results.extend(await fetch_rss(feed_urls))
    except Exception as exc:  # noqa: BLE001
        logger.warning("discover_for_domain.failed", domain=domain, error=str(exc))

    # Deduplicate by title/url
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for item in results:
        key = (item.get("url") or item.get("title") or str(item)).lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique[:40]
