import { NextResponse } from "next/server";
import { hfSentiment } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || "");
  if (!text) return NextResponse.json({ detail: "text required" }, { status: 400 });
  const result = await hfSentiment(text);
  return NextResponse.json({
    content: `${result.label} (${result.score.toFixed(3)})`,
    provider: result.provider,
    model: result.model,
    tokens_used: 0,
    sentiment: { label: result.label, score: result.score },
  });
}
