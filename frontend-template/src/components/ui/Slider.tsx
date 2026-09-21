interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  trackColor?: string;
  activeColor?: string;
}

export default function Slider({ 
  label, 
  min, 
  max, 
  step = 1, 
  value, 
  onChange, 
  formatValue = (v) => v.toString(),
  trackColor = '#e4e2dc',
  activeColor = '#1f2328'
}: SliderProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex justify-between items-center text-[12px]">
          <span className="font-medium text-ink-secondary">{label}</span>
          <span className="text-ink-primary text-[12px] font-medium tracking-tight">
            {formatValue(value)}
          </span>
        </div>
      )}
      <div className="relative flex items-center h-5 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{
            background: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`
          }}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="flex justify-between text-[11px] text-ink-tertiary">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
