import { useEffect, useRef } from 'react';

interface KaTeXProps {
  math: string;
  block?: boolean;
  className?: string;
}

declare global {
  interface Window {
    katex?: {
      render: (math: string, element: HTMLElement, options?: Record<string, unknown>) => void;
    };
  }
}

export default function KaTeX({ math, block = false, className = '' }: KaTeXProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.katex) {
      try {
        window.katex.render(math, el, {
          displayMode: block,
          throwOnError: false,
        });
      } catch {
        el.textContent = math;
      }
    } else {
      el.textContent = math;
    }
  }, [math, block]);

  if (block) {
    return (
      <div className={`my-3 p-3 bg-secondary/80 rounded-ios-lg border border-border text-center overflow-x-auto select-none ${className}`}>
        <span ref={containerRef} className="font-mono text-[14px] text-foreground font-semibold inline-block" />
      </div>
    );
  }

  return (
    <span
      ref={containerRef}
      className={`font-mono text-foreground font-semibold px-1 py-0.5 rounded bg-secondary/50 text-[13px] ${className}`}
    />
  );
}
