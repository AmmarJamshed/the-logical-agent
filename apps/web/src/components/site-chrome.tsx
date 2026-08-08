"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Search, Sun, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/news", label: "News" },
  { href: "/research", label: "Research" },
  { href: "/courses", label: "Courses" },
  { href: "/startups", label: "Startups" },
  { href: "/search", label: "Search" },
  { href: "/ai", label: "AI Lab" },
  { href: "/dashboards", label: "Dashboards" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--stroke)] bg-[color:var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-signal-400 shadow-panel dark:bg-signal-500 dark:text-ink-950">
            <Zap className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none tracking-tight">The Logical Agent</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Technology · Research · Intelligence
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[color:var(--muted)] transition hover:text-[color:var(--fg)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" className="btn-ghost !px-3" aria-label="Search">
            <Search className="h-4 w-4" />
          </Link>
          {mounted && (
            <button
              className="btn-ghost !px-3"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/pricing" className="btn-primary hidden sm:inline-flex">
            Go Pro
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--stroke)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl">The Logical Agent</p>
          <p className="mt-3 max-w-md text-sm text-[color:var(--muted)]">
            The Bloomberg of Technology — an AI-native newsroom continuously discovering, verifying, and
            publishing the world&apos;s latest developments in AI, research, and digital innovation.
          </p>
        </div>
        <div>
          <p className="eyebrow">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li><Link href="/news">Newsroom</Link></li>
            <li><Link href="/courses">Course Discovery</Link></li>
            <li><Link href="/network">Social Network</Link></li>
            <li><Link href="/admin">Admin Portal</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Business</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li><Link href="/pricing">Subscriptions</Link></li>
            <li><Link href="/advertise">Advertise</Link></li>
            <li><Link href="/jobs">Job Board</Link></li>
            <li><Link href="/marketplace">AI Marketplace</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
