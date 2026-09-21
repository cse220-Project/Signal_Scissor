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
  onClick 
}: CardProps) {
  const baseClasses = 'rounded-ios-2xl p-5 md:p-6 transition-all duration-200 ease-out will-change-transform';
  
  const variantMap: Record<string, { base: string; hover: string }> = {
    surface: {
      base: 'bg-surface text-ink-primary',
      hover: 'hover:bg-[#f2efe4]',
    },
    raised: {
      base: 'bg-surface-raised text-ink-primary',
      hover: 'hover:bg-[#e6e2d4]',
    },
    muted: {
      base: 'bg-surface-muted text-ink-primary',
      hover: 'hover:bg-[#e0d9cb]',
    },
    'pastel-cream': {
      base: 'bg-pastel-cream text-ink-primary',
      hover: 'hover:bg-[#e7e0cc]',
    },
    'pastel-blue': {
      base: 'bg-pastel-blue text-ink-primary',
      hover: 'hover:bg-[#cfdbe7]',
    },
    'pastel-lavender': {
      base: 'bg-pastel-lavender text-ink-primary',
      hover: 'hover:bg-[#ddd9e2]',
    },
    'pastel-peach': {
      base: 'bg-pastel-peach text-ink-primary',
      hover: 'hover:bg-[#e6d6cc]',
    },
    'pastel-green': {
      base: 'bg-pastel-green text-ink-primary',
      hover: 'hover:bg-[#d8deda]',
    },
  };

  const currentVariant = variantMap[variant] || variantMap.surface;
  
  // Uniform expansion + subtle harmonious darkening matching each card's base pastel family
  const interactiveClasses = onClick 
    ? `cursor-pointer hover:scale-[1.015] ${currentVariant.hover} active:scale-[0.985] select-none` 
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
