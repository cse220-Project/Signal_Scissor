import { useAudioStore } from '../../store/useAudioStore';
import Slider from '../ui/Slider';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';

export default function FilterControls() {
  const { filter, setFilter, applyFilterAction, isLoading, signalState } = useAudioStore();
  const nyquist = (signalState?.sample_rate ? signalState.sample_rate / 2 : 4000);
  const nyquistLabel = `0–${nyquist.toLocaleString()} Hz is the meaningful range for this signal (Nyquist limit)`;
  const rangeInverted = filter.enabled && filter.low_freq >= filter.high_freq;
  const bothAboveNyquist = filter.enabled && filter.low_freq > nyquist && filter.high_freq > nyquist;

  const operationOptions = [
    { value: 'cut', label: 'Cut (Bandstop / Notch)' },
    { value: 'keep', label: 'Keep (Bandpass)' },
    { value: 'attenuate', label: 'Attenuate (Dampen)' },
    { value: 'amplify', label: 'Amplify (Boost)' },
  ];

  const setPresetBand = (low: number, high: number, op: 'cut' | 'keep' | 'attenuate' | 'amplify', strength: number = 1.0) => {
    setFilter({
      enabled: true,
      low_freq: low,
      high_freq: Math.min(high, nyquist - 10),
      operation: op,
      strength,
    });
  };

  return (
    <div className="bg-pastel-green rounded-ios-2xl p-5 md:p-6 space-y-4 select-none">
      {/* Header */}
      <div className="panel-heading pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">tune</span>
          <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight">
            Fourier Frequency Filter
          </h3>
        </div>
        <Toggle
          checked={filter.enabled}
          onChange={(val) => setFilter({ enabled: val })}
          label={filter.enabled ? 'Active' : 'Bypassed'}
        />
      </div>

      <p className="text-[12px] text-ink-secondary leading-relaxed">
        Keeps or removes a band of frequencies using a Discrete Fourier Transform (DFT) via{' '}
        <code className="font-mono text-ink-primary">fourier_filter.py</code>: the signal is converted to the frequency domain, the chosen band is modified, then converted back with an Inverse FFT.
      </p>

      {/* Operation selector */}
      <Select
        label="Filtering Mode"
        value={filter.operation}
        options={operationOptions}
        onChange={(val: any) => setFilter({ operation: val })}
        disabled={!filter.enabled}
      />
      <p className="text-[11px] text-ink-tertiary -mt-2.5">
        Cut = silence this band · Keep = silence everything else · Attenuate/Amplify = turn this band down/up.
      </p>

      {/* Frequency sliders */}
      <div className="space-y-3 pt-1">
        <Slider
          label="Low Cutoff Frequency"
          help="The lower edge (in Hz) of the frequency band this filter acts on."
          hint={nyquistLabel}
          value={filter.low_freq}
          min={0}
          max={100000}
          step={10}
          unit="Hz"
          onChange={(val) => setFilter({ low_freq: val })}
          disabled={!filter.enabled}
        />

        <Slider
          label="High Cutoff Frequency"
          help="The upper edge (in Hz) of the frequency band this filter acts on."
          hint={nyquistLabel}
          value={filter.high_freq}
          min={0}
          max={100000}
          step={10}
          unit="Hz"
          onChange={(val) => setFilter({ high_freq: val })}
          disabled={!filter.enabled}
        />

        {filter.enabled && (rangeInverted || bothAboveNyquist) && (
          <p className="flex items-start gap-1.5 text-[11.5px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-ios-md px-2.5 py-2 -mt-1">
            <span className="material-symbols-outlined text-[15px] leading-none mt-px">warning</span>
            {rangeInverted
              ? 'Low Cutoff should be less than High Cutoff for this band to make sense.'
              : `Both cutoffs are above this signal's Nyquist limit (${nyquist.toLocaleString()} Hz) — the filter won't change anything audible.`}
          </p>
        )}

        {(filter.operation === 'attenuate' || filter.operation === 'amplify') && (
          <Slider
            label="Filter Strength Factor"
            help="How much to turn the band down (below 1×) or up (above 1×)."
            value={filter.strength ?? (filter.operation === 'attenuate' ? 0.3 : 1.8)}
            min={0.05}
            max={4.0}
            step={0.05}
            unit="×"
            onChange={(val) => setFilter({ strength: val })}
            disabled={!filter.enabled}
          />
        )}
      </div>

      {/* Quick Presets */}
      <div className="pt-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary block mb-2">
          Frequency Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPresetBand(300, 3400, 'keep')}
            className="text-[12px] px-2.5 py-1 rounded-pill bg-pastel-blue text-ink-primary hover:bg-pastel-blue/80 transition-colors"
          >
            Telephone (300–3.4k)
          </button>
          <button
            onClick={() => setPresetBand(55, 65, 'cut')}
            className="text-[12px] px-2.5 py-1 rounded-pill bg-pastel-peach text-ink-primary hover:bg-pastel-peach/80 transition-colors"
          >
            60 Hz Hum Notch
          </button>
          <button
            onClick={() => setPresetBand(2000, 4000, 'amplify', 2.2)}
            className="text-[12px] px-2.5 py-1 rounded-pill bg-pastel-lavender text-ink-primary hover:bg-pastel-lavender/80 transition-colors"
          >
            Hearing Aid (2k–4k)
          </button>
          <button
            onClick={() => setPresetBand(0, 80, 'cut')}
            className="text-[12px] px-2.5 py-1 rounded-pill bg-pastel-cream text-ink-primary hover:bg-pastel-cream/80 transition-colors"
          >
            Rumble Cut (&lt;80Hz)
          </button>
        </div>
      </div>

      {/* Apply Options: Original vs Processed */}
      <div className="pt-2 space-y-2 border-t border-hairline/60">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary block">
          Target Audio
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="md"
            icon="graphic_eq"
            loading={isLoading}
            disabled={!filter.enabled}
            onClick={() => applyFilterAction('original')}
            className="text-[12px]"
          >
            Apply to Original
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="auto_fix_high"
            loading={isLoading}
            disabled={!filter.enabled}
            onClick={() => applyFilterAction('processed')}
            className="text-[12px]"
          >
            Apply to Processed
          </Button>
        </div>
      </div>
    </div>
  );
}
