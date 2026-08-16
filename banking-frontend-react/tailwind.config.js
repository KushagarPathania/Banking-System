/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EDEAE0",
        "paper-raised": "#F6F4EC",
        ink: "#1D2B3A",
        "ink-soft": "#52626F",
        "ink-faint": "#8A94A0",
        rule: "#CFC7B0",
        "rule-strong": "#B9AF92",
        credit: "#2F6F4F",
        "credit-bg": "#E4EEE6",
        debit: "#A6423B",
        "debit-bg": "#F3E3E0",
        brass: "#A6813E",
        "brass-hover": "#8C6B2E",
        "brass-bg": "#EFE3C6",
      },
      fontFamily: {
        display: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', '"SFMono-Regular"', "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(29,43,58,0.06), 0 6px 20px -8px rgba(29,43,58,0.18)",
      },
    },
  },
  plugins: [],
};
