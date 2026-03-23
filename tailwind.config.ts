import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d0d1a',
          800: '#16213e',
          700: '#1a2a4a',
        },
        amber: { 400: '#f5a623' },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
          700: '#7c3aed',
        },
        bg: { DEFAULT: '#05050f' },
      },
    },
  },
  plugins: [],
} satisfies Config
