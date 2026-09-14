import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#111418",
          700: "#2b3138",
          500: "#5b6470",
          300: "#9aa3ad",
          100: "#e7eaee",
        },
        brand: {
          600: "#1f5eff",
          700: "#1a4fd6",
          50: "#eef3ff",
        },
        line: "#e2e5ea",
        danger: "#c1352b",
        success: "#1f7a4d",
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
