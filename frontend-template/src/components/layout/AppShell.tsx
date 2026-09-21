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
    { name: 'Compare', path: '/compare', icon: 'compare_arrows' },
    { name: 'Theory', path: '/theory', icon: 'menu_book' },
    { name: 'Effects', path: '/effects', icon: 'auto_fix_high' },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink-primary selection:bg-lavender selection:text-ink-primary">
      <SideNav />
      <TopBar />
      <main className="lg:ml-60 p-4 md:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1400px]">
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md flex justify-around items-center px-2 py-2.5 z-20">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-[56px] py-1 rounded-ios-md transition-colors ${
                isActive ? 'text-ink-primary bg-lavender/60' : 'text-ink-secondary hover:text-ink-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'icon-fill' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-medium leading-none">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
