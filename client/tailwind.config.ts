import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: '#1e293b',
        input: '#0f1629',
        ring: '#3b82f6',
        background: '#0a0e27',
        foreground: '#f5f5f7',
        primary: {
          DEFAULT: '#ec4899',
          foreground: '#0a0e27',
        },
        secondary: {
          DEFAULT: '#3b82f6',
          foreground: '#f5f5f7',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#f5f5f7',
        },
        muted: {
          DEFAULT: '#475569',
          foreground: '#a0aec0',
        },
        accent: {
          DEFAULT: '#ec4899',
          foreground: '#0a0e27',
        },
        card: '#0f1629',
        popover: '#0f1629',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
