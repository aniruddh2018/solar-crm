/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        solar: {
          50: '#fef9e7',
          100: '#fdf1c4',
          200: '#fce38a',
          300: '#fad04f',
          400: '#f8c024',
          500: '#e8a80f',
          600: '#c98a0b',
          700: '#a36a0d',
          800: '#875311',
          900: '#6e4415',
        },
      },
    },
  },
  plugins: [],
};
