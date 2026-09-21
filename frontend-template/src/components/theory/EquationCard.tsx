import { ReactNode } from 'react';

interface EquationCardProps {
  label?: string;
  children: ReactNode;
  description?: string;
  compact?: boolean;
}

/**
 * EquationCard — renders DSP equations using Unicode math symbols
 * and HTML sub/superscripts. Styled to match the Material-3 design system.
 */
export default function EquationCard({ label, children, description, compact = false }: EquationCardProps) {
  return (
    <div className={`rounded-2xl bg-surface-container-low border border-outline-variant/40 ${compact ? 'p-3' : 'p-4'}`}>
      {label && (
        <p className="text-label-caps text-on-surface-variant mb-2">{label}</p>
      )}
      <div className={`font-mono ${compact ? 'text-body-sm' : 'text-body-lg'} text-primary overflow-x-auto whitespace-nowrap py-1`}>
        {children}
      </div>
      {description && (
        <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

/** Inline math span with primary color */
export function Eq({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-primary bg-primary-container/40 px-1.5 py-0.5 rounded text-body-sm">
      {children}
    </span>
  );
}
