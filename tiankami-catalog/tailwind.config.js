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
        gold: "var(--gold)",
        "drop-red": "var(--drop-red)",
      },
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "glow-pink": "0 0 15px rgba(255,182,193,0.5)",
        "glow-purple": "0 0 15px rgba(201,160,220,0.5)",
        "neon-pink":
          "0 0 20px rgba(236,72,153,0.5), 0 0 40px rgba(168,85,247,0.3)",
        "neon-purple":
          "0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(236,72,153,0.3)",
        "gold-glow": "0 0 20px rgba(251,191,36,0.2)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
