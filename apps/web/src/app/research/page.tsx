import { loadResearchFeed } from "@/lib/feed";
import { Reveal, TiltCard } from "@/components/interactive";

export const metadata = { title: "Research" };
export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const feed = await loadResearchFeed();
  const papers = feed.papers || [];
  const topics = Array.from(new Set(papers.map((p) => p.topic).filter(Boolean))) as string[];
  const generated = feed.generated_at ? new Date(feed.generated_at).toLocaleString() : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Research intelligence</p>
      <h1 className="mt-3 font-display text-5xl">Papers, decoded</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Live arXiv ingest across AI, ML, NLP, vision, security, and quantum — refreshed with the desk.
      </p>
      {generated ? <p className="mt-2 text-xs text-[color:var(--muted)]">Feed updated {generated} · {papers.length} papers</p> : null}

      {topics.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span key={topic} className="rounded-xl border border-[color:var(--stroke)] px-3 py-1.5 text-xs text-signal-500">
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-4">
        {papers.length ? (
          papers.map((paper, i) => {
            const body = (
              <article className="panel-interactive grid gap-4 p-6 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
                    <span>{paper.venue || "arXiv"}</span>
                    {paper.topic ? <span>{paper.topic}</span> : null}
                    {paper.category ? <span className="text-[color:var(--muted)]">{paper.category}</span> : null}
                  </div>
                  <h2 className="mt-2 font-display text-2xl leading-snug">{paper.title}</h2>
                  {paper.author_line ? (
                    <p className="mt-2 text-xs text-[color:var(--muted)]">{paper.author_line}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-[color:var(--muted)]">{paper.summary || paper.abstract}</p>
                </div>
                <div className="text-sm text-[color:var(--muted)] md:text-right">
                  {paper.published_at ? <div>{new Date(paper.published_at).toLocaleDateString()}</div> : null}
                  {paper.url ? <div className="mt-3 text-signal-500">Open paper →</div> : null}
                </div>
              </article>
            );
            return (
              <Reveal key={paper.id} delay={(i % 8) * 40}>
                <TiltCard>
                  {paper.url ? (
                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="block">
                      {body}
                    </a>
                  ) : (
                    body
                  )}
                </TiltCard>
              </Reveal>
            );
          })
        ) : (
          <p className="text-sm text-[color:var(--muted)]">No research papers in the feed yet. Run the research ingest.</p>
        )}
      </div>
    </div>
  );
}
