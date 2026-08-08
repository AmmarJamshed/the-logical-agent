import Link from "next/link";
import { getLiveArticles } from "@/lib/feed";

export const metadata = { title: "Newsroom" };
export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function NewsPage() {
  const articles = await getLiveArticles();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">AI Newsroom</p>
      <h1 className="mt-3 font-display text-5xl">The desk is live</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Powered by NewsAPI plus Reddit, Hacker News, DEV, GitHub, and RSS — refreshed every 2 days by GitHub Actions.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {articles.slice(0, 60).map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`} className="panel p-5 transition hover:-translate-y-0.5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-signal-500">
              {article.source_name || article.technologies?.[0] || "intel"}
            </div>
            <h2 className="mt-2 font-display text-2xl leading-snug">{article.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-[color:var(--muted)]">{article.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
