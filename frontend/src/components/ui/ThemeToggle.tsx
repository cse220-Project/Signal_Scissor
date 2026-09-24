import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      id="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-150 text-foreground hover:bg-accent/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      style={{
        border: '1px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      {/* Sun icon (visible in light mode, rotated/scaled down in dark mode) */}
      <svg
        className="w-4 h-4 transition-all duration-300 transform dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-transparent"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>

      {/* Moon icon (visible in dark mode, scaled down in light mode) */}
      <svg
        className="w-4 h-4 absolute transition-all duration-300 transform rotate-90 scale-0 dark:rotate-0 dark:scale-100 text-sky-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
