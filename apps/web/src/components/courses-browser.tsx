"use client";

import { useMemo, useState } from "react";
import type { DemoCourse } from "@/lib/public-ai";
import { Reveal, TiltCard } from "@/components/interactive";

function safeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

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
        {safeDate(course.launched_at) ? <div className="mt-2">{safeDate(course.launched_at)}</div> : null}
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

export function CoursesBrowser({
  courses,
  topics,
  topicCounts,
  sources,
}: {
  courses: DemoCourse[];
  topics: string[];
  topicCounts?: Record<string, number>;
  sources: string[];
}) {
  const [topic, setTopic] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return courses.filter((item) => {
      const topicOk =
        !topic || (item.topics || []).includes(topic) || item.topic === topic;
      const sourceOk = !source || item.source === source || item.provider === source;
      return topicOk && sourceOk;
    });
  }, [courses, topic, source]);

  return (
    <div>
      <FilterBar
        label="Topics"
        active={topic}
        allLabel={`All (${courses.length})`}
        options={topics.map((t) => ({
          value: t,
          label: topicCounts?.[t] != null ? `${t} (${topicCounts[t]})` : t,
        }))}
        onChange={setTopic}
        accent="signal"
      />
      <FilterBar
        label="Sources"
        active={source}
        allLabel="All sources"
        options={sources.map((s) => ({ value: s, label: s }))}
        onChange={setSource}
        accent="punch"
      />
      <p className="mt-4 text-xs text-[color:var(--muted)]">
        Showing {filtered.length} of {courses.length}
        {topic ? ` · ${topic}` : ""}
        {source ? ` · ${source}` : ""}
      </p>
      <div className="mt-6 grid gap-4">
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
    </div>
  );
}

function FilterBar({
  label,
  active,
  allLabel,
  options,
  onChange,
  accent,
}: {
  label: string;
  active: string | null;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
  accent: "signal" | "punch";
}) {
  const activeCls =
    accent === "signal"
      ? "border-signal-500 bg-signal-500/15 text-signal-600"
      : "border-punch-500 bg-punch-500/10 text-punch-500";
  const idleCls =
    accent === "signal"
      ? "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-signal-500/40 hover:text-signal-500"
      : "border-[color:var(--stroke)] text-[color:var(--muted)] hover:border-punch-500/40";

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-xl border px-3 py-1.5 text-xs transition ${active === null ? activeCls : idleCls}`}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === active ? null : opt.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs transition ${
              active === opt.value ? activeCls : idleCls
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
