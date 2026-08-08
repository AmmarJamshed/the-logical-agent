export const metadata = { title: "Advertise" };

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow">Advertisement marketplace</p>
      <h1 className="mt-3 font-display text-5xl">Reach technology decision-makers</h1>
      <ul className="mt-8 space-y-3 text-[color:var(--muted)]">
        <li>Banner, sidebar, native, newsletter, homepage takeovers</li>
        <li>Sponsored articles, course promotion, event marketplace</li>
        <li>Targeting by country, technology, industry, role, company size</li>
      </ul>
    </div>
  );
}
