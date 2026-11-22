/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Authoritative Blue Palette
        "atelier-soft": "#E3F2FD",
        "atelier-sky": "#90CAF9",
        "atelier-blue": "#2196F3",
        "atelier-navy": "#0D47A1",
        "atelier-charcoal": "#172033",
        "atelier-slate": "#64748B",
        "atelier-border": "#E5E7EB",

        // Stitch Material Theme Mapping
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f1f3ff",
        "surface-container": "#e9edff",
        "surface-container-high": "#e1e8ff",
        "surface-container-highest": "#d9e2fc",
        "surface-variant": "#d9e2fc",
        "surface-dim": "#d1daf4",
        "surface-bright": "#ffffff",
        
        "primary": "#2196F3",
        "on-primary": "#ffffff",
        "primary-container": "#90CAF9",
        "on-primary-container": "#0D47A1",
        "primary-fixed": "#cbe6ff",
        "primary-fixed-dim": "#90CAF9",
        "primary-navy": "#0D47A1",

        "secondary": "#0061a4",
        "on-secondary": "#ffffff",
        "secondary-container": "#33a0fd",
        "on-secondary-container": "#00355c",
        "secondary-fixed": "#d1e4ff",

        "on-surface": "#172033",
        "on-surface-variant": "#64748B",
        "outline": "#71787f",
        "outline-variant": "#E5E7EB",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Sora", "Inter", "sans-serif"],
        sora: ["Sora", "sans-serif"],
        heading: ["Sora", "Epilogue", "sans-serif"],
        epilogue: ["Epilogue", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        md: "1.25rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        full: "9999px",
      },
      spacing: {
        gutter: "1rem",
        margin: "1rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
      },
      boxShadow: {
        subtle: "0 2px 8px rgba(23, 32, 51, 0.04)",
        card: "0 4px 14px rgba(33, 150, 243, 0.08)",
        nav: "0 -4px 20px rgba(13, 71, 161, 0.06)",
        modal: "0 10px 30px rgba(13, 71, 161, 0.12)",
      },
    },
  },
  plugins: [],
}
