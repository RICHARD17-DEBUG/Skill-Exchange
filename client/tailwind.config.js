/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          dark: '#141416',
          panel: '#1c1d22',
          card: '#24262e',
          border: '#383b47',
          gold: '#f59e0b',
          goldDark: '#b45309',
          green: '#10b981',
          greenDark: '#047857',
          red: '#ef4444',
          redDark: '#b91c1c',
          blue: '#3b82f6',
          cream: '#f5f0e6',
          accent: '#d97706',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        credit: {
          50: '#fef3c7',
          100: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
        arcade: ['VT323', 'monospace'],
        mono: ['"Space Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
