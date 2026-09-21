import React, { useState } from 'react';
import {
  Scissors,
  Sparkles,
  Volume2,
  Clock,
  Radio,
  Repeat,
  Layers,
  HelpCircle,
  Zap
} from 'lucide-react';

export default function EffectsRack({
  filterConfig,
  onFilterConfigChange,
  effectsConfig,
  onEffectsConfigChange,
  onApplyFilter,
  onApplyEffects,
  onApplyAll,
  onOpenImpulseResponse,
  sampleRate = 8000,
  isProcessing = false
}) {
  const [activeTab, setActiveTab] = useState('spectral');
  const nyquist = sampleRate / 2;

  const applyPresetBand = (low, high, op) => {
    onFilterConfigChange({
      ...filterConfig,
      enabled: true,
      low_freq: low,
      high_freq: high,
      operation: op
    });
  };

  return (
    <div className="glass-panel workstation-effects" style={{
      width: '380px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid rgba(31, 35, 40, 0.16)'
    }}>
      {/* ── Tab Switcher ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(31, 35, 40, 0.12)',
        background: 'rgba(250, 249, 246, 0.85)'
      }}>
        <button
          onClick={() => setActiveTab('spectral')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            fontWeight: '700',
            letterSpacing: '0.04em',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'spectral' ? 'rgba(31, 35, 40, 0.15)' : 'transparent',
            color: activeTab === 'spectral' ? 'var(--lavender-tonic)' : 'var(--text-muted)',
            borderBottom: activeTab === 'spectral' ? '2px solid var(--lavender-tonic)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Scissors size={14} />
          FOURIER SCISSOR
        </button>

        <button
          onClick={() => setActiveTab('acoustic')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            fontWeight: '700',
            letterSpacing: '0.04em',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'acoustic' ? 'rgba(31, 35, 40, 0.15)' : 'transparent',
            color: activeTab === 'acoustic' ? 'var(--lavender-tonic)' : 'var(--text-muted)',
            borderBottom: activeTab === 'acoustic' ? '2px solid var(--lavender-tonic)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Repeat size={14} />
          ACOUSTIC &amp; ECHO
        </button>
      </div>

      {/* ── Tab Body ────────────────────────────────────────────────── */}
      <div style={{
        padding: '18px',
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>

        {/* ===================== TAB 1: FOURIER SCISSOR ===================== */}
        {activeTab === 'spectral' && (
          <>
            {/* Header / Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(250, 249, 246, 0.75)',
              border: '1px solid rgba(31, 35, 40, 0.1)'
            }}>
              <div>
                <span className="swiss-tag" style={{ display: 'block', color: 'var(--lavender-tonic)' }}>
                  FREQUENCY DOMAIN
                </span>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1f2328', marginTop: '1px' }}>
                  Band Filter (FFT / IFFT)
                </h3>
              </div>

              <div
                className={`pixel-switch ${filterConfig.enabled ? 'active' : ''}`}
                onClick={() => onFilterConfigChange({ ...filterConfig, enabled: !filterConfig.enabled })}
                title="Toggle filter bypass"
              >
                <div className="pixel-switch-handle" />
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="swiss-tag" style={{ display: 'block', marginBottom: '6px' }}>
                QUICK TEMPLATES:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  className="swiss-btn"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => applyPresetBand(900, 1100, 'cut')}
                >
                  ✂️ Cut 1000Hz Tone
                </button>
                <button
                  className="swiss-btn"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => applyPresetBand(200, 1500, 'keep')}
                >
                  🎙️ Keep 200-1500Hz Voice
                </button>
                <button
                  className="swiss-btn"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => applyPresetBand(2000, 3800, 'attenuate')}
                >
                  🔉 Dampen Highs
                </button>
                <button
                  className="swiss-btn"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => applyPresetBand(100, 500, 'amplify')}
                >
                  🔊 Boost Bass
                </button>
              </div>
            </div>

            {/* Mode Select */}
            <div style={{
              background: 'rgba(250, 249, 246, 0.75)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(31, 35, 40, 0.1)'
            }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '700',
                marginBottom: '6px',
                letterSpacing: '0.03em'
              }}>
                FILTER OPERATION MODE
              </label>
              <select
                value={filterConfig.operation}
                onChange={(e) => onFilterConfigChange({ ...filterConfig, operation: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(250, 249, 246, 0.95)',
                  border: '1px solid rgba(31, 35, 40, 0.25)',
                  color: 'var(--lavender-tonic)',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-xs)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="cut">Cut (Zero Out Band / Notch Filter)</option>
                <option value="keep">Keep (Isolate Band Only / Bandpass)</option>
                <option value="attenuate">Attenuate (Dampen Band to 30% / -10.5dB)</option>
                <option value="amplify">Amplify (Boost Band to 150% / +3.5dB)</option>
              </select>
            </div>

            {/* Cutoff Sliders */}
            <div style={{
              background: 'rgba(250, 249, 246, 0.75)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(31, 35, 40, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Low Cutoff (f_low):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--lavender-tonic)', fontWeight: '700' }}>
                    {filterConfig.low_freq.toFixed(0)} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max={nyquist - 30}
                  step="10"
                  value={filterConfig.low_freq}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val < filterConfig.high_freq) onFilterConfigChange({ ...filterConfig, low_freq: val });
                  }}
                  disabled={!filterConfig.enabled}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>High Cutoff (f_high):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-violet)', fontWeight: '700' }}>
                    {filterConfig.high_freq.toFixed(0)} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max={nyquist}
                  step="10"
                  value={filterConfig.high_freq}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > filterConfig.low_freq) onFilterConfigChange({ ...filterConfig, high_freq: val });
                  }}
                  disabled={!filterConfig.enabled}
                />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Active Band: <span style={{ color: '#1f2328' }}>{filterConfig.low_freq.toFixed(0)} Hz — {filterConfig.high_freq.toFixed(0)} Hz</span>
              </div>
            </div>

            <button
              className="swiss-btn swiss-btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '2px' }}
              onClick={onApplyFilter}
              disabled={isProcessing || !filterConfig.enabled}
            >
              Apply Frequency Scissor
            </button>
          </>
        )}

        {/* ===================== TAB 2: ACOUSTIC & ECHO ===================== */}
        {activeTab === 'acoustic' && (
          <>
            {/* ── CARD 1: Convolution Echo ───────────────────────────── */}
            <div style={{
              background: 'rgba(250, 249, 246, 0.85)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: effectsConfig.echo_enabled ? 'rgba(69, 64, 79, 0.4)' : 'rgba(31, 35, 40, 0.1)',
              boxShadow: effectsConfig.echo_enabled ? '0 0 16px rgba(69, 64, 79, 0.12)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <span className="swiss-tag" style={{ color: 'var(--accent-violet)' }}>LTI SYSTEM CONVOLUTION</span>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1f2328', marginTop: '1px' }}>
                    Multi-Tap Acoustic Echo &middot; y = x * h
                  </h4>
                </div>

                <div
                  className={`pixel-switch ${effectsConfig.echo_enabled ? 'active' : ''}`}
                  onClick={() => onEffectsConfigChange({ ...effectsConfig, echo_enabled: !effectsConfig.echo_enabled })}
                  title="Enable/Disable Convolution Echo"
                >
                  <div className="pixel-switch-handle" />
                </div>
              </div>

              {/* Echo Delay Spacing */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Echo Spacing (Delay):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lavender-tonic)', fontWeight: '700' }}>
                    {effectsConfig.echo_delay_ms || 250} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="800"
                  step="10"
                  value={effectsConfig.echo_delay_ms || 250}
                  onChange={(e) => onEffectsConfigChange({ ...effectsConfig, echo_delay_ms: parseFloat(e.target.value) })}
                  disabled={!effectsConfig.echo_enabled}
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {[
                    { label: '100ms Slap', val: 100 },
                    { label: '250ms Room', val: 250 },
                    { label: '450ms Hall', val: 450 }
                  ].map(p => (
                    <button
                      key={p.label}
                      className="swiss-btn"
                      style={{ fontSize: '10px', padding: '2px 6px' }}
                      onClick={() => onEffectsConfigChange({ ...effectsConfig, echo_delay_ms: p.val })}
                      disabled={!effectsConfig.echo_enabled}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Echo Decay & Taps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Decay (&alpha;):</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#1f2328', fontWeight: '700' }}>
                      {effectsConfig.echo_feedback}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    step="5"
                    value={effectsConfig.echo_feedback}
                    onChange={(e) => onEffectsConfigChange({ ...effectsConfig, echo_feedback: parseFloat(e.target.value) })}
                    disabled={!effectsConfig.echo_enabled}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Echo Taps:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', fontWeight: '700' }}>
                      {effectsConfig.echo_taps || 3} repeats
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={effectsConfig.echo_taps || 3}
                    onChange={(e) => onEffectsConfigChange({ ...effectsConfig, echo_taps: parseInt(e.target.value) })}
                    disabled={!effectsConfig.echo_enabled}
                  />
                </div>
              </div>

              {/* Wet Mix Level */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Echo Level (Wet Mix):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lavender-tonic)', fontWeight: '700' }}>
                    {effectsConfig.echo_mix}%
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  step="5"
                  value={effectsConfig.echo_mix}
                  onChange={(e) => onEffectsConfigChange({ ...effectsConfig, echo_mix: parseFloat(e.target.value) })}
                  disabled={!effectsConfig.echo_enabled}
                />
              </div>

              <button
                className="swiss-btn"
                style={{ width: '100%', fontSize: '11px', borderStyle: 'dashed' }}
                onClick={onOpenImpulseResponse}
              >
                Inspect Impulse Response h[n] (Stem Plot)
              </button>
            </div>

            {/* ── CARD 2: Volume Gain ────────────────────────────────── */}
            <div style={{
              background: 'rgba(250, 249, 246, 0.75)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(31, 35, 40, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1f2328', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="var(--lavender-tonic)" />
                  Amplitude Scale &middot; y[n] = A &middot; x[n]
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lavender-tonic)', fontWeight: '700' }}>
                  {effectsConfig.gain.toFixed(2)}&times;
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="3.0"
                step="0.05"
                value={effectsConfig.gain}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, gain: parseFloat(e.target.value) })}
              />
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {[
                  { label: '0.5x (-6dB)', val: 0.5 },
                  { label: '1.0x Normal', val: 1.0 },
                  { label: '1.5x (+3.5dB)', val: 1.5 },
                  { label: '2.0x (+6dB)', val: 2.0 }
                ].map(p => (
                  <button
                    key={p.label}
                    className="swiss-btn"
                    style={{ fontSize: '10px', padding: '2px 5px' }}
                    onClick={() => onEffectsConfigChange({ ...effectsConfig, gain: p.val })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CARD 3: Pure Time Delay ─────────────────────────────── */}
            <div style={{
              background: 'rgba(250, 249, 246, 0.75)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(31, 35, 40, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1f2328', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--accent-violet)" />
                  Pure Time Delay &middot; y[n] = x[n - n₀]
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', fontWeight: '700' }}>
                  {effectsConfig.delay_ms} ms
                </span>
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Prepends silence to shift audio onset forward in time.
              </p>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={effectsConfig.delay_ms}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, delay_ms: parseFloat(e.target.value) })}
              />
            </div>

            {/* ── CARD 4: Analytic Frequency Shift ───────────────────── */}
            <div style={{
              background: 'rgba(250, 249, 246, 0.75)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(31, 35, 40, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1f2328', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} color="var(--lavender-tonic)" />
                  Analytic Frequency Shift (&Delta;f)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lavender-tonic)', fontWeight: '700' }}>
                  {effectsConfig.shift_hz > 0 ? `+${effectsConfig.shift_hz}` : effectsConfig.shift_hz} Hz
                </span>
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Single-sideband pitch translation using FFT analytic signal.
              </p>
              <input
                type="range"
                min="-1000"
                max="1000"
                step="25"
                value={effectsConfig.shift_hz}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, shift_hz: parseFloat(e.target.value) })}
              />
            </div>

            <button
              className="swiss-btn swiss-btn-aurora"
              style={{ width: '100%', padding: '11px', marginTop: '2px' }}
              onClick={onApplyEffects}
              disabled={isProcessing}
            >
              Apply Acoustic Chain
            </button>
          </>
        )}

      </div>

      {/* ── Master Bottom Run Pipeline Button ───────────────────────── */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid rgba(31, 35, 40, 0.12)',
        background: 'rgba(250, 249, 246, 0.95)'
      }}>
        <button
          className="swiss-btn swiss-btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '13px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
          onClick={onApplyAll}
          disabled={isProcessing}
        >
          <Sparkles size={16} />
          {isProcessing ? 'PROCESSING DSP…' : 'RUN FULL DSP PIPELINE'}
        </button>
      </div>
    </div>
  );
}
