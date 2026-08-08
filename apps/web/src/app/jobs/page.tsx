export const metadata = { title: "Jobs" };

export default function JobsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow">Job board</p>
      <h1 className="mt-3 font-display text-5xl">Hire builders of the AI era</h1>
      <p className="mt-4 text-[color:var(--muted)]">
        Featured listings, recruitment campaigns, employer branding, resume uploads, and AI job recommendations.
      </p>
    </div>
  );
}
