import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Design tokens — overridden per theme via CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Bloom brand palette
        bloom: {
          blush: "#F7C5C0",
          cream: "#FDF8F0",
          lavender: "#C4B5D0",
          sage: "#A8C5A0",
          coral: "#E8967A",
          plum: "#5C3D5E",
          warm: "#F5E6D3",
          sky: "#B8D4E8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "bloom-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "petal-rise": {
          "0%":   { transform: "translateY(0) translateX(0) rotate(0deg)",   opacity: "0" },
          "10%":  { opacity: "0.8" },
          "50%":  { transform: "translateY(-45vh) translateX(18px) rotate(120deg)", opacity: "0.6" },
          "90%":  { opacity: "0.2" },
          "100%": { transform: "translateY(-95vh) translateX(-12px) rotate(240deg)", opacity: "0" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%":       { transform: "translate(20px, -15px) scale(1.05)" },
          "66%":       { transform: "translate(-12px, 10px) scale(0.95)" },
        },
        "spring-tap": {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(0.93)" },
          "70%":  { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
        "flame": {
          "0%, 100%": { transform: "scaleY(1) rotate(-2deg)" },
          "50%":      { transform: "scaleY(1.15) rotate(2deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        "bloom-pulse": "bloom-pulse 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "petal-rise": "petal-rise var(--petal-duration, 18s) ease-in-out infinite both",
        "orb-drift": "orb-drift var(--orb-duration, 18s) ease-in-out infinite",
        "spring-tap": "spring-tap 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "flame": "flame 1.4s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-bloom": "linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)",
        "gradient-card": "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
