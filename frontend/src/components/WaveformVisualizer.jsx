import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layers } from 'lucide-react';

export default function WaveformVisualizer({
  title = "Time-Domain Signal",
  waveform = null,
  duration = 2.0,
  color = "#C8BEFA",
  secondaryWaveform = null,
  secondaryColor = "#A78BFA",
  currentTime = 0,
  onSeek = null,
  tag = "x[n]",
  height = 200
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showSecondary, setShowSecondary] = useState(true);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const h = canvas.height;

    // Champion Blue background
    ctx.fillStyle = '#151130';
    ctx.fillRect(0, 0, width, h);

    // Grid lines in subtle Lavender Tonic
    ctx.strokeStyle = 'rgba(200, 190, 250, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(width, h / 2);
    ctx.stroke();

    // Time division lines
    ctx.font = '10px Archivo, sans-serif';
    ctx.fillStyle = 'rgba(200, 190, 250, 0.35)';
    for (let i = 1; i <= 3; i++) {
      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      const tVal = ((duration / 4) * i).toFixed(2);
      ctx.fillText(`${tVal}s`, x + 4, h - 8);
    }

    // Render waveform curve
    const renderWave = (wf, strokeCol, fillTop, fillBot, alpha = 1.0) => {
      if (!wf || !wf.peaks || wf.peaks.length === 0) return;
      const peaks = wf.peaks;
      const centerY = h / 2;
      const scaleY = h * 0.42;

      ctx.save();
      ctx.globalAlpha = alpha;

      const grad = ctx.createLinearGradient(0, centerY - scaleY, 0, centerY + scaleY);
      grad.addColorStop(0, fillTop);
      grad.addColorStop(0.5, 'rgba(21, 17, 48, 0)');
      grad.addColorStop(1, fillBot);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      const step = width / (peaks.length / 2);
      for (let i = 0; i < peaks.length; i += 2) {
        const x = (i / 2) * step;
        const maxAmp = peaks[i + 1] || 0;
        ctx.lineTo(x, centerY - maxAmp * scaleY);
      }
      for (let i = peaks.length - 2; i >= 0; i -= 2) {
        const x = (i / 2) * step;
        const minAmp = peaks[i] || 0;
        ctx.lineTo(x, centerY - minAmp * scaleY);
      }
      ctx.closePath();
      ctx.fill();

      // Stroke line
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < peaks.length; i += 2) {
        const x = (i / 2) * step;
        const maxAmp = peaks[i + 1] || 0;
        const y = centerY - maxAmp * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Secondary Waveform
    if (secondaryWaveform && showSecondary) {
      renderWave(
        secondaryWaveform, 
        secondaryColor, 
        'rgba(167, 139, 250, 0.25)', 
        'rgba(167, 139, 250, 0.25)', 
        0.85
      );
    }

    // Primary Waveform (Lavender Tonic)
    if (waveform) {
      renderWave(
        waveform, 
        color, 
        'rgba(200, 190, 250, 0.35)', 
        'rgba(200, 190, 250, 0.35)', 
        1.0
      );
    }

    // Glowing Playhead
    if (duration > 0 && currentTime >= 0) {
      const playX = (currentTime / duration) * width;
      if (playX >= 0 && playX <= width) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#C8BEFA';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(playX, 0);
        ctx.lineTo(playX, h);
        ctx.stroke();

        ctx.fillStyle = '#C8BEFA';
        ctx.beginPath();
        ctx.arc(playX, 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [waveform, secondaryWaveform, showSecondary, color, secondaryColor, duration, currentTime]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        draw();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (onSeek) onSeek(ratio * duration);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: `${height}px` }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: '1px solid rgba(200, 190, 250, 0.08)',
        background: 'rgba(21, 17, 48, 0.65)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: '700', letterSpacing: '0.01em', color: '#FFFFFF' }}>
            {title}
          </span>
          <span className="swiss-tag" style={{ color: color, marginLeft: '4px' }}>
            [{tag}]
          </span>
        </div>

        {secondaryWaveform && (
          <button 
            className="swiss-btn"
            style={{ fontSize: '11px', padding: '3px 9px', borderRadius: 'var(--radius-pill)' }}
            onClick={() => setShowSecondary(!showSecondary)}
            title="Toggle secondary output comparison trace"
          >
            <Layers size={12} color={showSecondary ? secondaryColor : 'var(--text-muted)'} />
            <span style={{ color: showSecondary ? '#FFFFFF' : 'var(--text-muted)' }}>
              {showSecondary ? 'Compare: ON' : 'Compare: OFF'}
            </span>
          </button>
        )}
      </div>

      <div 
        ref={containerRef} 
        style={{ flex: 1, position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
