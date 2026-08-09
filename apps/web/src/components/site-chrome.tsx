"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Magnetic } from "@/components/interactive";

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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[color:var(--stroke)] transition-all duration-300 ${
        scrolled ? "bg-[color:var(--bg)]/95 shadow-[var(--shadow)] backdrop-blur-2xl" : "bg-[color:var(--bg)]/80 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="group" aria-label="The Logical Agent home">
          <BrandLogo size={40} />
        </Link>

        <nav className="hidden items-center gap-5 xl:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "text-[color:var(--fg)] after:!w-full" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Magnetic>
            <Link href="/search" className="btn-ghost !px-3" aria-label="Search">
              <Search className="h-4 w-4" />
            </Link>
          </Magnetic>
          {mounted && (
            <Magnetic>
              <button
                className="btn-ghost !px-3"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </Magnetic>
          )}
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Magnetic strength={22}>
            <Link href="/pricing" className="btn-primary hidden sm:inline-flex">
              Go Pro
            </Link>
          </Magnetic>
          <button
            className="btn-ghost !px-3 xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="animate-pop border-t border-[color:var(--stroke)] bg-[color:var(--bg)] xl:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1 px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-signal-500/10 hover:text-signal-500"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/pricing" className="btn-primary mt-2 justify-center">
              Go Pro
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--stroke)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandLogo size={48} />
          <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
            The Bloomberg of Technology — an AI-native newsroom continuously discovering, verifying, and publishing
            the latest in AI, research, and digital innovation.
          </p>
        </div>
        <div>
          <p className="eyebrow">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li><Link className="transition hover:text-signal-500" href="/news">Newsroom</Link></li>
            <li><Link className="transition hover:text-signal-500" href="/courses">Course Discovery</Link></li>
            <li><Link className="transition hover:text-signal-500" href="/network">Social Network</Link></li>
            <li><Link className="transition hover:text-signal-500" href="/admin">Admin Portal</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Business</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li><Link className="transition hover:text-signal-500" href="/pricing">Subscriptions</Link></li>
            <li><Link className="transition hover:text-signal-500" href="/advertise">Advertise</Link></li>
            <li><Link className="transition hover:text-signal-500" href="/jobs">Job Board</Link></li>
            <li><Link className="transition hover:text-signal-500" href="/marketplace">AI Marketplace</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
