/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        cream: '#F4F1FF',
        primary: {
          DEFAULT: '#8B5CF6',
          light: '#C4B5FD',
          dark: '#6D3FD6',
          soft: '#EDE9FE',
        },
        mint: '#A7F3D0',
        blush: '#FBCFE8',
        sky: '#BFDBFE',
        surface: '#FFFFFF',
        ink: '#29243A',
        muted: '#77738A',
        success: '#15803D',
        warning: '#92400E',
        error: '#B91C1C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        clay: '12px 12px 24px rgba(174,164,204,0.18), -12px -12px 24px rgba(255,255,255,0.9)',
        'clay-sm': '6px 6px 14px rgba(174,164,204,0.20), -6px -6px 14px rgba(255,255,255,0.95)',
        'clay-lg': '20px 20px 44px rgba(160,148,198,0.24), -16px -16px 36px rgba(255,255,255,0.92)',
        'clay-hover': '16px 18px 34px rgba(160,148,198,0.30), -10px -10px 26px rgba(255,255,255,0.95)',
        'clay-in': 'inset 4px 4px 10px rgba(174,164,204,0.22), inset -4px -4px 10px rgba(255,255,255,0.9)',
        'clay-btn': '0 8px 18px rgba(139,92,246,0.28), inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -4px 8px rgba(85,40,170,0.22)',
      },
      borderRadius: {
        clay: '24px',
        'clay-lg': '32px',
      },
      fontSize: {
        'fluid-hero': 'clamp(2.15rem, 6vw, 4.25rem)',
        'fluid-h2': 'clamp(1.6rem, 3.4vw, 2.6rem)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tw-rotate, 0deg))' },
          '50%': { transform: 'translateY(-14px) rotate(var(--tw-rotate, 0deg))' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pop-in': 'pop-in 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
