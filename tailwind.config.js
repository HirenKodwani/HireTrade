/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B1020',
          card: '#111827',
          border: '#1F2937',
        },
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FB923C',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
