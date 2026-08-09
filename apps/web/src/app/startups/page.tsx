import { loadStartupsFeed } from "@/lib/feed";
import { Reveal, TiltCard } from "@/components/interactive";
import type { StartupDeal } from "@/lib/feed";

export const metadata = { title: "Startups" };
export const dynamic = "force-dynamic";

function DealCard({ deal }: { deal: StartupDeal }) {
  const meta = [
    deal.event_type,
    deal.amount,
    deal.source,
    ...(deal.technologies || []).slice(0, 2),
  ].filter(Boolean);

  const body = (
    <article className="panel-interactive grid gap-4 p-6 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
          {meta.map((item) => (
            <span key={String(item)} className={item === deal.amount ? "text-ember-400" : undefined}>
              {item}
            </span>
          ))}
        </div>
        <h2 className="mt-2 font-display text-2xl leading-snug">{deal.name}</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{deal.summary}</p>
      </div>
      <div className="text-sm text-[color:var(--muted)] md:text-right">
        {deal.published_at ? <div>{new Date(deal.published_at).toLocaleDateString()}</div> : null}
        {deal.url ? <div className="mt-3 text-signal-500">Open story →</div> : null}
      </div>
    </article>
  );

  if (deal.url) {
    return (
      <a href={deal.url} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
    );
  }
  return body;
}

function Section({ title, subtitle, deals }: { title: string; subtitle: string; deals: StartupDeal[] }) {
  if (!deals.length) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-[color:var(--muted)]">{subtitle}</p>
      <div className="mt-6 grid gap-4">
        {deals.map((deal, i) => (
          <Reveal key={deal.id} delay={(i % 6) * 40}>
            <TiltCard>
              <DealCard deal={deal} />
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default async function StartupsPage() {
  const feed = await loadStartupsFeed();
  const funding = feed.funding?.length ? feed.funding : (feed.deals || []).filter((d) => d.event_type === "funding");
  const acquisitions = feed.acquisitions?.length
    ? feed.acquisitions
    : (feed.deals || []).filter((d) => d.event_type === "acquisition");
  const ipos = feed.ipos?.length ? feed.ipos : (feed.deals || []).filter((d) => d.event_type === "ipo");
  const other = (feed.deals || []).filter((d) => !["funding", "acquisition", "ipo"].includes(String(d.event_type)));
  const generated = feed.generated_at ? new Date(feed.generated_at).toLocaleString() : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Startup intelligence</p>
      <h1 className="mt-3 font-display text-5xl">Funding. Acquisitions. IPOs.</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Live scrape from TechCrunch, Crunchbase News, VentureBeat, and NewsAPI funding coverage.
      </p>
      {generated ? (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Feed updated {generated} · {feed.total || 0} deals
        </p>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Funding", feed.counts?.funding ?? funding.length],
          ["Acquisitions", feed.counts?.acquisition ?? acquisitions.length],
          ["IPOs", feed.counts?.ipo ?? ipos.length],
          ["Total", feed.total || 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
            <p className="mt-2 font-display text-3xl text-signal-500">{value}</p>
          </div>
        ))}
      </div>

      <Section title="Funding rounds" subtitle="Raises, seeds, and growth capital." deals={funding} />
      <Section title="Acquisitions" subtitle="Buyouts and strategic deals." deals={acquisitions} />
      <Section title="IPOs & listings" subtitle="Public market moves." deals={ipos} />
      <Section title="More startup signal" subtitle="Broader venture and company coverage." deals={other} />

      {!funding.length && !acquisitions.length && !ipos.length && !other.length ? (
        <p className="mt-10 text-sm text-[color:var(--muted)]">No startup deals in the feed yet. Run the startups ingest.</p>
      ) : null}
    </div>
  );
}
