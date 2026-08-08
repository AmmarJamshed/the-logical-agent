import { NextResponse } from "next/server";
import { groqChat } from "@/lib/public-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt || "");
  if (!prompt) return NextResponse.json({ detail: "prompt required" }, { status: 400 });
  const result = await groqChat(prompt, body.system || "You are The Logical Agent assistant.");
  return NextResponse.json({
    content: result.content,
    provider: result.provider,
    model: result.model,
    tokens_used: 0,
  });
}
