import Link from "next/link";
import { ArrowRight, Bot, Globe2, Newspaper, Radar } from "lucide-react";
import { getLiveArticles } from "@/lib/feed";
import { SpotlightStage, TiltCard } from "@/components/interactive";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function HomePage() {
  const articles = (await getLiveArticles()).slice(0, 9);
  const lead = articles[0];

  return (
    <div>
      <SpotlightStage className="relative border-b border-[color:var(--stroke)]">
        <div className="pointer-events-none absolute inset-0 animate-mesh bg-mesh-move opacity-90" />
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-35 dark:opacity-25" />
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-end gap-10 px-6 pb-16 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-rise">
            <p className="eyebrow">The Logical Indian</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
              Scroll less.
              <br />
              Know more.
              <br />
              <span className="brand-gradient-text">Stay sharp.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[color:var(--muted)]">
              News, courses, and startup signal built for millennials &amp; Gen Z — mint energy, coral punch, zero
              fluff.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/news" className="btn-primary">
                Enter the newsroom <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/courses" className="btn-ghost">
                Explore courses
              </Link>
              <Link href="/search" className="btn-ghost">
                Ask the graph
              </Link>
            </div>
          </div>

          <TiltCard className="animate-rise" >
            <div className="panel relative overflow-hidden" style={{ animationDelay: "120ms" }}>
              {lead?.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
              ) : null}
              <div className="relative space-y-4 p-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-punch-500">
                  <span className="h-1.5 w-1.5 animate-pulse-line rounded-full bg-punch-500" />
                  Live desk
                </div>
                <h2 className="font-display text-3xl leading-tight">{lead?.title}</h2>
                <p className="text-[color:var(--muted)]">{lead?.summary}</p>
                <Link href={`/articles/${lead?.slug || "latest"}`} className="btn-primary mt-4 inline-flex">
                  Read briefing
                </Link>
              </div>
            </div>
          </TiltCard>
        </div>
      </SpotlightStage>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Coverage mesh</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Tap. Swipe. Learn fast.</h2>
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
          ].map((item, i) => (
            <TiltCard key={item.title}>
              <div className="panel-interactive h-full p-6" style={{ animationDelay: `${i * 60}ms` }}>
                <item.icon className="h-5 w-5 text-signal-500" />
                <h3 className="mt-4 font-display text-xl">{item.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{item.body}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <p className="eyebrow">Latest from the desk</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article, i) => (
            <TiltCard key={article.id}>
              <Link
                href={`/articles/${article.slug}`}
                className="panel-interactive group block overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="aspect-[16/9] bg-ink-800/40">
                  {article.hero_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.hero_image_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
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
            </TiltCard>
          ))}
        </div>
      </section>
    </div>
  );
}
