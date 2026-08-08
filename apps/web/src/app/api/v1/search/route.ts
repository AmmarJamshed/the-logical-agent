import { NextResponse } from "next/server";
import { DEMO_ARTICLES, DEMO_COURSES, groqChat } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ detail: "Query too short" }, { status: 400 });
  }

  const lower = query.toLowerCase();
  const results: Array<{
    entity_type: string;
    id: string;
    title: string;
    summary?: string | null;
    score: number;
    url?: string | null;
  }> = [];

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
  if (/fund|startup|raised|ipo/.test(lower)) {
    results.push({
      entity_type: "funding",
      id: "f1",
      title: "Aurora Neural — series_b",
      summary: "Aurora Neural raised $80M to scale enterprise agent infrastructure.",
      score: 0.88,
      url: "/startups",
    });
  }
  for (const a of DEMO_ARTICLES) {
    if (
      a.title.toLowerCase().includes(lower.split(" ")[0]) ||
      /news|latest|ai|quantum|cyber/.test(lower)
    ) {
      results.push({
        entity_type: "article",
        id: a.id,
        title: a.title,
        summary: a.summary,
        score: 0.75,
        url: `/articles/${a.slug}`,
      });
    }
  }

  const interpretation = await groqChat(
    `Interpret this knowledge-graph search query in one sentence: ${query}`,
    "You are The Logical Agent search interpreter. Be concise.",
  );

  return NextResponse.json({
    query,
    interpretation: interpretation.content,
    results: results.slice(0, Number(body.limit || 20)),
    knowledge_graph_hops: [],
  });
}
