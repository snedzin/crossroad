import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#000000e6",
        input: "#ea384c",
        ring: "#ea384c",
        background: "#000000e6",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#ea384c",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#2226",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ea384c",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#2226",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#ea384c",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#000000e6",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#000000e6",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
