import { ChangeEvent, ReactNode } from 'react';

interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  className = '',
}: SliderProps) {
  const handleRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      // Keep typed values usable while enforcing the same bounds as the slider.
      onChange(Math.min(max, Math.max(min, val)));
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-ink-secondary">{label}</span>
        <div className="flex items-center gap-1.5 font-mono text-ink-primary font-medium tracking-tight">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : 0}
            onChange={handleNumberChange}
            disabled={disabled}
            className="w-20 px-1.5 py-0.5 text-right text-[12px] font-mono rounded border border-border bg-background/90 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
          />
          {unit && <span className="text-[12px] text-muted-foreground font-mono">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleRangeChange}
        disabled={disabled}
        className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}
