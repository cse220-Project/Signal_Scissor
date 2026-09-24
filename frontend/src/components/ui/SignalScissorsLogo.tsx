interface SignalScissorsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
}

export default function SignalScissorsLogo({
  className = '',
  size = 'md',
  showSubtext = false,
}: SignalScissorsLogoProps) {
  const sizeClasses = {
    sm: 'text-[17px]',
    md: 'text-[24px]',
    lg: 'text-[32px]',
    xl: 'text-[42px]',
  };

  return (
    <div className={`inline-flex flex-col justify-center leading-tight select-none ${className}`}>
      <span className={`trademark-logo font-bold tracking-tight ${sizeClasses[size]}`}>
        SIGNAL Scissors
      </span>
      {showSubtext && (
        <span className="text-[10px] tracking-widest uppercase font-medium opacity-60 block truncate text-muted-foreground mt-0.5">
          CSE 220 DSP Studio
        </span>
      )}
    </div>
  );
}
