import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

/** Geometric mark for The Logical Agent — mint logic mark + coral node. */
export function BrandMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="64" height="64" rx="16" fill="#0B0F14" />
      <path
        d="M18 40V18h10.5c7.2 0 11.5 3.6 11.5 9.4 0 4.1-2.1 7.1-5.7 8.5L42 46h-8.2L28.5 37.2H26V46H18V40zm8-10.3h2.2c3.1 0 4.8-1.5 4.8-3.9s-1.7-3.8-4.8-3.8H26v7.7z"
        fill="#00E8A8"
      />
      <path d="M46 18l6 6-6 6-6-6 6-6z" fill="#FF4D6D" />
      <circle cx="46" cy="24" r="2.2" fill="#0B0F14" />
    </svg>
  );
}

export function BrandLogo({ size = 40, showWordmark = true, className = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="relative shrink-0 overflow-hidden rounded-2xl shadow-glow transition duration-300 group-hover:rotate-3 group-hover:scale-105">
        <Image
          src="/brand/logical-agent-logo.png"
          alt="The Logical Agent"
          width={size}
          height={size}
          className="rounded-2xl"
          priority
        />
      </span>
      {showWordmark ? (
        <span className="min-w-0">
          <span className="block font-display text-lg leading-none tracking-tight">
            The Logical <span className="brand-gradient-text">Agent</span>
          </span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Technology · Research · Intelligence
          </span>
        </span>
      ) : null}
    </span>
  );
}
