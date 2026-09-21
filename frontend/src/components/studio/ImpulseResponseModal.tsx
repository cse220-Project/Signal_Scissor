import { useAudioStore } from '../../store/useAudioStore';
import ImpulseResponseCanvas from '../visualization/ImpulseResponseCanvas';
import Button from '../ui/Button';

export default function ImpulseResponseModal() {
  const {
    showImpulseModal,
    setShowImpulseModal,
    impulseResponse,
    effects,
    signalState,
  } = useAudioStore();

  if (!showImpulseModal) return null;

  const fs = signalState?.sample_rate || 8000;
  const n0 = Math.round((effects.echo_delay_ms / 1000) * fs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2328]/30 backdrop-blur-none animate-in fade-in duration-150">
      <div className="bg-surface rounded-ios-2xl max-w-xl w-full p-6 space-y-4 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-ink-primary">candlestick_chart</span>
            <h3 className="text-[17px] font-semibold text-ink-primary tracking-tight">
              Discrete Impulse Response h[n]
            </h3>
          </div>
          <button
            onClick={() => setShowImpulseModal(false)}
            className="text-ink-secondary hover:text-ink-primary p-1 rounded-ios-md transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Stem Plot Canvas */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
            Discrete Reflection Stems
          </span>
          <ImpulseResponseCanvas stems={impulseResponse?.stems} height={160} />
        </div>

        {/* Mathematical Formulation */}
        <div className="bg-surface-raised rounded-ios-lg p-4 space-y-2 text-[12px]">
          <div className="font-mono text-[13px] text-ink-primary font-semibold">
            y[n] = (x * h)[n] = ∑ x[k] · h[n - k]
          </div>
          <p className="text-ink-secondary leading-relaxed">
            The echo system is modeled as a Linear Time-Invariant (LTI) filter. The impulse response consists of the direct sound impulse <code className="font-mono text-ink-primary">δ[n]</code> followed by delayed reflections decaying exponentially at rate <code className="font-mono text-ink-primary">α = {(effects.echo_feedback / 100).toFixed(2)}</code> with sample delay spacing <code className="font-mono text-ink-primary">n₀ = {n0} samples ({effects.echo_delay_ms} ms)</code>.
          </p>
        </div>

        {/* Parameter summary grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
          <div className="bg-surface-raised p-2 rounded-ios-md">
            <span className="text-ink-tertiary block text-[10px] uppercase font-medium">Delay n₀</span>
            <span className="font-mono font-medium text-ink-primary">{n0} samples</span>
          </div>
          <div className="bg-surface-raised p-2 rounded-ios-md">
            <span className="text-ink-tertiary block text-[10px] uppercase font-medium">Decay α</span>
            <span className="font-mono font-medium text-ink-primary">{(effects.echo_feedback / 100).toFixed(2)}</span>
          </div>
          <div className="bg-surface-raised p-2 rounded-ios-md">
            <span className="text-ink-tertiary block text-[10px] uppercase font-medium">Echo Taps</span>
            <span className="font-mono font-medium text-ink-primary">{effects.echo_taps}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" onClick={() => setShowImpulseModal(false)}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
