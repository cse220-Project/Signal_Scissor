import { useState } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

export default function FloatingAudioBar() {
  const {
    signalState,
    isPlaying,
    activeTrack,
    currentTime,
    duration,
    volume,
    loop,
    setVolume,
    setLoop,
  } = useAudioStore();

  const { togglePlay, seekTo, handleTrackChange } = useAudioPlayer();
  const [showVolume, setShowVolume] = useState(false);

  if (!signalState?.loaded) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * duration);
  };

  return (
    <div
      id="floating-audio-bar"
      className="relative z-30 mx-auto w-full shrink-0 lg:w-[700px] lg:mb-4 lg:rounded-2xl select-none animate-in slide-in-from-bottom duration-500"
      style={{
        background: 'rgba(10, 15, 30, 0.88)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 -2px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.55)',
      }}
    >
      {/* Seek Bar (clickable) */}
      <div
        className="h-1 w-full cursor-pointer group relative overflow-hidden lg:rounded-t-2xl"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        onClick={handleSeek}
      >
        <div
          className="h-full transition-none relative"
          style={{
            width: `${progress}%`,
            background: activeTrack === 'original'
              ? 'linear-gradient(90deg, #38bdf8, #0ea5e9)'
              : 'linear-gradient(90deg, #34d399, #10b981)',
          }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md -mr-1.5" />
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5">

        {/* Original / processed toggle */}
        <div
          className="flex items-center rounded-xl overflow-hidden shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <button
            onClick={() => handleTrackChange('original')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
              activeTrack === 'original'
                ? 'bg-sky-500/90 text-white'
                : 'text-white/45 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 inline-block" />
            <span>Original</span>
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={() => handleTrackChange('processed')}
            className={`px-2.5 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
              activeTrack === 'processed'
                ? 'bg-emerald-500/90 text-white'
                : 'text-white/45 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
            <span>Processed</span>
          </button>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-white/85 truncate leading-tight">
            {signalState.source_name || 'Audio Signal'}
          </div>
          <div className="text-[10px] text-white/35 font-mono leading-tight">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Loop */}
        <button
          onClick={() => setLoop(!loop)}
          title={loop ? 'Loop On' : 'Loop Off'}
          className={`p-1.5 rounded-lg transition-all ${
            loop ? 'text-amber-400' : 'text-white/35 hover:text-white/70'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">repeat</span>
        </button>

        {/* Play / Pause */}
        <button
          id="floating-play-pause"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
          style={{
            background: activeTrack === 'original'
              ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)'
              : 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
            boxShadow: activeTrack === 'original'
              ? '0 0 20px rgba(56,189,248,0.45)'
              : '0 0 20px rgba(52,211,153,0.45)',
          }}
        >
          <span className="material-symbols-outlined text-[22px] icon-fill">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Volume */}
        <div className="relative">
          <button
            onClick={() => setShowVolume((v) => !v)}
            className="p-1.5 text-white/40 hover:text-white/80 transition-all rounded-lg"
          >
            <span className="material-symbols-outlined text-[18px]">
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
          </button>
          {showVolume && (
            <div
              className="absolute bottom-full mb-2 right-0 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
              style={{
                background: 'rgba(10, 15, 30, 0.96)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <span className="material-symbols-outlined text-[14px] text-white/40">volume_mute</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-1 cursor-pointer"
                style={{ accentColor: '#38bdf8' }}
              />
              <span className="material-symbols-outlined text-[14px] text-white/40">volume_up</span>
              <span className="text-white/50 text-[10px] font-mono w-7">{Math.round(volume * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
