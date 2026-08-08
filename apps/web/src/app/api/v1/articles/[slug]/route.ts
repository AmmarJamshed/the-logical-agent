import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_ARTICLES } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  let articles = DEMO_ARTICLES;
  try {
    const file = path.join(process.cwd(), "public", "data", "intelligence-feed.json");
    const feed = JSON.parse(await readFile(file, "utf8"));
    if (Array.isArray(feed.articles) && feed.articles.length) articles = feed.articles;
  } catch {
    // demo fallback
  }

  const article = articles.find((a: { slug?: string }) => a.slug === params.slug);
  if (!article) {
    return NextResponse.json({ detail: "Article not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...article,
    body_html: `<p>${article.body || article.summary || ""}</p>`,
    seo_title: article.title,
    seo_description: article.summary,
    sources: [{ title: article.source_name || article.source || "Feed", url: article.url }],
    country_codes: [],
    comment_count: 0,
    like_count: 0,
    language: "en",
    created_at: article.published_at,
    article_type: "analysis",
    status: "published",
  });
}
