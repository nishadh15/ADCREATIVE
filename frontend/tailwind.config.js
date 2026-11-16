module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        // translucent tokens: every existing `bg-panel` / `border-line` upgrades to glass automatically
        panel: "rgba(255,255,255,0.035)",
        line: "rgba(255,255,255,0.08)",
        paper: "#F5F5F0",
        accent: "#FF8A4C",
        violet: "#8B7CFF",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"] },
      transitionTimingFunction: { fluid: "cubic-bezier(0.32,0.72,0,1)" },
      boxShadow: {
        core: "inset 0 1px 1px rgba(255,255,255,0.10)",
        glow: "0 0 40px -8px rgba(255,138,76,0.55)",
      },
      keyframes: {
        rise: { "0%": { opacity: 0, transform: "translateY(24px)", filter: "blur(8px)" }, "100%": { opacity: 1, transform: "translateY(0)", filter: "blur(0)" } },
        grow: { "0%": { transform: "scaleX(0)" }, "100%": { transform: "scaleX(1)" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0)" }, "50%": { transform: "translate3d(4%,-3%,0)" } },
      },
      animation: {
        rise: "rise 0.9s cubic-bezier(0.32,0.72,0,1) both",
        grow: "grow 1.1s cubic-bezier(0.32,0.72,0,1) both",
        drift: "drift 18s cubic-bezier(0.45,0,0.55,1) infinite",
      },
    },
  },
  plugins: [],
};
