import { useAudioStore } from '../../store/useAudioStore';

export default function GlobalLoadingOverlay() {
  const { isLoading } = useAudioStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/50 backdrop-blur-xl animate-in fade-in duration-200 select-none cursor-wait">
      <div className="relative bg-card/80 backdrop-blur-2xl border border-border shadow-2xl rounded-ios-2xl p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center transform animate-in zoom-in-95 duration-200">
        {/* Animated Equalizer Spinner */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
          <div className="flex items-end justify-center gap-1 w-8 h-8">
            <span className="w-1.5 bg-primary rounded-full animate-[bounce_0.6s_infinite_100ms] h-6" />
            <span className="w-1.5 bg-primary rounded-full animate-[bounce_0.6s_infinite_300ms] h-8" />
            <span className="w-1.5 bg-primary rounded-full animate-[bounce_0.6s_infinite_200ms] h-4" />
            <span className="w-1.5 bg-primary rounded-full animate-[bounce_0.6s_infinite_400ms] h-7" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-[17px] font-bold text-foreground tracking-tight">
            Processing Audio SIGNAL...
          </h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Executing discrete Fourier transformation & DSP pipeline. Please wait...
          </p>
        </div>

        <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 via-primary to-emerald-400 animate-pulse w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
