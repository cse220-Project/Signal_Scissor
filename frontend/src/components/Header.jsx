import React, { useRef, useState } from 'react';
import { Upload, Download, RotateCcw, BookOpen, Sparkles, Music, Activity, ChevronDown, Volume2 } from 'lucide-react';

export default function Header({
  sourceName,
  onLoadPreset,
  onUploadFile,
  onExportWav,
  onReset,
  onOpenTheory,
  isProcessing
}) {
  const fileInputRef = useRef(null);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState(null);

  const presets = [
    { id: 'pulse',      icon: <Volume2   size={13} />, label: 'Pulse (Echo Demo)' },
    { id: 'tones',      icon: <Sparkles size={13} />, label: 'Standard 3-Tone' },
    { id: 'multitone',  icon: <Music     size={13} />, label: '4-Harmonic' },
    { id: 'noise',      icon: <Activity  size={13} />, label: 'Tone + Noise' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
  };

  return (
    <header className="app-header" style={{ position: 'relative', zIndex: 20 }}>
      {/* ── Brand ────────────────────────────────── */}
      <div className="header-brand">
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(31, 35, 40, 0.22) 0%, rgba(69, 64, 79, 0.22) 100%)',
          border: '1px solid rgba(31, 35, 40, 0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px rgba(31, 35, 40, 0.28)'
        }}>
          <Activity size={21} color="var(--lavender-tonic)" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="trademark-logo" style={{ fontSize: '21px' }}>
              SIGNAL Scissors
            </h1>
            <span className="pixel-badge" style={{ color: 'var(--lavender-tonic)', borderColor: 'rgba(31, 35, 40, 0.4)', fontSize: '13px' }}>
              CSE:220
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.02em', marginTop: '1px' }}>
            DSP Studio · <span style={{ color: 'var(--text-secondary)' }}>{sourceName}</span>
          </p>
        </div>
      </div>

      {/* ── Preset Pills (hidden on small screens via CSS) ─── */}
      <div className="header-presets glass-pill" style={{ padding: '4px 6px' }}>
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '0 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
          PRESET:
        </span>
        {presets.map((p) => (
          <button
            key={p.id}
            className="swiss-btn"
            onMouseEnter={() => setHoveredPreset(p.id)}
            onMouseLeave={() => setHoveredPreset(null)}
            onClick={() => onLoadPreset(p.id)}
            style={{
              fontSize: '11px', padding: '4px 10px',
              borderRadius: 'var(--radius-pill)', border: 'none',
              background: hoveredPreset === p.id ? 'rgba(31, 35, 40, 0.14)' : 'transparent',
              color: hoveredPreset === p.id ? 'var(--lavender-tonic)' : 'var(--text-secondary)',
            }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* ── Actions ─────────────────────────────── */}
      <div className="header-actions">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" style={{ display: 'none' }} />

        <button className="swiss-btn" onClick={() => fileInputRef.current?.click()} title="Upload audio (any format, up to 60 MB)">
          <Upload size={13} color="var(--lavender-tonic)" />
          <span className="load-btn-label">Load Audio (≤60 MB)</span>
        </button>

        <button className="swiss-btn swiss-btn-primary" onClick={onExportWav} title="Export processed WAV">
          <Download size={13} />
          <span className="export-btn-label">Export WAV</span>
        </button>

        <button className="swiss-btn swiss-btn-aurora" onClick={onOpenTheory} title="CSE 220 Theory Inspector">
          <BookOpen size={13} />
          <span style={{ display: 'inline' }}>Theory</span>
        </button>

        <button
          className="swiss-btn"
          style={{ padding: '7px 10px', borderRadius: '50%', width: '36px', height: '36px' }}
          onClick={onReset}
          title="Reset to source"
        >
          <RotateCcw size={13} color="var(--text-muted)" />
        </button>
      </div>
    </header>
  );
}
