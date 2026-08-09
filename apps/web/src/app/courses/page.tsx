import { loadCoursesFeed } from "@/lib/feed";
import { CoursesBrowser } from "@/components/courses-browser";

export const metadata = { title: "Courses" };
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

export default async function CoursesPage() {
  const feed = await loadCoursesFeed();
  const courses = feed.courses || [];
  const topics = feed.topics?.length ? feed.topics : DEFAULT_TOPICS;
  const sources = Array.from(new Set(courses.map((c) => c.source || c.provider).filter(Boolean))) as string[];
  const generated = feed.generated_at ? new Date(feed.generated_at).toLocaleString() : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Course discovery</p>
      <h1 className="mt-3 font-display text-5xl">Popular picks &amp; fresh launches</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Courses from Coursera, edX, Hugging Face, DeepLearning.AI, LangChain, Microsoft Learn, and launch coverage —
        filterable by LLM, AI, World Models, Agents, and more.
      </p>
      {generated ? (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Feed updated {generated} · {courses.length} courses · {sources.length} sources
        </p>
      ) : null}

      <CoursesBrowser
        courses={courses}
        topics={topics}
        topicCounts={feed.topic_counts}
        sources={sources}
      />
    </div>
  );
}
