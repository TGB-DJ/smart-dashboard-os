/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'os-bg': '#02040a',
        'os-card': '#0d1117',
        'os-indigo': '#6366f1',
        'os-emerald': '#10b981',
        'os-amber': '#f59e0b'
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
        'flip': ['Bebas Neue', 'cursive']
      }
    },
  },
  plugins: [],
}
