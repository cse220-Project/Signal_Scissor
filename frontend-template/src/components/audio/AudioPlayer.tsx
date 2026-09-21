import { useRef, useEffect, useState } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useAudioStore } from '../../store/useAudioStore';
import { getWaveform, getSpectrogram } from '../../api/client';

interface AudioPlayerProps {
  url: string | null;
  title?: string;
}

export default function AudioPlayer({ url, title }: AudioPlayerProps) {
  const { play, pause, stop, seek } = useAudioEngine(url);
  const {
    isPlaying, currentTime, duration,
    volume, playbackRate,
    setVolume, setPlaybackRate,
    selectedFile, originalFile,
    restoreToOriginal,
    setWaveformData, setSpectrogramData,
  } = useAudioStore();
  const [showRateMenu, setShowRateMenu] = useState(false);
  const rateMenuRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); isPlaying ? pause() : play(); }
      else if (e.code === 'ArrowLeft') seek(Math.max(0, currentTime - 5));
      else if (e.code === 'ArrowRight') seek(Math.min(duration, currentTime + 5));
      else if (e.key === 'm') setVolume(volume > 0 ? 0 : 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, volume, play, pause, seek, setVolume]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rateMenuRef.current && !rateMenuRef.current.contains(e.target as Node)) {
        setShowRateMenu(false);
      }
    };
    if (showRateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRateMenu]);

  // Show restore button when there is an original file and the current file is different (processed)
  const showRestoreButton = !!(
    originalFile &&
    selectedFile &&
    selectedFile.id !== originalFile.id
  );

  const handleRestore = async () => {
    restoreToOriginal();
    if (originalFile) {
      // Refresh waveform/spectrogram for the original file
      getWaveform(originalFile.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(originalFile.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="flex flex-col gap-0 select-none">
      <div className="bg-surface rounded-ios-2xl p-4 md:p-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[14px] text-ink-primary truncate max-w-[220px] md:max-w-md">
              {title || 'Current Audio'}
            </span>
          </div>
          <div className="text-[12px] font-medium text-ink-secondary tracking-tight">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Minimalist Seek track */}
        <div
          ref={progressRef}
          className="h-2 bg-[rgba(38,33,28,0.08)] hover:h-3 rounded-pill relative cursor-pointer flex items-center overflow-hidden transition-all duration-150"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute h-full left-0 top-0 bg-[#26211c] transition-all duration-75"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Control Buttons & Sliders */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
          <div className="flex items-center gap-1">
            {/* Custom Skip Back 10s */}
            <button
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className="w-8 h-8 rounded-ios-md flex items-center justify-center text-ink-primary/70 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] transition-all cursor-pointer"
              title="Rewind 10s"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
            </button>

            {/* Bordered Play/Pause with Rounded Corners */}
            <button
              onClick={isPlaying ? pause : play}
              className="w-9 h-9 rounded-ios-md flex items-center justify-center text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.92] transition-all cursor-pointer select-none"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="5" x2="8" y2="19" />
                  <line x1="16" y1="5" x2="16" y2="19" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[1px]">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>

            {/* Custom Skip Forward 10s */}
            <button
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              className="w-8 h-8 rounded-ios-md flex items-center justify-center text-ink-primary/70 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] transition-all cursor-pointer"
              title="Forward 10s"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </button>

            {/* Bordered Stop with Rounded Corners */}
            <button
              onClick={stop}
              className="w-8 h-8 rounded-ios-md flex items-center justify-center text-ink-primary/80 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] transition-all cursor-pointer"
              title="Stop"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                className="w-7 h-7 rounded-ios-md flex items-center justify-center text-ink-primary/70 hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:scale-[0.95] cursor-pointer transition-all shrink-0"
                onClick={() => setVolume(volume > 0 ? 0 : 1)}
                title={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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
                className="w-20 cursor-pointer"
              />
            </div>

            <div className="relative flex items-center ml-auto justify-end" ref={rateMenuRef}>
              <button
                type="button"
                onClick={() => setShowRateMenu(!showRateMenu)}
                className="text-[12px] font-medium text-ink-primary/70 hover:text-ink-primary cursor-pointer select-none transition-colors py-0.5 px-1"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showRateMenu && (
                <div className="absolute bottom-full right-0 mb-2 py-1 bg-surface-raised border border-[rgba(38,33,28,0.12)] rounded-ios-lg shadow-ios-md flex flex-col z-30 min-w-[70px] animate-fadeIn">
                  {rates.map(r => {
                    const isSelected = r === playbackRate;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setPlaybackRate(r);
                          setShowRateMenu(false);
                        }}
                        className={`text-[12px] px-3 py-1.5 text-right cursor-pointer transition-colors ${
                          isSelected
                            ? 'font-semibold text-ink-primary bg-[rgba(38,33,28,0.06)]'
                            : 'font-normal text-ink-secondary hover:text-ink-primary hover:bg-[rgba(38,33,28,0.04)]'
                        }`}
                      >
                        {r}x
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Restore to Original button — shown below the player when effects have been applied */}
      {showRestoreButton && (
        <div className="flex justify-end pt-1.5 pr-1">
          <button
            type="button"
            onClick={handleRestore}
            className="px-4 py-1.5 rounded-full bg-[#26211c] text-white text-[12px] font-semibold tracking-tight hover:bg-[#1a1713] active:scale-[0.97] transition-all cursor-pointer select-none"
          >
            Restore to Original
          </button>
        </div>
      )}
    </div>
  );
}
