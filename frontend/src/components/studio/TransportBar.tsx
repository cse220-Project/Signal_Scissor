import { useRef } from 'react';
import { useAudioStore } from '../../store/useAudioStore';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import Button from '../ui/Button';
import { getExportWavUrl } from '../../api/client';

export default function TransportBar() {
  const {
    duration,
    volume,
    loop,
    setVolume,
    setLoop,
    signalState,
  } = useAudioStore();

  const {
    isPlaying,
    activeTrack,
    currentTime,
    vuLevel,
    togglePlay,
    stop,
    seekTo,
    handleTrackChange,
  } = useAudioPlayer();

  const prevVolumeRef = useRef<number>(volume > 0 ? volume : 0.85);

  const handleToggleMute = () => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolumeRef.current || 0.85);
    }
  };

  const handleSkipBack = () => {
    seekTo(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    seekTo(Math.min(duration, currentTime + 5));
  };

  const formatTime = (sec: number) => {
    const s = Math.max(0, sec);
    return `${s.toFixed(2)}s`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  return (
    <div className="bg-surface rounded-ios-2xl p-4 md:p-5 flex flex-col gap-4 select-none border border-hairline">
      {/* Top row: Track selector, Playhead Time, VU Meter, and Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Track A/B toggle */}
        <div className="inline-flex bg-surface-raised p-1 rounded-pill">
          <button
            onClick={() => handleTrackChange('original')}
            className={`px-3.5 py-1.5 rounded-pill text-[13px] font-medium transition-all ${
              activeTrack === 'original'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            A · Original
          </button>
          <button
            onClick={() => handleTrackChange('processed')}
            className={`px-3.5 py-1.5 rounded-pill text-[13px] font-medium transition-all ${
              activeTrack === 'processed'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            B · Processed
          </button>
        </div>

        {/* Time display & VU Meter */}
        <div className="flex items-center gap-4 text-[13px] text-ink-secondary">
          <span className="font-mono text-ink-primary font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* VU Meter bar */}
          <div className="flex items-center gap-1.5" title="Signal Peak / RMS Level">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">VU</span>
            <div className="w-16 h-2.5 bg-surface-raised rounded-pill overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 rounded-pill ${
                  vuLevel > 0.85 ? 'bg-error' : vuLevel > 0.6 ? 'bg-pastel-peach' : 'bg-success'
                }`}
                style={{ width: `${Math.min(100, vuLevel * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <a
          href={getExportWavUrl()}
          download={`processed_${signalState?.source_name || 'signal'}.wav`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-raised px-3 py-1.5 rounded-ios-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[17px]">download</span>
          <span>Export WAV</span>
        </a>
      </div>

      {/* Scrubber progress bar */}
      <div className="w-full">
        <input
          type="range"
          min={0}
          max={Math.max(0.1, duration)}
          step={0.01}
          value={Math.min(duration, currentTime)}
          onChange={handleSeekChange}
          className="w-full cursor-pointer"
        />
      </div>

      {/* Bottom controls: Play/Pause, Stop, Skips, Loop, Volume */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Play/Pause Button */}
          <Button
            variant="primary"
            size="md"
            icon={isPlaying ? 'pause' : 'play_arrow'}
            onClick={togglePlay}
          >
            {isPlaying ? 'Pause' : 'Play Audio'}
          </Button>

          {/* Stop Button */}
          <Button
            variant="secondary"
            size="sm"
            icon="stop"
            onClick={stop}
            title="Stop playback and reset to start"
          >
            Stop
          </Button>

          {/* Skip Buttons */}
          <button
            type="button"
            onClick={handleSkipBack}
            className="p-2 rounded-ios-md text-ink-secondary hover:text-ink-primary hover:bg-surface-raised transition-colors flex items-center justify-center cursor-pointer"
            title="Rewind 5 seconds"
          >
            <span className="material-symbols-outlined text-[19px]">replay_5</span>
          </button>

          <button
            type="button"
            onClick={handleSkipForward}
            className="p-2 rounded-ios-md text-ink-secondary hover:text-ink-primary hover:bg-surface-raised transition-colors flex items-center justify-center cursor-pointer"
            title="Forward 5 seconds"
          >
            <span className="material-symbols-outlined text-[19px]">forward_5</span>
          </button>

          {/* Loop Button */}
          <Button
            variant={loop ? 'pill' : 'ghost'}
            size="sm"
            icon="repeat"
            onClick={() => setLoop(!loop)}
            title="Loop audio playback"
          >
            Loop
          </Button>
        </div>

        {/* Volume slider with interactive mute button */}
        <div className="flex items-center gap-2 max-w-[190px] min-w-[130px] flex-1">
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1 text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer flex items-center"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
}
