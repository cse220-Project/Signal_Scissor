interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[12px] font-medium text-ink-secondary">{label}</span>
          <span className="text-[11px]  font-medium text-ink-primary">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-surface-raised rounded-pill overflow-hidden">
        <div 
          className="h-full bg-lavender-ink/80 rounded-pill transition-all duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}
