import { loadCoursesFeed } from "@/lib/feed";
import type { DemoCourse } from "@/lib/public-ai";

export const metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

function CourseCard({ course }: { course: DemoCourse }) {
  const meta = [
    course.is_promoted ? "Featured" : null,
    course.category === "popular" ? "Top rated" : null,
    course.category === "newly_launched" ? "Just launched" : null,
    course.provider,
    course.modality,
    course.is_free ? "Free" : "Paid",
    course.rating != null ? `${course.rating.toFixed(1)}★` : null,
    course.review_count != null ? `${course.review_count.toLocaleString()} reviews` : null,
  ].filter(Boolean);

  const body = (
    <article className="panel grid gap-4 p-6 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
          {meta.map((item) => (
            <span key={String(item)} className={item === "Featured" || item === "Top rated" ? "text-ember-400" : undefined}>
              {item}
            </span>
          ))}
        </div>
        <h2 className="mt-2 font-display text-2xl">{course.name}</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{course.ai_summary}</p>
        {course.technologies?.length ? (
          <p className="mt-3 text-xs text-[color:var(--muted)]">{course.technologies.join(" · ")}</p>
        ) : null}
      </div>
      <div className="text-sm text-[color:var(--muted)] md:text-right">
        <div>{course.country_code || "Global"}</div>
        {course.launched_at ? (
          <div className="mt-2">{new Date(course.launched_at).toLocaleDateString()}</div>
        ) : null}
        {course.url ? <div className="mt-3 text-signal-500">Open course →</div> : null}
      </div>
    </article>
  );

  if (course.url) {
    return (
      <a href={course.url} target="_blank" rel="noopener noreferrer" className="block transition hover:opacity-95">
        {body}
      </a>
    );
  }
  return body;
}

export default async function CoursesPage() {
  const feed = await loadCoursesFeed();
  const popular = feed.popular?.length
    ? feed.popular
    : (feed.courses || []).filter((c) => c.category === "popular");
  const newly = feed.newly_launched?.length
    ? feed.newly_launched
    : (feed.courses || []).filter((c) => c.category === "newly_launched");
  const generated = feed.generated_at ? new Date(feed.generated_at).toLocaleString() : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Course discovery</p>
      <h1 className="mt-3 font-display text-5xl">Popular picks &amp; fresh launches</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Real courses scraped from Coursera, edX, and launch coverage — ranked favorites with strong review
        signals, plus programs that just hit the catalog.
      </p>
      {generated ? (
        <p className="mt-2 text-xs text-[color:var(--muted)]">Feed updated {generated}</p>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-3xl">Popular with strong reviews</h2>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
          High-enrollment, highly rated programs learners keep recommending.
        </p>
        <div className="mt-6 grid gap-4">
          {popular.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Just launched</h2>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
          Recently published catalog entries and course-launch coverage from the web.
        </p>
        <div className="mt-6 grid gap-4">
          {newly.length ? (
            newly.map((course) => <CourseCard key={course.id} course={course} />)
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No newly launched courses in the latest scrape.</p>
          )}
        </div>
      </section>
    </div>
  );
}
