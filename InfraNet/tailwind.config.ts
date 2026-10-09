import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0d1117",
          700: "#1f2a33",
          500: "#46515d",
          300: "#8692a0",
          100: "#dfe6ee",
        },
        brand: {
          600: "#173ea8",
          700: "#102d7a",
          50: "#e7edff",
        },
        line: "#d9dee6",
        danger: "#a62d2d",
        success: "#136a4a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 20, 24, 0.06), 0 1px 1px rgba(17, 20, 24, 0.04)",
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
