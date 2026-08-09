import { loadCoursesFeed } from "@/lib/feed";
import type { DemoCourse } from "@/lib/public-ai";
import { Reveal, TiltCard } from "@/components/interactive";
import { TopicSourceFilter } from "@/components/topic-source-filter";

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

function CourseCard({ course }: { course: DemoCourse }) {
  const meta = [
    course.is_promoted ? "Featured" : null,
    course.category === "popular" ? "Top rated" : null,
    course.category === "newly_launched" ? "Just launched" : null,
    course.source || course.provider,
    course.modality,
    course.is_free ? "Free" : "Paid",
    course.rating != null ? `${course.rating.toFixed(1)}★` : null,
    course.review_count != null ? `${course.review_count.toLocaleString()} reviews` : null,
  ].filter(Boolean);

  const body = (
    <article className="panel-interactive grid gap-4 p-6 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
          {meta.map((item) => (
            <span key={String(item)} className={item === "Featured" || item === "Top rated" ? "text-ember-400" : undefined}>
              {item}
            </span>
          ))}
        </div>
        {(course.topics || []).length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(course.topics || []).slice(0, 4).map((t) => (
              <span key={t} className="rounded-lg bg-punch-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-punch-500">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <h2 className="mt-2 font-display text-2xl">{course.name}</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{course.ai_summary}</p>
        {course.technologies?.length ? (
          <p className="mt-3 text-xs text-[color:var(--muted)]">{course.technologies.join(" · ")}</p>
        ) : null}
      </div>
      <div className="text-sm text-[color:var(--muted)] md:text-right">
        <div>{course.country_code || "Global"}</div>
        {course.launched_at ? <div className="mt-2">{new Date(course.launched_at).toLocaleDateString()}</div> : null}
        {course.url ? <div className="mt-3 text-signal-500">Open course →</div> : null}
      </div>
    </article>
  );

  if (course.url) {
    return (
      <a href={course.url} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
    );
  }
  return body;
}

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

      <TopicSourceFilter
        topics={topics}
        topicCounts={feed.topic_counts}
        sources={sources}
        items={courses}
        matchTopic={(item, topic) =>
          !topic || (item.topics || []).includes(topic) || item.topic === topic
        }
        matchSource={(item, source) => !source || item.source === source || item.provider === source}
      >
        {(filtered) => (
          <div className="grid gap-4">
            {filtered.length ? (
              filtered.map((course, i) => (
                <Reveal key={course.id} delay={(i % 8) * 35}>
                  <TiltCard>
                    <CourseCard course={course} />
                  </TiltCard>
                </Reveal>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">No courses match this filter.</p>
            )}
          </div>
        )}
      </TopicSourceFilter>
    </div>
  );
}
