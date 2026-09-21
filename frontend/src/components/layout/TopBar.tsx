import { useLocation } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  const pageName = path === '' ? 'Dashboard' : path.charAt(0).toUpperCase() + path.slice(1);

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface/95 backdrop-blur-md sticky top-0 z-10 border-b border-hairline">
      <div className="flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-primary"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
        <span className="font-semibold text-[16px] text-ink-primary">{pageName}</span>
      </div>
      <span className="text-[13px] font-semibold text-ink-secondary">Signal Scissors</span>
    </header>
  );
}
