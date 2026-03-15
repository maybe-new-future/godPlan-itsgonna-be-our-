/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amazigh: {
          blue: "#0066CC",
          green: "#009E49",
          yellow: "#FFD100",
          red: "#E11D48",
        },
      },
    },
  },
  plugins: [],
};