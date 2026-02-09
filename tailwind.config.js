/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        primary: "#F7931A", // Bitcoin Orange
        secondary: "#00F3FF", // Neon Blue
        surface: "#1a1a1a",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'neon-primary': '0 0 10px rgba(247, 147, 26, 0.5), 0 0 20px rgba(247, 147, 26, 0.3)',
        'neon-secondary': '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
