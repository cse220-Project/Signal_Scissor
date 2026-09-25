import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { SidebarProvider } from '../../context/SidebarContext';
import SideNav from './SideNav';
import TopBar from './TopBar';
import GlobalLoadingOverlay from '../ui/GlobalLoadingOverlay';
import GlobalAlertModal from '../ui/GlobalAlertModal';
import FloatingAudioBar from '../ui/FloatingAudioBar';

interface AppShellProps {
  children: ReactNode;
}

const bottomNavItems = [
  { name: 'Control',       path: '/',             icon: 'dashboard' },
  { name: 'Studio',        path: '/studio',        icon: 'science' },
  { name: 'Synthesizer',   path: '/signals',       icon: 'show_chart' },
  { name: 'FX Engine',     path: '/effects',       icon: 'auto_fix_high' },
  { name: 'Denoiser',      path: '/noise-remover', icon: 'graphic_eq' },
  { name: 'Inspector',     path: '/compare',       icon: 'compare_arrows' },
  { name: 'Academy',       path: '/theory',        icon: 'menu_book' },
];

export default function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      {/* Global Frozen Loading Overlay & Alert Modal */}
      <GlobalLoadingOverlay />
      <GlobalAlertModal />

      {/*
        Shell is height-bounded to the viewport (h-dvh, not min-h-dvh) so `<main>`
        owns its own internal scroll. The floating audio bar and mobile nav are
        normal flow children of this column (not position:fixed overlays), so they
        always get their own reserved space and can never render on top of page
        content, at any scroll position or viewport size.
      */}
      <div className="app-shell-background flex h-dvh bg-[var(--background)] text-[var(--foreground)]">
        {/* Desktop Sidebar */}
        <SideNav />

        {/* Content inset */}
        <div
          id="sidebar-inset"
          className="flex flex-1 flex-col min-w-0 min-h-0 transition-[margin] duration-200 ease-linear"
        >
          {/* Persistent desktop header + mobile topbar */}
          <TopBar />

          {/* Page content - the only internally-scrolling region */}
          <main
            id="main-content"
            className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8"
          >
            {children}
          </main>

          {/* Now-playing bar: reserved layout space, never overlaps main content */}
          <FloatingAudioBar />

          {/* ── Mobile Bottom Nav ──────────────────────────────────────────── */}
          <nav
            aria-label="Mobile navigation"
            className="lg:hidden shrink-0 flex justify-between gap-1 overflow-x-auto items-center px-2 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t select-none"
            style={{
              background: 'var(--sidebar)',
              borderColor: 'var(--sidebar-border)',
            }}
          >
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 min-w-[44px] shrink-0 px-1 py-1.5 rounded-lg transition-all text-[10px] font-medium leading-none ${
                    isActive
                      ? 'text-[var(--sidebar-primary)] font-semibold'
                      : 'text-[var(--sidebar-foreground)] opacity-70 hover:opacity-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-[20px] leading-none ${
                        isActive ? 'icon-fill' : ''
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
