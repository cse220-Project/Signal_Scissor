import { useRef, useEffect } from 'react';
import { useAnalyserNode } from '../../hooks/useAudioEngine';
import { useAudioStore } from '../../store/useAudioStore';

interface SpectrumAnalyzerProps {
  previewSignal?: {
    type: string;
    frequency: number;
    amplitude: number;
    duration: number;
  } | null;
}

const BAR_COLOR = '#26211c';
const PEAK_COLOR = 'rgba(38, 33, 28, 0.2)';
const GRID_COLOR = 'rgba(38, 33, 28, 0.05)';

export default function SpectrumAnalyzer({ previewSignal }: SpectrumAnalyzerProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserNode = useAnalyserNode();
  const { isPlaying, fftData } = useAudioStore();

  const previewRef = useRef(previewSignal);
  previewRef.current = previewSignal;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    const drawGrid = (w: number, h: number) => {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      for (let i = 1; i <= 4; i++) {
        const x = (w / 5) * i;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();
    };

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);

      const preview = previewRef.current;
      const playing = isPlayingRef.current;

      // 1. If playing audio, read real-time frequency data from AnalyserNode
      if (playing && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray);

        const bars = 64;
        const barWidth = Math.max(2, (w / bars) - 1.5);

        for (let i = 0; i < bars; i++) {
          const binIndex = Math.min(
            bufferLength - 1,
            Math.floor(Math.pow(i / bars, 2) * (bufferLength * 0.75))
          );
          const val = dataArray[binIndex] / 255;
          const barHeight = Math.max(2, val * (h - 8));
          const x = i * (barWidth + 1.5);
          const y = h - barHeight;

          ctx.fillStyle = BAR_COLOR;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
        return;
      }

      // 2. If adjusting generator sliders, synthesize accurate real-time Fourier harmonics
      if (preview) {
        const bars = 64;
        const barWidth = Math.max(2, (w / bars) - 1.5);
        const { type, frequency, amplitude } = preview;
        const maxFreq = 4000;

        for (let i = 0; i < bars; i++) {
          const binFreq = (i / bars) * maxFreq;
          let mag = 0;

          if (type === 'white_noise') {
            mag = amplitude * (0.35 + Math.random() * 0.15);
          } else if (type === 'impulse') {
            mag = amplitude * 0.5;
          } else {
            const harmonics = 16;
            for (let n = 1; n <= harmonics; n++) {
              let harmAmp = 0;
              if (type === 'sine' && n === 1) {
                harmAmp = 1;
              } else if (type === 'square' && n % 2 === 1) {
                harmAmp = 1 / n;
              } else if (type === 'sawtooth') {
                harmAmp = 1 / n;
              } else if (type === 'triangle' && n % 2 === 1) {
                harmAmp = 1 / (n * n);
              } else if (type === 'chirp') {
                harmAmp = 1 / Math.sqrt(n);
              }

              if (harmAmp > 0) {
                const targetFreq = frequency * n;
                const delta = Math.abs(binFreq - targetFreq);
                const bandwidth = 45;
                if (delta < bandwidth * 2.5) {
                  mag += harmAmp * Math.exp(-0.5 * Math.pow(delta / bandwidth, 2));
                }
              }
            }
            mag = Math.min(1, mag * amplitude);
          }

          const barHeight = Math.max(1.5, mag * (h - 10));
          const x = i * (barWidth + 1.5);
          const y = h - barHeight;

          ctx.fillStyle = BAR_COLOR;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
        return;
      }

      // 3. Fallback: if static file FFT data exists from store
      if (fftData && fftData.magnitudes_db?.length) {
        const mags = fftData.magnitudes_db;
        const bars = Math.min(64, mags.length);
        const barWidth = Math.max(2, (w / bars) - 1.5);

        for (let i = 0; i < bars; i++) {
          const step = Math.floor(mags.length / bars);
          const mag = mags[i * step];
          const minDb = -80;
          const norm = Math.max(0, (mag - minDb) / Math.abs(minDb));
          const barHeight = Math.max(2, norm * (h - 10));
          const x = i * (barWidth + 1.5);
          const y = h - barHeight;

          ctx.fillStyle = BAR_COLOR;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
        return;
      }

      ctx.fillStyle = PEAK_COLOR;
      ctx.fillRect(0, h - 1, w, 1);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
    };
  }, [analyserNode, fftData]);

  return (
    <div className="w-full h-44 bg-surface rounded-ios-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-semibold text-ink-secondary">LIVE FFT SPECTRUM</h4>
        <span className="text-[10px] text-ink-tertiary">Frequency Domain</span>
      </div>
      <div className="flex-1 bg-surface overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full bg-surface" />
      </div>
    </div>
  );
}

