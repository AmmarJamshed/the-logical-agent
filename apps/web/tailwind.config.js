/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070a",
          900: "#0b0f14",
          800: "#121820",
          700: "#1a2330",
          600: "#243041",
        },
        signal: {
          300: "#5dffc8",
          400: "#2ef2a8",
          500: "#00e8a8",
        },
        punch: {
          300: "#ff8aa3",
          400: "#ff6b8a",
          500: "#ff4d6d",
        },
        ember: {
          400: "#ffe066",
          500: "#ffd23f",
        },
        mist: {
          50: "#f2f5f3",
          100: "#e4ebe7",
          200: "#c9d5ce",
          400: "#7a8b86",
          500: "#5c6b67",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(0,232,168,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,232,168,0.07) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(ellipse 70% 55% at 15% 10%, rgba(0,232,168,0.22), transparent 55%), radial-gradient(ellipse 55% 45% at 90% 0%, rgba(255,77,109,0.18), transparent 50%), radial-gradient(ellipse 40% 30% at 60% 80%, rgba(255,210,63,0.1), transparent 60%)",
        "mesh-move":
          "radial-gradient(circle at 20% 20%, rgba(0,232,168,0.18), transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,77,109,0.14), transparent 40%), radial-gradient(circle at 40% 80%, rgba(255,210,63,0.1), transparent 35%)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(0,232,168,0.08), 0 20px 50px rgba(0,0,0,0.28)",
        glow: "0 0 0 1px rgba(0,232,168,0.25), 0 12px 40px rgba(0,232,168,0.15)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseLine: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        mesh: {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(-2%, 1%, 0) scale(1.05)" },
          "100%": { transform: "translate3d(0,0,0) scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-line": "pulseLine 2.2s ease-in-out infinite",
        floaty: "floaty 5s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        mesh: "mesh 14s ease-in-out infinite",
        pop: "pop 0.45s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
