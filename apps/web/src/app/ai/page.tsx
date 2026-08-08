"use client";

import { useState } from "react";
import { API_URL } from "@/lib/utils";

export default function AILabPage() {
  const [prompt, setPrompt] = useState("Summarize why agentic AI is moving into production.");
  const [sentimentText, setSentimentText] = useState("This product launch is an incredible breakthrough for AI.");
  const [genOut, setGenOut] = useState<string>("");
  const [sentOut, setSentOut] = useState<string>("");
  const [meta, setMeta] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: "You are The Logical Agent editorial AI. Be crisp." }),
      });
      const data = await res.json();
      setGenOut(data.content || JSON.stringify(data));
      setMeta(`${data.provider}:${data.model}`);
    } finally {
      setBusy(false);
    }
  }

  async function sentiment() {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/ai/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentimentText }),
      });
      const data = await res.json();
      setSentOut(JSON.stringify(data.sentiment || data, null, 2));
      setMeta(`${data.provider}:${data.model}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow">AI lab</p>
      <h1 className="mt-3 font-display text-5xl">Generate & sentiment</h1>
      <p className="mt-4 text-[color:var(--muted)]">
        Public demo powered by Groq + Hugging Face with automatic model switching on rate limits.
      </p>
      {meta ? <p className="mt-2 font-mono text-xs text-signal-500">{meta}</p> : null}

      <div className="panel mt-8 space-y-3 p-6">
        <h2 className="font-display text-2xl">Text generation</h2>
        <textarea
          className="min-h-28 w-full rounded-xl border border-[color:var(--stroke)] bg-transparent p-3 text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button className="btn-primary" disabled={busy} onClick={() => void generate()}>
          Generate
        </button>
        {genOut ? <pre className="whitespace-pre-wrap text-sm text-[color:var(--muted)]">{genOut}</pre> : null}
      </div>

      <div className="panel mt-6 space-y-3 p-6">
        <h2 className="font-display text-2xl">Sentiment analysis</h2>
        <textarea
          className="min-h-24 w-full rounded-xl border border-[color:var(--stroke)] bg-transparent p-3 text-sm"
          value={sentimentText}
          onChange={(e) => setSentimentText(e.target.value)}
        />
        <button className="btn-primary" disabled={busy} onClick={() => void sentiment()}>
          Analyze
        </button>
        {sentOut ? <pre className="whitespace-pre-wrap text-sm text-[color:var(--muted)]">{sentOut}</pre> : null}
      </div>
    </div>
  );
}
