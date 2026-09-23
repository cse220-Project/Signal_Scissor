/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: 'var(--bg-cream)',
        navy: { DEFAULT: '#1F2A44', hover: '#30415F' },
        gold: '#B8955A',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          raised: 'var(--bg-surface-raised)',
          muted: 'var(--bg-surface-muted)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary: 'var(--ink-tertiary)',
        },
        lavender: {
          DEFAULT: 'var(--accent-lavender)',
          hover: 'var(--accent-lavender-hover)',
          active: 'var(--accent-lavender-active)',
          ink: 'var(--accent-lavender-ink)',
          soft: 'var(--accent-soft)',
        },
        pastel: {
          cream: 'var(--cat-cream)',
          blue: 'var(--cat-blue)',
          lavender: 'var(--cat-lavender)',
          peach: 'var(--cat-peach)',
          green: 'var(--cat-green)',
        },
        error: {
          DEFAULT: 'var(--error)',
          soft: 'var(--error-soft)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        hairline: 'var(--hairline)',
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'ios-sm': '6px',
        'ios-md': '6px',
        'ios-lg': '6px',
        'ios-xl': '8px',
        'ios-2xl': '10px',
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}
