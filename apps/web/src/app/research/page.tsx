import { loadResearchFeed } from "@/lib/feed";
import { ResearchBrowser } from "@/components/research-browser";

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

      <ResearchBrowser
        papers={papers}
        topics={topics}
        topicCounts={feed.topic_counts}
        sources={sources}
      />
    </div>
  );
}
