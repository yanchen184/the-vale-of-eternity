/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      colors: {
        // Element colors
        fire: '#FF4444',
        water: '#4444FF',
        earth: '#88CC44',
        wind: '#CCCCCC',
        dragon: '#AA44AA',

        // Vale theme colors (updated for fantasy feel)
        vale: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },

        // Magic theme colors
        magic: {
          purple: {
            light: '#a78bfa',
            DEFAULT: '#7c3aed',
            dark: '#5b21b6',
          },
          gold: {
            light: '#fcd34d',
            DEFAULT: '#f59e0b',
            dark: '#d97706',
          },
          blue: {
            light: '#60a5fa',
            DEFAULT: '#3b82f6',
            dark: '#2563eb',
          },
        },
      },

      animation: {
        // Card animations
        'card-flip': 'flip 0.6s ease-in-out',
        'card-draw': 'drawCard 0.4s ease-out',

        // Glow and pulse
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-button': 'pulseButton 2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',

        // Movement
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-up': 'scaleUp 0.3s ease-out forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'float': 'float 3s ease-in-out infinite',
        'float-particle': 'floatParticle 20s ease-in-out infinite',
        'float-orb': 'floatOrb 8s ease-in-out infinite',

        // Rotation
        'rotate-slow': 'rotateSlow 60s linear infinite',

        // Effects
        'shimmer': 'shimmer 2s infinite',
        'shimmer-slow': 'shimmer 4s infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
      },

      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        drawCard: {
          '0%': { transform: 'translateY(-100px) scale(0.8)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)',
          },
        },
        pulseButton: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 35px rgba(16, 185, 129, 0.6)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.3' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatParticle: {
          '0%, 100%': {
            transform: 'translateY(0) translateX(0)',
            opacity: '0.3',
          },
          '25%': {
            transform: 'translateY(-30px) translateX(10px)',
            opacity: '0.6',
          },
          '50%': {
            transform: 'translateY(-50px) translateX(-5px)',
            opacity: '0.8',
          },
          '75%': {
            transform: 'translateY(-30px) translateX(-10px)',
            opacity: '0.5',
          },
        },
        floatOrb: {
          '0%, 100%': {
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: '0.8',
          },
          '50%': {
            transform: 'translate(-50%, -50%) scale(1.1)',
            opacity: '1',
          },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
      },

      fontFamily: {
        game: ['Cinzel', 'Cinzel Decorative', 'Georgia', 'serif'],
      },

      backdropBlur: {
        xs: '2px',
      },

      boxShadow: {
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)',
      },
    },
  },
  plugins: [],
}
