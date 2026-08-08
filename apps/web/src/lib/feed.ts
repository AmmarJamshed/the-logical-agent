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

export async function loadCoursesFeed(): Promise<CoursesFeed> {
  try {
    const file = path.join(process.cwd(), "public", "data", "courses-feed.json");
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as CoursesFeed;
  } catch {
    return { courses: DEMO_COURSES, popular: DEMO_COURSES, newly_launched: [], total: DEMO_COURSES.length };
  }
}

export async function getLiveCourses(): Promise<DemoCourse[]> {
  const feed = await loadCoursesFeed();
  if (feed.courses?.length) return feed.courses;
  return DEMO_COURSES;
}
