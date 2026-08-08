import { NextResponse } from "next/server";
import { DEMO_COURSES } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") || "").toUpperCase();
  const technology = (searchParams.get("technology") || "").toLowerCase();
  const isFree = searchParams.get("is_free");
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("page_size") || 50);

  let items = DEMO_COURSES;
  if (country) items = items.filter((c) => (c.country_code || "").toUpperCase() === country);
  if (technology) items = items.filter((c) => c.technologies.some((t) => t.toLowerCase() === technology));
  if (isFree === "true") items = items.filter((c) => c.is_free);
  if (isFree === "false") items = items.filter((c) => !c.is_free);

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
