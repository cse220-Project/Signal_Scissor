import { useRef, useEffect, useState } from 'react'; // eslint-disable-line

export interface SpectrumPlotProps {
  frequencies: number[];
  magnitudes: number[];
  height?: number;
  highlightBin?: number;
  label?: string;
}

export default function SpectrumPlot({
  frequencies,
  magnitudes,
  height = 150,
  highlightBin = -1,
  label
}: SpectrumPlotProps) {
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (isVisible) draw();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const h = height;
      ctx.clearRect(0, 0, width, h);

      if (frequencies.length === 0) return;

      const barWidth = Math.max(1, width / frequencies.length - 1);
      const maxMag = Math.max(1, ...magnitudes);

      for (let i = 0; i < frequencies.length; i++) {
        const x = i * (width / frequencies.length);
        const barHeight = (magnitudes[i] / maxMag) * (h - 20);
        const y = h - 20 - barHeight;

        ctx.fillStyle = i === highlightBin ? '#49645d' : '#a7c4bc';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      ctx.fillStyle = '#111c2d';
      ctx.font = '10px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0', 10, h - 5);
      ctx.fillText('Fs/4', width / 2, h - 5);
      ctx.fillText('Fs/2', width - 20, h - 5);
    };

    if (isVisible) draw();

    return () => resizeObserver.disconnect();
  }, [frequencies, magnitudes, height, highlightBin, isVisible]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {label && <div className="absolute top-2 left-2 text-label-caps text-on-surface-variant z-10">{label}</div>}
      <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
    </div>
  );
}
