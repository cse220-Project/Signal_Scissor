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
        /* Semantic tokens — mapped to CSS variables */
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card:        { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover:     { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary:     { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary:   { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted:       { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent:      { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: 'var(--destructive)',
        border:      'var(--border)',
        input:       'var(--input)',
        ring:        'var(--ring)',
        success:     { DEFAULT: 'var(--success)', foreground: 'var(--success-foreground)' },

        /* Sidebar tokens */
        sidebar: {
          DEFAULT:            'var(--sidebar)',
          foreground:         'var(--sidebar-foreground)',
          primary:            'var(--sidebar-primary)',
          'primary-foreground':'var(--sidebar-primary-foreground)',
          accent:             'var(--sidebar-accent)',
          'accent-foreground':'var(--sidebar-accent-foreground)',
          border:             'var(--sidebar-border)',
          ring:               'var(--sidebar-ring)',
        },

        /* Legacy aliases — keeps existing page components working */
        cream:   'var(--bg-cream)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          raised:  'var(--bg-surface-raised)',
          muted:   'var(--bg-surface-muted)',
        },
        navy:  { DEFAULT: '#1F2A44', hover: '#30415F' },
        gold:  '#B8955A',
        ink: {
          primary:   'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary:  'var(--ink-tertiary)',
        },
        lavender: {
          DEFAULT: 'var(--accent-lavender)',
          hover:   'var(--accent-lavender-hover)',
          active:  'var(--accent-lavender-active)',
          ink:     'var(--accent-lavender-ink)',
          soft:    'var(--accent-soft)',
        },
        pastel: {
          cream:   'var(--cat-cream)',
          blue:    'var(--cat-blue)',
          lavender:'var(--cat-lavender)',
          peach:   'var(--cat-peach)',
          green:   'var(--cat-green)',
        },
        error:   { DEFAULT: 'var(--error)',   soft: 'var(--error-soft)' },
        hairline:'var(--hairline)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        solitus: ['Solitus', '"IBM Plex Sans"', 'sans-serif'],
      },
      borderRadius: {
        'ios-sm':  '6px',
        'ios-md':  '6px',
        'ios-lg':  '8px',
        'ios-xl':  '10px',
        'ios-2xl': '12px',
        'pill':    '9999px',
        /* Sink Master radius scale */
        'sm':  'var(--radius-sm)',
        'md':  'var(--radius-md)',
        'lg':  'var(--radius-lg)',
        'xl':  'var(--radius-xl)',
      },
    },
  },
  plugins: [],
}
