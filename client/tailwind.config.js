/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pale: {
          bg: '#fdfbf7',     // Soft Cream
          primary: '#d4a373', // Soft Brown/Gold
          accent: '#ccd5ae',  // Sage Green
          text: '#4a4e69',    // Muted dark
          secondary: '#e9edc9', // Lighter Green
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
