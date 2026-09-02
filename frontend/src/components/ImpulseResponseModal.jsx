import React, { useRef, useEffect } from 'react';
import { X, Activity } from 'lucide-react';

export default function ImpulseResponseModal({
  isOpen,
  onClose,
  impulseData
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !impulseData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Deep space background
    ctx.fillStyle = '#060B17';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 60;
    const padRight = 40;
    const padTop = 40;
    const padBottom = 50;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Zero-line
    const zeroY = padTop + plotHeight * 0.88;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(padLeft + plotWidth, zeroY);
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, zeroY);
    ctx.stroke();

    // Axis Labels
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('1.0', padLeft - 30, padTop + 10);
    ctx.fillText('0.5', padLeft - 30, padTop + plotHeight * 0.44);
    ctx.fillText('0.0', padLeft - 30, zeroY + 4);

    ctx.fillText('Time (ms)', width / 2 - 25, height - 12);
    ctx.save();
    ctx.translate(16, height / 2 + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude h[n]', 0, 0);
    ctx.restore();

    // Draw Stems
    const stems = impulseData.stems || [];
    if (stems.length === 0) return;

    const maxTime = Math.max(100, stems[stems.length - 1]?.t_ms * 1.15 || 800);

    stems.forEach((stem, idx) => {
      const x = padLeft + (stem.t_ms / maxTime) * plotWidth;
      const stemHeight = stem.amp * (plotHeight * 0.82);
      const y = zeroY - stemHeight;

      // Stem line
      ctx.strokeStyle = idx === 0 ? '#14F1D9' : '#F43F9E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, zeroY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Marker circle
      ctx.fillStyle = idx === 0 ? '#14F1D9' : '#F43F9E';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Amplitude tag
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${stem.amp.toFixed(2)}`, x - 12, y - 10);

      // Time tag
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(`${stem.t_ms.toFixed(0)}ms`, x - 16, zeroY + 18);
    });
  }, [isOpen, impulseData]);

  if (!isOpen) return null;

  return (
    <div className="glass-modal-backdrop" onClick={onClose}>
      <div className="glass-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(6, 11, 24, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="var(--aurora-magenta)" />
            <h2 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Convolution Echo Impulse Response h[n]
            </h2>
          </div>
          <button className="swiss-btn" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <div style={{
            background: 'rgba(6, 10, 20, 0.6)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '18px'
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--aurora-cyan)', fontWeight: '700' }}>
              Discrete Convolution Equation: y[n] = (x &lowast; h)[n] = &sum; x[k] &middot; h[n - k]
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {impulseData?.formula || 'h[n] = δ[n] + decay · δ[n - n₀] + decay² · δ[n - 2n₀] + ...'}
            </p>
          </div>

          <div style={{ width: '100%', height: '270px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <canvas ref={canvasRef} width="760" height="270" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '18px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            <div>Sampling: <span style={{ color: '#FFFFFF' }}>{impulseData?.sample_rate || 8000} Hz</span></div>
            <div>Delay Index (n₀): <span style={{ color: 'var(--aurora-blue)' }}>{impulseData?.delay_ms || 250} ms</span></div>
            <div>Decay Factor (&alpha;): <span style={{ color: 'var(--aurora-magenta)' }}>{((impulseData?.decay || 0.5) * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
