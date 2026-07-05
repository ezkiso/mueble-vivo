/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        verde: { DEFAULT: '#2E7D32', claro: '#E8F5E9' },
        tierra: { oscuro: '#5D4037', claro: '#D7CCC8' },
        texto: '#3E2723',
      },
      fontFamily: {
        titulo: ['var(--font-lora)'],
        cuerpo: ['var(--font-nunito)'],
      },
    },
  },
  plugins: [],
};
