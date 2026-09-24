import { useEffect, useRef, useState, MouseEvent } from 'react';
import { SpectrumPayload } from '../../types';

interface LogSpectrumCanvasProps {
  originalSpectrum?: SpectrumPayload;
  processedSpectrum?: SpectrumPayload;
  filterBand?: [number, number] | null;
  filterOperation?: string | null;
  dominantFreq?: number;
  height?: number;
  isLogScale?: boolean;
  className?: string;
  showOriginal?: boolean;
  showProcessed?: boolean;
}

export default function LogSpectrumCanvas({
  originalSpectrum,
  processedSpectrum,
  filterBand,
  filterOperation,
  dominantFreq,
  height = 240,
  isLogScale = true,
  className = '',
  showOriginal = true,
  showProcessed = true,
}: LogSpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    freq: number;
    origDb: number | null;
    procDb: number | null;
  } | null>(null);

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

    const paddingLeft = 46;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 32;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const minDb = -80;
    const maxDb = 0;
    const minFreq = 20; // Hz
    const nyquist = processedSpectrum?.nyquist || originalSpectrum?.nyquist || 20000;
    const maxFreq = Math.min(100000, nyquist);

    // dB to Y coordinate
    const dbToY = (db: number) => {
      const clamped = Math.max(minDb, Math.min(maxDb, db));
      const normalized = (clamped - minDb) / (maxDb - minDb);
      return paddingTop + (1 - normalized) * plotHeight;
    };

    // Frequency to X coordinate (Log or Linear)
    const freqToX = (freq: number) => {
      const f = Math.max(minFreq, Math.min(maxFreq, freq));
      if (isLogScale) {
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);
        const logF = Math.log10(f);
        const norm = (logF - logMin) / (logMax - logMin);
        return paddingLeft + norm * plotWidth;
      } else {
        const norm = (f - minFreq) / (maxFreq - minFreq);
        return paddingLeft + norm * plotWidth;
      }
    };

    // Theme Colors
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8';

    // Draw horizontal dB grid lines & labels
    const dbTicks = [-80, -60, -40, -20, 0];
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';

    dbTicks.forEach((db) => {
      const y = dbToY(db);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = db === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(`${db} dB`, paddingLeft - 6, y + 3.5);
    });

    // Frequency Ticks (Explicit sensible markers)
    const freqMarkers = isLogScale
      ? [20, 100, 1000, 10000, 50000, 100000]
      : [20, 20000, 40000, 60000, 80000, 100000];

    ctx.textAlign = 'center';
    freqMarkers.forEach((freq) => {
      if (freq > maxFreq) return;
      const x = freqToX(freq);

      // Tick mark
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + plotHeight);
      ctx.stroke();

      // Tick label format (e.g., 1 kHz)
      let label = `${freq}Hz`;
      if (freq >= 1000) {
        label = `${freq / 1000}k`;
      }

      ctx.fillStyle = freq === 1000 ? (isDark ? '#f4f4f5' : '#0f172a') : subtextColor;
      ctx.font = freq === 1000 ? '600 10px "IBM Plex Mono", monospace' : '10px "IBM Plex Mono", monospace';
      ctx.fillText(label, x, height - 10);
    });

    // 1. Highlight Filter Band Region if active
    if (filterBand && filterBand[0] < filterBand[1]) {
      const x1 = Math.max(paddingLeft, freqToX(filterBand[0]));
      const x2 = Math.min(width - paddingRight, freqToX(filterBand[1]));

      if (x2 > x1) {
        const isCut = filterOperation !== 'keep';
        const bandFill = isCut
          ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.10)')
          : (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)');
        const strokeCol = isCut
          ? (isDark ? '#ef4444' : '#dc2626')
          : (isDark ? '#10b981' : '#059669');

        ctx.fillStyle = bandFill;
        ctx.fillRect(x1, paddingTop, x2 - x1, plotHeight);

        // Dashed boundaries
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, paddingTop);
        ctx.lineTo(x1, paddingTop + plotHeight);
        ctx.moveTo(x2, paddingTop);
        ctx.lineTo(x2, paddingTop + plotHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Region label
        ctx.fillStyle = strokeCol;
        ctx.font = '600 10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        const midX = (x1 + x2) / 2;
        ctx.fillText(
          `${filterOperation?.toUpperCase() || 'FILTER'}: ${Math.round(filterBand[0])}–${Math.round(filterBand[1])}Hz`,
          midX,
          paddingTop + 14
        );
      }
    }

    // Function to render smooth spectrum curve
    const drawSpectrumLine = (
      spec: SpectrumPayload,
      color: string,
      fillGradient: CanvasGradient | null,
      lineWidth: number,
      glow: boolean
    ) => {
      if (!spec.freqs || spec.freqs.length === 0) return;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = isDark ? 8 : 3;
      }

      ctx.beginPath();
      let started = false;

      for (let i = 0; i < spec.freqs.length; i++) {
        const f = spec.freqs[i];
        if (f < minFreq || f > maxFreq) continue;
        const x = freqToX(f);
        const y = dbToY(spec.mag_db[i]);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (fillGradient) {
        ctx.lineTo(freqToX(maxFreq), paddingTop + plotHeight);
        ctx.lineTo(freqToX(minFreq), paddingTop + plotHeight);
        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();
      }
      ctx.restore();
    };

    // 2. Original Spectrum (Track A: Cyan)
    if (showOriginal && originalSpectrum) {
      const origColor = isDark ? '#38bdf8' : '#0284c7';
      const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
      grad.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.10)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      drawSpectrumLine(
        originalSpectrum,
        origColor,
        showProcessed ? null : grad,
        showProcessed ? 1.5 : 2.0,
        false
      );
    }

    // 3. Processed Spectrum (Track B: Emerald)
    if (showProcessed && processedSpectrum) {
      const procColor = isDark ? '#34d399' : '#059669';
      const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
      grad.addColorStop(0, isDark ? 'rgba(52, 211, 153, 0.22)' : 'rgba(5, 150, 105, 0.14)');
      grad.addColorStop(1, 'rgba(52, 211, 153, 0.0)');

      drawSpectrumLine(processedSpectrum, procColor, grad, 2.2, true);
    }

    // 4. Mark Dominant Peak
    if (dominantFreq && dominantFreq >= minFreq && dominantFreq <= maxFreq) {
      const domX = freqToX(dominantFreq);
      const peakColor = isDark ? '#fbbf24' : '#d97706';

      ctx.save();
      ctx.fillStyle = peakColor;
      ctx.shadowColor = peakColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(domX, paddingTop + 8, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = peakColor;
      ctx.fillText(`Peak: ${Math.round(dominantFreq)} Hz`, domX, paddingTop + 24);
      ctx.restore();
    }
  }, [
    originalSpectrum,
    processedSpectrum,
    filterBand,
    filterOperation,
    dominantFreq,
    height,
    isLogScale,
    showOriginal,
    showProcessed,
  ]);

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 46;
    const paddingRight = 16;
    const plotWidth = rect.width - paddingLeft - paddingRight;

    if (x < paddingLeft || x > rect.width - paddingRight) {
      setHoverInfo(null);
      return;
    }

    const normX = (x - paddingLeft) / plotWidth;
    const minFreq = 20;
    const nyquist = processedSpectrum?.nyquist || originalSpectrum?.nyquist || 20000;
    const maxFreq = Math.min(100000, nyquist);

    let freq: number;
    if (isLogScale) {
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      freq = Math.pow(10, logMin + normX * (logMax - logMin));
    } else {
      freq = minFreq + normX * (maxFreq - minFreq);
    }

    const getNearestDb = (spec?: SpectrumPayload) => {
      if (!spec || !spec.freqs || spec.freqs.length === 0) return null;
      let minDiff = Infinity;
      let bestDb = spec.mag_db[0];
      for (let i = 0; i < spec.freqs.length; i++) {
        const diff = Math.abs(spec.freqs[i] - freq);
        if (diff < minDiff) {
          minDiff = diff;
          bestDb = spec.mag_db[i];
        }
      }
      return Math.round(bestDb * 10) / 10;
    };

    setHoverInfo({
      x,
      y,
      freq: Math.round(freq),
      origDb: getNearestDb(originalSpectrum),
      procDb: getNearestDb(processedSpectrum),
    });
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded-ios-lg bg-transparent cursor-crosshair"
      />
      {hoverInfo && (
        <div
          style={{
            left: `${Math.min(hoverInfo.x + 12, window.innerWidth - 220)}px`,
            top: `${Math.max(10, hoverInfo.y - 45)}px`,
          }}
          className="pointer-events-none absolute z-20 bg-popover/95 backdrop-blur-md px-3 py-2 rounded-ios-md border border-border shadow-xl text-[11px] font-mono space-y-1"
        >
          <div className="font-semibold text-foreground border-b border-border pb-1">
            Freq: {hoverInfo.freq} Hz
          </div>
          {hoverInfo.origDb !== null && (
            <div className="flex items-center justify-between gap-3 text-sky-400">
              <span>Original:</span>
              <span className="font-bold">{hoverInfo.origDb} dB</span>
            </div>
          )}
          {hoverInfo.procDb !== null && (
            <div className="flex items-center justify-between gap-3 text-emerald-400">
              <span>Processed:</span>
              <span className="font-bold">{hoverInfo.procDb} dB</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
