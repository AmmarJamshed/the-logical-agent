import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DASHBOARDS: Record<string, object> = {
  US: {
    latest_news_count: 210,
    ai_investment: 62000000000,
    startup_activity: 18400,
    universities: 420,
    courses: 9200,
    certifications: 900,
    conferences: 140,
    research: 48000,
    funding_total: 78000000000,
    technology_rankings: { ai: 1, cloud: 1, cybersecurity: 1 },
  },
  DE: {
    latest_news_count: 42,
    ai_investment: 4500000000,
    startup_activity: 1280,
    universities: 85,
    courses: 420,
    certifications: 65,
    conferences: 18,
    research: 3100,
    funding_total: 2100000000,
    technology_rankings: { ai: 8, cybersecurity: 5, quantum: 4 },
  },
  GB: {
    latest_news_count: 88,
    ai_investment: 9200000000,
    startup_activity: 3400,
    universities: 130,
    courses: 1100,
    certifications: 220,
    conferences: 45,
    research: 8900,
    funding_total: 6100000000,
    technology_rankings: { ai: 4, fintech: 2, cybersecurity: 3 },
  },
};

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const data = DASHBOARDS[code];
  if (!data) {
    return NextResponse.json({ detail: "Country dashboard not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
