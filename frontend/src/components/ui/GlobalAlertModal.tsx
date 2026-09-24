import { useAudioStore } from '../../store/useAudioStore';
import Button from './Button';

export default function GlobalAlertModal() {
  const { error, setError } = useAudioStore();

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative bg-card/90 backdrop-blur-2xl border border-destructive/30 shadow-2xl rounded-ios-2xl p-6 max-w-md w-full flex flex-col gap-4 transform animate-in zoom-in-95 duration-200">
        {/* Error Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-destructive/15 text-destructive shrink-0">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-[16px] font-bold text-foreground tracking-tight">
              DSP Engine Notice / Processing Failure
            </h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed break-words">
              {error}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setError(null)}
          >
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
