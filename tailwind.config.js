/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'speedLine': 'speedLine 0.15s linear forwards',
        'reelStop': 'reelStop 0.5s ease-out forwards',
        'symbolPop': 'symbolPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fastSpin': 'fastSpin 0.05s linear infinite',
      },
      keyframes: {
        speedLine: {
          '0%': { transform: 'translateY(-100%)', opacity: 0.7 },
          '100%': { transform: 'translateY(100%)', opacity: 0 },
        },
        reelStop: {
          '0%': { transform: 'translateY(0)' },
          '20%': { transform: 'translateY(-5%)' },
          '40%': { transform: 'translateY(3%)' },
          '60%': { transform: 'translateY(-2%)' },
          '80%': { transform: 'translateY(1%)' },
          '100%': { transform: 'translateY(0)' },
        },
        symbolPop: {
          '0%': { transform: 'scale(0.8)', opacity: 0.5 },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        fastSpin: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-20%)' },
        }
      },
      screens: {
        'ultra': '2200px',
        'uw': '2560px',
        'uw2': '3440px',
      }
    },
  },
   plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".option-w-200 option": { width: "200px !important" },
        ".option-w-150 option": { width: "150px !important" },
        ".option-w-120 option": { width: "120px !important" },
      });
    },
  ],
};
