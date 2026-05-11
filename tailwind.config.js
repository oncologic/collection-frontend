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
        review: {
          approve: {
            light: "#d1fae5",
            medium: "#34d399",
            dark: "#059669",
          },
          decline: {
            light: "#fee2e2",
            medium: "#f87171",
            dark: "#dc2626",
          },
          revise: {
            light: "#fef3c7",
            medium: "#fbbf24",
            dark: "#d97706",
          },
          question: {
            light: "#dbeafe",
            medium: "#60a5fa",
            dark: "#2563eb",
          },
        },
      },
      textColor: {
        DEFAULT: "gray-700",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "fade-in-left": "fadeInLeft 0.5s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        "rotate-y-180": "rotateY180 0.5s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        progress: "progress 1s ease-out forwards",
        "fly-to-profile":
          "flyToProfile 1s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "fly-to-chat-resources":
          "flyToChatResources 1s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "text-stream": "cursor 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: 0, transform: "translateX(-20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        rotateY180: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        flyToProfile: {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: 1 },
          "90%": { transform: "translate(50vw, -50vh) scale(0.1)", opacity: 0 },
          "100%": {
            transform: "translate(100vw, -100vh) scale(0)",
            opacity: 0,
          },
        },
        flyToChatResources: {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: 1 },
          "90%": {
            transform: "translate(0, 50vh) scale(0.1)",
            opacity: 0,
          },
          "100%": {
            transform: "translate(0, 100vh) scale(0)",
            opacity: 0,
          },
        },
        cursor: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: null,
            color: "var(--foreground)",
            p: {
              marginTop: "1em",
              marginBottom: "1em",
            },
            "ul, ol": {
              paddingLeft: "1.5em",
            },
            h1: {
              color: "var(--foreground)",
              fontWeight: "600",
            },
            h2: {
              color: "var(--foreground)",
              fontWeight: "600",
            },
            h3: {
              color: "var(--foreground)",
              fontWeight: "600",
            },
            a: {
              color: "#2563eb",
              "&:hover": {
                color: "#1d4ed8",
              },
            },
            blockquote: {
              borderLeftColor: "#e5e7eb",
              color: "var(--foreground)",
            },
            code: {
              color: "#ef4444",
              backgroundColor: "#f3f4f6",
              borderRadius: "0.25rem",
              padding: "0.125rem 0.25rem",
            },
          },
        },
      },
      perspective: {
        1000: "1000px",
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      backfaceVisibility: {
        hidden: "hidden",
      },
      boxShadow: {
        feedback:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        status: "0 0 0 3px rgba(124, 58, 237, 0.3)",
      },
      fontSize: {
        xxs: [
          "0.625rem",
          {
            lineHeight: "0.75rem",
          },
        ],
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
    "bg-green-50",
    "bg-green-100",
    "bg-green-500",
    "text-green-500",
    "text-green-600",
    "text-green-700",
    "border-green-100",
    "border-green-200",
    "bg-red-50",
    "bg-red-100",
    "bg-red-500",
    "text-red-500",
    "text-red-600",
    "text-red-700",
    "border-red-100",
    "border-red-200",
    "bg-yellow-50",
    "bg-yellow-100",
    "bg-yellow-500",
    "text-yellow-500",
    "text-yellow-600",
    "text-yellow-700",
    "border-yellow-100",
    "border-yellow-200",
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-500",
    "text-blue-500",
    "text-blue-600",
    "text-blue-700",
    "border-blue-100",
    "border-blue-200",
    "bg-purple-50",
    "bg-purple-100",
    "text-purple-500",
    "text-purple-600",
    "text-purple-700",
    "border-purple-100",
    "border-purple-200",
    "bg-indigo-50",
    "bg-indigo-100",
    "text-indigo-500",
    "text-indigo-600",
    "text-indigo-700",
    "border-indigo-100",
    "border-indigo-200",
    "from-purple-600",
    "to-indigo-600",
    "from-purple-700",
    "to-indigo-700",
    "animate-pulse-slow",
    "animate-progress",
  ],
  plugins: [typography()],
};

export default config;
