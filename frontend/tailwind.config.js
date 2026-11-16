/**
 * Neo-brutalist theme. Palette: peach background, light-grey surface, hot orange, acid lime, black.
 *
 * Legacy pages were written for a dark theme (text-white, text-neutral-*, bg-white/5 ...). Instead of
 * editing every page, the scales below are remapped for a LIGHT background:
 *   - `white` is ink (so text-white / bg-white/5 / border-white/10 become dark text and faint dark tints)
 *   - `neutral` is inverted to readable greys
 * Use `bone` when you really need white.
 */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        peach: "#E9B9A4",
        paper: "#E6E6E6",
        bone: "#FFFFFF",
        accent: "#FF5A14",
        lime: "#C6FF00",
        violet: "#0A0A0A",
        panel: "#FFFFFF",
        line: "#0A0A0A",
        white: "#0A0A0A",
        neutral: { 50: "#0A0A0A", 100: "#141414", 200: "#1F1F1F", 300: "#2B2B2B", 400: "#3A3A3A", 500: "#4A4A4A", 600: "#5C5C5C", 700: "#6E6E6E", 800: "#BDBDBD", 900: "#E0E0E0", 950: "#F2F2F2" },
        red: { 200: "#8F1D0B", 300: "#C2260C", 400: "#B91C1C" },
        emerald: { 200: "#0B6B3A", 300: "#0F7A3F", 400: "#0F7A3F" },
        amber: { 200: "#6B4200", 300: "#8A5300" },
        sky: { 300: "#0B5CAD" },
        fuchsia: { 300: "#A3197A" },
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "Haettenschweiler", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { none: "0" },
      transitionTimingFunction: { fluid: "cubic-bezier(0.2,0.9,0.3,1)" },
      boxShadow: {
        brut: "6px 6px 0 0 #0A0A0A",
        brutsm: "3px 3px 0 0 #0A0A0A",
        brutlg: "10px 10px 0 0 #0A0A0A",
        core: "none",
        glow: "none",
      },
      keyframes: {
        rise: { "0%": { opacity: 0, transform: "translateY(16px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        grow: { "0%": { transform: "scaleX(0)" }, "100%": { transform: "scaleX(1)" } },
        slide: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        rise: "rise 0.45s cubic-bezier(0.2,0.9,0.3,1) both",
        grow: "grow 0.7s cubic-bezier(0.2,0.9,0.3,1) both",
        slide: "slide 28s linear infinite",
      },
    },
  },
  plugins: [],
};
