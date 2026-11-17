import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        royale: {
          maroon: "#560f31",
          "maroon-deep": "#3e0823",
          crimson: "#7f1038",
          door: "#4a021e",
          flap: "#4a021e",
          band: "#800033",
          gold: "#feb669",
          cream: "#fdf2e1",
          paper: "#fde5c9",
          keyline: "#c29a70",
          ink: "#8c5a2c",
          "ceremony-ink": "#40080b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        names: ["var(--font-names)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        devanagari: ["var(--font-devanagari)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
