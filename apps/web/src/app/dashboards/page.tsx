import Link from "next/link";

const TOPICS = [
  "AI",
  "Quantum",
  "Cybersecurity",
  "Cloud",
  "Blockchain",
  "Open Source",
  "Research",
  "Universities",
  "Courses",
  "Certifications",
  "Conferences",
  "Startups",
  "Funding",
  "Companies",
  "Countries",
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "DE", name: "Germany" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "SG", name: "Singapore" },
];

export const metadata = { title: "Dashboards" };

export default function DashboardsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Intelligence dashboards</p>
      <h1 className="mt-3 font-display text-5xl">Signal over noise</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Topic and country command centers for news, investment, policy, universities, courses, and research.
      </p>

      <h2 className="mt-12 font-display text-2xl">Topics</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {TOPICS.map((topic) => (
          <Link key={topic} href={`/dashboards/${encodeURIComponent(topic.toLowerCase())}`} className="panel p-4 text-sm hover:text-signal-500">
            {topic}
          </Link>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">Countries</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {COUNTRIES.map((country) => (
          <Link
            key={country.code}
            href={`/dashboards/countries/${country.code}`}
            className="panel flex items-center justify-between p-5"
          >
            <span className="font-display text-xl">{country.name}</span>
            <span className="font-mono text-sm text-[color:var(--muted)]">{country.code}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
