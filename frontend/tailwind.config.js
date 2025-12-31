// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí indicamos dónde buscará las clases de tailwind (App.tsx y carpeta components)
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}