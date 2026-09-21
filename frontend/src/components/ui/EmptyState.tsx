import { ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = 'graphic_eq',
  title,
  description,
  actionLabel,
  onAction,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 ${className}`}>
      <span className="material-symbols-outlined text-[44px] text-ink-tertiary mb-3">
        {icon}
      </span>
      <h3 className="text-[17px] font-semibold text-ink-primary tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-[13px] text-ink-secondary max-w-sm leading-relaxed mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
