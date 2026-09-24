import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface SidebarContextValue {
  /** true = expanded (full-width), false = collapsed (icon-only) */
  isOpen: boolean;
  /** Flip open/closed */
  toggle: () => void;
  /** Explicit open/close setter */
  setOpen: (value: boolean) => void;
  /** true when viewport width < 1024px (lg breakpoint) */
  isMobile: boolean;
  /** Mobile-specific overlay open state */
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Detect mobile breakpoint */
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setIsOpen(true); // reset desktop state when resizing to mobile
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  /* Keyboard shortcut: Ctrl/Cmd + B (mirrors Sink Master's sidebar shortcut) */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) setMobileOpen(prev => !prev);
        else setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobile]);

  const toggle = useCallback(() => {
    if (isMobile) setMobileOpen(prev => !prev);
    else setIsOpen(prev => !prev);
  }, [isMobile]);

  const setOpen = useCallback((value: boolean) => {
    if (isMobile) setMobileOpen(value);
    else setIsOpen(value);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setOpen, isMobile, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}
