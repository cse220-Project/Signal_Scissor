import { useRef, useEffect, useState } from 'react';

interface NativeAudioPlayerProps {
  url: string | null;
  title?: string;
  className?: string;
  onRestoreOriginal?: () => void;
  onPlaybackStateChange?: (state: { currentTime: number, duration: number, isPlaying: boolean }) => void;
}

export default function NativeAudioPlayer({ url, title, className = '', onRestoreOriginal, onPlaybackStateChange }: NativeAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const seekFromEvent = (clientX: number) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek(pos * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    seekFromEvent(e.clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDraggingRef.current) seekFromEvent(e.clientX); };
    const onUp = () => { isDraggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  });

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  // Sync volume & playback rate to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (onPlaybackStateChange) {
      onPlaybackStateChange({ currentTime, duration, isPlaying });
    }
  }, [currentTime, duration, isPlaying, onPlaybackStateChange]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className={`flex flex-col gap-0 select-none ${className}`}>
      <div className="flex flex-col gap-3">
        {url && (
          <audio
            ref={audioRef}
            src={url}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
          />
        )}

        <div className={`flex items-center ${title ? 'justify-between' : 'justify-end'} px-0.5`}>
          {title && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-[13.5px] text-ink-primary truncate max-w-[200px]">
                {title}
              </span>
            </div>
          )}
          <div className="text-[12px] font-medium text-ink-secondary tracking-tight">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Minimalist Seek track */}
        <div
          ref={progressRef}
          className="h-2 bg-[rgba(38,33,28,0.08)] hover:h-2.5 rounded-pill relative cursor-pointer flex items-center overflow-hidden transition-all duration-150"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute h-full left-0 top-0 bg-[#26211c] transition-all duration-75"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Single-line Controls Row: Play controls, volume, and speed all together */}
        <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5 flex-nowrap">
          {/* Playback Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Skip Back 10s */}
            <button
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className="w-7 h-7 rounded-ios-md flex items-center justify-center text-ink-primary/70 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] transition-all cursor-pointer"
              title="Rewind 10s"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
            </button>

            {/* Bordered Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-ios-md flex items-center justify-center text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.92] transition-all cursor-pointer select-none"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="5" x2="8" y2="19" />
                  <line x1="16" y1="5" x2="16" y2="19" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[1px]">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              className="w-7 h-7 rounded-ios-md flex items-center justify-center text-ink-primary/70 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] transition-all cursor-pointer"
              title="Forward 10s"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </button>

            {/* Stop */}
            <button
              onClick={stop}
              className="w-7 h-7 rounded-ios-md flex items-center justify-center text-ink-primary/80 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] transition-all cursor-pointer"
              title="Stop"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
              </svg>
            </button>
          </div>

          {/* Volume Slider right after play controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              type="button"
              className="w-6 h-6 rounded-ios-md flex items-center justify-center text-ink-primary/70 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] cursor-pointer transition-all shrink-0"
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              title={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={volume}
              style={{
                background: `linear-gradient(to right, #1f2328 0%, #1f2328 ${volume * 100}%, #e4e2dc ${volume * 100}%, #e4e2dc 100%)`
              }}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 cursor-pointer"
            />
          </div>

          {/* Speed Selector on same line */}
          <div className="flex items-center shrink-0">
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-[11.5px] font-semibold text-ink-primary/80 hover:text-ink-primary cursor-pointer select-none outline-none py-0.5 px-1"
            >
              {rates.map(r => (
                <option key={r} value={r}>
                  {r}x
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Restore to Original button — shown below when onRestoreOriginal is provided */}
      {onRestoreOriginal && (
        <div className="flex justify-end pt-1.5 pr-0.5">
          <button
            type="button"
            onClick={onRestoreOriginal}
            className="px-4 py-1.5 rounded-full bg-[#26211c] text-white text-[12px] font-semibold tracking-tight hover:bg-[#1a1713] active:scale-[0.97] transition-all cursor-pointer select-none"
          >
            Restore to Original
          </button>
        </div>
      )}
    </div>
  );
}
