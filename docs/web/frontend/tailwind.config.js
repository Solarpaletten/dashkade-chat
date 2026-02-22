/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'de-blue': '#1a1a2e',
        'de-dark': '#16213e',
        'de-accent': '#0f3460',
        'de-gold': '#e94560',
      }
    }
  },
  plugins: []
}
