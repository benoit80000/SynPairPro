/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}","./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { brandA:"#7B61FF", brandB:"#00FFFF" },
      borderRadius: { '2xl': '1rem' }
    }
  },
  plugins: [],
};
