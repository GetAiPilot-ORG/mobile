/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0D10',
          card: '#121316',
          surface: '#181A1F',
          border: '#262930',
          text: '#F8FAFC',
          muted: '#94A3B8',
          dim: '#64748B',
        },
        brand: {
          blue: '#0284C7',
          sky: '#38BDF8',
          amber: '#F59E0B',
          yellow: '#FBBF24',
          green: '#10B981',
          purple: '#6366F1',
          indigo: '#818CF8',
          red: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};
