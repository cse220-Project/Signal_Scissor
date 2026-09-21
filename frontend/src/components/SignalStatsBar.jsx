import React from 'react';
import { Activity, Disc, Clock, Radio } from 'lucide-react';

export default function SignalStatsBar({ stats = null, sourceName = "" }) {
  if (!stats) return null;

  return (
    <footer className="workstation-metrics" style={{
      position: 'relative',
      zIndex: 20,
      background: 'rgba(250, 249, 246, 0.75)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(31, 35, 40, 0.06)',
      padding: '8px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '11px',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Left: Source metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Disc size={13} color="var(--aurora-cyan)" />
          <span style={{ color: 'var(--text-secondary)' }}>Source:</span>
          <span style={{ color: '#1f2328', fontWeight: '600' }}>{sourceName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Sampling Rate:</span>
          <span style={{ color: 'var(--aurora-cyan)' }}>{stats.sample_rate} Hz</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} />
          <span>{stats.duration.toFixed(3)}s ({stats.samples} samples)</span>
        </div>
      </div>

      {/* Right: CSE 220 measurements */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>RMS Level: </span>
          <span style={{ color: '#1f2328', fontWeight: '700' }}>{stats.rms.toFixed(4)}</span>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)' }}>Peak Amp: </span>
          <span style={{ color: 'var(--aurora-magenta)', fontWeight: '700' }}>{stats.peak.toFixed(4)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} color="var(--aurora-purple)" />
          <span style={{ color: 'var(--text-secondary)' }}>Dominant Peak: </span>
          <span style={{ color: '#45404f', fontWeight: '700' }}>{stats.dominant_freq.toFixed(1)} Hz</span>
        </div>
      </div>
    </footer>
  );
}
