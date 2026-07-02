/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F1117',
          secondary: '#13161F',
          tertiary: '#1A1D27',
        },
        accent: {
          DEFAULT: '#FF6B35',
          hover: '#E85E2A',
          muted: 'rgba(255,107,53,0.12)',
          border: 'rgba(255,107,53,0.25)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          light: 'rgba(255,255,255,0.10)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(255,255,255,0.6)',
          muted: 'rgba(255,255,255,0.3)',
          hint: 'rgba(255,255,255,0.15)',
        },
        status: {
          success: '#4CAF50',
          warning: '#FF9800',
          error: '#f44336',
          info: '#2196F3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hint: ['10px', '12px'],
        label: ['11px', '14px'],
        caption: ['12px', '16px'],
        'body-sm': ['13px', '18px'],
        body: ['14px', '20px'],
        title: ['15px', '22px'],
        h3: ['18px', '26px'],
        h2: ['22px', '30px'],
        h1: ['28px', '36px'],
      },
    },
  },
  plugins: [],
}
