/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#090a0f',
        cardbg: '#111319',
        elevated: '#171922',
        borderzinc: '#232633',
        subtle: '#2d3142',
        rail: {
          green: '#10b981',
          yellow: '#f59e0b',
          doubleyellow: '#eab308',
          red: '#ef4444',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Geist Mono', 'ui-monospace', 'monospace'],
        sans: ['var(--font-sans)', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'loco-glide': 'locoGlide 8s linear infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'signal-blink': 'signalBlink 1s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.98)' },
        },
        locoGlide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        signalBlink: {
          '0%': { opacity: '0.3' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
