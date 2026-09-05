/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-dark": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "accent-pink": "var(--accent-pink)",
        "accent-purple": "var(--accent-purple)",
        "accent-cyan": "var(--accent-cyan)",
        "accent-blue": "var(--accent-blue)",
        gold: "var(--gold)",
        "drop-red": "var(--drop-red)",
        mint: "var(--accent-mint)",
      },
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "glow-pink": "0 0 15px var(--accent-pink-alpha)",
        "glow-purple": "0 0 15px var(--accent-purple-alpha)",
        "neon-pink":
          "0 0 20px var(--accent-pink-alpha), 0 0 40px var(--accent-purple-soft)",
        "neon-purple":
          "0 0 20px var(--accent-purple-alpha), 0 0 40px var(--accent-pink-soft)",
        "gold-glow": "0 0 20px var(--gold-alpha)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
