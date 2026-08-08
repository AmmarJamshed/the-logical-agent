export const dynamic = "force-dynamic";

type Metrics = {
  latest_news_count: number;
  ai_investment: number | null;
  startup_activity: number;
  universities: number;
  courses: number;
  certifications: number;
  conferences: number;
  research: number;
  funding_total: number | null;
  technology_rankings: Record<string, number>;
};

const DASHBOARDS: Record<string, Metrics> = {
  US: {
    latest_news_count: 210,
    ai_investment: 62000000000,
    startup_activity: 18400,
    universities: 420,
    courses: 9200,
    certifications: 900,
    conferences: 140,
    research: 48000,
    funding_total: 78000000000,
    technology_rankings: { ai: 1, cloud: 1, cybersecurity: 1 },
  },
  DE: {
    latest_news_count: 42,
    ai_investment: 4500000000,
    startup_activity: 1280,
    universities: 85,
    courses: 420,
    certifications: 65,
    conferences: 18,
    research: 3100,
    funding_total: 2100000000,
    technology_rankings: { ai: 8, cybersecurity: 5, quantum: 4 },
  },
  GB: {
    latest_news_count: 88,
    ai_investment: 9200000000,
    startup_activity: 3400,
    universities: 130,
    courses: 1100,
    certifications: 220,
    conferences: 45,
    research: 8900,
    funding_total: 6100000000,
    technology_rankings: { ai: 4, fintech: 2, cybersecurity: 3 },
  },
};

export async function generateMetadata({ params }: { params: { code: string } }) {
  return { title: `${params.code.toUpperCase()} Dashboard` };
}

export default function CountryDashboardPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const metrics = DASHBOARDS[code] || null;

  const cards = metrics
    ? [
        ["Latest news", metrics.latest_news_count],
        ["AI investment", metrics.ai_investment ? `$${(metrics.ai_investment / 1e9).toFixed(1)}B` : "—"],
        ["Startups", metrics.startup_activity],
        ["Universities", metrics.universities],
        ["Courses", metrics.courses],
        ["Certifications", metrics.certifications],
        ["Conferences", metrics.conferences],
        ["Research", metrics.research],
        ["Funding YTD", metrics.funding_total ? `$${(metrics.funding_total / 1e9).toFixed(1)}B` : "—"],
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Country dashboard</p>
      <h1 className="mt-3 font-display text-5xl">{code}</h1>
      {!metrics ? (
        <p className="mt-6 text-[color:var(--muted)]">Dashboard data unavailable for {code}.</p>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(([label, value]) => (
              <div key={String(label)} className="panel p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
                <p className="mt-3 font-display text-3xl">{value}</p>
              </div>
            ))}
          </div>
          <div className="panel mt-8 p-6">
            <p className="eyebrow">Technology rankings</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(metrics.technology_rankings).map(([tech, rank]) => (
                <span key={tech} className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm">
                  {tech}: #{rank}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
