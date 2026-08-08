import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const models = (process.env.GROQ_MODELS || "llama-3.3-70b-versatile,llama-3.1-8b-instant,gemma2-9b-it")
    .split(",")
    .map((m) => `groq:${m.trim()}`);
  const sentiment = (
    process.env.HF_SENTIMENT_MODELS ||
    "cardiffnlp/twitter-roberta-base-sentiment-latest,distilbert/distilbert-base-uncased-finetuned-sst-2-english"
  )
    .split(",")
    .map((m) => `huggingface:${m.trim()}`);

  return NextResponse.json({
    providers: ["groq", "huggingface"],
    models: {
      text_generation: models,
      sentiment: [...sentiment, "groq:llama-3.1-8b-instant"],
    },
    policy: "auto-switch on HTTP 429/503",
  });
}
