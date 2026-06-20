/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ALEX Brand Colors
        navy: {
          950: '#050A14',
          900: '#0A0F1E',
          800: '#111827',
          700: '#1C2433',
          600: '#263044',
        },
        alex: {
          blue:    '#1E40AF',  // Blueprint Blue (MPS brand)
          amber:   '#F59E0B',  // Achievement Gold
          'amber-light': '#FCD34D',
          success: '#10B981',  // Correct answers
          error:   '#EF4444',  // Wrong answers
          warning: '#F97316',  // Caution / update alerts
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-in-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'flip':        'flip 0.5s ease-in-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in':   'bounceIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        flip:     { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(180deg)' } },
        bounceIn: { '0%': { transform: 'scale(0.8)', opacity: '0' }, '70%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      backgroundImage: {
        'alex-gradient': 'linear-gradient(135deg, #0A0F1E 0%, #111827 50%, #0A0F1E 100%)',
        'amber-gradient': 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
        'blue-gradient':  'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
      }
    },
  },
  plugins: [],
}
