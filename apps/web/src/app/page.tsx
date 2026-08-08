import Link from "next/link";
import { ArrowRight, Bot, Globe2, Newspaper, Radar } from "lucide-react";
import { getLiveArticles } from "@/lib/feed";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function HomePage() {
  const articles = (await getLiveArticles()).slice(0, 9);
  const lead = articles[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[color:var(--stroke)]">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-40 dark:opacity-30" />
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-end gap-10 px-6 pb-16 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-rise">
            <p className="eyebrow">The Logical Agent</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Technology.
              <br />
              Research.
              <br />
              <span className="text-signal-500 dark:text-signal-300">Intelligence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[color:var(--muted)]">
              Live NewsAPI + social intelligence, refreshed automatically every 2 days.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/news" className="btn-primary">
                Enter the newsroom <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/search" className="btn-ghost">
                Ask the knowledge graph
              </Link>
            </div>
          </div>

          <div className="animate-rise panel relative overflow-hidden" style={{ animationDelay: "120ms" }}>
            {lead?.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lead.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            ) : null}
            <div className="relative space-y-4 p-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ember-400">
                <span className="h-1.5 w-1.5 animate-pulse-line rounded-full bg-ember-400" />
                Live AI desk
              </div>
              <h2 className="font-display text-3xl leading-tight">{lead?.title}</h2>
              <p className="text-[color:var(--muted)]">{lead?.summary}</p>
              <Link href={`/articles/${lead?.slug || "latest"}`} className="btn-primary mt-4 inline-flex">
                Read briefing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Coverage mesh</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">NewsAPI + social signal</h2>
          </div>
          <Link href="/dashboards" className="btn-ghost">
            Open dashboards
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Newspaper, title: "NewsAPI desk", body: "Technology headlines and topic queries." },
            { icon: Bot, title: "Social scrape", body: "Reddit, HN, DEV, GitHub every 2 days." },
            { icon: Radar, title: "Semantic search", body: "Query the live knowledge graph." },
            { icon: Globe2, title: "Country dashboards", body: "National tech and funding pulse." },
          ].map((item) => (
            <div key={item.title} className="panel p-6">
              <item.icon className="h-5 w-5 text-signal-500" />
              <h3 className="mt-4 font-display text-xl">{item.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <p className="eyebrow">Latest from the desk</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.slug}`} className="panel group overflow-hidden transition hover:-translate-y-1">
              <div className="aspect-[16/9] bg-ink-800/40">
                {article.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.hero_image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span>{article.reading_time_minutes} min</span>
                  {article.source_name ? <span>{article.source_name}</span> : null}
                </div>
                <h3 className="mt-2 font-display text-xl leading-snug group-hover:text-signal-500">{article.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-[color:var(--muted)]">{article.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
