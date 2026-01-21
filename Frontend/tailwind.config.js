/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 🔥 ESTA LÍNEA ES LA CLAVE
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"), // Asegúrate de tener esto si usas animaciones
  ],
}