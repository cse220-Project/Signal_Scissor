import { useLocation } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();
  const pageName = location.pathname === '/' ? 'Dashboard' 
                 : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-[16px] text-ink-primary">{pageName}</span>
      </div>
      <span className="text-[13px] font-semibold text-ink-primary">
        PhasePlay
      </span>
    </header>
  );
}
