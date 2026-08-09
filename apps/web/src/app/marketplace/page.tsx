import Link from "next/link";
import { ApiMarketplaceBrowser } from "@/components/api-marketplace-browser";

export const metadata = {
  title: "AI API Marketplace",
  description:
    "Compare AI APIs for chat, agents, speech, images, and embeddings — plus where to get API keys. Pro features free during open preview.",
};

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-2xl border border-signal-500/30 bg-signal-500/10 px-4 py-3 text-sm text-signal-600">
        Open preview · <strong>Pro is free for everyone</strong> right now so you can learn the platform — no card
        required.{" "}
        <Link href="/pricing" className="underline underline-offset-2">
          See what&apos;s unlocked
        </Link>
      </div>

      <p className="eyebrow mt-8">AI API marketplace</p>
      <h1 className="mt-3 font-display text-5xl">Which AI API for what</h1>
      <p className="mt-4 max-w-3xl text-[color:var(--muted)]">
        A practical directory of AI providers: what they&apos;re good at, example models, when to use them, and exact
        links to create API keys. Bring your own keys — we help you choose.
      </p>

      <ApiMarketplaceBrowser />
    </div>
  );
}
