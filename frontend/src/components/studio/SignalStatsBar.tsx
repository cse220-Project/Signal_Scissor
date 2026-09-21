import { SignalStats } from '../../types';

interface SignalStatsBarProps {
  stats?: SignalStats;
  sourceName?: string;
  sampleRate?: number;
  duration?: number;
}

export default function SignalStatsBar({
  stats,
  sourceName = 'Signal',
  sampleRate = 8000,
  duration = 2.0,
}: SignalStatsBarProps) {
  const items = [
    { label: 'Source', value: sourceName },
    { label: 'Sampling Rate', value: `${sampleRate} Hz` },
    { label: 'Nyquist Limit', value: `${sampleRate / 2} Hz` },
    { label: 'Duration', value: `${duration.toFixed(2)} s` },
    { label: 'Samples (N)', value: `${stats?.samples || Math.round(sampleRate * duration)}` },
    { label: 'RMS Level', value: stats?.rms !== undefined ? `${stats.rms.toFixed(4)}` : '—' },
    { label: 'Peak Amplitude', value: stats?.peak !== undefined ? `${stats.peak.toFixed(4)}` : '—' },
    {
      label: 'Dominant Peak',
      value: stats?.dominant_freq !== undefined && stats.dominant_freq > 0
        ? `${Math.round(stats.dominant_freq)} Hz`
        : '—',
    },
  ];

  return (
    <div className="bg-pastel-cream rounded-ios-2xl p-5 md:p-6 select-none">
      <div className="panel-heading pb-3 border-b border-hairline mb-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-ink-primary">analytics</span>
          <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
            Signal Metrics & Analysis
          </span>
        </div>
        <span className="text-[11px] text-ink-secondary">CSE 220</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 border-b border-hairline py-2 text-[12px]">
            <span className="text-ink-secondary">{item.label}</span>
            <span className="font-mono text-ink-primary font-medium text-right break-words">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
