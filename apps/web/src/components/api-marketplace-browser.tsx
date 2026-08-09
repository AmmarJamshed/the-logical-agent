"use client";

import { useMemo, useState } from "react";
import { ExternalLink, KeyRound, Sparkles } from "lucide-react";
import {
  AI_API_CATALOG,
  API_CATEGORIES,
  type AiApiProvider,
  type ApiCategory,
} from "@/lib/ai-api-catalog";
import { Reveal, TiltCard } from "@/components/interactive";

function ProviderCard({ provider }: { provider: AiApiProvider }) {
  return (
    <TiltCard>
      <article className="panel-interactive flex h-full flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
          {provider.free_tier ? (
            <span className="rounded-lg bg-signal-500/15 px-2 py-1 text-signal-600">Free tier</span>
          ) : (
            <span className="rounded-lg bg-[color:var(--stroke)] px-2 py-1 text-[color:var(--muted)]">Paid API</span>
          )}
          {provider.categories.slice(0, 2).map((c) => (
            <span key={c} className="rounded-lg bg-punch-500/10 px-2 py-1 text-punch-500">
              {c}
            </span>
          ))}
        </div>
        <h2 className="mt-3 font-display text-2xl">{provider.name}</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{provider.tagline}</p>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Best for</p>
          <ul className="mt-2 space-y-1 text-sm">
            {provider.best_for.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-[color:var(--muted)]">{provider.pricing_note}</p>
        <p className="mt-2 font-mono text-[11px] text-signal-600">
          {provider.models_examples.slice(0, 3).join(" · ")}
        </p>

        <div className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
          <p>
            <span className="font-medium text-[color:var(--fg)]">Use when: </span>
            {provider.when_to_use}
          </p>
          <p>
            <span className="font-medium text-[color:var(--fg)]">Skip when: </span>
            {provider.when_not_to_use}
          </p>
        </div>

        <details className="mt-4 rounded-xl border border-[color:var(--stroke)] bg-white/50 p-3 dark:bg-transparent">
          <summary className="cursor-pointer text-sm font-medium">How to get an API key</summary>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-[color:var(--muted)]">
            {provider.how_to_get_key.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href={provider.key_url} target="_blank" rel="noopener noreferrer" className="btn-primary !px-3 !py-2 text-xs">
            <KeyRound className="h-3.5 w-3.5" /> Get API key
          </a>
          <a href={provider.docs_url} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-2 text-xs">
            Docs <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {provider.playground_url ? (
            <a
              href={provider.playground_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !px-3 !py-2 text-xs"
            >
              Playground
            </a>
          ) : null}
        </div>
      </article>
    </TiltCard>
  );
}

export function ApiMarketplaceBrowser() {
  const [category, setCategory] = useState<ApiCategory | "All">("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return AI_API_CATALOG.filter((p) => {
      if (freeOnly && !p.free_tier) return false;
      if (category !== "All" && !p.categories.includes(category)) return false;
      if (!query) return true;
      const hay = `${p.name} ${p.tagline} ${p.best_for.join(" ")} ${p.categories.join(" ")} ${p.models_examples.join(" ")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [category, freeOnly, q]);

  return (
    <div>
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search APIs — LLM, speech, embeddings, agents…"
          className="w-full rounded-xl border border-[color:var(--stroke)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none transition focus:border-signal-500/50 focus:shadow-glow"
        />
        <button
          type="button"
          onClick={() => setFreeOnly((v) => !v)}
          className={`shrink-0 rounded-xl border px-4 py-3 text-sm transition ${
            freeOnly
              ? "border-signal-500 bg-signal-500/15 text-signal-600"
              : "border-[color:var(--stroke)] text-[color:var(--muted)]"
          }`}
        >
          Free tier only
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={category === "All"} onClick={() => setCategory("All")}>
          All ({AI_API_CATALOG.length})
        </Chip>
        {API_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <p className="mt-4 text-xs text-[color:var(--muted)]">
        Showing {filtered.length} providers · Open preview: explore freely, bring your own keys for external APIs
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((provider, i) => (
          <Reveal key={provider.id} delay={(i % 6) * 40}>
            <ProviderCard provider={provider} />
          </Reveal>
        ))}
      </div>

      {!filtered.length ? (
        <p className="mt-8 text-sm text-[color:var(--muted)]">No APIs match that filter.</p>
      ) : null}

      <div className="panel mt-12 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-signal-500" />
          <div>
            <h3 className="font-display text-xl">How The Logical Agent uses APIs</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              This marketplace is a map — not a reseller. You create keys at each provider, then plug them into your
              apps (or into The Logical Agent&apos;s AI Lab). During open preview, Pro platform features here are free
              so you can learn the stack without a paywall.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-xs transition ${
        active
          ? "border-signal-500 bg-signal-500/15 text-signal-600"
          : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-signal-500/40 hover:text-signal-500"
      }`}
    >
      {children}
    </button>
  );
}
