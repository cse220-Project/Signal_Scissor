import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export default function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-[12px] font-medium text-ink-secondary">{label}</label>}
      <div className="relative">
        <select 
          className="w-full bg-surface-raised text-ink-primary text-[13px] font-normal rounded-ios-lg px-3.5 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-lavender-ink/30 cursor-pointer transition-colors"
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-surface text-ink-primary">{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-[18px] text-ink-tertiary">expand_more</span>
        </div>
      </div>
    </div>
  );
}
