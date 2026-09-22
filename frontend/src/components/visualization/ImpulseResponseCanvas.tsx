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

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 32;
    const paddingRight = 24;
    const paddingTop = 20;
    const paddingBottom = 28;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const baselineY = paddingTop + plotHeight;

    // Draw baseline (amplitude = 0)
    ctx.strokeStyle = '#1f2328';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, baselineY);
    ctx.lineTo(width - paddingRight, baselineY);
    ctx.stroke();

    // Draw amplitude grid (0, 0.5, 1.0)
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillStyle = '#626975';
    ctx.textAlign = 'right';
    [0, 0.5, 1.0].forEach((amp) => {
      const y = baselineY - amp * plotHeight;
      ctx.fillText(amp.toFixed(1), paddingLeft - 6, y + 3);
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.06)';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
    });

    if (!stems || stems.length === 0) return;

    const maxTime = Math.max(100, stems[stems.length - 1].t_ms * 1.15);

    // Draw time ticks
    ctx.textAlign = 'center';
    ctx.fillStyle = '#626975';
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

      // Vertical stem line
      ctx.strokeStyle = idx === 0 ? '#1f2328' : '#3f7856';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, baselineY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Tip circle
      ctx.fillStyle = idx === 0 ? '#1f2328' : '#3f7856';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Amplitude text
      ctx.fillStyle = '#1f2328';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stem.amp.toFixed(2), x, y - 7);
    });
  }, [stems, height]);

  return (
    <div className={`relative w-full select-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded-ios-lg bg-surface-raised/40"
      />
    </div>
  );
}
