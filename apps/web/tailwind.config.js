/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070b14",
          900: "#0b1220",
          800: "#121a2b",
          700: "#1a2438",
          600: "#243049",
        },
        signal: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
        },
        ember: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        mist: {
          50: "#f4f7fb",
          100: "#e8eef7",
          200: "#d5deeb",
          400: "#94a3b8",
          500: "#64748b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.06) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14,165,233,0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(245,158,11,0.12), transparent)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(148,163,184,0.12), 0 24px 48px rgba(0,0,0,0.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseLine: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out both",
        "pulse-line": "pulseLine 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
