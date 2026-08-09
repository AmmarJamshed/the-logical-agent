import { NextResponse } from "next/server";
import { getLiveDeals, loadStartupsFeed } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "").toLowerCase();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("page_size") || 40);

  const feed = await loadStartupsFeed();
  let items = await getLiveDeals();
  if (type) items = items.filter((d) => (d.event_type || "").toLowerCase() === type);

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
    counts: feed.counts || null,
  });
}
