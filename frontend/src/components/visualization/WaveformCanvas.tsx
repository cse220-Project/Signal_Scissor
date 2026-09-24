import { useEffect, useRef, MouseEvent } from 'react';
import { WaveformPayload } from '../../types';

interface WaveformCanvasProps {
  originalWaveform?: WaveformPayload;
  processedWaveform?: WaveformPayload;
  duration: number;
  currentTime: number;
  activeTrack?: 'original' | 'processed';
  height?: number;
  onSeek?: (time: number) => void;
  className?: string;
  showOriginal?: boolean;
  showProcessed?: boolean;
  customOrigColor?: string;
  customProcColor?: string;
  showPlayhead?: boolean;
}

export default function WaveformCanvas({
  originalWaveform,
  processedWaveform,
  duration,
  currentTime,
  activeTrack = 'processed',
  height = 140,
  onSeek,
  className = '',
  showOriginal = true,
  showProcessed = true,
  customOrigColor,
  customProcColor,
  showPlayhead = true,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const centerY = height / 2;
    // Long recordings are delivered with a short, frequency-aware preview.
    // Use it for drawing so a pure sine does not collapse into a solid block.
    const preferredWaveform = activeTrack === 'original' ? originalWaveform : processedWaveform;
    const previewDuration = preferredWaveform?.preview?.duration || 0;
    const previewStart = preferredWaveform?.preview?.start_time || 0;
    const displayDuration = previewDuration || duration;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Grid and zero-line
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const zeroLineColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)';
    const tickTextColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';

    // Center zero line
    ctx.strokeStyle = zeroLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Time grid ticks
    // Keep long recordings legible without overcrowding the time axis.
    const numTicks = Math.min(8, Math.max(4, Math.ceil((displayDuration || 2) / 10)));
    ctx.fillStyle = tickTextColor;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= numTicks; i++) {
      const x = (i / numTicks) * width;
      const t = previewStart + (i / numTicks) * (displayDuration || 2.0);
      ctx.fillRect(x, height - 8, 1, 4);
      if (i > 0 && i < numTicks) {
        const label = t < 0.001 ? `${(t * 1e6).toFixed(0)}µs`
          : t < 1 ? `${(t * 1e3).toFixed(1)}ms`
          : t >= 60 ? `${(t / 60).toFixed(1)}m` : `${t.toFixed(1)}s`;
        ctx.fillText(label, x, height - 12);
      }
    }

    // Helper to draw downsampled envelope with optional gradient/fill
    const drawEnvelope = (
      peaks: number[],
      strokeColor: string,
      fillColor: string,
      lineWidth: number = 1.5,
      alpha: number = 1.0,
      glow: boolean = false
    ) => {
      if (!peaks || peaks.length < 2) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      if (glow) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = isDark ? 6 : 3;
      }

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

    // Color tokens:
    // Track A (Original): Electric Cyan / Sky Blue
    const origStroke = customOrigColor || (isDark ? '#38bdf8' : '#0284c7');
    const origFill = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(2, 132, 199, 0.14)';

    // Track B (Processed): Vibrant Emerald / Mint
    const procStroke = customProcColor || (isDark ? '#34d399' : '#059669');
    const procFill = isDark ? 'rgba(52, 211, 153, 0.26)' : 'rgba(5, 150, 105, 0.18)';

    // 1. Draw Original Waveform (Track A)
    if (showOriginal && originalWaveform?.peaks && originalWaveform.peaks.length > 0) {
      const isOrigActive = activeTrack === 'original';
      drawEnvelope(
        originalWaveform.preview?.peaks || originalWaveform.peaks,
        origStroke,
        origFill,
        isOrigActive ? 1.75 : 1.0,
        isOrigActive ? 1.0 : (showProcessed ? 0.45 : 0.85),
        isOrigActive
      );
    }

    // 2. Draw Processed Waveform (Track B)
    if (showProcessed && processedWaveform?.peaks && processedWaveform.peaks.length > 0) {
      const isProcActive = activeTrack === 'processed';
      drawEnvelope(
        processedWaveform.preview?.peaks || processedWaveform.peaks,
        procStroke,
        procFill,
        isProcActive ? 1.75 : 1.0,
        isProcActive ? 1.0 : 0.5,
        isProcActive
      );
    }

    // 3. Draw Playback Head
    // The preview is anchored at the start of the signal, so a full-recording
    // playhead would be misleading once playback has moved beyond it.
    if (showPlayhead && duration > 0 && !previewDuration) {
      const playX = Math.max(0, Math.min(width, (currentTime / duration) * width));
      const playheadColor = isDark ? '#fbbf24' : '#d97706';

      ctx.save();
      // Glow on playhead
      ctx.shadowColor = playheadColor;
      ctx.shadowBlur = 4;

      // Playhead vertical line
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();

      // Playhead handle
      ctx.fillStyle = playheadColor;
      ctx.beginPath();
      ctx.arc(playX, 6, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner white dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playX, 6, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }, [
    originalWaveform,
    processedWaveform,
    duration,
    currentTime,
    activeTrack,
    height,
    showOriginal,
    showProcessed,
    customOrigColor,
    customProcColor,
    showPlayhead,
  ]);

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
