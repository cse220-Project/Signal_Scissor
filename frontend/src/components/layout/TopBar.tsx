import { useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';

/* ─── Page title resolver ─────────────────────────────────────────────────── */
const PAGE_NAMES: Record<string, string> = {
  '':             'Control Center',
  'studio':       'Spectral Studio',
  'signals':      'Waveform Synthesizer',
  'mic-capture':  'Live Audio Input',
  'effects':      'Acoustic FX Engine',
  'noise-remover':'Spectral Denoiser',
  'compare':      'SIGNAL Inspector',
  'theory':       'Mathematical Principles',
  'settings':     'Engine Preferences',
  'about':        'About Us',
};

function usePageName() {
  const location = useLocation();
  const key = location.pathname.replace(/^\//, '');
  return PAGE_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

import ThemeToggle from '../ui/ThemeToggle';

/* ─── TopBar ──────────────────────────────────────────────────────────────── */
export default function TopBar() {
  const pageName = usePageName();
  const { isMobile } = useSidebar();

  return (
    <header
      className="sticky top-0 z-20 flex shrink-0 items-center gap-3 px-4 h-14"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Left: Breadcrumbs (Sink Master PageBreadcrumb) ───────────── */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 min-w-0">
        <span className="trademark-logo text-[17px] md:text-[19px] font-bold truncate hidden sm:inline">
          SIGNAL Scissors
        </span>
        <span
          className="text-xs text-muted-foreground hidden sm:inline opacity-40"
          aria-hidden="true"
        >
          /
        </span>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--foreground)' }}
        >
          {pageName.startsWith('SIGNAL ') ? <><span className="trademark-signal">SIGNAL</span>{pageName.slice(6)}</> : pageName}
        </span>
      </nav>

      {/* ── Right: Header Actions (Sink Master dashboard-header-actions) ─── */}
      <div id="dashboard-header-actions" className="ml-auto flex items-center gap-2.5 shrink-0">
        {!isMobile && (
          <span
            className="text-[11px] font-mono opacity-50 tracking-tight hidden md:inline px-2 py-0.5 rounded border border-border"
            style={{ background: 'var(--card)' }}
          >
            Ctrl+B
          </span>
        )}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide shadow-xs"
          style={{
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: 'var(--success)' }}
          />
          <span className="font-semibold text-[10px] uppercase tracking-wider text-success">60 FPS</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="text-[11px] opacity-75 hidden sm:inline">DFT &amp; Echo Engine</span>
        </span>

        {/* Sink Master theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
