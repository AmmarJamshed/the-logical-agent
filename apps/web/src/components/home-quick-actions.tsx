"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CHIPS = [
  { label: "AI agents", href: "/search?q=AI%20agents" },
  { label: "New courses", href: "/courses" },
  { label: "Cybersecurity", href: "/news" },
  { label: "Funding", href: "/startups" },
  { label: "AI Lab", href: "/ai" },
];

export function HomeQuickActions() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <div className="mt-8 max-w-xl space-y-3">
      <form
        className="group flex items-center gap-2 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel)] p-2 shadow-panel backdrop-blur-xl transition focus-within:border-signal-500/50 focus-within:shadow-glow"
        onSubmit={(e) => {
          e.preventDefault();
          const query = q.trim();
          if (!query) return;
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything — agents, courses, funding…"
          className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[color:var(--muted)]"
          aria-label="Quick search"
        />
        <button type="submit" className="btn-primary !rounded-xl !px-4 !py-2 text-xs">
          Go
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className="rounded-xl border border-[color:var(--stroke)] px-3 py-1.5 text-xs text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-signal-500/40 hover:bg-signal-500/10 hover:text-signal-500"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
