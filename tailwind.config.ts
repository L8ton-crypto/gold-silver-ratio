import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#d4a017",
        silver: "#c0c0c0",
      },
    },
  },
  plugins: [],
};

export default config;
