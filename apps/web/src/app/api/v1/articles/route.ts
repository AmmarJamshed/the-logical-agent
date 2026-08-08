import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_ARTICLES } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readFeedArticles() {
  try {
    const file = path.join(process.cwd(), "public", "data", "intelligence-feed.json");
    const raw = await readFile(file, "utf8");
    const feed = JSON.parse(raw);
    if (Array.isArray(feed.articles) && feed.articles.length) return feed.articles;
  } catch {
    // fall through
  }
  return DEMO_ARTICLES;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const technology = (searchParams.get("technology") || "").toLowerCase();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("page_size") || 20);

  let items = await readFeedArticles();
  if (q) {
    items = items.filter(
      (a: { title?: string; summary?: string }) =>
        (a.title || "").toLowerCase().includes(q) || (a.summary || "").toLowerCase().includes(q),
    );
  }
  if (technology) {
    items = items.filter((a: { technologies?: string[] }) =>
      (a.technologies || []).some((t) => t.toLowerCase() === technology),
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
  });
}
