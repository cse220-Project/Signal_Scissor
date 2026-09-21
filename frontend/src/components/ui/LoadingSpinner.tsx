export default function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeMap = {
    sm: 'text-[18px]',
    md: 'text-[24px]',
    lg: 'text-[32px]',
  };

  return (
    <div className={`inline-flex items-center justify-center text-ink-primary ${className}`}>
      <span className={`material-symbols-outlined animate-spin ${sizeMap[size]}`}>
        progress_activity
      </span>
    </div>
  );
}
