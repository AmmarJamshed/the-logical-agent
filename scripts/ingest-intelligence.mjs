#!/usr/bin/env node
/**
 * Intelligence ingest — NewsAPI + social/public scrapers.
 * Writes apps/web/public/data/intelligence-feed.json
 *
 * Env:
 *   NEWS_API_KEY (required for NewsAPI)
 *   GROQ_API_KEY (optional — AI summaries)
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "apps/web/public/data/intelligence-feed.json");
const USER_AGENT = "TheLogicalAgentBot/1.0 (+https://github.com/the-logical-agent; intel-ingest)";

const NEWS_QUERIES = [
  "artificial intelligence OR LLM OR agentic AI",
  "cybersecurity OR ransomware",
  "quantum computing",
  "startup funding OR venture capital",
  "cloud computing OR kubernetesOps",
  "blockchain OR web3",
  "open source software",
];

const RSS_FEEDS = [
  "https://hnrss.org/frontpage",
  "https://www.technologyreview.com/feed/",
  "https://feeds.arstechnica.com/arstechnica/technology-lab",
  "https://krebsonsecurity.com/feed/",
  "https://www.bleepingcomputer.com/feed/",
  "https://github.blog/feed/",
  "https://dev.to/feed",
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function idFrom(url, title) {
  return createHash("sha1").update(String(url || title || Math.random())).digest("hex").slice(0, 12);
}

function detectTechs(text) {
  const t = String(text || "").toLowerCase();
  const map = [
    ["ai", /\b(ai|artificial intelligence|llm|gpt|agentic)\b/],
    ["cybersecurity", /\b(cyber|ransomware|malware|security)\b/],
    ["quantum", /\bquantum\b/],
    ["cloud", /\b(cloud|aws|azure|gcp|kubernetes)\b/],
    ["blockchain", /\b(blockchain|web3|crypto)\b/],
    ["startup", /\b(startup|funding|venture|series [a-c])\b/],
    ["open-source", /\b(open.?source|github)\b/],
  ];
  return map.filter(([, re]) => re.test(t)).map(([name]) => name);
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function fetchNewsApi() {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    console.warn("NEWS_API_KEY missing — skipping NewsAPI");
    return [];
  }
  const items = [];
  for (const q of NEWS_QUERIES) {
    try {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q", q);
      url.searchParams.set("language", "en");
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("pageSize", "20");
      const data = await fetchJson(url.toString(), { "X-Api-Key": key });
      for (const a of data.articles || []) {
        if (!a.title || a.title === "[Removed]") continue;
        items.push({
          source: "newsapi",
          source_name: a.source?.name || "NewsAPI",
          id: idFrom(a.url, a.title),
          title: a.title,
          summary: a.description || a.content || "",
          url: a.url,
          image: a.urlToImage,
          published_at: a.publishedAt,
          author: a.author,
          query: q,
          technologies: detectTechs(`${a.title} ${a.description || ""}`),
        });
      }
      // NewsAPI free tier rate niceness
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.warn("NewsAPI query failed:", q, err.message);
    }
  }
  return items;
}

async function fetchNewsApiHeadlines() {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];
  try {
    const url = new URL("https://newsapi.org/v2/top-headlines");
    url.searchParams.set("category", "technology");
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", "30");
    const data = await fetchJson(url.toString(), { "X-Api-Key": key });
    return (data.articles || [])
      .filter((a) => a.title && a.title !== "[Removed]")
      .map((a) => ({
        source: "newsapi_headlines",
        source_name: a.source?.name || "NewsAPI",
        id: idFrom(a.url, a.title),
        title: a.title,
        summary: a.description || "",
        url: a.url,
        image: a.urlToImage,
        published_at: a.publishedAt,
        technologies: detectTechs(`${a.title} ${a.description || ""}`),
      }));
  } catch (err) {
    console.warn("NewsAPI headlines failed:", err.message);
    return [];
  }
}

async function fetchHackerNews(limit = 25) {
  try {
    const ids = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");
    const items = [];
    for (const id of ids.slice(0, limit)) {
      const item = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!item || item.type !== "story" || !item.title) continue;
      items.push({
        source: "hacker_news",
        source_name: "Hacker News",
        id: String(item.id),
        title: item.title,
        summary: "",
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        published_at: item.time ? new Date(item.time * 1000).toISOString() : null,
        score: item.score,
        by: item.by,
        technologies: detectTechs(item.title),
      });
    }
    return items;
  } catch (err) {
    console.warn("HN failed:", err.message);
    return [];
  }
}

async function fetchReddit(subreddits = ["MachineLearning", "artificial", "cybersecurity", "programming", "startups"]) {
  const items = [];
  for (const sub of subreddits) {
    try {
      // old.reddit + browser-like UA improves GitHub Actions / scraper success rate
      const data = await fetchJson(`https://old.reddit.com/r/${sub}/hot.json?limit=15`, {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; TheLogicalAgent/1.0; +https://thelogicalagent.com)",
      });
      for (const child of data?.data?.children || []) {
        const p = child.data;
        if (!p?.title || p.stickied) continue;
        items.push({
          source: "reddit",
          source_name: `r/${sub}`,
          id: p.id,
          title: p.title,
          summary: (p.selftext || "").slice(0, 400),
          url: p.url_overridden_by_dest || `https://reddit.com${p.permalink}`,
          published_at: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
          score: p.score,
          technologies: detectTechs(`${p.title} ${p.selftext || ""}`),
        });
      }
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.warn(`Reddit r/${sub} failed:`, err.message);
    }
  }
  return items;
}

async function fetchDevTo() {
  try {
    const data = await fetchJson("https://dev.to/api/articles?per_page=20&top=7");
    return (data || []).map((a) => ({
      source: "devto",
      source_name: "DEV",
      id: String(a.id),
      title: a.title,
      summary: a.description || "",
      url: a.url,
      image: a.cover_image || a.social_image,
      published_at: a.published_at,
      technologies: detectTechs(`${a.title} ${(a.tag_list || []).join(" ")}`),
      tags: a.tag_list || [],
    }));
  } catch (err) {
    console.warn("DEV.to failed:", err.message);
    return [];
  }
}

async function fetchRss(urls) {
  const items = [];
  for (const feedUrl of urls) {
    try {
      const xml = await fetchText(feedUrl);
      const entries = [...xml.matchAll(/<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>/gi)].slice(0, 12);
      for (const [block] of entries) {
        const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1];
        const link =
          (block.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] ||
          (block.match(/<link[^>]*>([^<]+)<\/link>/i) || [])[1];
        const desc =
          (block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) || [])[1] ||
          (block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) || [])[1] ||
          "";
        const pub =
          (block.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i) || [])[1] ||
          (block.match(/<updated[^>]*>([^<]+)<\/updated>/i) || [])[1];
        const cleanTitle = String(title || "")
          .replace(/<[^>]+>/g, "")
          .trim();
        if (!cleanTitle) continue;
        items.push({
          source: "rss",
          source_name: feedUrl,
          id: idFrom(link, cleanTitle),
          title: cleanTitle,
          summary: String(desc).replace(/<[^>]+>/g, "").trim().slice(0, 400),
          url: String(link || "").trim(),
          published_at: pub ? new Date(pub).toISOString() : null,
          technologies: detectTechs(`${cleanTitle} ${desc}`),
        });
      }
    } catch (err) {
      console.warn("RSS failed:", feedUrl, err.message);
    }
  }
  return items;
}

async function fetchGithubTrendingTopics() {
  try {
    const data = await fetchJson(
      "https://api.github.com/search/repositories?q=artificial+intelligence+OR+llm+OR+agent&sort=updated&order=desc&per_page=15",
      {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    );
    return (data.items || []).map((repo) => ({
      source: "github",
      source_name: "GitHub",
      id: String(repo.id),
      title: repo.full_name,
      summary: repo.description || "",
      url: repo.html_url,
      published_at: repo.updated_at,
      score: repo.stargazers_count,
      technologies: detectTechs(`${repo.full_name} ${repo.description || ""}`),
    }));
  } catch (err) {
    console.warn("GitHub search failed:", err.message);
    return [];
  }
}

function toArticles(items) {
  const seen = new Set();
  const articles = [];
  for (const item of items) {
    const key = (item.url || item.title || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const slug = `${slugify(item.title)}-${item.id}`.slice(0, 100);
    articles.push({
      id: item.id,
      title: item.title,
      slug,
      summary: item.summary || `Sourced from ${item.source_name || item.source}`,
      hero_image_url: item.image || null,
      reading_time_minutes: Math.max(2, Math.ceil(String(item.summary || "").split(/\s+/).length / 200)),
      technologies: item.technologies?.length ? item.technologies : ["technology"],
      published_at: item.published_at || new Date().toISOString(),
      ai_confidence_score: item.source?.startsWith("newsapi") ? 0.9 : 0.75,
      is_sponsored: false,
      view_count: item.score || 0,
      source: item.source,
      source_name: item.source_name,
      url: item.url,
      body: item.summary || "",
    });
  }
  return articles.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
}

async function maybeSummarize(articles, limit = 8) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return articles;
  const models = (process.env.GROQ_MODELS || "llama-3.1-8b-instant,llama-3.3-70b-versatile")
    .split(/[,\n\r]+/)
    .map((m) => m.trim())
    .filter(Boolean);

  for (let i = 0; i < Math.min(limit, articles.length); i++) {
    const a = articles[i];
    if ((a.summary || "").length > 40) continue;
    const prompt = `Write a 2-sentence technology intelligence summary for: ${a.title}\nURL: ${a.url || ""}`;
    for (const model of models) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are The Logical Agent news desk. Be factual and concise." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
          }),
        });
        if (res.status === 429 || res.status === 503) continue;
        if (!res.ok) continue;
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          a.summary = content.trim();
          a.body = content.trim();
          a.ai_confidence_score = 0.88;
        }
        break;
      } catch {
        continue;
      }
    }
  }
  return articles;
}

async function main() {
  console.log("Starting intelligence ingest…");
  const chunks = await Promise.all([
    fetchNewsApi(),
    fetchNewsApiHeadlines(),
    fetchHackerNews(),
    fetchReddit(),
    fetchDevTo(),
    fetchRss(RSS_FEEDS),
    fetchGithubTrendingTopics(),
  ]);

  const flat = chunks.flat();
  let articles = toArticles(flat);
  articles = await maybeSummarize(articles);

  const feed = {
    generated_at: new Date().toISOString(),
    cadence: "every_2_days",
    sources: {
      newsapi: flat.filter((x) => String(x.source).startsWith("newsapi")).length,
      hacker_news: flat.filter((x) => x.source === "hacker_news").length,
      reddit: flat.filter((x) => x.source === "reddit").length,
      rss: flat.filter((x) => x.source === "rss").length,
      devto: flat.filter((x) => x.source === "devto").length,
      github: flat.filter((x) => x.source === "github").length,
    },
    total: articles.length,
    articles: articles.slice(0, 200),
    social: flat
      .filter((x) => ["reddit", "hacker_news", "devto", "github"].includes(x.source))
      .slice(0, 100),
  };

  await mkdir(dirname(OUT), { recursive: true });
  let previous = null;
  try {
    previous = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    previous = null;
  }

  // Merge: keep unique newer items first
  if (previous?.articles?.length) {
    const merged = toArticles([
      ...feed.articles.map((a) => ({ ...a, source_name: a.source_name, source: a.source })),
      ...previous.articles.map((a) => ({
        ...a,
        source: a.source || "cache",
        source_name: a.source_name || "cache",
      })),
    ]);
    feed.articles = merged.slice(0, 250);
    feed.total = feed.articles.length;
  }

  await writeFile(OUT, JSON.stringify(feed, null, 2));
  console.log(`Wrote ${feed.total} articles -> ${OUT}`);
  console.log("Source counts:", feed.sources);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
