export const metadata = { title: "Network" };

export default function NetworkPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="eyebrow">AI social network</p>
      <h1 className="mt-3 font-display text-5xl">Professionals. Researchers. Builders.</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
        Profiles, communities, research posts, debate rooms, messaging, portfolios, and an AI chat assistant —
        wired into the same knowledge graph as the newsroom.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Communities", "Join technology circles and publish research."],
          ["Debate rooms", "AI-moderated discussions on emerging topics."],
          ["Portfolios", "Showcase projects and get discovered."],
        ].map(([title, body]) => (
          <div key={title} className="panel p-6">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
