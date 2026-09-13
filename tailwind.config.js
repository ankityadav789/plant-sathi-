/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plant: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#00e676',
          600: '#00c853',
          700: '#00a843',
          800: '#008833',
          900: '#006823',
        },
        surface: {
          50: '#1a1a2e',
          100: '#16162a',
          200: '#121226',
          300: '#0e0e22',
          400: '#0a0a1e',
          500: '#08081a',
          600: '#060616',
          700: '#040412',
          800: '#02020e',
          900: '#00000a',
        },
        aurora: {
          teal: '#00d4aa',
          purple: '#7c3aed',
          blue: '#3b82f6',
          pink: '#ec4899',
          green: '#00e676',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(0, 230, 118, 0.15)',
        'glow': '0 0 30px rgba(0, 230, 118, 0.2)',
        'glow-lg': '0 0 60px rgba(0, 230, 118, 0.25)',
        'glow-teal': '0 0 40px rgba(0, 212, 170, 0.2)',
        'glow-purple': '0 0 40px rgba(124, 58, 237, 0.2)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 230, 118, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'aurora': 'aurora 15s ease infinite',
        'leaf-fall': 'leafFall 12s linear infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'typing': 'typing 3s steps(40) 1s forwards',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 230, 118, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 230, 118, 0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        leafFall: {
          '0%': { transform: 'translateY(-10vh) translateX(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(110vh) translateX(100px) rotate(720deg)', opacity: '0' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
    },
  },
  plugins: [],
}
