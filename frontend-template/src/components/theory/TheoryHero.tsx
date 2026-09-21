import { useEffect, useRef, useCallback } from 'react';

interface TheoryHeroProps {
  onExplore: () => void;
}

const CONCEPT_CHIPS = [
  'Sampling', 'DFT / FFT', 'STFT', 'Magnitude', 'Phase',
  'Windowing', 'Phase Vocoder', 'Time Stretching', 'Pitch Shifting',
  'Resampling', 'WOLA', 'Phase Locking',
];

/**
 * TheoryHero — hero section for the Theory page.
 * Features a continuously animated SVG sine wave and concept chips.
 */
export default function TheoryHero({ onExplore }: TheoryHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(73,100,93,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    // Animated composite wave
    const drawWave = (freq: number, amp: number, phase: number, color: string, lineWidth: number) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      for (let x = 0; x <= W; x++) {
        const t = x / W;
        const y = H / 2 - amp * Math.sin(2 * Math.PI * freq * t + phase);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Primary wave
    drawWave(3, H * 0.28, phaseRef.current, '#49645d', 2);
    // Secondary lighter wave
    drawWave(5, H * 0.14, phaseRef.current * 1.3 + 1, 'rgba(73,100,93,0.35)', 1.5);
    // Tertiary subtle wave
    drawWave(7, H * 0.08, phaseRef.current * 0.7 + 2, 'rgba(167,196,188,0.5)', 1);

    ctx.restore();

    phaseRef.current += 0.015;
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      // Draw once, static
      draw();
      return;
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div className="rounded-3xl bg-surface-container-lowest shadow-card overflow-hidden mb-10">
      {/* Animated waveform */}
      <div className="w-full h-28 relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {/* Subtle gradient overlay at edges */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface-container-lowest to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface-container-lowest to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="px-8 pb-8 pt-2">
        <div className="mb-1">
          <span className="text-label-caps text-primary font-bold">THEORY LABORATORY</span>
        </div>
        <h1 className="text-display font-bold text-on-surface mb-3 leading-tight">
          Signals &amp; Systems<br className="hidden sm:block" /> Behind the Voice Changer
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mb-6 leading-relaxed">
          Explore the mathematics, signal transformations, Fourier analysis, phase processing,
          resampling, and reconstruction techniques that power the Phase Vocoder Voice Changer.
        </p>

        {/* Concept chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CONCEPT_CHIPS.map((chip) => (
            <span
              key={chip}
              className="text-label-caps bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-full border border-outline-variant/30 hover:bg-primary-container hover:text-on-primary-container hover:border-primary/30 transition-colors cursor-default"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onExplore}
          className="inline-flex items-center gap-2 text-body-lg font-medium text-primary hover:text-on-primary hover:bg-primary px-5 py-2.5 rounded-full transition-all duration-200 border border-primary/30 hover:border-transparent hover:shadow-active"
        >
          Explore the Pipeline
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_downward</span>
        </button>
      </div>
    </div>
  );
}
