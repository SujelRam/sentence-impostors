/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020510',
          900: '#040714',
          800: '#080B20',
          700: '#0B102B',
          600: '#0F1640',
          500: '#141D50',
        },
        'c-cyan':   '#3FE0E0',
        'c-yellow': '#F5C542',
        'c-green':  '#2BD46A',
        'c-red':    '#FF4545',
        'c-purple': '#A855F7',
        'c-orange': '#F97316',
        'c-pink':   '#EC4899',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(63,224,224,0.45)',
        'glow-yellow': '0 0 20px rgba(245,197,66,0.45)',
        'glow-green':  '0 0 20px rgba(43,212,106,0.45)',
        'glow-red':    '0 0 20px rgba(255,69,69,0.45)',
        'glow-purple': '0 0 20px rgba(168,85,247,0.45)',
      },
      animation: {
        'twinkle':        'twinkle 2s ease-in-out infinite alternate',
        'float':          'float 4s ease-in-out infinite',
        'float-slow':     'float 7s ease-in-out infinite',
        'slide-up':       'slideUp 0.4s ease-out',
        'slide-down':     'slideDown 0.4s ease-out',
        'scale-in':       'scaleIn 0.3s ease-out',
        'shake':          'shake 0.5s ease-out',
        'countdown':      'countdown 0.8s ease-out',
        'pulse-glow':     'pulseGlow 2s ease-in-out infinite',
        'emergency-bg':   'emergencyBg 1s ease-in-out infinite',
        'reaction-float': 'reactionFloat 2s ease-out forwards',
        'rank-up':        'rankUp 0.5s ease-out',
        'confetti-fall':  'confettiFall 2.5s ease-in forwards',
      },
      keyframes: {
        twinkle: {
          '0%':   { opacity: '0.2', transform: 'scale(0.8)' },
          '100%': { opacity: '1',   transform: 'scale(1.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.7)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%':   { transform: 'translateX(0)' },
          '20%, 60%':   { transform: 'translateX(-8px)' },
          '40%, 80%':   { transform: 'translateX(8px)' },
        },
        countdown: {
          '0%':   { transform: 'scale(2.2)', opacity: '0' },
          '30%':  { opacity: '1' },
          '80%':  { opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(63,224,224,0.3)' },
          '50%':      { boxShadow: '0 0 25px rgba(63,224,224,0.8)' },
        },
        emergencyBg: {
          '0%, 100%': { backgroundColor: 'rgba(255,69,69,0.04)' },
          '50%':      { backgroundColor: 'rgba(255,69,69,0.14)' },
        },
        reactionFloat: {
          '0%':   { opacity: '1',  transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0',  transform: 'translateY(-120px) scale(1.6)' },
        },
        rankUp: {
          '0%':   { transform: 'translateY(16px)', color: '#2BD46A' },
          '100%': { transform: 'translateY(0)' },
        },
        confettiFall: {
          '0%':   { transform: 'translateY(-80px) rotate(0deg)',   opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
