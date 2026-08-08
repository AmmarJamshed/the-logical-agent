import { getLiveArticles } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articles = await getLiveArticles();
  const article = articles.find((a) => a.slug === params.slug) || null;

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl">Article not found</h1>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-signal-500">
        {article.source_name || "Intelligence feed"}
      </p>
      <h1 className="mt-3 font-display text-5xl leading-tight">{article.title}</h1>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
        <span>{article.reading_time_minutes} min read</span>
        {article.published_at ? <span>{new Date(article.published_at).toLocaleString()}</span> : null}
      </div>
      {article.hero_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.hero_image_url} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
      ) : null}
      <p className="mt-8 text-lg text-[color:var(--muted)]">{article.summary}</p>
      {(article.url) ? (
        <p className="mt-8">
          <a className="btn-primary" href={article.url} target="_blank" rel="noreferrer">
            View original source
          </a>
        </p>
      ) : null}
    </article>
  );
}
