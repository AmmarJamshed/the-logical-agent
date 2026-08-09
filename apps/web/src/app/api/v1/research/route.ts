import { NextResponse } from "next/server";
import { getLivePapers, loadResearchFeed } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = (searchParams.get("topic") || "").toLowerCase();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("page_size") || 40);

  const feed = await loadResearchFeed();
  let items = await getLivePapers();
  if (topic) {
    items = items.filter(
      (p) =>
        (p.topic_key || "").toLowerCase() === topic ||
        (p.topic || "").toLowerCase().includes(topic) ||
        (p.category || "").toLowerCase().includes(topic),
    );
  }

  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return NextResponse.json({
    items: slice,
    total: items.length,
    page,
    page_size: pageSize,
    pages: Math.max(1, Math.ceil(items.length / pageSize)),
    generated_at: feed.generated_at || null,
    sources: feed.sources || null,
  });
}
