/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cil-gold'    : '#c49a3c',
        'cil-gold-lt' : '#e8d4a0',
        'cil-ink'     : '#1a1610',
        'cil-green'   : '#2d6a4f',
        'cil-red'     : '#9b2335',
        'cil-blue'    : '#1a4068',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}