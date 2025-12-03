/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'nexscout-blue': '#1877F2',
        'nexscout-gray': '#777777',
      },
      boxShadow: {
        'soft': '0px 8px 24px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0px 12px 32px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.18' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'float': 'float 3.2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4.5s ease-in-out infinite',
        'fade-in-scale': 'fade-in-scale 600ms ease-out forwards',
        'fade-in-up': 'fade-in-up 400ms ease-out forwards',
        'fade-out': 'fade-out 350ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
