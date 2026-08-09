"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

/** Soft spotlight that follows the pointer. */
export function SpotlightStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(620px circle at var(--mx, 50%) var(--my, 30%), var(--spot), transparent 48%)",
      }}
    >
      {children}
    </div>
  );
}

/** 3D tilt card with stronger motion and light glare. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translateY(-6px) scale(1.02)`;
    el.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card relative transition-transform duration-150 will-change-transform ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-200 [.tilt-card:hover_&]:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--gx, 50%) var(--gy, 40%), rgba(255,255,255,0.35), transparent 55%)",
        }}
      />
      {children}
    </div>
  );
}

/** Magnetic hover pull for CTAs. */
export function Magnetic({ children, className = "", strength = 28 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${(x / strength).toFixed(2)}px, ${(y / strength).toFixed(2)}px)`;
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-flex transition-transform duration-150 will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}

/** Scroll progress bar at top of viewport. */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-signal-500 via-ember-400 to-punch-500 transition-[width] duration-150"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/** Floating custom cursor glow (desktop only). */
export function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [on, setOn] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setOn(true);
    const move = (e: globalThis.MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (!on) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[55] hidden h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-500/15 blur-3xl md:block"
      style={{ left: pos.x, top: pos.y }}
    />
  );
}

/** Reveal on scroll into view. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition duration-700 ease-out ${show ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Infinite marquee ticker. */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[color:var(--stroke)] bg-[color:var(--panel)] py-3">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap pl-8 text-sm font-medium text-[color:var(--muted)]">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center gap-8">
            <span className="text-signal-500">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Click ripple wrapper. */
export function RippleButton({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const spawn = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 600);
    onClick?.();
  }, [onClick]);

  return (
    <button type="button" onClick={spawn} className={`relative overflow-hidden ${className}`}>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full bg-white/40"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </button>
  );
}
