import React, { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Volume2, 
  Clock, 
  Radio, 
  Repeat, 
  Layers
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
    <div className="glass-panel" style={{ width: '380px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Swiss Clean Segmented Tab Switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(200, 190, 250, 0.12)',
        background: 'rgba(21, 17, 48, 0.7)'
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
            background: activeTab === 'spectral' ? 'rgba(200, 190, 250, 0.15)' : 'transparent',
            color: activeTab === 'spectral' ? 'var(--lavender-tonic)' : 'var(--text-muted)',
            borderBottom: activeTab === 'spectral' ? '2px solid var(--lavender-tonic)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Scissors size={14} />
          SPECTRAL SCISSOR
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
            background: activeTab === 'acoustic' ? 'rgba(200, 190, 250, 0.15)' : 'transparent',
            color: activeTab === 'acoustic' ? 'var(--lavender-tonic)' : 'var(--text-muted)',
            borderBottom: activeTab === 'acoustic' ? '2px solid var(--lavender-tonic)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={14} />
          ACOUSTIC EFFECTS
        </button>
      </div>

      {/* Tab Body */}
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* ===================== TAB 1: SPECTRAL SCISSOR ===================== */}
        {activeTab === 'spectral' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="swiss-tag" style={{ display: 'block', color: 'var(--text-muted)' }}>FOURIER DOMAIN</span>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px', fontFamily: 'var(--font-sans)' }}>
                  Band Filter Engine
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

            {/* Quick Presets Pills */}
            <div>
              <span className="swiss-tag" style={{ display: 'block', marginBottom: '8px' }}>
                QUICK SCISSOR TEMPLATES:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button 
                  className="swiss-btn" 
                  style={{ fontSize: '11px', padding: '4px 9px' }}
                  onClick={() => applyPresetBand(900, 1100, 'cut')}
                >
                  Cut 1000Hz Tone
                </button>
                <button 
                  className="swiss-btn" 
                  style={{ fontSize: '11px', padding: '4px 9px' }}
                  onClick={() => applyPresetBand(200, 1500, 'keep')}
                >
                  Keep 200-1500Hz
                </button>
                <button 
                  className="swiss-btn" 
                  style={{ fontSize: '11px', padding: '4px 9px' }}
                  onClick={() => applyPresetBand(2000, 3500, 'attenuate')}
                >
                  Dampen Highs
                </button>
                <button 
                  className="swiss-btn" 
                  style={{ fontSize: '11px', padding: '4px 9px' }}
                  onClick={() => applyPresetBand(100, 500, 'amplify')}
                >
                  Boost Lows
                </button>
              </div>
            </div>

            {/* Mode Select */}
            <div style={{
              background: 'rgba(16, 13, 38, 0.7)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(200, 190, 250, 0.1)'
            }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>
                OPERATION MODE
              </label>
              <select
                value={filterConfig.operation}
                onChange={(e) => onFilterConfigChange({ ...filterConfig, operation: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(21, 17, 48, 0.95)',
                  border: '1px solid rgba(200, 190, 250, 0.2)',
                  color: 'var(--lavender-tonic)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '600',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-xs)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="cut">Cut (Zero Out Selected Band / Notch)</option>
                <option value="keep">Keep (Zero Out Outside Band / Bandpass)</option>
                <option value="attenuate">Attenuate (Reduce Band to 30%)</option>
                <option value="amplify">Amplify (Boost Band to 150%)</option>
              </select>
            </div>

            {/* Low & High Cutoff Frequencies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            </div>

            <button 
              className="swiss-btn swiss-btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '4px' }}
              onClick={onApplyFilter}
              disabled={isProcessing || !filterConfig.enabled}
            >
              Apply Frequency Scissor
            </button>
          </>
        )}

        {/* ===================== TAB 2: ACOUSTIC EFFECTS ===================== */}
        {activeTab === 'acoustic' && (
          <>
            {/* 1. Amplitude Scale */}
            <div style={{
              background: 'rgba(16, 13, 38, 0.7)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(200, 190, 250, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            </div>

            {/* 2. Delay & Feedback */}
            <div style={{
              background: 'rgba(16, 13, 38, 0.7)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(200, 190, 250, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--accent-violet)" />
                  Time Delay &middot; y[n] = x[n - n₀]
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', fontWeight: '700' }}>
                  {effectsConfig.delay_ms} ms
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="1500"
                step="10"
                value={effectsConfig.delay_ms}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, delay_ms: parseFloat(e.target.value) })}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Feedback Decay (&alpha;):</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{effectsConfig.echo_feedback}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="90"
                step="1"
                value={effectsConfig.echo_feedback}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, echo_feedback: parseFloat(e.target.value) })}
              />
            </div>

            {/* 3. Frequency Translation */}
            <div style={{
              background: 'rgba(16, 13, 38, 0.7)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(200, 190, 250, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} color="var(--lavender-tonic)" />
                  Analytic Frequency Shift (&Delta;f)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lavender-tonic)', fontWeight: '700' }}>
                  {effectsConfig.shift_hz > 0 ? `+${effectsConfig.shift_hz}` : effectsConfig.shift_hz} Hz
                </span>
              </div>
              <input 
                type="range"
                min="-1500"
                max="1500"
                step="25"
                value={effectsConfig.shift_hz}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, shift_hz: parseFloat(e.target.value) })}
              />
            </div>

            {/* 4. Convolution Echo */}
            <div style={{
              background: 'rgba(16, 13, 38, 0.7)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(200, 190, 250, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Repeat size={14} color="var(--accent-violet)" />
                  Convolution Echo &middot; y[n] = x * h
                </span>
                <div 
                  className={`pixel-switch ${effectsConfig.echo_enabled ? 'active' : ''}`}
                  onClick={() => onEffectsConfigChange({ ...effectsConfig, echo_enabled: !effectsConfig.echo_enabled })}
                >
                  <div className="pixel-switch-handle" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wet Mix:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lavender-tonic)' }}>{effectsConfig.echo_mix}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                step="1"
                value={effectsConfig.echo_mix}
                onChange={(e) => onEffectsConfigChange({ ...effectsConfig, echo_mix: parseFloat(e.target.value) })}
                disabled={!effectsConfig.echo_enabled}
              />

              <button
                className="swiss-btn"
                style={{ width: '100%', fontSize: '11px', marginTop: '10px', borderStyle: 'dashed' }}
                onClick={onOpenImpulseResponse}
              >
                Inspect Impulse Response h[n]
              </button>
            </div>

            <button 
              className="swiss-btn swiss-btn-aurora"
              style={{ width: '100%', padding: '11px', marginTop: '4px' }}
              onClick={onApplyEffects}
              disabled={isProcessing}
            >
              Apply Acoustic Chain
            </button>
          </>
        )}

      </div>

      {/* Master Processing Action */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(200, 190, 250, 0.12)',
        background: 'rgba(21, 17, 48, 0.85)'
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
          {isProcessing ? 'PROCESSING...' : 'RUN FULL DSP PIPELINE'}
        </button>
      </div>
    </div>
  );
}
