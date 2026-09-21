import { useRef, useEffect, useState } from 'react'; // eslint-disable-line

export interface SignalPlotProps {
  data?: number[];
  height?: number;
  color?: string;
  label?: string;
  animated?: boolean;
  phase?: number;
}

export default function SignalPlot({
  data,
  height = 150,
  color = '#49645d',
  label,
  animated = false,
  phase = 0
}: SignalPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let localPhase = phase;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (!animated) draw();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const h = height;

      ctx.clearRect(0, 0, width, h);

      ctx.strokeStyle = 'rgba(73, 100, 93, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < width; i += 50) {
        ctx.moveTo(i, 0); ctx.lineTo(i, h);
      }
      for (let i = 0; i < h; i += 50) {
        ctx.moveTo(0, i); ctx.lineTo(width, i);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(73, 100, 93, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2); ctx.lineTo(width, h / 2);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      if (data && data.length > 0) {
        const step = width / (data.length - 1);
        for (let i = 0; i < data.length; i++) {
          const x = i * step;
          const y = h / 2 - (data[i] * (h / 2.5));
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      } else if (animated) {
        for (let x = 0; x < width; x++) {
          const y = h / 2 - Math.sin((x * 0.05) + localPhase) * (h / 2.5);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        localPhase += 0.05;
      }
      ctx.stroke();

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (animated && isVisible && !prefersReducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    };

    if (isVisible || !animated) draw();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [data, height, color, animated, isVisible, phase]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {label && <div className="absolute top-2 left-2 text-label-caps text-on-surface-variant z-10">{label}</div>}
      <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
    </div>
  );
}
