import { useRef, useEffect } from 'react';
import { useAnalyserNode } from '../../hooks/useAudioEngine';
import { useWaveformCanvas } from '../../hooks/useWaveformCanvas';
import { useAudioStore } from '../../store/useAudioStore';

export function StudioWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { waveformData, currentTime, duration } = useAudioStore();

  useWaveformCanvas({
    canvasRef,
    waveformData,
    currentTime,
    duration,
    selection: null,
    color: '#26211c',
  });

  return (
    <div className="bg-[#f0ead8] rounded-[24px] p-5 flex flex-col justify-between h-[180px] shadow-none select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-[#26211c] tracking-tight">Waveform</h3>
        <span className="text-[12px] font-medium text-[#57534e]">
          Overview
        </span>
      </div>
      <div className="w-full h-[105px] relative mt-1">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}

export function StudioLiveSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying } = useAudioStore();
  const analyserNode = useAnalyserNode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let buffer: Uint8Array | null = null;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      if (isPlaying && analyserNode) {
        if (!buffer || buffer.length !== analyserNode.fftSize) {
          buffer = new Uint8Array(analyserNode.fftSize);
        }
        analyserNode.getByteTimeDomainData(buffer as any);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#26211c';
        ctx.beginPath();

        const sliceWidth = w / buffer.length;
        let x = 0;

        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(38,33,28,0.2)';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isPlaying, analyserNode]);

  return (
    <div className="bg-[#dce6f0] rounded-[24px] p-5 flex flex-col justify-between h-[180px] shadow-none select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-[#26211c] tracking-tight">Live Oscilloscope</h3>
        <span className="text-[12px] font-medium text-[#57534e]">
          Real-time
        </span>
      </div>
      <div className="w-full h-[105px] relative mt-1">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}

export function StudioLiveSpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, fftData } = useAudioStore();
  const analyserNode = useAnalyserNode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      const bars = 48;
      const barW = Math.max(2, (w / bars) - 2);

      if (isPlaying && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray as any);
        for (let i = 0; i < bars; i++) {
          const idx = Math.min(bufferLength - 1, Math.floor(Math.pow(i / bars, 1.8) * (bufferLength * 0.7)));
          const norm = dataArray[idx] / 255;
          const barH = Math.max(2, norm * (h - 6));
          const x = i * (barW + 2);
          const y = h - barH;

          ctx.fillStyle = '#26211c';
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
      } else if (fftData && fftData.magnitudes_db?.length) {
        const mags = fftData.magnitudes_db;
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor(i * (mags.length / bars));
          const norm = Math.max(0, (mags[idx] + 80) / 80);
          const barH = Math.max(2, norm * (h - 6));
          const x = i * (barW + 2);
          const y = h - barH;

          ctx.fillStyle = '#26211c';
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [1.5, 1.5, 0, 0]);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = 'rgba(38,33,28,0.15)';
        ctx.fillRect(0, h - 2, w, 2);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isPlaying, analyserNode, fftData]);

  return (
    <div className="bg-[#e5e3e8] rounded-[24px] p-5 flex flex-col justify-between h-[180px] shadow-none select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-[#26211c] tracking-tight">Spectrum (FFT)</h3>
        <span className="text-[12px] font-medium text-[#57534e]">
          Frequency
        </span>
      </div>
      <div className="w-full h-[105px] relative mt-1">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
