import { useEffect, useRef, useState } from 'react';
import { ComparisonResult, WaveformData, FFTData } from '../../types';
import { getWaveform, getFFT } from '../../api/client';
import Card from '../ui/Card';

interface ComparisonSignalGraphsProps {
  result: ComparisonResult;
  pvProgressPct: number;
  naiveProgressPct: number;
}

function WaveformCanvas({ data, color, progressPct }: { data: WaveformData | null, color: string, progressPct: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw center line (Axes)
    ctx.strokeStyle = 'rgba(38, 33, 28, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!data) return;
    const peaks = Array.isArray(data) ? data : (data.peaks || []);
    if (peaks.length === 0) return;

    ctx.fillStyle = color;
    const step = w / peaks.length;

    for (let i = 0; i < peaks.length; i++) {
      const { min, max } = peaks[i];
      const x = i * step;
      const yMax = (h / 2) - (max * (h / 2.5));
      const yMin = (h / 2) - (min * (h / 2.5));
      const height = Math.max(1, yMin - yMax);

      ctx.fillRect(x, yMax, step > 1 ? step - 0.5 : step, height);
    }
  }, [data, color]);

  return (
    <div className="w-full h-24 bg-surface rounded-ios-lg relative overflow-hidden">
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-tertiary">
          Loading waveform...
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block relative z-0" />
      {progressPct > 0 && progressPct < 100 && (
        <div 
          className="absolute top-0 bottom-0 w-[1.5px] bg-[#e15241] z-10 pointer-events-none transition-all duration-75"
          style={{ left: `${progressPct}%` }}
        />
      )}
    </div>
  );
}

function FFTCanvas({ data, color, progressPct }: { data: FFTData | null, color: string, progressPct: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(38, 33, 28, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    // Baseline
    ctx.moveTo(0, h - 1);
    ctx.lineTo(w, h - 1);
    ctx.stroke();

    if (!data) return;
    const mags = Array.isArray(data) ? data : (data.magnitudes_db || []);
    if (mags.length === 0) return;

    ctx.fillStyle = color;
    const bars = Math.min(128, mags.length);
    const barWidth = Math.max(1, (w / bars) - 1);

    for (let i = 0; i < bars; i++) {
      const step = Math.floor(mags.length / bars);
      const mag = mags[i * step];
      const minDb = -80;
      const norm = Math.max(0, (mag - minDb) / Math.abs(minDb));
      const barHeight = Math.max(1, norm * (h - 8));
      
      const x = i * (w / bars);
      const y = h - barHeight;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [1, 1, 0, 0]);
      ctx.fill();
    }
  }, [data, color]);

  return (
    <div className="w-full h-24 bg-surface rounded-ios-lg relative overflow-hidden">
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-tertiary">
          Loading FFT...
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block relative z-0" />
      {progressPct > 0 && progressPct < 100 && (
        <div 
          className="absolute top-0 bottom-0 w-[1.5px] bg-[#e15241] z-10 pointer-events-none transition-all duration-75"
          style={{ left: `${progressPct}%` }}
        />
      )}
    </div>
  );
}

export default function ComparisonSignalGraphs({ result, pvProgressPct, naiveProgressPct }: ComparisonSignalGraphsProps) {
  const [pvWaveform, setPvWaveform] = useState<WaveformData | null>(null);
  const [naiveWaveform, setNaiveWaveform] = useState<WaveformData | null>(null);
  const [pvFFT, setPvFFT] = useState<FFTData | null>(null);
  const [naiveFFT, setNaiveFFT] = useState<FFTData | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Points count for waveform
    const pts = 800;

    Promise.all([
      getWaveform(result.pv_file.id, pts),
      getWaveform(result.naive_file.id, pts),
      getFFT(result.pv_file.id),
      getFFT(result.naive_file.id)
    ]).then(([pvW, naiveW, pvF, naiveF]) => {
      if (!mounted) return;
      setPvWaveform(pvW.data.data || pvW.data);
      setNaiveWaveform(naiveW.data.data || naiveW.data);
      setPvFFT(pvF.data.data || pvF.data);
      setNaiveFFT(naiveF.data.data || naiveF.data);
    }).catch(err => {
      console.error('Failed to fetch comparison graph data:', err);
    });

    return () => {
      mounted = false;
    };
  }, [result]);

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Card variant="surface" className="flex flex-col gap-4">
        <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight px-1">
          Time Domain (Waveform)
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Phase Vocoder Output</span>
            <WaveformCanvas data={pvWaveform} color="#4a7eb3" progressPct={pvProgressPct} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Naive Resampling Output</span>
            <WaveformCanvas data={naiveWaveform} color="#786c8f" progressPct={naiveProgressPct} />
          </div>
        </div>
      </Card>

      <Card variant="surface" className="flex flex-col gap-4">
        <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight px-1">
          Frequency Domain (FFT Spectrum)
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Phase Vocoder Output</span>
            <FFTCanvas data={pvFFT} color="#4a7eb3" progressPct={pvProgressPct} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-secondary px-1">Naive Resampling Output</span>
            <FFTCanvas data={naiveFFT} color="#786c8f" progressPct={naiveProgressPct} />
          </div>
        </div>
      </Card>
    </div>
  );
}
