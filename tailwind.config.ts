import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Luxury Black & Charcoal Base
          black: '#0A0A0C',
          'black-pure': '#050506',
          charcoal: '#121215',
          'charcoal-elevated': '#18181D',
          'charcoal-surface': '#1E1E24',
          'charcoal-border': '#2A2722',

          // Refined Champagne Gold Accents
          champagne: '#C5A059',
          'champagne-light': '#DFBE76',
          'champagne-metallic': '#D4AF37',
          'champagne-dark': '#9E7D3B',
          'champagne-muted': 'rgba(197, 160, 89, 0.18)',

          // Warm Ivory & Light Neutrals
          ivory: '#F7F5F0',
          'ivory-soft': '#EFECE6',
          'ivory-muted': '#A8A29E',
          'stone-muted': '#78716C',
          'stone-dark': '#44403C',

          // Legacy / compatibility keys (mapped to luxury palette)
          gold: '#C5A059',
          'gold-metallic': '#D4AF37',
          'gold-light': '#DFBE76',
          'gold-dark': '#9E7D3B',
          'gold-50': '#1A1815',
          'gold-100': '#26221A',
          'gold-200': '#383224',
          'ivory-dark': '#E2DDD3',
          cream: '#121215',
          maroon: '#4A0E17',
          'maroon-hover': '#631521',
          'maroon-light': '#631521',
          'maroon-dark': '#2E070D',
          'maroon-50': '#1F0B10',
          'maroon-100': '#360910',
          'charcoal-muted': '#8E8A85',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #C5A059 0%, #D4AF37 50%, #DFBE76 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0C 0%, #121215 100%)',
        'gradient-luxury': 'linear-gradient(135deg, #0A0A0C 0%, #141418 50%, #1A1215 100%)',
        'gradient-card': 'linear-gradient(180deg, #141418 0%, #0E0E11 100%)',
      },
      boxShadow: {
        'gold': '0 4px 20px 0 rgba(197, 160, 89, 0.20)',
        'gold-lg': '0 10px 40px -10px rgba(197, 160, 89, 0.35)',
        'luxury': '0 20px 60px -10px rgba(0, 0, 0, 0.6)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(197, 160, 89, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
