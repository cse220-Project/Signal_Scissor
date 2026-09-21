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
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed select-none tracking-tight';

  const variants = {
    // Primary: solid dark #26211c with crisp white text
    primary: 'bg-[#26211c] text-[#ffffff] font-semibold tracking-[-0.01em] hover:bg-[#1a1713] active:bg-[#0f0d0b]',
    // Secondary: transparent bg, subtle 1px border on cream
    secondary: 'bg-transparent text-[#26211c] border border-[rgba(38,33,28,0.18)] hover:bg-[rgba(38,33,28,0.04)] active:bg-[rgba(38,33,28,0.08)]',
    // Ghost: transparent hover
    ghost: 'bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-surface-raised active:bg-surface-muted',
    // Destructive: soft error fill
    destructive: 'bg-error-soft text-error hover:bg-error hover:text-white active:opacity-90',
    // Pill capsule style
    pill: 'bg-surface-raised text-ink-primary hover:bg-[#26211c] hover:text-white hover:font-semibold rounded-pill',
  };

  const sizes = {
    sm: 'text-[13px] px-4 py-2 rounded-ios-lg gap-2',
    md: 'text-[14px] px-5 py-2.5 rounded-ios-xl gap-2',
    lg: 'text-[15px] px-6 py-3 rounded-ios-xl gap-2.5',
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
