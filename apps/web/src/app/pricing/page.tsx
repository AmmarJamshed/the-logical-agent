import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    blurb: "Read, join communities, basic newsletters, limited AI search.",
    features: ["Articles & communities", "Basic newsletters", "Limited AI search"],
  },
  {
    name: "Pro",
    price: "$29",
    blurb: "Unlimited search, premium research, AI assistants, no ads.",
    features: ["Unlimited AI search", "Premium newsletters", "Saved dashboards", "No advertisements"],
    highlight: true,
  },
  {
    name: "Business",
    price: "$199",
    blurb: "Company profiles, sponsored content, recruitment, API access.",
    features: ["Company profile", "Sponsored content", "Recruitment tools", "Team management", "API access"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "Private research, white-label newsletters, custom agents, SSO.",
    features: ["Dedicated dashboards", "Custom AI agents", "SSO", "Priority support", "White-label"],
  },
];

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Subscriptions</p>
      <h1 className="mt-3 font-display text-5xl">Intelligence, priced for every desk</h1>
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
            <Link href="/login" className={plan.highlight ? "btn-primary mt-8" : "btn-ghost mt-8"}>
              Choose {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
