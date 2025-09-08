/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#EC4899',
        background: '#F3F4F6',
        sidebar: '#111827',
        'sidebar-text': '#D1D5DB',
        'sidebar-active': '#1F2937',
      },
    },
  },
  plugins: [],
};
