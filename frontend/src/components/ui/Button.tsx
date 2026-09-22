import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  fullWidth,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-[6px] border font-medium transition-[background-color,box-shadow,transform] duration-150 enabled:active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-navy text-white border-navy enabled:hover:bg-navy-hover enabled:hover:shadow-sm',
    secondary: 'bg-transparent text-navy border-navy enabled:hover:bg-lavender-soft',
    ghost: 'bg-transparent border-transparent text-ink-secondary enabled:hover:text-navy enabled:hover:bg-surface-raised',
    destructive: 'bg-error text-white border-error enabled:hover:opacity-90 enabled:hover:shadow-sm',
    pill: 'bg-surface-raised text-navy border-hairline enabled:hover:bg-lavender-soft',
  };

  const sizes = {
    sm: 'text-[13px] px-4 py-2 gap-2',
    md: 'text-[14px] px-5 py-2.5 gap-2',
    lg: 'text-[15px] px-6 py-3 gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon && iconPosition === 'left' ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}

      {children}

      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
    </button>
  );
}
