#!/usr/bin/env node
/**
 * Startups ingest — funding / acquisition / IPO coverage from RSS + NewsAPI.
 * Writes apps/web/public/data/startups-feed.json
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "apps/web/public/data/startups-feed.json");
const USER_AGENT = "TheLogicalAgentBot/1.0 (+https://github.com/AmmarJamshed/the-logical-agent; startups-ingest)";

const RSS_FEEDS = [
  { name: "TechCrunch Startups", url: "https://techcrunch.com/category/startups/feed/" },
  { name: "TechCrunch Fundraising", url: "https://techcrunch.com/tag/fundraising/feed/" },
  { name: "Crunchbase News", url: "https://news.crunchbase.com/feed/" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
];

const NEWS_QUERIES = [
  'startup (funding OR "series A" OR "series B" OR "series C" OR seed OR raises OR acquired OR IPO)',
  '("venture capital" OR VC) (AI OR cybersecurity OR fintech OR SaaS) (funding OR raises)',
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function idFrom(...parts) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);
}

function clean(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectEventType(text) {
  const t = text.toLowerCase();
  if (/\bipo\b|goes public|public offering/.test(t)) return "ipo";
  if (/\bacquir|\bbought by\b|acquisition/.test(t)) return "acquisition";
  if (/\bseries [a-f]\b|\bseed\b|\braises?\b|\bfunding\b|\binvests?\b|\bventure\b/.test(t)) return "funding";
  return "startup";
}

function extractAmount(text) {
  const m = text.match(/\$\s?(\d+(?:\.\d+)?)\s?(billion|million|bn|m|k)\b/i)
    || text.match(/\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b/);
  if (!m) return null;
  if (m[2]) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    if (unit.startsWith("b")) return `$${n}B`;
    if (unit.startsWith("m")) return `$${n}M`;
    if (unit === "k") return `$${n}K`;
  }
  return `$${m[1]}`;
}

function detectTechs(text) {
  const t = String(text || "").toLowerCase();
  const map = [
    ["ai", /\b(ai|artificial intelligence|llm|generative|agentic|machine learning)\b/],
    ["fintech", /\b(fintech|payments|banking|crypto)\b/],
    ["cybersecurity", /\b(cyber|security|ransomware)\b/],
    ["saas", /\b(saas|b2b software)\b/],
    ["climate", /\b(climate|cleantech|energy)\b/],
    ["health", /\b(health|biotech|medtech)\b/],
    ["cloud", /\b(cloud|devops|infrastructure)\b/],
  ];
  return map.filter(([, re]) => re.test(t)).map(([name]) => name);
}

function parseRssItems(xml, sourceName) {
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  const items = [];
  for (const chunk of chunks) {
    const block = chunk.split(/<\/item>/i)[0] || chunk;
    const title = clean((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const link = clean((block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const desc = clean(
      (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [])[1]
        || (block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) || [])[1]
        || "",
    );
    const pub = clean((block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
    if (!title) continue;
    const blob = `${title} ${desc}`;
    items.push({
      id: idFrom("rss", link || title),
      name: title,
      slug: slugify(title),
      summary: desc.slice(0, 280),
      url: link,
      source: sourceName,
      event_type: detectEventType(blob),
      amount: extractAmount(blob),
      technologies: detectTechs(blob),
      published_at: pub ? new Date(pub).toISOString() : null,
    });
  }
  return items;
}

async function fetchRss() {
  const out = [];
  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseRssItems(xml, feed.name).slice(0, 25);
      out.push(...items);
      console.log(`  RSS ${feed.name}: ${items.length}`);
    } catch (err) {
      console.warn(`  RSS ${feed.name} failed:`, err.message);
    }
  }
  return out;
}

async function fetchNewsApi() {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    console.warn("NEWS_API_KEY missing — skipping NewsAPI startups");
    return [];
  }
  const out = [];
  for (const q of NEWS_QUERIES) {
    try {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q", q);
      url.searchParams.set("language", "en");
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("pageSize", "25");
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT, "X-Api-Key": key },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const a of data.articles || []) {
        if (!a.title || a.title === "[Removed]") continue;
        const blob = `${a.title} ${a.description || ""}`;
        out.push({
          id: idFrom("news", a.url || a.title),
          name: a.title.replace(/\s+/g, " ").slice(0, 180),
          slug: slugify(a.title),
          summary: (a.description || "").replace(/\s+/g, " ").slice(0, 280),
          url: a.url,
          source: a.source?.name || "NewsAPI",
          event_type: detectEventType(blob),
          amount: extractAmount(blob),
          technologies: detectTechs(blob),
          published_at: a.publishedAt || null,
          image_url: a.urlToImage || null,
        });
      }
    } catch (err) {
      console.warn("NewsAPI startups:", err.message);
    }
  }
  return out;
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.url || item.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function main() {
  console.log("Ingesting startup funding intelligence…");
  const [rss, news] = await Promise.all([fetchRss(), fetchNewsApi()]);
  const deals = dedupe([...rss, ...news]).sort(
    (a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0),
  );

  const byType = {
    funding: deals.filter((d) => d.event_type === "funding"),
    acquisition: deals.filter((d) => d.event_type === "acquisition"),
    ipo: deals.filter((d) => d.event_type === "ipo"),
    startup: deals.filter((d) => d.event_type === "startup"),
  };

  const payload = {
    generated_at: new Date().toISOString(),
    total: deals.length,
    sources: { rss: rss.length, newsapi: news.length },
    counts: {
      funding: byType.funding.length,
      acquisition: byType.acquisition.length,
      ipo: byType.ipo.length,
      startup: byType.startup.length,
    },
    funding: byType.funding,
    acquisitions: byType.acquisition,
    ipos: byType.ipo,
    deals,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${deals.length} deals → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
