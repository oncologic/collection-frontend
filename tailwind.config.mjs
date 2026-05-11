/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-10deg)" },
          "75%": { transform: "rotate(10deg)" },
        },
      },
    },
  },
  safelist: [
    "from-green-600",
    "from-indigo-600",
    "to-green-300",
    "to-indigo-900",
    "bg-slate-900",
    "prose",
    "prose-sm",
    "prose-lg",
    "prose-xl",
    "prose-2xl",
  ],
  plugins: [typography()],
};

export default config;
