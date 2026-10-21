/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: '#2B211C',
        cream: '#F6EFE3',
        sage: '#9BAA91',
        terracotta: '#C8795B',
        sand: '#D8C6AE',
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
