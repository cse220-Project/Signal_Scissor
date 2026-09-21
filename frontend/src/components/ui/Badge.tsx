import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'cream' | 'blue' | 'lavender' | 'peach' | 'green' | 'muted' | 'error' | 'success';
  icon?: string;
  className?: string;
}

export default function Badge({
  children,
  variant = 'lavender',
  icon,
  className = '',
}: BadgeProps) {
  const variantStyles = {
    cream: 'bg-pastel-cream text-ink-primary',
    blue: 'bg-pastel-blue text-ink-primary',
    lavender: 'bg-pastel-lavender text-ink-primary',
    peach: 'bg-pastel-peach text-ink-primary',
    green: 'bg-pastel-green text-ink-primary',
    muted: 'bg-surface-raised text-ink-secondary',
    error: 'bg-error-soft text-error',
    success: 'bg-success-soft text-success',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[12px] font-medium tracking-tight select-none ${variantStyles[variant]} ${className}`}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px] leading-none shrink-0">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
