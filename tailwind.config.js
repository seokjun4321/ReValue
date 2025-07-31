/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        green:{
          100: '#AED581'
        },
        yellow:{
          100: '#FFFF66'
        }
      } 
    },
  },
  plugins: [],
}