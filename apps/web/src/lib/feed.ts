import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_ARTICLES, DEMO_COURSES, type DemoArticle, type DemoCourse } from "@/lib/public-ai";

export type IntelligenceFeed = {
  generated_at?: string;
  total?: number;
  sources?: Record<string, number>;
  articles?: DemoArticle[];
  social?: Array<Record<string, unknown>>;
};

export type CoursesFeed = {
  generated_at?: string;
  total?: number;
  sources?: Record<string, number>;
  popular?: DemoCourse[];
  newly_launched?: DemoCourse[];
  courses?: DemoCourse[];
};

export type ResearchPaper = {
  id: string;
  title: string;
  slug: string;
  abstract?: string | null;
  summary?: string | null;
  authors?: string[];
  author_line?: string | null;
  url?: string | null;
  pdf_url?: string | null;
  category?: string | null;
  published_at?: string | null;
  source?: string | null;
  venue?: string | null;
  topic?: string | null;
  topic_key?: string | null;
};

export type ResearchFeed = {
  generated_at?: string;
  total?: number;
  sources?: Record<string, number>;
  papers?: ResearchPaper[];
};

export type StartupDeal = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  url?: string | null;
  source?: string | null;
  event_type?: string | null;
  amount?: string | null;
  technologies?: string[];
  published_at?: string | null;
  image_url?: string | null;
};

export type StartupsFeed = {
  generated_at?: string;
  total?: number;
  sources?: Record<string, number>;
  counts?: Record<string, number>;
  funding?: StartupDeal[];
  acquisitions?: StartupDeal[];
  ipos?: StartupDeal[];
  deals?: StartupDeal[];
};

async function readJson<T>(rel: string): Promise<T | null> {
  try {
    const file = path.join(process.cwd(), "public", "data", rel);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadIntelligenceFeed(): Promise<IntelligenceFeed> {
  const feed = await readJson<IntelligenceFeed>("intelligence-feed.json");
  if (feed) return feed;
  return { articles: DEMO_ARTICLES, total: DEMO_ARTICLES.length };
}

export async function getLiveArticles(): Promise<DemoArticle[]> {
  const feed = await loadIntelligenceFeed();
  if (feed.articles?.length) return feed.articles as DemoArticle[];
  return DEMO_ARTICLES;
}

export async function loadCoursesFeed(): Promise<CoursesFeed> {
  const feed = await readJson<CoursesFeed>("courses-feed.json");
  if (feed) return feed;
  return { courses: DEMO_COURSES, popular: DEMO_COURSES, newly_launched: [], total: DEMO_COURSES.length };
}

export async function getLiveCourses(): Promise<DemoCourse[]> {
  const feed = await loadCoursesFeed();
  if (feed.courses?.length) return feed.courses;
  return DEMO_COURSES;
}

export async function loadResearchFeed(): Promise<ResearchFeed> {
  return (await readJson<ResearchFeed>("research-feed.json")) || { papers: [], total: 0 };
}

export async function getLivePapers(): Promise<ResearchPaper[]> {
  const feed = await loadResearchFeed();
  return feed.papers || [];
}

export async function loadStartupsFeed(): Promise<StartupsFeed> {
  return (await readJson<StartupsFeed>("startups-feed.json")) || { deals: [], funding: [], total: 0 };
}

export async function getLiveDeals(): Promise<StartupDeal[]> {
  const feed = await loadStartupsFeed();
  return feed.deals || feed.funding || [];
}
