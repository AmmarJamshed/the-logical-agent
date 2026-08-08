import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_ARTICLES, type DemoArticle } from "@/lib/public-ai";

export type IntelligenceFeed = {
  generated_at?: string;
  total?: number;
  sources?: Record<string, number>;
  articles?: DemoArticle[];
  social?: Array<Record<string, unknown>>;
};

export async function loadIntelligenceFeed(): Promise<IntelligenceFeed> {
  try {
    const file = path.join(process.cwd(), "public", "data", "intelligence-feed.json");
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as IntelligenceFeed;
  } catch {
    return { articles: DEMO_ARTICLES, total: DEMO_ARTICLES.length };
  }
}

export async function getLiveArticles(): Promise<DemoArticle[]> {
  const feed = await loadIntelligenceFeed();
  if (feed.articles?.length) return feed.articles as DemoArticle[];
  return DEMO_ARTICLES;
}
