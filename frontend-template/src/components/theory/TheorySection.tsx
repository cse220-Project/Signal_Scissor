import { ReactNode, useRef, useEffect, useState } from 'react';

interface TheorySectionProps {
  id: string;
  index?: string; // e.g. "01"
  title: string;
  subtitle?: string;
  whyCard?: string; // "Why is this here?" explanation
  children: ReactNode;
  onVisible?: (id: string) => void;
  initiallyVisible?: boolean;
}

/**
 * TheorySection — section wrapper for the Theory page.
 * Handles IntersectionObserver reporting (for sticky nav highlight)
 * and renders the standard section header + "Why is this here?" card.
 */
export default function TheorySection({
  id,
  index,
  title,
  subtitle,
  whyCard,
  initiallyVisible = false,
  children,
  onVisible,
}: TheorySectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(initiallyVisible);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onVisible?.(id);
        }
      },
      { rootMargin: '-5% 0px -15% 0px', threshold: 0 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [id, onVisible]);

  return (
    <section
      id={id}
      ref={ref}
      className={`scroll-mt-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {/* Section header */}
      <div className="mb-6">
        {index && (
          <span className="text-label-caps text-primary font-bold mb-1 block">
            SECTION {index}
          </span>
        )}
        <h2 className="text-headline-lg font-bold text-on-surface leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-body-lg text-on-surface-variant mt-1">{subtitle}</p>
        )}
      </div>

      {/* "Why is this here?" card */}
      {whyCard && (
        <div className="mb-6 rounded-2xl bg-primary-container/30 border border-primary/20 p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5" style={{ fontSize: 18 }}>
            help_outline
          </span>
          <div>
            <p className="text-label-caps text-primary mb-1">WHY IS THIS HERE?</p>
            <p className="text-body-sm text-on-surface leading-relaxed">{whyCard}</p>
          </div>
        </div>
      )}

      {children}
    </section>
  );
}
