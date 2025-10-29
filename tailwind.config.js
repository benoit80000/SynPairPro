/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}","./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { brandA:"#7B61FF", brandB:"#00FFFF", bull:"#10b981", bear:"#ef4444", neutral:"#a1a1aa" },
      boxShadow: { glow: "0 0 32px rgba(123,97,255,.25)" }
    }
  },
  plugins: [],
};
