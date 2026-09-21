import React from 'react';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';

const TOTAL_DOTS = 12;

export default function TransportBar({
  isPlaying,
  currentTime,
  duration,
  activeTrack,
  onTogglePlay,
  onStop,
  onSeek,
  onToggleTrack,
  volume,
  onVolumeChange,
  vuLevel = 0
}) {
  const formatTime = (s) => {
    if (!s || isNaN(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2);
    return `${m}:${sec.padStart(5, '0')}`;
  };

  const activeDots = Math.round(Math.min(1, Math.max(0, vuLevel)) * TOTAL_DOTS);

  return (
    <div className="glass-panel workstation-player" style={{
      padding: '10px 20px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid rgba(31, 35, 40, 0.16)',
      background: 'rgba(250, 249, 246, 0.80)'
    }}>
      <div className="transport-inner">

        {/* ── Play / Stop ─────────────────────── */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid',
              borderColor: isPlaying ? 'var(--lavender-tonic-hover)' : 'rgba(31, 35, 40, 0.28)',
              background: isPlaying ? 'var(--lavender-tonic)' : 'rgba(31, 35, 40, 0.08)',
              color: isPlaying ? 'var(--champion-blue)' : 'var(--text-primary)',
              boxShadow: isPlaying ? 'var(--shadow-glow-lavender)' : 'none',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {isPlaying
              ? <Pause  size={16} fill="currentColor" />
              : <Play   size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
            }
          </button>

          <button
            onClick={onStop}
            title="Stop & reset"
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(31, 35, 40, 0.15)',
              background: 'rgba(31, 35, 40, 0.06)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(31, 35, 40, 0.14)';
              e.currentTarget.style.borderColor = 'rgba(31, 35, 40, 0.3)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(31, 35, 40, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(31, 35, 40, 0.15)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Square size={13} fill="currentColor" />
          </button>
        </div>

        {/* ── A / B Track Toggle ───────────────── */}
        <div className="glass-pill" style={{ display: 'flex', padding: '3px', flexShrink: 0 }}>
          {[
            { id: 'original',  label: 'ORIGINAL',  color: 'var(--lavender-tonic)' },
            { id: 'processed', label: 'PROCESSED', color: 'var(--accent-violet)'   }
          ].map(({ id, label, color }) => {
            const isActive = activeTrack === id;
            return (
              <button
                key={id}
                onClick={() => onToggleTrack(id)}
                style={{
                  padding: '5px 14px',
                  fontSize: '11px', fontWeight: '700', fontFamily: 'var(--font-sans)',
                  borderRadius: 'var(--radius-pill)', border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  background: isActive ? color : 'transparent',
                  color: isActive ? (id === 'original' ? 'var(--champion-blue)' : '#FFFFFF') : 'var(--text-dim)',
                  boxShadow: isActive ? `0 0 14px ${color}55` : 'none',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'rgba(31, 35, 40, 0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-dim)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {id === 'original' ? 'A' : 'B'} · {label}
              </button>
            );
          })}
        </div>

        {/* ── Pixel Clock ──────────────────────── */}
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: '20px',
          color: activeTrack === 'processed' ? '#1f2328' : 'var(--lavender-tonic)',
          letterSpacing: '0.08em', whiteSpace: 'nowrap',
          padding: '3px 12px',
          background: 'rgba(250, 249, 246, 0.90)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid rgba(31, 35, 40, 0.14)',
          textShadow: '0 0 10px rgba(31, 35, 40, 0.4)',
          flexShrink: 0
        }}>
          {formatTime(currentTime)}
          <span className="pixel-clock-secondary" style={{ color: 'var(--text-dim)', margin: '0 4px' }}>/</span>
          <span className="pixel-clock-secondary">{formatTime(duration)}</span>
        </div>

        {/* ── Scrub Slider (drops to own row on narrow) ── */}
        <div className="transport-scrub" style={{ flex: 1, minWidth: '80px' }}>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.001"
            value={currentTime || 0}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* ── VU Meter ─────────────────────────── */}
        <div className="dot-matrix-meter" title="Live VU peak meter">
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fontWeight: '800', color: 'var(--text-dim)', marginRight: '4px', letterSpacing: '0.05em' }}>
            VU
          </span>
          {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
            let cls = '';
            if (i < activeDots) {
              if (i < 7) cls = 'active-green';
              else if (i < 9)  cls = 'active-cyan';
              else if (i < 11) cls = 'active-amber';
              else             cls = 'active-red';
            }
            return <div key={i} className={`dot-cell ${cls}`} />;
          })}
        </div>

        {/* ── Volume ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: '110px' }}>
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.85)}
            style={{
              background: 'none', border: 'none',
              color: volume === 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', padding: '2px',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = volume === 0 ? 'var(--accent-rose)' : 'var(--text-muted)'}
          >
            {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range" min="0" max="1" step="0.02"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{ width: '70px' }}
          />
        </div>

      </div>
    </div>
  );
}
