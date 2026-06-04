/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C0C',
        surface: '#181818',
        surface2: '#1C1C1C',
        brass: '#C4A882',
        'brass-dark': '#A07850',
        bone: '#F5F0E8',
        mid: '#787068',
        muted: '#5E5A55',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        btn: '7px',
        tag: '5px',
      },
    },
  },
  plugins: [],
}
