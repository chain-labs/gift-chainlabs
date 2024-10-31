import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0D0619",
        secondary: "#0C2F30",
        accent: "#0AD48B",
        highlight: "#04FFA4",
        lightGray: "#E6E7E8",
        festiveRed: "#E91C1C",
        customBackground: "url('/bg.jpg')",
      },
      fontFamily: {
        festive: ['"Epilogue"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
