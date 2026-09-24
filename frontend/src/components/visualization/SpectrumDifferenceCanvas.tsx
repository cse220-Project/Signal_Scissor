import { useEffect, useRef, useState, MouseEvent } from 'react';
import { SpectrumPayload } from '../../types';

interface SpectrumDifferenceCanvasProps {
  originalSpectrum?: SpectrumPayload;
  processedSpectrum?: SpectrumPayload;
  height?: number;
  isLogScale?: boolean;
  className?: string;
}

export default function SpectrumDifferenceCanvas({
  originalSpectrum,
  processedSpectrum,
  height = 180,
  isLogScale = true,
  className = '',
}: SpectrumDifferenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    freq: number;
    deltaDb: number;
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
    const paddingBottom = 28;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const minDelta = -60; // dB cut limit
    const maxDelta = 30;  // dB boost limit
    const minFreq = 20;
    const nyquist = processedSpectrum?.nyquist || originalSpectrum?.nyquist || 20000;
    const maxFreq = Math.min(100000, nyquist);

    // Delta dB to Y coordinate
    const deltaToY = (delta: number) => {
      const clamped = Math.max(minDelta, Math.min(maxDelta, delta));
      const normalized = (clamped - minDelta) / (maxDelta - minDelta);
      return paddingTop + (1 - normalized) * plotHeight;
    };

    // Frequency to X coordinate (Log/Linear)
    const freqToX = (freq: number) => {
      const f = Math.max(minFreq, Math.min(maxFreq, freq));
      if (isLogScale) {
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);
        const norm = (Math.log10(f) - logMin) / (logMax - logMin);
        return paddingLeft + norm * plotWidth;
      } else {
        const norm = (f - minFreq) / (maxFreq - minFreq);
        return paddingLeft + norm * plotWidth;
      }
    };

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8';

    // Draw horizontal grid lines (-40, -20, 0, +20 dB)
    const deltaTicks = [-60, -40, -20, 0, 20];
    const zeroY = deltaToY(0);

    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';

    deltaTicks.forEach((db) => {
      const y = deltaToY(db);
      ctx.strokeStyle = db === 0 ? (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)') : gridColor;
      ctx.lineWidth = db === 0 ? 1.5 : 1;
      if (db === 0) ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = db === 0 ? (isDark ? '#f4f4f5' : '#0f172a') : textColor;
      ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, paddingLeft - 6, y + 3.5);
    });

    // Frequency markers along X-axis
    const freqMarkers = isLogScale
      ? [20, 100, 1000, 10000, 50000, 100000]
      : [20, 20000, 40000, 60000, 80000, 100000];

    ctx.textAlign = 'center';
    freqMarkers.forEach((freq) => {
      if (freq > maxFreq) return;
      const x = freqToX(freq);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + plotHeight);
      ctx.stroke();

      let label = `${freq}Hz`;
      if (freq >= 1000) label = `${freq / 1000}k`;

      ctx.fillStyle = subtextColor;
      ctx.fillText(label, x, height - 8);
    });

    // Compute difference delta points
    if (!originalSpectrum || !processedSpectrum || !originalSpectrum.freqs || !processedSpectrum.freqs) {
      return;
    }

    const origFreqs = originalSpectrum.freqs;
    const origDb = originalSpectrum.mag_db;
    const procFreqs = processedSpectrum.freqs;
    const procDb = processedSpectrum.mag_db;

    const deltaPoints: { freq: number; delta: number }[] = [];

    // Interpolate / align frequencies
    for (let i = 0; i < origFreqs.length; i++) {
      const f = origFreqs[i];
      if (f < minFreq || f > maxFreq) continue;

      // Find closest freq in processed
      let procVal = origDb[i];
      if (i < procFreqs.length) {
        procVal = procDb[i];
      }
      const delta = procVal - origDb[i];
      deltaPoints.push({ freq: f, delta });
    }

    if (deltaPoints.length === 0) return;

    // Separate curve into positive (boost) and negative (attenuated) region fills
    ctx.save();
    
    // Draw baseline 0 dB text annotation
    ctx.fillStyle = isDark ? '#a1a1aa' : '#64748b';
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0 dB (Unchanged / Preserved)', paddingLeft + 8, zeroY - 4);

    // Render continuous spectral difference line with light purple fill gradients
    // Positive Boost fill (Light Purple / Lavender)
    const boostGrad = ctx.createLinearGradient(0, paddingTop, 0, zeroY);
    boostGrad.addColorStop(0, isDark ? 'rgba(216, 180, 254, 0.45)' : 'rgba(192, 132, 252, 0.38)');
    boostGrad.addColorStop(1, 'rgba(216, 180, 254, 0.02)');

    // Negative Cut fill (Soft Light Violet / Purple)
    const cutGrad = ctx.createLinearGradient(0, zeroY, 0, paddingTop + plotHeight);
    cutGrad.addColorStop(0, 'rgba(192, 132, 252, 0.02)');
    cutGrad.addColorStop(1, isDark ? 'rgba(192, 132, 252, 0.40)' : 'rgba(168, 85, 247, 0.30)');

    // Fill regions below 0 dB (Cut)
    ctx.beginPath();
    ctx.moveTo(freqToX(deltaPoints[0].freq), zeroY);
    deltaPoints.forEach((pt) => {
      const x = freqToX(pt.freq);
      const y = deltaToY(pt.delta);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(freqToX(deltaPoints[deltaPoints.length - 1].freq), zeroY);
    ctx.closePath();
    ctx.fillStyle = cutGrad;
    ctx.fill();

    // Fill regions above 0 dB (Boost)
    ctx.beginPath();
    ctx.moveTo(freqToX(deltaPoints[0].freq), zeroY);
    deltaPoints.forEach((pt) => {
      const x = freqToX(pt.freq);
      const y = deltaToY(pt.delta);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(freqToX(deltaPoints[deltaPoints.length - 1].freq), zeroY);
    ctx.closePath();
    ctx.fillStyle = boostGrad;
    ctx.fill();

    // Draw main delta line curve in light purple
    ctx.beginPath();
    deltaPoints.forEach((pt, idx) => {
      const x = freqToX(pt.freq);
      const y = deltaToY(pt.delta);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = isDark ? '#d8b4fe' : '#c084fc';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = isDark ? '#d8b4fe' : '#c084fc';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.restore();
  }, [originalSpectrum, processedSpectrum, height, isLogScale]);

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
      freq = Math.pow(10, Math.log10(minFreq) + normX * (Math.log10(maxFreq) - Math.log10(minFreq)));
    } else {
      freq = minFreq + normX * (maxFreq - minFreq);
    }

    let deltaDb = 0;
    if (originalSpectrum?.freqs && processedSpectrum?.mag_db) {
      let minDiff = Infinity;
      for (let i = 0; i < originalSpectrum.freqs.length; i++) {
        const diff = Math.abs(originalSpectrum.freqs[i] - freq);
        if (diff < minDiff) {
          minDiff = diff;
          const origVal = originalSpectrum.mag_db[i] || -80;
          const procVal = processedSpectrum.mag_db[i] || origVal;
          deltaDb = procVal - origVal;
        }
      }
    }

    setHoverInfo({
      x,
      y,
      freq: Math.round(freq),
      deltaDb: Math.round(deltaDb * 10) / 10,
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
            left: `${Math.min(hoverInfo.x + 12, window.innerWidth - 200)}px`,
            top: `${Math.max(10, hoverInfo.y - 40)}px`,
          }}
          className="pointer-events-none absolute z-20 bg-popover/95 backdrop-blur-md px-3 py-1.5 rounded-ios-md border border-border shadow-xl text-[11px] font-mono space-y-0.5"
        >
          <div className="font-semibold text-foreground">{hoverInfo.freq} Hz</div>
          <div
            className={`font-bold flex items-center gap-1 ${
              hoverInfo.deltaDb > 0.5
                ? 'text-emerald-400'
                : hoverInfo.deltaDb < -0.5
                  ? 'text-rose-400'
                  : 'text-muted-foreground'
            }`}
          >
            <span>{hoverInfo.deltaDb > 0 ? '▲ Boost' : hoverInfo.deltaDb < 0 ? '▼ Cut' : '— Preserved'}:</span>
            <span>{hoverInfo.deltaDb > 0 ? '+' : ''}{hoverInfo.deltaDb} dB</span>
          </div>
        </div>
      )}
    </div>
  );
}
