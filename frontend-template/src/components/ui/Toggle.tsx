interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className="relative inline-flex items-center">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        {/* iOS toggle track */}
        <div className={`w-11 h-6 rounded-pill transition-colors duration-200 ${
          checked ? 'bg-lavender-ink/80' : 'bg-surface-raised'
        }`} />
        {/* iOS toggle thumb */}
        <div className={`absolute top-0.5 bg-white w-5 h-5 rounded-pill transition-transform duration-200 shadow-sm flex items-center justify-center ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}>
          {checked && <div className="w-1.5 h-1.5 rounded-pill bg-lavender-ink" />}
        </div>
      </div>
      {label && <span className="text-[13px] font-medium text-ink-primary">{label}</span>}
    </label>
  );
}
