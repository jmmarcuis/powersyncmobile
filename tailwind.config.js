/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bgdark: '#1C1E21',
        primary: '#C6F806',
        secondary:'#455A64'
      },
    },
  },
  plugins: [],
}