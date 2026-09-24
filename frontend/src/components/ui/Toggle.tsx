interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}: ToggleProps) {
  return (
    <label
      className={`inline-flex items-center gap-3 select-none cursor-pointer ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`w-10 h-6 rounded-pill transition-colors duration-200 relative flex items-center px-0.5 ${
          checked ? 'bg-primary' : 'bg-surface-muted'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-surface transition-transform duration-200 transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-[13px] font-medium text-ink-primary">{label}</span>}
    </label>
  );
}
