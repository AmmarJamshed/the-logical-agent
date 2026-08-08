import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public demo auth — unlocks local token flows on Vercel preview. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "");
  if (!email.includes("@")) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }
  return NextResponse.json({
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    token_type: "bearer",
  });
}
