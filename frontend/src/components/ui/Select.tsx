import { ChangeEvent } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className = '',
}: SelectProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[13px] font-medium text-ink-secondary">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-surface text-ink-primary text-[13px] font-medium px-3.5 py-2 pr-8 rounded-ios-lg border border-[#9097A1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-surface-muted"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-secondary text-[18px]">
          expand_more
        </span>
      </div>
    </div>
  );
}
