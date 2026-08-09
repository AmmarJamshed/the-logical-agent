"use client";

import { useMemo, useState } from "react";

type TopicFilterProps<T> = {
  topics: string[];
  topicCounts?: Record<string, number>;
  sources?: string[];
  items: T[];
  matchTopic: (item: T, topic: string | null) => boolean;
  matchSource?: (item: T, source: string | null) => boolean;
  children: (filtered: T[]) => React.ReactNode;
};

export function TopicSourceFilter<T>({
  topics,
  topicCounts,
  sources = [],
  items,
  matchTopic,
  matchSource,
  children,
}: TopicFilterProps<T>) {
  const [topic, setTopic] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!matchTopic(item, topic)) return false;
      if (matchSource && !matchSource(item, source)) return false;
      return true;
    });
  }, [items, topic, source, matchTopic, matchSource]);

  return (
    <div>
      <div className="mt-6 space-y-3">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Topics</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTopic(null)}
              className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                topic === null
                  ? "border-signal-500 bg-signal-500/15 text-signal-600"
                  : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-signal-500/40 hover:text-signal-500"
              }`}
            >
              All ({items.length})
            </button>
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t === topic ? null : t)}
                className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                  topic === t
                    ? "border-signal-500 bg-signal-500/15 text-signal-600"
                    : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-signal-500/40 hover:text-signal-500"
                }`}
              >
                {t}
                {topicCounts?.[t] != null ? ` (${topicCounts[t]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {sources.length ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Sources</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSource(null)}
                className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                  source === null
                    ? "border-punch-500 bg-punch-500/10 text-punch-500"
                    : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-punch-500/40"
                }`}
              >
                All sources
              </button>
              {sources.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s === source ? null : s)}
                  className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                    source === s
                      ? "border-punch-500 bg-punch-500/10 text-punch-500"
                      : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-punch-500/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-[color:var(--muted)]">
        Showing {filtered.length} of {items.length}
        {topic ? ` · ${topic}` : ""}
        {source ? ` · ${source}` : ""}
      </p>

      <div className="mt-6">{children(filtered)}</div>
    </div>
  );
}
