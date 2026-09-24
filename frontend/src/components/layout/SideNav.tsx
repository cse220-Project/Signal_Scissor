import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import SignalScissorsLogo from '../ui/SignalScissorsLogo';

/* ─── Nav item definitions ────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Audio Workstation',
    items: [
      { name: 'Control Center',        path: '/',           icon: 'dashboard',      end: true },
      { name: 'Spectral Studio',       path: '/studio',      icon: 'science' },
      { name: 'Waveform Synthesizer',  path: '/signals',     icon: 'show_chart' },
      { name: 'Live Audio Input',      path: '/mic-capture', icon: 'mic' },
    ],
  },
  {
    label: 'DSP Processing Suite',
    items: [
      { name: 'Acoustic FX Engine',    path: '/effects',       icon: 'auto_fix_high' },
      { name: 'Spectral Denoiser',     path: '/noise-remover', icon: 'graphic_eq' },
      { name: 'SIGNAL Inspector',      path: '/compare',       icon: 'compare_arrows' },
    ],
  },
  {
    label: 'DSP Academy',
    items: [
      { name: 'Mathematical Principles', path: '/theory',   icon: 'menu_book' },
      { name: 'Engine Preferences',     path: '/settings', icon: 'settings' },
      { name: 'About Us',               path: '/about',    icon: 'groups' },
    ],
  },
];

/* ─── Hamburger / Panel-left trigger icon ─────────────────────────────────── */
function HamburgerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/* ─── Tooltip wrapper for collapsed icon-only mode ─────────────────────────── */
function NavTooltip({ label, children, show }: { label: string; children: React.ReactNode; show: boolean }) {
  if (!show) return <>{children}</>;
  return (
    <div className="relative group/tip">
      {children}
      <span
        className="
          pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
          whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium
          opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150
          shadow-lg
        "
        style={{
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Mobile overlay backdrop ────────────────────────────────────────────── */
function MobileOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

/* ─── Main SideNav component ─────────────────────────────────────────────── */
export default function SideNav() {
  const { isOpen, toggle, isMobile, mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  /* Close mobile sidebar on route change */
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile, setMobileOpen]);

  /* Collapsed on desktop = icon-only; mobile always full-width if open */
  const collapsed = !isMobile && !isOpen;
  const width = collapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)';

  /* Mobile: hidden unless mobileOpen */
  const mobileTranslate = isMobile
    ? mobileOpen ? 'translateX(0)' : 'translateX(-100%)'
    : undefined;

  return (
    <>
      {/* Mobile overlay */}
      <MobileOverlay open={isMobile && mobileOpen} onClose={() => setMobileOpen(false)} />

      <aside
        ref={sidebarRef}
        data-state={collapsed ? 'collapsed' : 'expanded'}
        aria-label="Main navigation"
        className="select-none overflow-hidden flex flex-col shrink-0 z-40"
        style={{
          /* Layout */
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100dvh',
          width: isMobile ? 'var(--sidebar-width)' : width,
          transform: mobileTranslate,

          /* Transitions */
          transition: 'width var(--sidebar-transition), transform var(--sidebar-transition)',

          /* Theming — Sink Master sidebar colors */
          background: 'var(--sidebar)',
          color: 'var(--sidebar-foreground)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className={`flex items-center shrink-0 py-4 ${
            collapsed ? 'justify-center px-0' : 'px-3 gap-2'
          }`}
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          {/* Toggle trigger — three-lines hamburger */}
          <button
            id="sidebar-toggle"
            onClick={toggle}
            aria-label="Toggle sidebar"
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            className="
              flex items-center justify-center shrink-0 rounded-lg p-1.5
              transition-colors duration-150
            "
            style={{ color: 'var(--sidebar-foreground)', '--hover-bg': 'var(--sidebar-accent)' } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-accent)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <HamburgerIcon />
          </button>

          {/* Brand — hidden in collapsed mode */}
          <NavLink
            to="/"
            title="SIGNAL Scissors Dashboard"
            className="flex items-center gap-2.5 overflow-hidden transition-all duration-200 no-underline"
            style={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : '100%',
              pointerEvents: collapsed ? 'none' : 'auto',
            }}
          >
            <div className="min-w-0">
              <SignalScissorsLogo size="md" showSubtext />
            </div>
          </NavLink>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="px-2">
              {/* Group label — hidden when collapsed */}
              <div
                className="overflow-hidden transition-all duration-200"
                style={{
                  maxHeight: collapsed ? 0 : '2rem',
                  opacity: collapsed ? 0 : 1,
                  marginBottom: collapsed ? 0 : '2px',
                }}
              >
                <span
                  className="px-2 text-[10px] font-semibold tracking-widest uppercase block"
                  style={{ color: 'var(--sidebar-foreground)', opacity: 0.45 }}
                >
                  {group.label}
                </span>
              </div>

              {/* Items */}
              <ul className="space-y-0.5 list-none p-0 m-0">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavTooltip label={item.name} show={collapsed}>
                      <NavLink
                        to={item.path}
                        end={'end' in item ? item.end : false}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg transition-all duration-150 text-[13px] font-medium overflow-hidden ${
                            isActive ? 'font-semibold' : ''
                          } ${collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'}`
                        }
                        style={({ isActive }) => ({
                          background: isActive ? 'var(--sidebar-accent)' : 'transparent',
                          color: isActive
                            ? 'var(--sidebar-accent-foreground)'
                            : 'var(--sidebar-foreground)',
                        })}
                        onMouseEnter={e => {
                          const el = e.currentTarget;
                          if (!el.classList.contains('font-semibold')) {
                            el.style.background = 'var(--sidebar-accent)';
                            el.style.opacity = '0.85';
                          }
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget;
                          if (!el.classList.contains('font-semibold')) {
                            el.style.background = 'transparent';
                            el.style.opacity = '1';
                          }
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`material-symbols-outlined shrink-0 text-[20px] leading-none ${
                                isActive ? 'icon-fill' : ''
                              }`}
                              style={{
                                color: isActive
                                  ? 'var(--sidebar-primary)'
                                  : 'var(--sidebar-foreground)',
                              }}
                            >
                              {item.icon}
                            </span>

                            {/* Label — hidden in collapsed mode */}
                            <span
                              className="truncate transition-all duration-200 whitespace-nowrap"
                              style={{
                                opacity: collapsed ? 0 : 1,
                                width: collapsed ? 0 : 'auto',
                                overflow: 'hidden',
                              }}
                            >
                              {item.name.startsWith('SIGNAL ') ? <><span className="trademark-signal">SIGNAL</span>{item.name.slice(6)}</> : item.name}
                            </span>

                            {/* Active pill indicator */}
                            {isActive && !collapsed && (
                              <span
                                className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: 'var(--sidebar-primary)' }}
                                aria-hidden="true"
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    </NavTooltip>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer status ────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-3 py-4 overflow-hidden"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <div
            className="flex items-center gap-2 transition-all duration-200"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            {/* Pulse dot — always visible */}
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ background: 'var(--success)' }}
              title="Engine Ready"
            />

            {/* Text — hidden when collapsed */}
            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : '100%',
              }}
            >
              <span
                className="block text-[11px] font-medium truncate"
                style={{ color: 'var(--sidebar-foreground)' }}
              >
                Engine Ready
              </span>
              <span
                className="block text-[10px] opacity-55 truncate"
                style={{ color: 'var(--sidebar-foreground)' }}
              >
                60 FPS · DFT &amp; Conv
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
