import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning';
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variants = {
    primary: 'bg-lavender text-ink-primary',
    secondary: 'bg-pastel-blue text-ink-primary',
    neutral: 'bg-surface-raised text-ink-secondary',
    success: 'bg-pastel-green text-ink-primary',
    warning: 'bg-pastel-peach text-ink-primary',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-medium tracking-tight ${variants[variant]}`}>
      {children}
    </span>
  );
}
