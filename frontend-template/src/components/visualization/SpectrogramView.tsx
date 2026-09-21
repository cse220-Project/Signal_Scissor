import { useRef, useEffect } from 'react';
import { useAudioStore } from '../../store/useAudioStore';

/**
 * SpectrogramView — renders the server-computed STFT spectrogram as a heatmap
 * using ImageData for efficient rendering. Color maps log-magnitude → green tones.
 */
export default function SpectrogramView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spectrogramData } = useAudioStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spectrogramData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const times = spectrogramData.times;
    const freqs = spectrogramData.frequencies;
    const mag = spectrogramData.magnitude_db;

    if (!times.length || !freqs.length || !mag.length) return;

    const nTime = times.length;
    const nFreq = freqs.length;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.round(rect.width * dpr);
    const H = Math.round(rect.height * dpr);
    canvas.width = W;
    canvas.height = H;

    // Build ImageData: x = time, y = frequency (inverted so low freq is bottom)
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;

    const minDb = -80;
    const maxDb = 0;
    const dbRange = maxDb - minDb;

    for (let py = 0; py < H; py++) {
      // Map pixel y → frequency bin (bottom = low freq)
      const fIdx = Math.floor((1 - py / H) * (nFreq - 1));
      const fRow = mag[fIdx] ?? [];

      for (let px = 0; px < W; px++) {
        const tIdx = Math.floor((px / W) * (nTime - 1));
        const dbVal = fRow[tIdx] ?? minDb;
        const norm = Math.max(0, Math.min(1, (dbVal - minDb) / dbRange));

        // Color: dark background → sage green → light yellow
        // r: 0→200, g: 20→220, b: 20→80
        const r = Math.round(norm * 200);
        const g = Math.round(20 + norm * 200);
        const b = Math.round(20 + norm * 60);

        const i = (py * W + px) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Frequency axis labels
    ctx.scale(dpr, dpr);
    const h = rect.height;
    ctx.font = `bold ${Math.round(10 * dpr)}px Manrope, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const labelFreqs = [1000, 4000, 8000, 16000].filter(f => f <= freqs[freqs.length - 1]);
    labelFreqs.forEach(f => {
      const normF = f / freqs[freqs.length - 1];
      const y = h * (1 - normF);
      ctx.fillText(`${f >= 1000 ? (f / 1000).toFixed(0) + 'k' : f}Hz`, 4, y - 2);
    });
  }, [spectrogramData]);

  return (
    <div className="w-full h-64 bg-transparent rounded-ios-2xl overflow-hidden p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[12px] font-semibold text-ink-secondary">SPECTROGRAM (STFT)</h4>
        {spectrogramData && (
          <span className="text-[10px] text-ink-tertiary">
            {spectrogramData.times.length} frames × {spectrogramData.frequencies.length} bins
          </span>
        )}
      </div>
      <div className="flex-1 relative rounded-ios-lg overflow-hidden bg-black/5">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {!spectrogramData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-tertiary gap-1.5">
            <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
            <p className="text-[12px]">Load audio to compute STFT spectrogram</p>
          </div>
        )}
      </div>
    </div>
  );
}
