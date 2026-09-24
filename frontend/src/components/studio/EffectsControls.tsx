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
        Time-domain operations and linear time-invariant (LTI) system convolution via{' '}
        <code className="font-mono text-ink-primary">audio_effects.py</code>: amplitude scaling, delay, SSB frequency translation, and multi-tap echo convolution.
      </p>

      {/* Voice Transformation Effects */}
      <div className="pt-2 border-t border-hairline space-y-2">
        <label className="text-[13px] font-medium text-ink-primary block">
          Voice Transformation Effect
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'none', label: 'Off / Normal', icon: 'mic_none' },
            { id: 'autotune', label: 'Auto-Tune', icon: 'music_note' },
            { id: 'robotic', label: 'Robotic', icon: 'smart_toy' },
            { id: 'baby', label: 'Baby / Chipmunk', icon: 'child_care' },
            { id: 'monster', label: 'Deep Monster', icon: 'sentiment_very_dissatisfied' },
          ].map((item) => {
            const isSelected = (effects.voice_effect || 'none') === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setEffects({ voice_effect: item.id === 'none' ? null : item.id })}
                className={`flex items-center gap-1.5 p-2 rounded-ios-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'bg-surface text-ink-secondary border-hairline hover:bg-surface-raised'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time-Domain Sliders */}
      <div className="space-y-3 pt-1">
        <Slider
          label="Amplitude Gain (Volume Scaling)"
          help="Multiplies the signal's amplitude. 1× = unchanged, below 1× = quieter, above 1× = louder."
          value={effects.gain}
          min={0.1}
          max={2.5}
          step={0.05}
          unit="×"
          onChange={(val) => setEffects({ gain: val })}
        />

        <Slider
          label="Discrete Time Delay (Shifting)"
          help="Shifts the whole signal later in time by this many milliseconds."
          value={effects.delay_ms}
          min={0}
          max={600}
          step={10}
          unit="ms"
          onChange={(val) => setEffects({ delay_ms: val })}
        />

        <Slider
          label="Frequency Shift (Hilbert SSB)"
          help="Single-sideband modulation: moves every frequency component up by this amount using a Hilbert transform, instead of just pitching the whole signal up/down."
          value={effects.shift_hz}
          min={0}
          max={100000}
          step={10}
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
              help="Time gap between each echo repeat, like the delay between a shout and hearing it bounce back."
              value={effects.echo_delay_ms}
              min={20}
              max={600}
              step={10}
              unit="ms"
              onChange={(val) => setEffects({ echo_delay_ms: val })}
            />

            <Slider
              label="Decay Factor (Feedback α)"
              help="How quickly each successive echo repeat fades out. Higher = echoes last longer."
              value={effects.echo_feedback}
              min={10}
              max={85}
              step={5}
              unit="%"
              onChange={(val) => setEffects({ echo_feedback: val })}
            />

            <Slider
              label="Number of Echo Taps"
              help="How many discrete echo repeats (impulse response taps) are added."
              value={effects.echo_taps}
              min={1}
              max={6}
              step={1}
              unit="taps"
              onChange={(val) => setEffects({ echo_taps: val })}
            />

            <Slider
              label="Wet / Dry Reflection Mix"
              help="Balance between the original (dry) signal and the added echoes (wet). Higher = more echo."
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

      {/* Apply Effects Action: Original vs Processed */}
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
            onClick={() => applyEffectsAction('original')}
            className="text-[12px]"
          >
            Apply to Original
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="auto_fix_high"
            loading={isLoading}
            onClick={() => applyEffectsAction('processed')}
            className="text-[12px]"
          >
            Apply to Processed
          </Button>
        </div>
      </div>
    </div>
  );
}
