import { loadResearchFeed, type ResearchPaper } from "@/lib/feed";
import { Reveal, TiltCard } from "@/components/interactive";
import { TopicSourceFilter } from "@/components/topic-source-filter";

export const metadata = { title: "Research" };
export const dynamic = "force-dynamic";

const DEFAULT_TOPICS = [
  "LLM",
  "AI",
  "World Models",
  "Agents",
  "Multimodal",
  "Computer Vision",
  "NLP",
  "Reinforcement Learning",
  "Robotics",
  "Quantum",
  "Cybersecurity",
  "Machine Learning",
];

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const body = (
    <article className="panel-interactive grid gap-4 p-6 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
          <span>{paper.source || paper.venue || "Research"}</span>
          {(paper.topics || (paper.topic ? [paper.topic] : [])).slice(0, 3).map((t) => (
            <span key={t} className="text-punch-500">
              {t}
            </span>
          ))}
          {paper.category ? <span className="text-[color:var(--muted)]">{paper.category}</span> : null}
        </div>
        <h2 className="mt-2 font-display text-2xl leading-snug">{paper.title}</h2>
        {paper.author_line ? <p className="mt-2 text-xs text-[color:var(--muted)]">{paper.author_line}</p> : null}
        <p className="mt-3 text-sm text-[color:var(--muted)]">{paper.summary || paper.abstract}</p>
      </div>
      <div className="text-sm text-[color:var(--muted)] md:text-right">
        {paper.published_at ? <div>{new Date(paper.published_at).toLocaleDateString()}</div> : null}
        {paper.url ? <div className="mt-3 text-signal-500">Open paper →</div> : null}
      </div>
    </article>
  );

  if (paper.url) {
    return (
      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
    );
  }
  return body;
}

export default async function ResearchPage() {
  const feed = await loadResearchFeed();
  const papers = feed.papers || [];
  const topics = feed.topics?.length ? feed.topics : DEFAULT_TOPICS;
  const sources = Array.from(new Set(papers.map((p) => p.source).filter(Boolean))) as string[];
  const generated = feed.generated_at ? new Date(feed.generated_at).toLocaleString() : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Research intelligence</p>
      <h1 className="mt-3 font-display text-5xl">Papers, decoded</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Multi-source research desk: arXiv, OpenAlex, Crossref, Hugging Face Papers, and PubMed — tagged by LLM, AI,
        World Models, Agents, and more.
      </p>
      {generated ? (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Feed updated {generated} · {papers.length} papers · {sources.length} sources
        </p>
      ) : null}

      <TopicSourceFilter
        topics={topics}
        topicCounts={feed.topic_counts}
        sources={sources}
        items={papers}
        matchTopic={(item, topic) =>
          !topic || (item.topics || []).includes(topic) || item.topic === topic
        }
        matchSource={(item, source) => !source || item.source === source}
      >
        {(filtered) => (
          <div className="grid gap-4">
            {filtered.length ? (
              filtered.map((paper, i) => (
                <Reveal key={paper.id} delay={(i % 8) * 35}>
                  <TiltCard>
                    <PaperCard paper={paper} />
                  </TiltCard>
                </Reveal>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">No papers match this filter.</p>
            )}
          </div>
        )}
      </TopicSourceFilter>
    </div>
  );
}
