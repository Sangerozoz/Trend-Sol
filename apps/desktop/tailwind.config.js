/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 中国股市惯例：红涨绿跌
        "up-red": "#ef4444",
        "up-red-light": "#f87171",
        "up-red-dark": "#dc2626",
        "down-green": "#22c55e",
        "down-green-light": "#4ade80",
        "down-green-dark": "#16a34a",
        // 主题色 - 纯黑背景
        "bg-primary": "#000000",
        "bg-secondary": "#0a0a0a",
        "bg-tertiary": "#161616",
        "bg-elevated": "#1f1f1f",
        "border-default": "#262626",
        "border-strong": "#333333",
        "text-primary": "#e8e8e8",
        "text-secondary": "#999999",
        "text-muted": "#666666",
        "accent": "#3b82f6",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
