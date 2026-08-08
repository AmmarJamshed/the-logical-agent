"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { API_URL, type SearchResponse } from "@/lib/utils";

const EXAMPLES = [
  "What AI courses launched this week?",
  "Show cybersecurity certifications in Germany.",
  "Latest Quantum Computing breakthroughs.",
  "Which universities launched new AI degrees?",
  "What startups raised funding today?",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string) {
    setLoading(true);
    setError(null);
    setQuery(q);
    try {
      const response = await fetch(`${API_URL}/api/v1/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 20 }),
      });
      if (!response.ok) throw new Error(await response.text());
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow">Semantic AI search</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Ask the live knowledge graph</h1>
      <p className="mt-4 text-[color:var(--muted)]">
        Natural-language queries across news, courses, research, funding, universities, and events.
      </p>

      <form
        className="panel mt-8 flex items-center gap-3 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void runSearch(query.trim());
        }}
      >
        <Search className="ml-2 h-5 w-5 text-signal-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. cybersecurity certifications in Germany"
          className="w-full bg-transparent py-3 text-base outline-none"
        />
        <button className="btn-primary" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            className="rounded-full border border-[color:var(--stroke)] px-3 py-1.5 text-left text-xs text-[color:var(--muted)] hover:text-[color:var(--fg)]"
            onClick={() => void runSearch(example)}
          >
            {example}
          </button>
        ))}
      </div>

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

      {result ? (
        <div className="mt-10 space-y-4">
          <p className="text-sm text-[color:var(--muted)]">{result.interpretation}</p>
          {result.results.map((item) => (
            <article key={`${item.entity_type}-${item.id}`} className="panel p-5">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-signal-500">
                <span>{item.entity_type}</span>
                <span className="font-mono text-[color:var(--muted)]">{item.score.toFixed(2)}</span>
              </div>
              <h2 className="mt-2 font-display text-2xl">{item.title}</h2>
              {item.summary ? <p className="mt-2 text-sm text-[color:var(--muted)]">{item.summary}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
