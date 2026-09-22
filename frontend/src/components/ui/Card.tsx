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
  const baseClasses = 'rounded-ios-2xl p-5 md:p-6 border border-hairline shadow-sm transition-colors duration-150';

  const variantMap: Record<string, { base: string; hover: string }> = {
    surface: {
      base: 'bg-surface text-ink-primary',
      hover: 'hover:border-gold hover:bg-cream',
    },
    raised: {
      base: 'bg-surface-raised text-ink-primary',
      hover: 'hover:border-gold hover:bg-cream',
    },
    muted: {
      base: 'bg-surface-muted text-ink-primary',
      hover: 'hover:border-gold hover:bg-cream',
    },
    'pastel-cream': {
      base: 'bg-surface text-ink-primary border-t-gold',
      hover: 'hover:border-gold hover:bg-cream',
    },
    'pastel-blue': {
      base: 'bg-surface text-ink-primary border-t-gold',
      hover: 'hover:border-gold hover:bg-cream',
    },
    'pastel-lavender': {
      base: 'bg-surface text-ink-primary border-t-gold',
      hover: 'hover:border-gold hover:bg-cream',
    },
    'pastel-peach': {
      base: 'bg-surface text-ink-primary border-t-gold',
      hover: 'hover:border-gold hover:bg-cream',
    },
    'pastel-green': {
      base: 'bg-surface text-ink-primary border-t-gold',
      hover: 'hover:border-gold hover:bg-cream',
    },
  };

  const currentVariant = variantMap[variant] || variantMap.surface;

  const interactiveClasses = onClick
    ? `cursor-pointer ${currentVariant.hover} select-none`
    : '';

  return (
    <div
      className={`${baseClasses} ${currentVariant.base} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
