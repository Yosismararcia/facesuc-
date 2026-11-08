/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vinotinto: {
          50: '#fbf2f5',
          100: '#f7e4ea',
          200: '#efc9d5',
          300: '#e2a1b6',
          400: '#d06f90',
          500: '#b8436c',
          600: '#9d2f57',
          700: '#7b1e3b',
          800: '#651a32',
          900: '#55182c',
          950: '#300a18',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
