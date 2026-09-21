import { useRef, useEffect, useState } from 'react';
import Slider from '../../ui/Slider';
import Badge from '../../ui/Badge';

export default function SamplingSimulation() {
  const [signalFreq, setSignalFreq] = useState(5);
  const [samplingFreq, setSamplingFreq] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const nyquist = samplingFreq / 2;
  const isAliased = signalFreq > nyquist;
  const aliasFreq = Math.abs(signalFreq - Math.round(signalFreq / samplingFreq) * samplingFreq);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = 'rgba(73,100,93,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();

    const timeEnd = 1.0;
    const drawSignal = (freq: number, color: string, lineWidth = 2, isDashed = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      if (isDashed) ctx.setLineDash([6, 4]);
      else ctx.setLineDash([]);
      for (let x = 0; x < width; x++) {
        const t = (x / width) * timeEnd;
        const y = height / 2 - Math.cos(2 * Math.PI * freq * t) * (height / 2.5);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Original signal (semi-transparent)
    drawSignal(signalFreq, 'rgba(73,100,93,0.5)', 2);

    // Alias signal shown when aliasing
    if (isAliased) drawSignal(aliasFreq, 'rgba(186,26,26,0.7)', 2, true);

    // Sample dots
    ctx.fillStyle = '#49645d';
    const numSamples = Math.floor(timeEnd * samplingFreq);
    for (let i = 0; i <= numSamples; i++) {
      const t = i / samplingFreq;
      const x = (t / timeEnd) * width;
      const y = height / 2 - Math.cos(2 * Math.PI * signalFreq * t) * (height / 2.5);
      if (x <= width) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [signalFreq, samplingFreq, isAliased, aliasFreq, isVisible]);

  return (
    <div ref={containerRef} className="rounded-3xl bg-surface-container-lowest shadow-card p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Slider
          label={`Signal Frequency: ${signalFreq} Hz`}
          value={signalFreq} min={1} max={20} step={1}
          onChange={setSignalFreq}
          formatValue={(v) => `${v} Hz`}
        />
        <Slider
          label={`Sampling Frequency: ${samplingFreq} Hz`}
          value={samplingFreq} min={5} max={100} step={1}
          onChange={setSamplingFreq}
          formatValue={(v) => `${v} Hz`}
        />
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-4 text-body-sm">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant">Nyquist:</span>
          <span className="font-bold text-on-surface">{nyquist} Hz</span>
        </div>
        <Badge variant={isAliased ? 'warning' : 'success'}>
          {isAliased
            ? `⚠ Aliasing — appears as ${aliasFreq.toFixed(1)} Hz`
            : '✓ Nyquist condition satisfied'}
        </Badge>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-label-caps">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-primary opacity-50 rounded" />
          Original signal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-full bg-primary" />
          Samples
        </span>
        {isAliased && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-error rounded" style={{ borderTop: '2px dashed' }} />
            Alias frequency
          </span>
        )}
      </div>

      <canvas ref={canvasRef} width={900} height={200} className="w-full rounded-2xl bg-surface-container" />
    </div>
  );
}
