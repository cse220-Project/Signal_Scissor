import { useEffect, useRef } from 'react';
import { SpectrogramPayload } from '../../types';

interface SpectrogramCanvasProps {
  spectrogram?: SpectrogramPayload;
  title: string;
  subtitle?: string;
  colorScheme?: 'cyan-emerald' | 'plasma' | 'fire';
  height?: number;
  className?: string;
}

export default function SpectrogramCanvas({
  spectrogram,
  title,
  subtitle = 'STFT Magnitude (Time vs Frequency)',
  colorScheme = 'cyan-emerald',
  height = 180,
  className = '',
}: SpectrogramCanvasProps) {
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

    const paddingLeft = 46;
    const paddingRight = 16;
    const paddingTop = 22;
    const paddingBottom = 28;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';

    // Draw header text
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = isDark ? '#f4f4f5' : '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(title, paddingLeft, 14);

    if (subtitle) {
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'right';
      ctx.fillText(subtitle, width - paddingRight, 14);
    }

    if (!spectrogram || !spectrogram.mag_db || spectrogram.mag_db.length === 0) {
      // Empty state
      ctx.fillStyle = textColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No STFT Spectrogram Available', width / 2, height / 2);
      return;
    }

    const freqBins = spectrogram.freqs.length;
    const timeFrames = spectrogram.times.length;
    const maxFreq = spectrogram.freqs[freqBins - 1] || 20000;
    const maxTime = spectrogram.times[timeFrames - 1] || 2.0;

    // Intensity mapping (minDb = -80 dB, maxDb = 0 dB)
    const minDb = -80;
    const maxDb = 0;

    const getColor = (db: number) => {
      const norm = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
      if (colorScheme === 'plasma') {
        // Plasma heatmap: Dark Purple -> Red -> Orange -> Yellow -> White
        if (norm < 0.25) {
          const t = norm / 0.25;
          return `rgb(${Math.round(15 + t * 75)}, ${Math.round(10 + t * 10)}, ${Math.round(60 + t * 80)})`;
        } else if (norm < 0.5) {
          const t = (norm - 0.25) / 0.25;
          return `rgb(${Math.round(90 + t * 110)}, ${Math.round(20 + t * 20)}, ${Math.round(140 - t * 40)})`;
        } else if (norm < 0.75) {
          const t = (norm - 0.5) / 0.25;
          return `rgb(${Math.round(200 + t * 55)}, ${Math.round(40 + t * 130)}, ${Math.round(100 - t * 100)})`;
        } else {
          const t = (norm - 0.75) / 0.25;
          return `rgb(255, ${Math.round(170 + t * 85)}, ${Math.round(t * 200)})`;
        }
      } else {
        // Cyan-Emerald heatmap: Deep Blue -> Dark Cyan -> Bright Emerald -> Neon Yellow
        if (norm < 0.3) {
          const t = norm / 0.3;
          return `rgb(${Math.round(10 + t * 10)}, ${Math.round(15 + t * 45)}, ${Math.round(45 + t * 85)})`;
        } else if (norm < 0.6) {
          const t = (norm - 0.3) / 0.3;
          return `rgb(${Math.round(20 + t * 30)}, ${Math.round(60 + t * 150)}, ${Math.round(130 + t * 25)})`;
        } else if (norm < 0.85) {
          const t = (norm - 0.6) / 0.25;
          return `rgb(${Math.round(50 + t * 180)}, ${Math.round(210 + t * 35)}, ${Math.round(155 - t * 100)})`;
        } else {
          const t = (norm - 0.85) / 0.15;
          return `rgb(255, ${Math.round(245 + t * 10)}, ${Math.round(55 + t * 180)})`;
        }
      }
    };

    const cellW = plotWidth / timeFrames;
    const cellH = plotHeight / freqBins;

    // Render 2D matrix cells
    for (let fIdx = 0; fIdx < freqBins; fIdx++) {
      // Y-axis: Frequency increases upwards
      const y = paddingTop + plotHeight - (fIdx + 1) * cellH;
      const row = spectrogram.mag_db[fIdx];
      if (!row) continue;

      for (let tIdx = 0; tIdx < timeFrames; tIdx++) {
        const x = paddingLeft + tIdx * cellW;
        const db = row[tIdx];
        ctx.fillStyle = getColor(db);
        ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
      }
    }

    // Y-axis Frequency Labels & Gridlines
    const fTicks = [0, maxFreq * 0.25, maxFreq * 0.5, maxFreq * 0.75, maxFreq];
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';

    fTicks.forEach((f) => {
      const normF = f / maxFreq;
      const y = paddingTop + (1 - normF) * plotHeight;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      let label = `${Math.round(f)}Hz`;
      if (f >= 1000) label = `${(f / 1000).toFixed(1)}k`;
      ctx.fillText(label, paddingLeft - 6, y + 3.5);
    });

    // X-axis Time Labels
    const tTicks = 5;
    ctx.textAlign = 'center';
    for (let i = 0; i <= tTicks; i++) {
      const t = (i / tTicks) * maxTime;
      const x = paddingLeft + (i / tTicks) * plotWidth;
      ctx.fillText(`${t.toFixed(1)}s`, x, height - 8);
    }
  }, [spectrogram, title, subtitle, colorScheme, height]);

  return (
    <div className={`relative w-full select-none ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded-ios-lg bg-transparent border border-border/50"
      />
    </div>
  );
}
