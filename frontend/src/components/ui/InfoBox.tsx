import { ReactNode, useState } from 'react';

interface InfoBoxProps {
  title?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

/** Collapsible "how this works" callout used at the top of task pages. */
export default function InfoBox({
  title = 'How this works',
  children,
  className = '',
  defaultOpen = true,
}: InfoBoxProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-ios-2xl border border-primary/20 bg-primary/[0.06] text-[13px] leading-relaxed text-ink-secondary ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
      >
        <span className="material-symbols-outlined text-[17px] text-primary">info</span>
        <span className="flex-1 text-[13px] font-medium text-ink-primary">{title}</span>
        <span className="material-symbols-outlined text-[18px] text-ink-tertiary">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && <div className="px-4 pb-3.5 pt-0.5 space-y-1.5">{children}</div>}
    </div>
  );
}
