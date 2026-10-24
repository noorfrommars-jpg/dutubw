/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dutube: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#FF2A4D', // Primary brand color
          600: '#E01D3E',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        surface: {
          dark: '#0B0C0E',
          'dark-card': '#121418',
          'dark-elevated': '#1B1E24',
          'dark-border': '#252932',
          light: '#F4F5F7',
          'light-card': '#FFFFFF',
          'light-elevated': '#EAEBED',
          'light-border': '#E2E4E8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 0.8s ease-in-out',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        }
      }
    },
  },
  plugins: [],
}
