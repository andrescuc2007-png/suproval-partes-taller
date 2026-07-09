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
        // Colores corporativos Suproval
        navy: {
          DEFAULT: "#0D1B4B",
          50: "#E8EAF2",
          100: "#C5CAE0",
          200: "#9AA3C5",
          300: "#6E7BAA",
          400: "#4C5B95",
          500: "#2B3B80",
          600: "#1D2A66",
          700: "#0D1B4B",
          800: "#0A1540",
          900: "#060D2B",
        },
        gold: {
          DEFAULT: "#F5C800",
          50: "#FEF9E0",
          100: "#FDF0B3",
          200: "#FBE580",
          300: "#F9DA4D",
          400: "#F7D126",
          500: "#F5C800",
          600: "#C9A400",
          700: "#9C7F00",
          800: "#6F5A00",
          900: "#423600",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
