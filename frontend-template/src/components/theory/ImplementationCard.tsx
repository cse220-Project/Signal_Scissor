
interface ImplementationCardProps {
  file: string;
  fn?: string;
  description?: string;
  className?: string;
}

/**
 * ImplementationCard — shows a "Used in project" reference with
 * the verified source file and function name from the backend DSP code.
 */
export default function ImplementationCard({ file, fn, description, className = '' }: ImplementationCardProps) {
  return (
    <div className={`rounded-2xl bg-surface-container border border-outline-variant/30 p-4 flex items-start gap-3 ${className}`}>
      <span className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0" style={{ fontSize: 18 }}>
        code
      </span>
      <div className="min-w-0">
        <p className="text-label-caps text-on-surface-variant mb-1">IMPLEMENTATION</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="font-mono text-body-sm bg-primary-container/60 text-on-primary-container px-2 py-0.5 rounded-md">
            {file}
          </span>
          {fn && (
            <>
              <span className="text-on-surface-variant text-body-sm">→</span>
              <span className="font-mono text-body-sm bg-secondary-container text-on-secondary-fixed px-2 py-0.5 rounded-md">
                {fn}
              </span>
            </>
          )}
        </div>
        {description && (
          <p className="text-body-sm text-on-surface-variant mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
