import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import SideNav from './SideNav';
import TopBar from './TopBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const bottomNavItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Studio', path: '/studio', icon: 'science' },
    { name: 'Signals', path: '/signals', icon: 'show_chart' },
    { name: 'Effects', path: '/effects', icon: 'auto_fix_high' },
    { name: 'Noise Remover', path: '/noise-remover', icon: 'graphic_eq' },
    { name: 'Compare', path: '/compare', icon: 'compare_arrows' },
    { name: 'Theory', path: '/theory', icon: 'menu_book' },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink-primary selection:bg-lavender selection:text-ink-primary">
      <SideNav />
      <TopBar />
      <main className="lg:ml-60 p-4 md:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1400px]">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface flex justify-between gap-2 overflow-x-auto items-center px-2 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t border-hairline z-20">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-[48px] shrink-0 px-1 py-1 rounded-ios-md transition-colors ${
                isActive ? 'text-navy bg-lavender-soft font-semibold' : 'text-ink-secondary hover:text-ink-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'icon-fill text-ink-primary' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] leading-none">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
