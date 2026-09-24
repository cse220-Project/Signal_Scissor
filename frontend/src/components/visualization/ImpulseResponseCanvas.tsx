import { useEffect, useRef } from 'react';
import { ImpulseResponseStem } from '../../types';

interface ImpulseResponseCanvasProps {
  stems?: ImpulseResponseStem[];
  height?: number;
  className?: string;
}

export default function ImpulseResponseCanvas({
  stems = [],
  height = 140,
  className = '',
}: ImpulseResponseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 36;
    const paddingRight = 24;
    const paddingTop = 22;
    const paddingBottom = 28;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const baselineY = paddingTop + plotHeight;

    const baselineColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';
    const labelColor = isDark ? '#f4f4f5' : '#18181b';

    // Draw baseline (amplitude = 0)
    ctx.strokeStyle = baselineColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, baselineY);
    ctx.lineTo(width - paddingRight, baselineY);
    ctx.stroke();

    // Draw amplitude grid (0, 0.5, 1.0)
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    [0, 0.5, 1.0].forEach((amp) => {
      const y = baselineY - amp * plotHeight;
      ctx.fillText(amp.toFixed(1), paddingLeft - 8, y + 3);
      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
    });

    if (!stems || stems.length === 0) return;

    const maxTime = Math.max(100, stems[stems.length - 1].t_ms * 1.15);

    // Draw time ticks
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    const timeTicks = 5;
    for (let i = 0; i <= timeTicks; i++) {
      const t = (i / timeTicks) * maxTime;
      const x = paddingLeft + (t / maxTime) * plotWidth;
      ctx.fillText(`${Math.round(t)}ms`, x, height - 8);
    }

    // Draw stems (discrete delta functions)
    stems.forEach((stem, idx) => {
      const x = paddingLeft + (stem.t_ms / maxTime) * plotWidth;
      const y = baselineY - Math.min(1.0, stem.amp) * plotHeight;

      // Direct tap is cyan, reflections are vibrant emerald
      const stemColor = idx === 0 ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#34d399' : '#059669');

      ctx.save();
      ctx.strokeStyle = stemColor;
      ctx.fillStyle = stemColor;
      ctx.shadowColor = stemColor;
      ctx.shadowBlur = isDark ? 6 : 2;

      // Vertical stem line
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, baselineY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Tip circle
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner white dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Amplitude text
      ctx.shadowBlur = 0;
      ctx.fillStyle = labelColor;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(stem.amp.toFixed(2), x, y - 8);
      ctx.restore();
    });
  }, [stems, height]);

  return (
    <div className={`relative w-full select-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded-ios-lg bg-transparent"
      />
    </div>
  );
}
