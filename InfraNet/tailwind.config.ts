import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#FFFFFF",
          700: "#E5E5E5",
          600: "#B8B8B8",
          500: "#999999",
          300: "#666666",
          100: "#101010",
          50: "#171717",
        },
        brand: {
          50: "#202900",
          100: "#344200",
          200: "#718d00",
          600: "#B3E600",
          700: "#C8FF00",
          800: "#D6FF45",
        },
        line: "#2b2b2b",
        danger: "#FFFFFF",
        success: "#C8FF00",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 20, 24, 0.06), 0 1px 1px rgba(17, 20, 24, 0.04)",
      },
      borderRadius: {
        md: "12px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
