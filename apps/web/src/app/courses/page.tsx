import { DEMO_COURSES } from "@/lib/public-ai";

export const metadata = { title: "Courses" };

export default function CoursesPage() {
  const courses = DEMO_COURSES;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">Course discovery</p>
      <h1 className="mt-3 font-display text-5xl">Learn what just launched</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Continuously discovered courses, certifications, bootcamps, fellowships, and scholarships.
      </p>
      <div className="mt-10 grid gap-4">
        {courses.map((course) => (
          <article key={course.id} className="panel grid gap-4 p-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-signal-500">
                {course.is_promoted ? <span className="text-ember-400">Featured</span> : null}
                <span>{course.provider}</span>
                <span>{course.modality}</span>
                {course.is_free ? <span>Free</span> : null}
              </div>
              <h2 className="mt-2 font-display text-2xl">{course.name}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{course.ai_summary}</p>
            </div>
            <div className="text-sm text-[color:var(--muted)] md:text-right">{course.country_code || "Global"}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
