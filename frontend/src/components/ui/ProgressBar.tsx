interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
  variant?: 'dark' | 'lavender' | 'success';
}

export default function ProgressBar({
  value,
  className = '',
  variant = 'dark',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const variantMap = {
    dark: 'bg-[#26211c]',
    lavender: 'bg-lavender-ink',
    success: 'bg-success',
  };

  return (
    <div className={`w-full h-1.5 bg-surface-muted rounded-pill overflow-hidden ${className}`}>
      <div
        className={`h-full ${variantMap[variant]} rounded-pill transition-all duration-150 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
