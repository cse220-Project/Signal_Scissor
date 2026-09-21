import { NavLink } from 'react-router-dom';

export default function SideNav() {
  // no navigate needed anymore since clear session is gone

  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Studio', path: '/studio', icon: 'science' },
    { name: 'Signals', path: '/signals', icon: 'show_chart' },
    { name: 'Effects', path: '/effects', icon: 'auto_fix_high' },
    { name: 'Compare', path: '/compare', icon: 'compare_arrows' },
    { name: 'Theory', path: '/theory', icon: 'menu_book' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-surface border-r border-hairline py-6 px-4 select-none z-20">
      {/* Brand Header */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2.5">
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-ink-primary shrink-0"
          >
            <rect 
              x="2.5" 
              y="3.5" 
              width="18" 
              height="18" 
              rx="5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M7 12.5L10.5 16L18.5 7.5" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
          <span className="text-[17px] font-semibold text-ink-primary tracking-tight">PhasePlay</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2 rounded-ios-lg transition-all text-[13px] font-medium ${
                isActive
                  ? 'bg-[#e5e3e8] text-ink-primary font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-[#e5e3e8]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[19px] ${isActive ? 'icon-fill text-ink-primary' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
