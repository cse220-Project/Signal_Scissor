import { useEffect, RefObject } from 'react';
import { WaveformData } from '../types';

interface UseWaveformCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  waveformData: WaveformData | null;
  currentTime: number;
  duration: number;
  selection: { start: number; end: number } | null;
  color?: string;
}

export const useWaveformCanvas = ({
  canvasRef,
  waveformData,
  currentTime,
  duration,
  selection,
  color = '#49645d'
}: UseWaveformCanvasProps) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);

      const peaks: Array<{ min: number; max: number }> = Array.isArray(waveformData)
        ? (waveformData as any)
        : (waveformData?.peaks || []);

      if (!peaks || peaks.length === 0) {
        return;
      }

      const peakCount = peaks.length;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      const step = w / peakCount;

      for (let i = 0; i < peakCount; i++) {
        const x = i * step;
        const y = (1 - peaks[i].max) * (h / 2);
        ctx.lineTo(x, y);
      }

      for (let i = peakCount - 1; i >= 0; i--) {
        const x = i * step;
        const y = (1 - peaks[i].min) * (h / 2);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(0, h / 2);
      ctx.closePath();

      ctx.fillStyle = `${color}99`;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (selection && duration > 0) {
        const startX = (selection.start / duration) * w;
        const endX = (selection.end / duration) * w;
        ctx.fillStyle = '#bae6fd66';
        ctx.fillRect(startX, 0, endX - startX, h);

        ctx.strokeStyle = '#396477';
        ctx.beginPath();
        ctx.moveTo(startX, 0); ctx.lineTo(startX, h);
        ctx.moveTo(endX, 0); ctx.lineTo(endX, h);
        ctx.stroke();
      }

      if (duration > 0) {
        const cursorX = (currentTime / duration) * w;
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    render();
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);

    return () => {
      ro.disconnect();
    };

  }, [canvasRef, waveformData, currentTime, duration, selection, color]);
};
