import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_ARTICLES, DEMO_COURSES, groqChat } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadArticles() {
  try {
    const file = path.join(process.cwd(), "public", "data", "intelligence-feed.json");
    const feed = JSON.parse(await readFile(file, "utf8"));
    if (Array.isArray(feed.articles) && feed.articles.length) return feed.articles;
  } catch {
    // fallback
  }
  return DEMO_ARTICLES;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ detail: "Query too short" }, { status: 400 });
  }

  const lower = query.toLowerCase();
  const articles = await loadArticles();
  const results: Array<{
    entity_type: string;
    id: string;
    title: string;
    summary?: string | null;
    score: number;
    url?: string | null;
  }> = [];

  for (const a of articles) {
    const hay = `${a.title || ""} ${a.summary || ""} ${(a.technologies || []).join(" ")}`.toLowerCase();
    if (hay.includes(lower.split(/\s+/)[0]) || /ai|quantum|cyber|cloud|startup|funding|llm/.test(lower)) {
      const hit = lower.split(/\s+/).some((w) => w.length > 2 && hay.includes(w));
      if (hit || /news|latest|today|week/.test(lower)) {
        results.push({
          entity_type: "article",
          id: String(a.id),
          title: a.title,
          summary: a.summary,
          score: hit ? 0.9 : 0.7,
          url: a.url || `/articles/${a.slug}`,
        });
      }
    }
  }

  if (/course|certif|bootcamp|degree/.test(lower)) {
    for (const c of DEMO_COURSES) {
      results.push({
        entity_type: "course",
        id: c.id,
        title: c.name,
        summary: c.ai_summary,
        score: c.is_promoted ? 0.92 : 0.8,
        url: `/courses`,
      });
    }
  }

  const interpretation = await groqChat(
    `Interpret this knowledge-graph search query in one sentence: ${query}`,
    "You are The Logical Agent search interpreter. Be concise.",
  );

  // Dedup + rank
  const seen = new Set<string>();
  const unique = [];
  for (const item of results.sort((a, b) => b.score - a.score)) {
    const key = `${item.entity_type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= Number(body.limit || 20)) break;
  }

  return NextResponse.json({
    query,
    interpretation: interpretation.content,
    results: unique,
    knowledge_graph_hops: [],
  });
}
