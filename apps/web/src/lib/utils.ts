import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // During build / SSR without an absolute API, prefer relative URL only when a request base exists.
  // Otherwise throw quickly so pages can fall back to demo content.
  const base = API_URL;
  if (!base && typeof window === "undefined" && !process.env.VERCEL_URL) {
    throw new Error("API unavailable during build");
  }
  const origin =
    base ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (typeof window !== "undefined" ? "" : "http://127.0.0.1:3000");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${origin}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error(`API ${response.status}: ${await response.text()}`);
    }
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export type Article = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  summary?: string | null;
  hero_image_url?: string | null;
  reading_time_minutes: number;
  technologies: string[];
  published_at?: string | null;
  ai_confidence_score?: number | null;
  is_sponsored: boolean;
  view_count: number;
};

export type Course = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  country_code?: string | null;
  modality: string;
  difficulty: string;
  is_free: boolean;
  technologies: string[];
  ai_summary?: string | null;
  is_promoted: boolean;
  category?: string;
  rating?: number | null;
  review_count?: number | null;
  url?: string | null;
  launched_at?: string | null;
};

export type SearchResponse = {
  query: string;
  interpretation: string;
  results: Array<{
    entity_type: string;
    id: string;
    title: string;
    summary?: string | null;
    score: number;
    url?: string | null;
  }>;
};
