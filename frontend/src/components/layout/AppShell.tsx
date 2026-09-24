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
      <FloatingAudioBar />

      {/* Shell: sidebar + inset */}
      <div className="flex min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
        {/* Desktop Sidebar */}
        <SideNav />

        {/* Content inset */}
        <div
          id="sidebar-inset"
          className="flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ease-linear"
        >
          {/* Persistent desktop header + mobile topbar */}
          <TopBar />

          {/* Page content */}
          <main
            id="main-content"
            className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-10"
          >
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-between gap-1 overflow-x-auto items-center px-2 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t select-none"
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
    </SidebarProvider>
  );
}
