/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Book My Chef palette
        navy: '#1551A5',      // primary navy
        brand: '#2196F3',     // bright blue — primary interaction
        sky: '#90CAF9',       // light blue — selected / highlights
        pale: '#E3F2FD',      // pale blue — info surfaces
        ink: '#172033',       // primary text
        muted: '#5B6577',     // secondary text (4.9:1 on white)
        line: '#E3E7EE',      // borders
        canvas: '#F7F9FC',    // subtle section background
        success: '#15803D',
        warning: '#B45309',
        danger: '#B91C1C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 32, 51, 0.04), 0 2px 8px rgba(23, 32, 51, 0.04)',
        raised: '0 8px 24px rgba(21, 81, 165, 0.10)',
        sheet: '0 -8px 32px rgba(23, 32, 51, 0.14)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};
