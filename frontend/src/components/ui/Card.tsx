import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'surface' | 'raised' | 'muted' | 'pastel-cream' | 'pastel-blue' | 'pastel-lavender' | 'pastel-peach' | 'pastel-green';
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  variant = 'surface',
  onClick,
}: CardProps) {
  const baseClasses = 'rounded-ios-2xl p-5 md:p-6 border border-hairline shadow-sm transition-all duration-200';

  const variantMap: Record<string, { base: string; hover: string; activeHover: string }> = {
    surface: {
      base: 'bg-surface text-ink-primary',
      hover: 'hover:border-border hover:shadow-md',
      activeHover: 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
    },
    raised: {
      base: 'bg-surface-raised text-ink-primary',
      hover: 'hover:border-border hover:shadow-md',
      activeHover: 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
    },
    muted: {
      base: 'bg-surface-muted text-ink-primary',
      hover: 'hover:border-border hover:shadow-md',
      activeHover: 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
    },
    'pastel-cream': {
      base: 'bg-surface text-ink-primary border-t-2 border-t-[#B8955A]/50',
      hover: 'hover:border-[#B8955A]/40 hover:shadow-md',
      activeHover: 'hover:border-[#B8955A]/60 hover:shadow-lg hover:shadow-[#B8955A]/10 hover:-translate-y-0.5',
    },
    'pastel-blue': {
      base: 'bg-surface text-ink-primary border-t-2 border-t-blue-400/40',
      hover: 'hover:border-blue-400/30 hover:shadow-md',
      activeHover: 'hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-400/10 hover:-translate-y-0.5',
    },
    'pastel-lavender': {
      base: 'bg-surface text-ink-primary border-t-2 border-t-violet-400/40',
      hover: 'hover:border-violet-400/30 hover:shadow-md',
      activeHover: 'hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-400/10 hover:-translate-y-0.5',
    },
    'pastel-peach': {
      base: 'bg-surface text-ink-primary border-t-2 border-t-orange-400/40',
      hover: 'hover:border-orange-400/30 hover:shadow-md',
      activeHover: 'hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-400/10 hover:-translate-y-0.5',
    },
    'pastel-green': {
      base: 'bg-surface text-ink-primary border-t-2 border-t-emerald-400/40',
      hover: 'hover:border-emerald-400/30 hover:shadow-md',
      activeHover: 'hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-0.5',
    },
  };

  const currentVariant = variantMap[variant] || variantMap.surface;

  const hoverClasses = onClick
    ? `cursor-pointer ${currentVariant.activeHover} active:translate-y-0 select-none`
    : currentVariant.hover;

  return (
    <div
      className={`${baseClasses} ${currentVariant.base} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
