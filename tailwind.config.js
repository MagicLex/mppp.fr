/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        cartoon: ['Lilita One', 'cursive'],
      },
      borderRadius: {
        'cartoon': '2rem',
      },
      boxShadow: {
        'cartoon': '8px 8px 0px 0px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};