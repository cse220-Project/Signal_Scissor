interface ConceptCardProps {
  concept: string;
  math?: string;
  mathDescription?: string;
  description: string;
  tags?: string[];
  variant?: 'default' | 'highlight' | 'muted';
}

/**
 * ConceptCard — displays a DSP concept with its mathematical
 * definition and an accessible description.
 */
export default function ConceptCard({
  concept,
  math,
  mathDescription,
  description,
  tags,
  variant = 'default',
}: ConceptCardProps) {
  const bg = {
    default: 'bg-surface-container-lowest',
    highlight: 'bg-primary-container/20 border border-primary/20',
    muted: 'bg-surface-container-low',
  }[variant];

  return (
    <div className={`rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-active ${bg}`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <h4 className="text-title-md font-bold text-on-surface">{concept}</h4>
        {tags && (
          <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
            {tags.map((t) => (
              <span
                key={t}
                className="text-label-caps bg-secondary-container text-on-secondary-fixed px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {math && (
        <div className="font-mono text-body-sm text-primary bg-surface-container px-3 py-2 rounded-xl mb-3 overflow-x-auto whitespace-nowrap">
          {math}
        </div>
      )}

      {mathDescription && (
        <p className="text-body-sm text-on-surface-variant mb-2 italic">{mathDescription}</p>
      )}

      <p className="text-body-sm text-on-surface leading-relaxed">{description}</p>
    </div>
  );
}
