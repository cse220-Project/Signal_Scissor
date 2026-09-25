import { useAudioStore } from '../../store/useAudioStore';
import { FilterParams, EffectsParams } from '../../types';

/** One-line summary of what filter/effects are currently active, in plain English. */
function describeActiveProcessing(filter: FilterParams, effects: EffectsParams): string {
  const parts: string[] = [];

  if (filter.enabled) {
    const opLabel = filter.operation === 'cut' ? 'Cut' : filter.operation === 'keep' ? 'Keep' : filter.operation === 'attenuate' ? 'Attenuate' : 'Amplify';
    parts.push(`Filter: ${opLabel} ${filter.low_freq}–${filter.high_freq} Hz`);
  }

  if (effects.voice_effect) {
    parts.push(`Voice: ${effects.voice_effect}`);
  }
  if (effects.gain !== 1) {
    parts.push(`Gain: ${effects.gain}×`);
  }
  if (effects.delay_ms > 0) {
    parts.push(`Delay: ${effects.delay_ms}ms`);
  }
  if (effects.shift_hz !== 0) {
    parts.push(`Shift: ${effects.shift_hz > 0 ? '+' : ''}${effects.shift_hz}Hz`);
  }
  if (effects.echo_enabled) {
    parts.push(`Echo: ${effects.echo_taps} taps`);
  }

  return parts.length ? parts.join(' · ') : 'No processing applied — showing the original signal';
}

interface SignalStatusBarProps {
  className?: string;
}

/** Compact "what's loaded / what's applied" strip, reused across pages so it's shown consistently instead of duplicated ad hoc. */
export default function SignalStatusBar({ className = '' }: SignalStatusBarProps) {
  const { signalState, duration, filter, effects } = useAudioStore();

  const sourceName = signalState?.source_name || 'No signal loaded';
  const sampleRate = signalState?.sample_rate || 8000;
  const dur = signalState?.duration || duration;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-ios-lg border border-hairline bg-surface-raised/60 px-3.5 py-2 text-[12px] ${className}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="material-symbols-outlined text-[15px] text-ink-tertiary shrink-0">graphic_eq</span>
        <span className="font-medium text-ink-primary truncate">{sourceName}</span>
        <span className="text-ink-tertiary font-mono shrink-0">
          {sampleRate.toLocaleString()} Hz · {dur.toFixed(2)}s
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-ink-secondary min-w-0">
        <span className="material-symbols-outlined text-[15px] text-ink-tertiary shrink-0">tune</span>
        <span className="truncate">{describeActiveProcessing(filter, effects)}</span>
      </div>
    </div>
  );
}
