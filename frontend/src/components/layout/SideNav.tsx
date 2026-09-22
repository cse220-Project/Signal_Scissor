import { NavLink } from 'react-router-dom';

export default function SideNav() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Studio', path: '/studio', icon: 'science' },
    { name: 'Signals', path: '/signals', icon: 'show_chart' },
    { name: 'Effects', path: '/effects', icon: 'auto_fix_high' },
    { name: 'Noise Remover', path: '/noise-remover', icon: 'graphic_eq' },
    { name: 'Compare', path: '/compare', icon: 'compare_arrows' },
    { name: 'Theory', path: '/theory', icon: 'menu_book' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-dvh overflow-y-auto w-60 bg-navy border-r border-navy py-6 px-4 select-none z-20">
      {/* Brand Header */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2.5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white shrink-0"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          <div>
            <span className="text-[17px] font-semibold text-white tracking-tight block leading-tight">
              Signal Scissors
            </span>
            <span className="text-[10px] text-[#D2D7E0] tracking-normal uppercase font-medium">
              CSE 220 DSP Studio
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 border-l-2 border-transparent px-3.5 py-2.5 rounded-ios-lg transition-colors text-[13px] font-medium ${
                isActive
                  ? 'bg-[#30415F] text-white font-semibold border-l-gold'
                  : 'text-[#E5E1DA] hover:text-white hover:bg-[#30415F]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[19px] ${isActive ? 'icon-fill text-gold' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Status Tag */}
      <div className="pt-4 border-t border-[#47536A] px-3 text-[11px] text-[#D2D7E0]">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
          <span className="font-medium text-[#E5E1DA]">Engine Ready</span>
        </div>
        <span>60 FPS Discrete FFT & Conv</span>
      </div>
    </aside>
  );
}
