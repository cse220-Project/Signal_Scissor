import { useRef, useEffect } from 'react';
import { useAudioStore } from '../../store/useAudioStore';

export function StudioAnalysisMetrics() {
  const { analysis, selectedFile } = useAudioStore();

  const formatNumber = (num: number, unit = '') => {
    if (num >= 1000 && unit === 'Hz') return `${(num / 1000).toFixed(1)} kHz`;
    if (Number.isInteger(num)) return `${num}${unit ? ' ' + unit : ''}`;
    return `${num.toFixed(2)}${unit ? ' ' + unit : ''}`;
  };

  const metrics = analysis && selectedFile ? [
    { label: 'Duration', value: formatNumber(analysis.duration, 's') },
    { label: 'Sample Rate', value: formatNumber(analysis.sample_rate, 'Hz') },
    { label: 'Channels', value: analysis.channels === 1 ? 'Mono' : 'Stereo' },
    { label: 'File Size', value: formatNumber(selectedFile.file_size_bytes / 1024, 'KB') },
    { label: 'Peak Amplitude', value: analysis.peak_amplitude.toFixed(2) },
    { label: 'Zero Crossing', value: `${(analysis.zero_crossing_rate * 100).toFixed(1)}%` },
    { label: 'Dominant Freq', value: formatNumber(analysis.dominant_frequency, 'Hz') },
    { label: 'Spectral Centroid', value: formatNumber(analysis.spectral_centroid, 'Hz') },
  ] : [];

  const col1 = metrics.slice(0, 4);
  const col2 = metrics.slice(4, 8);

  return (
    <div className="bg-[#f0ead8] rounded-[24px] px-6 pt-6 pb-7 flex flex-col gap-4 select-none shadow-none">
      <div className="flex items-center justify-between pb-1 border-b border-[rgba(38,33,28,0.08)]">
        <h3 className="text-[17px] font-semibold text-[#26211c] tracking-tight">Audio Analysis</h3>
        <span className="text-[12px] font-medium text-[#57534e]">Computed</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {/* Left Column */}
        <div className="flex flex-col">
          {col1.map((m, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 border-b border-[rgba(38,33,28,0.07)] text-[13px]"
            >
              <span className="text-[#57534e] font-normal">{m.label}</span>
              <span className="text-[#26211c] font-medium">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          {col2.map((m, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 border-b border-[rgba(38,33,28,0.07)] text-[13px]"
            >
              <span className="text-[#57534e] font-normal">{m.label}</span>
              <span className="text-[#26211c] font-medium">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pb-1" />
    </div>
  );
}

export function StudioSpectrogramCard() {
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

    if (!times?.length || !freqs?.length || !mag?.length) return;

    const nTime = times.length;
    const nFreq = freqs.length;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.round(rect.width * dpr);
    const H = Math.round(rect.height * dpr);
    if (W === 0 || H === 0) return;

    canvas.width = W;
    canvas.height = H;

    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;

    const minDb = -80;
    const maxDb = 0;
    const dbRange = maxDb - minDb;

    for (let py = 0; py < H; py++) {
      const fIdx = Math.floor((1 - py / H) * (nFreq - 1));
      const fRow = mag[fIdx] ?? [];

      for (let px = 0; px < W; px++) {
        const tIdx = Math.floor((px / W) * (nTime - 1));
        const dbVal = fRow[tIdx] ?? minDb;
        const norm = Math.max(0, Math.min(1, (dbVal - minDb) / dbRange));

        // Calm monochrome ink density
        const intensity = Math.round(norm * 255);
        const i = (py * W + px) * 4;
        data[i] = 38;
        data[i + 1] = 33;
        data[i + 2] = 28;
        data[i + 3] = intensity;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [spectrogramData]);

  return (
    <div className="bg-[#dce6f0] rounded-[24px] p-6 flex flex-col gap-4 select-none shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-[#26211c] tracking-tight">Spectrogram Matrix</h3>
          <p className="text-[12px] text-[#57534e]">STFT 2D time-frequency heat distribution</p>
        </div>
        <span className="text-[12px] font-medium text-[#57534e]">
          2D STFT
        </span>
      </div>

      <div className="h-[200px] w-full relative flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full rounded-[14px]" />
        {!spectrogramData && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#57534e]">
            No spectrogram generated
          </div>
        )}
      </div>
    </div>
  );
}
