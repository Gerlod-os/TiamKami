/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#121212',
        'bg-gradient-start': '#1a1a2e',
        'accent-pink': '#FFB6C1',
        'accent-purple': '#C9A0DC',
        'accent-blue': '#A0C4FF',
      },
      fontFamily: {
        'heading': ['Nunito', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-pink': '0 0 15px rgba(255,182,193,0.5)',
        'glow-purple': '0 0 15px rgba(201,160,220,0.5)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}