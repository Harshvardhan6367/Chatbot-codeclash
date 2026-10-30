/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        college: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9eb',
          300: '#94bfe0',
          400: '#5f9fd1',
          500: '#3882be',
          600: '#2768a3',
          700: '#205384',
          800: '#1e476d',
          900: '#1c3d5c',
          950: '#0e2439',
        },
        navy: {
          800: '#0f172a',
          900: '#0b1120',
          950: '#060a12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

