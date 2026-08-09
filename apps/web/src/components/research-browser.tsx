"use client";

import { useMemo, useState } from "react";
import type { ResearchPaper } from "@/lib/feed";
import { Reveal, TiltCard } from "@/components/interactive";

function safeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const body = (
    <article className="panel-interactive grid gap-4 p-6 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
          <span>{paper.source || paper.venue || "Research"}</span>
          {(paper.topics || (paper.topic ? [paper.topic] : [])).slice(0, 3).map((t) => (
            <span key={t} className="text-punch-500">
              {t}
            </span>
          ))}
          {paper.category ? <span className="text-[color:var(--muted)]">{paper.category}</span> : null}
        </div>
        <h2 className="mt-2 font-display text-2xl leading-snug">{paper.title}</h2>
        {paper.author_line ? <p className="mt-2 text-xs text-[color:var(--muted)]">{paper.author_line}</p> : null}
        <p className="mt-3 text-sm text-[color:var(--muted)]">{paper.summary || paper.abstract}</p>
      </div>
      <div className="text-sm text-[color:var(--muted)] md:text-right">
        {safeDate(paper.published_at) ? <div>{safeDate(paper.published_at)}</div> : null}
        {paper.url ? <div className="mt-3 text-signal-500">Open paper →</div> : null}
      </div>
    </article>
  );

  if (paper.url) {
    return (
      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
    );
  }
  return body;
}

export function ResearchBrowser({
  papers,
  topics,
  topicCounts,
  sources,
}: {
  papers: ResearchPaper[];
  topics: string[];
  topicCounts?: Record<string, number>;
  sources: string[];
}) {
  const [topic, setTopic] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return papers.filter((item) => {
      const topicOk =
        !topic || (item.topics || []).includes(topic) || item.topic === topic;
      const sourceOk = !source || item.source === source;
      return topicOk && sourceOk;
    });
  }, [papers, topic, source]);

  return (
    <div>
      <FilterBar
        label="Topics"
        active={topic}
        allLabel={`All (${papers.length})`}
        options={topics.map((t) => ({
          value: t,
          label: topicCounts?.[t] != null ? `${t} (${topicCounts[t]})` : t,
        }))}
        onChange={setTopic}
        accent="signal"
      />
      <FilterBar
        label="Sources"
        active={source}
        allLabel="All sources"
        options={sources.map((s) => ({ value: s, label: s }))}
        onChange={setSource}
        accent="punch"
      />
      <p className="mt-4 text-xs text-[color:var(--muted)]">
        Showing {filtered.length} of {papers.length}
        {topic ? ` · ${topic}` : ""}
        {source ? ` · ${source}` : ""}
      </p>
      <div className="mt-6 grid gap-4">
        {filtered.length ? (
          filtered.map((paper, i) => (
            <Reveal key={paper.id} delay={(i % 8) * 35}>
              <TiltCard>
                <PaperCard paper={paper} />
              </TiltCard>
            </Reveal>
          ))
        ) : (
          <p className="text-sm text-[color:var(--muted)]">No papers match this filter.</p>
        )}
      </div>
    </div>
  );
}

function FilterBar({
  label,
  active,
  allLabel,
  options,
  onChange,
  accent,
}: {
  label: string;
  active: string | null;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
  accent: "signal" | "punch";
}) {
  const activeCls =
    accent === "signal"
      ? "border-signal-500 bg-signal-500/15 text-signal-600"
      : "border-punch-500 bg-punch-500/10 text-punch-500";
  const idleCls =
    accent === "signal"
      ? "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-signal-500/40 hover:text-signal-500"
      : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-punch-500/40";

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-xl border px-3 py-1.5 text-xs transition ${active === null ? activeCls : idleCls}`}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === active ? null : opt.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs transition ${
              active === opt.value ? activeCls : idleCls
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
