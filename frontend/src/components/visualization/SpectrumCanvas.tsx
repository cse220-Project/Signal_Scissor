import { useEffect, useRef, useState, MouseEvent } from 'react';
import { SpectrumPayload } from '../../types';

interface SpectrumCanvasProps {
  originalSpectrum?: SpectrumPayload;
  processedSpectrum?: SpectrumPayload;
  filterBand?: [number, number] | null;
  dominantFreq?: number;
  height?: number;
  className?: string;
}

export default function SpectrumCanvas({
  originalSpectrum,
  processedSpectrum,
  filterBand,
  dominantFreq,
  height = 140,
  className = '',
}: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; freq: number; db: number } | null>(null);

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

    const paddingBottom = 22;
    const paddingTop = 12;
    const plotHeight = height - paddingBottom - paddingTop;

    const minDb = -80;
    const maxDb = 0;
    const nyquist = processedSpectrum?.nyquist || originalSpectrum?.nyquist || 4000;

    // dB to Y coordinate
    const dbToY = (db: number) => {
      const clamped = Math.max(minDb, Math.min(maxDb, db));
      const normalized = (clamped - minDb) / (maxDb - minDb);
      return paddingTop + (1 - normalized) * plotHeight;
    };

    // Frequency to X coordinate
    const freqToX = (freq: number) => {
      return (freq / nyquist) * width;
    };

    // Draw horizontal dB grid lines
    const dbLines = [-60, -40, -20, 0];
    ctx.strokeStyle = 'rgba(31, 35, 40, 0.07)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#626975';
    ctx.font = '9px Outfit, sans-serif';
    ctx.textAlign = 'right';

    dbLines.forEach((db) => {
      const y = dbToY(db);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(`${db}dB`, width - 6, y - 3);
    });

    // Draw vertical frequency ticks
    const numFreqTicks = 4;
    ctx.textAlign = 'center';
    for (let i = 0; i <= numFreqTicks; i++) {
      const freq = (i / numFreqTicks) * nyquist;
      const x = freqToX(freq);
      ctx.fillRect(x, height - 18, 1, 4);
      if (i > 0 && i < numFreqTicks) {
        ctx.fillText(`${Math.round(freq)}Hz`, x, height - 6);
      }
    }

    // Highlight active Filter Band if configured
    if (filterBand && filterBand[0] < filterBand[1]) {
      const x1 = Math.max(0, freqToX(filterBand[0]));
      const x2 = Math.min(width, freqToX(filterBand[1]));
      ctx.fillStyle = 'rgba(228, 222, 242, 0.45)';
      ctx.fillRect(x1, paddingTop, x2 - x1, plotHeight);

      ctx.strokeStyle = 'rgba(31, 35, 40, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, paddingTop);
      ctx.lineTo(x1, paddingTop + plotHeight);
      ctx.moveTo(x2, paddingTop);
      ctx.lineTo(x2, paddingTop + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Function to render spectrum curve
    const renderCurve = (spec: SpectrumPayload, color: string, lineWidth: number, isGhost: boolean) => {
      if (!spec.freqs || spec.freqs.length === 0) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let i = 0; i < spec.freqs.length; i++) {
        const x = freqToX(spec.freqs[i]);
        const y = dbToY(spec.mag_db[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!isGhost) {
        // Fill area under processed curve
        ctx.lineTo(width, height - paddingBottom);
        ctx.lineTo(0, height - paddingBottom);
        ctx.closePath();
        ctx.fillStyle = 'rgba(38, 33, 28, 0.05)';
        ctx.fill();
      }
      ctx.restore();
    };

    // 1. Draw Original spectrum (Ghost line)
    if (originalSpectrum) {
      renderCurve(originalSpectrum, 'rgba(140, 149, 159, 0.5)', 1, true);
    }

    // 2. Draw Processed spectrum (Primary curve)
    if (processedSpectrum) {
      renderCurve(processedSpectrum, '#1F2A44', 1.8, false);
    }

    // 3. Mark Dominant Frequency
    if (dominantFreq && dominantFreq > 20 && dominantFreq <= nyquist) {
      const domX = freqToX(dominantFreq);
      ctx.fillStyle = '#8B3A3A';
      ctx.beginPath();
      ctx.arc(domX, paddingTop + 6, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8B3A3A';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(dominantFreq)} Hz (Peak)`, domX, paddingTop + 20);
    }
  }, [originalSpectrum, processedSpectrum, filterBand, dominantFreq, height]);

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nyquist = processedSpectrum?.nyquist || originalSpectrum?.nyquist || 4000;
    const freq = (x / rect.width) * nyquist;

    const paddingTop = 12;
    const paddingBottom = 22;
    const plotHeight = rect.height - paddingBottom - paddingTop;
    const clampedY = Math.max(paddingTop, Math.min(paddingTop + plotHeight, y));
    const normalized = 1 - (clampedY - paddingTop) / plotHeight;
    const db = -80 + normalized * 80;

    setHoverInfo({ x, y, freq: Math.round(freq), db: Math.round(db) });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded-ios-lg bg-transparent cursor-crosshair"
      />
      {hoverInfo && (
        <div
          style={{
            left: `${Math.min(hoverInfo.x + 10, 200)}px`,
            top: '8px',
          }}
          className="pointer-events-none absolute bg-surface px-2.5 py-1 rounded-ios-md text-[11px] font-mono text-ink-primary border border-hairline"
        >
          {hoverInfo.freq} Hz · {hoverInfo.db} dB
        </div>
      )}
    </div>
  );
}
