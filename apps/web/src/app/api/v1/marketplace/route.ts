import { NextResponse } from "next/server";
import { AI_API_CATALOG, API_CATEGORIES } from "@/lib/ai-api-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const free = searchParams.get("free");
  let items = AI_API_CATALOG;
  if (category) items = items.filter((p) => p.categories.includes(category as (typeof API_CATEGORIES)[number]));
  if (free === "true") items = items.filter((p) => p.free_tier);
  return NextResponse.json({
    total: items.length,
    categories: API_CATEGORIES,
    free_preview: true,
    note: "Pro platform features are free during open preview. External provider keys are created on each vendor site.",
    items,
  });
}
