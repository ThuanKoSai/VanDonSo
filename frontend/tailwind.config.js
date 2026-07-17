/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3E9D2",
        paper2: "#EADFC1",
        paper3: "#E1D3AE",
        ink: "#3B2A1D",
        inksoft: "#6B5A44",
        rule: "#8A7658",
        forest: "#2F5D3A",
        forest2: "#1E4028",
        crimson: "#B23A2E",
        gold: "#C77A1E",
        goldtext: "#8A5714", // biến thể tối hơn của gold, đạt ~5:1 tương phản trên nền paper — dùng cho CHỮ, không dùng cho nền/icon
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
