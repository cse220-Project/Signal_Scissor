import { useEffect, useRef, useState, MouseEvent } from 'react';
import { SpectrumPayload } from '../../types';

interface SpectrumCanvasProps {
  originalSpectrum?: SpectrumPayload;
  processedSpectrum?: SpectrumPayload;
  filterBand?: [number, number] | null;
  dominantFreq?: number;
  height?: number;
  className?: string;
  showOriginal?: boolean;
  showProcessed?: boolean;
}

export default function SpectrumCanvas({
  originalSpectrum,
  processedSpectrum,
  filterBand,
  dominantFreq,
  height = 140,
  className = '',
  showOriginal = true,
  showProcessed = true,
}: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; freq: number; db: number } | null>(null);

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

    // Color tokens
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';

    // Draw horizontal dB grid lines
    const dbLines = [-60, -40, -20, 0];
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '9px "IBM Plex Mono", monospace';
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

      ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.22)' : 'rgba(167, 139, 250, 0.18)';
      ctx.fillRect(x1, paddingTop, x2 - x1, plotHeight);

      ctx.strokeStyle = isDark ? 'rgba(196, 181, 253, 0.7)' : 'rgba(124, 58, 237, 0.6)';
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
    const renderCurve = (
      spec: SpectrumPayload,
      color: string,
      fillColor: string | null,
      lineWidth: number,
      glow: boolean
    ) => {
      if (!spec.freqs || spec.freqs.length === 0) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = isDark ? 6 : 3;
      }

      ctx.beginPath();
      for (let i = 0; i < spec.freqs.length; i++) {
        const x = freqToX(spec.freqs[i]);
        const y = dbToY(spec.mag_db[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (fillColor) {
        ctx.lineTo(width, height - paddingBottom);
        ctx.lineTo(0, height - paddingBottom);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      ctx.restore();
    };

    // 1. Draw Original spectrum (Track A: Electric Cyan)
    if (showOriginal && originalSpectrum) {
      const origColor = isDark ? '#38bdf8' : '#0284c7';
      renderCurve(
        originalSpectrum,
        origColor,
        showProcessed ? null : (isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.10)'),
        showProcessed ? 1.25 : 1.75,
        false
      );
    }

    // 2. Draw Processed spectrum (Track B: Vibrant Emerald)
    if (showProcessed && processedSpectrum) {
      const procColor = isDark ? '#34d399' : '#059669';
      const procFill = isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(5, 150, 105, 0.12)';
      renderCurve(processedSpectrum, procColor, procFill, 1.85, true);
    }

    // 3. Mark Dominant Frequency Peak
    if (dominantFreq && dominantFreq > 20 && dominantFreq <= nyquist) {
      const domX = freqToX(dominantFreq);
      const peakColor = isDark ? '#fbbf24' : '#e11d48';

      ctx.save();
      ctx.fillStyle = peakColor;
      ctx.shadowColor = peakColor;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(domX, paddingTop + 6, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(dominantFreq)} Hz`, domX, paddingTop + 20);
      ctx.restore();
    }
  }, [originalSpectrum, processedSpectrum, filterBand, dominantFreq, height, showOriginal, showProcessed]);

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
            left: `${Math.min(hoverInfo.x + 10, 220)}px`,
            top: '8px',
          }}
          className="pointer-events-none absolute bg-card px-2.5 py-1 rounded-md text-[11px] font-mono text-foreground border border-border shadow-md"
        >
          {hoverInfo.freq} Hz · {hoverInfo.db} dB
        </div>
      )}
    </div>
  );
}
