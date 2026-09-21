import { useAudioStore } from '../../store/useAudioStore';
import Slider from '../ui/Slider';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';

export default function EffectsControls() {
  const {
    effects,
    setEffects,
    applyEffectsAction,
    setShowImpulseModal,
    isLoading,
  } = useAudioStore();

  return (
    <div className="bg-pastel-peach rounded-ios-2xl p-5 md:p-6 space-y-4 select-none">
      {/* Header */}
      <div className="panel-heading pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">equalizer</span>
          <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight">
            Acoustic & LTI Convolution Effects
          </h3>
        </div>
      </div>

      <p className="text-[12px] text-ink-secondary leading-relaxed">
        Time-domain operations and linear time-invariant system convolution via{' '}
        <code className="font-mono text-ink-primary">audio_effects.py</code>: amplitude scaling, delay, SSB frequency translation, and multi-tap echo convolution.
      </p>

      {/* Time-Domain Sliders */}
      <div className="space-y-3 pt-1">
        <Slider
          label="Amplitude Gain (Volume Scaling)"
          value={effects.gain}
          min={0.1}
          max={2.5}
          step={0.05}
          unit="×"
          onChange={(val) => setEffects({ gain: val })}
        />

        <Slider
          label="Discrete Time Delay (Shifting)"
          value={effects.delay_ms}
          min={0}
          max={600}
          step={10}
          unit="ms"
          onChange={(val) => setEffects({ delay_ms: val })}
        />

        <Slider
          label="Frequency Shift (Hilbert SSB)"
          value={effects.shift_hz}
          min={-150}
          max={150}
          step={5}
          unit="Hz"
          onChange={(val) => setEffects({ shift_hz: val })}
        />
      </div>

      {/* Convolution Echo Section */}
      <div className="pt-2 border-t border-hairline space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-ink-primary">graphic_eq</span>
            <span className="text-[14px] font-medium text-ink-primary">Convolution Echo</span>
          </div>
          <Toggle
            checked={effects.echo_enabled}
            onChange={(val) => setEffects({ echo_enabled: val })}
            label={effects.echo_enabled ? 'Enabled' : 'Disabled'}
          />
        </div>

        {effects.echo_enabled && (
          <div className="space-y-3 pt-1">
            <Slider
              label="Reflection Delay Spacing (n₀)"
              value={effects.echo_delay_ms}
              min={20}
              max={600}
              step={10}
              unit="ms"
              onChange={(val) => setEffects({ echo_delay_ms: val })}
            />

            <Slider
              label="Decay Factor (Feedback α)"
              value={effects.echo_feedback}
              min={10}
              max={85}
              step={5}
              unit="%"
              onChange={(val) => setEffects({ echo_feedback: val })}
            />

            <Slider
              label="Number of Echo Taps"
              value={effects.echo_taps}
              min={1}
              max={6}
              step={1}
              unit="taps"
              onChange={(val) => setEffects({ echo_taps: val })}
            />

            <Slider
              label="Wet / Dry Reflection Mix"
              value={effects.echo_mix}
              min={10}
              max={100}
              step={5}
              unit="%"
              onChange={(val) => setEffects({ echo_mix: val })}
            />

            <div className="pt-1">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                icon="candlestick_chart"
                onClick={() => setShowImpulseModal(true)}
              >
                Inspect Impulse Response h[n]
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Apply Effects Action */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={isLoading}
          onClick={applyEffectsAction}
        >
          Apply Acoustic Effects
        </Button>
      </div>
    </div>
  );
}
