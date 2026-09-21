import { useAudioStore } from '../../store/useAudioStore';
import Slider from '../ui/Slider';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';

export default function FilterControls() {
  const { filter, setFilter, applyFilterAction, isLoading, signalState } = useAudioStore();
  const nyquist = (signalState?.sample_rate ? signalState.sample_rate / 2 : 4000);

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
        Discrete Fourier Transform (DFT) band filtering via{' '}
        <code className="font-mono text-ink-primary">fourier_filter.py</code>. Modifies spectral bins in frequency domain before Inverse FFT synthesis.
      </p>

      {/* Operation selector */}
      <Select
        label="Filtering Mode"
        value={filter.operation}
        options={operationOptions}
        onChange={(val: any) => setFilter({ operation: val })}
        disabled={!filter.enabled}
      />

      {/* Frequency sliders */}
      <div className="space-y-3 pt-1">
        <Slider
          label="Low Cutoff Frequency"
          value={filter.low_freq}
          min={0}
          max={Math.max(100, filter.high_freq - 20)}
          step={10}
          unit="Hz"
          onChange={(val) => setFilter({ low_freq: val })}
          disabled={!filter.enabled}
        />

        <Slider
          label="High Cutoff Frequency"
          value={filter.high_freq}
          min={filter.low_freq + 20}
          max={nyquist}
          step={10}
          unit="Hz"
          onChange={(val) => setFilter({ high_freq: val })}
          disabled={!filter.enabled}
        />

        {(filter.operation === 'attenuate' || filter.operation === 'amplify') && (
          <Slider
            label="Filter Strength Factor"
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

      {/* Apply Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={isLoading}
          disabled={!filter.enabled}
          onClick={applyFilterAction}
        >
          Apply Fourier Filter
        </Button>
      </div>
    </div>
  );
}
