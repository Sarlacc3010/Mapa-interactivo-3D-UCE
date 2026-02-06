/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // THIS LINE IS KEY
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"), // Ensure you have this if using animations
  ],
}