/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        timer: {
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          'red-dark': '#B91C1C',
        },
        surface: {
          900: '#0A0A0F',
          800: '#12121A',
          700: '#1A1A25',
          600: '#252530',
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'overtime-flash': 'overtime-flash 1s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'tick': 'tick 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'overtime-flash': {
          '0%, 100%': { backgroundColor: '#EF4444' },
          '50%': { backgroundColor: '#B91C1C' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'tick': {
          '0%, 100%': { transform: 'scale(1)' },
          '10%': { transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
