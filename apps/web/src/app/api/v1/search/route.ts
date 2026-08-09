import { NextResponse } from "next/server";
import { getLiveArticles, getLiveCourses, getLiveDeals, getLivePapers } from "@/lib/feed";
import { groqChat } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ detail: "Query too short" }, { status: 400 });
  }

  const lower = query.toLowerCase();
  const articles = await getLiveArticles();
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

  if (/course|certif|bootcamp|degree|learn|class/.test(lower)) {
    const courses = await getLiveCourses();
    for (const c of courses.slice(0, 40)) {
      const hay = `${c.name} ${c.provider} ${c.ai_summary || ""} ${(c.technologies || []).join(" ")}`.toLowerCase();
      const hit = lower.split(/\s+/).some((w) => w.length > 2 && hay.includes(w));
      if (hit || /course|certif|bootcamp|popular|new|launch/.test(lower)) {
        results.push({
          entity_type: "course",
          id: c.id,
          title: c.name,
          summary: c.ai_summary,
          score: c.category === "popular" || c.is_promoted ? 0.93 : 0.82,
          url: c.url || `/courses`,
        });
      }
    }
  }

  if (/paper|arxiv|research|study|journal|preprint/.test(lower)) {
    const papers = await getLivePapers();
    for (const p of papers.slice(0, 40)) {
      const hay = `${p.title} ${p.summary || ""} ${p.topic || ""} ${p.abstract || ""}`.toLowerCase();
      const hit = lower.split(/\s+/).some((w) => w.length > 2 && hay.includes(w));
      if (hit || /paper|research|arxiv/.test(lower)) {
        results.push({
          entity_type: "research",
          id: p.id,
          title: p.title,
          summary: p.summary || p.abstract,
          score: hit ? 0.94 : 0.8,
          url: p.url || "/research",
        });
      }
    }
  }

  if (/startup|funding|venture|series|ipo|acquisition|raises/.test(lower)) {
    const deals = await getLiveDeals();
    for (const d of deals.slice(0, 40)) {
      const hay = `${d.name} ${d.summary || ""} ${d.event_type || ""} ${(d.technologies || []).join(" ")}`.toLowerCase();
      const hit = lower.split(/\s+/).some((w) => w.length > 2 && hay.includes(w));
      if (hit || /startup|funding|venture|ipo/.test(lower)) {
        results.push({
          entity_type: "startup",
          id: d.id,
          title: d.name,
          summary: d.summary,
          score: hit ? 0.93 : 0.81,
          url: d.url || "/startups",
        });
      }
    }
  }

  const interpretation = await groqChat(
    `Interpret this knowledge-graph search query in one sentence: ${query}`,
    "You are The Logical Agent search interpreter. Be concise.",
  );

  const seen = new Set<string>();
  const unique = [];
  for (const item of results.sort((a, b) => b.score - a.score)) {
    const key = `${item.entity_type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return NextResponse.json({
    query,
    interpretation: interpretation.content,
    results: unique.slice(0, 40),
  });
}
