import { useEffect, useRef, MouseEvent } from 'react';
import { WaveformPayload } from '../../types';

interface WaveformCanvasProps {
  originalWaveform?: WaveformPayload;
  processedWaveform?: WaveformPayload;
  duration: number;
  currentTime: number;
  activeTrack: 'original' | 'processed';
  height?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export default function WaveformCanvas({
  originalWaveform,
  processedWaveform,
  duration,
  currentTime,
  activeTrack,
  height = 140,
  onSeek,
  className = '',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const centerY = height / 2;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw center zero line
    ctx.strokeStyle = 'rgba(31, 35, 40, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Time grid ticks
    const numTicks = 6;
    ctx.fillStyle = '#626975';
    ctx.font = '10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= numTicks; i++) {
      const x = (i / numTicks) * width;
      const t = (i / numTicks) * duration;
      ctx.fillRect(x, height - 8, 1, 4);
      if (i > 0 && i < numTicks) {
        ctx.fillText(`${t.toFixed(1)}s`, x, height - 12);
      }
    }

    // Helper to draw downsampled envelope
    const drawEnvelope = (peaks: number[], strokeStyle: string, fillStyle: string, alpha: number) => {
      if (!peaks || peaks.length < 2) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1;

      const numBuckets = Math.floor(peaks.length / 2);
      const stepX = width / numBuckets;

      // Draw top line
      ctx.beginPath();
      for (let i = 0; i < numBuckets; i++) {
        const maxVal = Math.max(-1, Math.min(1, peaks[i * 2 + 1]));
        const x = i * stepX;
        const y = centerY - maxVal * (centerY * 0.88);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Draw bottom line in reverse
      for (let i = numBuckets - 1; i >= 0; i--) {
        const minVal = Math.max(-1, Math.min(1, peaks[i * 2]));
        const x = i * stepX;
        const y = centerY - minVal * (centerY * 0.88);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    // 1. Draw Original Waveform (Ghost / Reference layer)
    if (originalWaveform?.peaks && originalWaveform.peaks.length > 0) {
      const isOrigActive = activeTrack === 'original';
      drawEnvelope(
        originalWaveform.peaks,
        isOrigActive ? '#1f2328' : '#626975',
        isOrigActive ? 'rgba(31, 35, 40, 0.18)' : 'rgba(140, 149, 159, 0.12)',
        isOrigActive ? 0.9 : 0.4
      );
    }

    // 2. Draw Processed Waveform (Main layer)
    if (processedWaveform?.peaks && processedWaveform.peaks.length > 0) {
      const isProcActive = activeTrack === 'processed';
      drawEnvelope(
        processedWaveform.peaks,
        isProcActive ? '#1F2A44' : '#59636e',
        isProcActive ? 'rgba(38, 33, 28, 0.28)' : 'rgba(89, 99, 110, 0.15)',
        isProcActive ? 1.0 : 0.5
      );
    }

    // 3. Draw Playback Head
    if (duration > 0) {
      const playX = Math.max(0, Math.min(width, (currentTime / duration) * width));

      ctx.save();
      // Playhead vertical line
      ctx.strokeStyle = '#1f2328';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();

      // Playhead handle
      ctx.fillStyle = '#1f2328';
      ctx.beginPath();
      ctx.arc(playX, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [originalWaveform, processedWaveform, duration, currentTime, activeTrack, height]);

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || duration <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className={`relative w-full overflow-hidden select-none cursor-pointer ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded-ios-lg bg-transparent"
      />
    </div>
  );
}
