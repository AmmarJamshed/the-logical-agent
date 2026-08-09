import Link from "next/link";

const PLANS = [
  {
    name: "Open Preview",
    price: "$0",
    blurb: "Everything unlocked while we teach the platform. No card. No trial clock.",
    features: [
      "Full news, research, courses, startups",
      "Unlimited AI search & AI Lab",
      "API Marketplace guides",
      "Dashboards & saved views",
      "No advertisements",
    ],
    highlight: true,
    cta: "Start exploring",
    href: "/marketplace",
  },
  {
    name: "Pro (coming later)",
    price: "TBD",
    blurb: "Will cover advanced agents and premium reports — free during preview.",
    features: ["Same as Open Preview today", "Future: deeper agent packs", "Future: export & alerts"],
    cta: "Included free now",
    href: "/ai",
  },
  {
    name: "Business (later)",
    price: "TBD",
    blurb: "Teams, sponsorships, and recruitment — not billed in preview.",
    features: ["Company profiles", "Sponsored content", "Team seats", "API access"],
    cta: "Browse APIs",
    href: "/marketplace",
  },
  {
    name: "Enterprise (later)",
    price: "Talk to us",
    blurb: "Custom agents and SSO when you outgrow preview.",
    features: ["Custom agents", "SSO", "Private data rooms", "Priority support"],
    cta: "Explore platform",
    href: "/search",
  },
];

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-2xl border border-signal-500/30 bg-signal-500/10 px-4 py-3 text-sm text-signal-600">
        <strong>Pro-level access is free for everyone</strong> during open preview. Learn the product first — billing
        comes later.
      </div>
      <p className="eyebrow mt-8">Subscriptions</p>
      <h1 className="mt-3 font-display text-5xl">Free while you learn the desk</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Use search, AI Lab, research, courses, and the API Marketplace with full Pro capabilities. Paid tiers are
        placeholders for later.
      </p>
      <div className="mt-12 grid gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`panel flex flex-col p-6 ${plan.highlight ? "ring-1 ring-signal-500" : ""}`}
          >
            <p className="eyebrow">{plan.name}</p>
            <p className="mt-4 font-display text-4xl">{plan.price}</p>
            <p className="mt-3 text-sm text-[color:var(--muted)]">{plan.blurb}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <Link href={plan.href} className={plan.highlight ? "btn-primary mt-8" : "btn-ghost mt-8"}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
