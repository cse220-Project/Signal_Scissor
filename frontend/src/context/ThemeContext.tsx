import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'signal-scissors-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Compute resolved theme based on preference & system media query
  const getSystemTheme = (): ResolvedTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = useCallback((pref: ThemePreference) => {
    const resolved = pref === 'system' ? getSystemTheme() : pref;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Set theme-color meta tag
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', resolved === 'dark' ? '#09090b' : '#ffffff');
  }, []);

  useEffect(() => {
    applyTheme(preference);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (preference === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preference, applyTheme]);

  const setPreference = (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    try {
      localStorage.setItem(STORAGE_KEY, newPref);
    } catch {
      // ignore
    }
    applyTheme(newPref);
  };

  const toggleTheme = () => {
    // If currently dark, switch to light; if light, switch to dark
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setPreference(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        preference,
        setPreference,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
