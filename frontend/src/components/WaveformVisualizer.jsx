import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layers, Sparkles, Eye, Info } from 'lucide-react';

export default function WaveformVisualizer({
  title = "Time-Domain Signal",
  waveform = null,
  duration = 2.0,
  color = "#38BDF8",
  gradientTop = "rgba(56, 189, 248, 0.45)",
  gradientBot = "rgba(14, 116, 144, 0.05)",
  secondaryWaveform = null,
  secondaryColor = "#C084FC",
  currentTime = 0,
  onSeek = null,
  tag = "x[n]",
  height = 250,
  stats = null,
  originalDuration = null,
  processedDuration = null,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showSecondary, setShowSecondary] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null);

  // Measurements
  const margin = { left: 52, right: 42, top: 22, bottom: 26 };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const h = rect.height;
    if (width <= 0 || h <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark studio background
    ctx.fillStyle = '#f0ead8';
    ctx.fillRect(0, 0, width, h);

    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotWidth = Math.max(10, plotRight - plotLeft);
    const plotTop = margin.top;
    const plotBottom = h - margin.bottom;
    const plotHeight = Math.max(10, plotBottom - plotTop);
    const centerY = plotTop + plotHeight / 2;
    const scaleY = (plotHeight / 2) * 0.92;

    // Plot area background
    ctx.fillStyle = '#f0ead8';
    ctx.fillRect(plotLeft, plotTop, plotWidth, plotHeight);

    // ── Echo Tail Region Highlight ──────────────────────────────
    // When processed signal is longer than original, shade the tail region
    const safeDuration = duration > 0 ? duration : 2.0;
    const origDur = originalDuration || safeDuration;
    const procDur = processedDuration || safeDuration;

    if (procDur > origDur && origDur < safeDuration) {
      const tailStartX = plotLeft + (origDur / safeDuration) * plotWidth;
      const tailWidth = plotRight - tailStartX;

      if (tailWidth > 2) {
        // Subtle amber-tinted background for echo tail
        const tailGrad = ctx.createLinearGradient(tailStartX, plotTop, plotRight, plotTop);
        tailGrad.addColorStop(0, 'rgba(152, 106, 44, 0.06)');
        tailGrad.addColorStop(0.3, 'rgba(152, 106, 44, 0.10)');
        tailGrad.addColorStop(1, 'rgba(152, 106, 44, 0.04)');
        ctx.fillStyle = tailGrad;
        ctx.fillRect(tailStartX, plotTop, tailWidth, plotHeight);

        // Dashed vertical marker at original end
        ctx.save();
        ctx.strokeStyle = 'rgba(152, 106, 44, 0.50)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tailStartX, plotTop);
        ctx.lineTo(tailStartX, plotBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label the echo tail region
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(152, 106, 44, 0.70)';
        ctx.textAlign = 'center';
        const labelX = tailStartX + tailWidth / 2;
        if (tailWidth > 60) {
          ctx.fillText('ECHO TAIL', labelX, plotTop + 14);
          ctx.fillStyle = 'rgba(152, 106, 44, 0.45)';
          ctx.fillText(`+${((procDur - origDur) * 1000).toFixed(0)}ms`, labelX, plotTop + 26);
        }
        ctx.restore();
      }
    }

    // ── Horizontal Amplitude Grid & Rulers ──────────────────────
    const ampLevels = [
      { amp: 1.0,  label: '+1.0', db: ' 0dB' },
      { amp: 0.5,  label: '+0.5', db: '-6dB' },
      { amp: 0.0,  label: ' 0.0', db: ' -∞ ' },
      { amp: -0.5, label: '-0.5', db: '-6dB' },
      { amp: -1.0, label: '-1.0', db: ' 0dB' }
    ];

    // Minor amplitude gridlines
    const minorAmps = [0.75, 0.25, -0.25, -0.75];
    minorAmps.forEach((amp) => {
      const y = centerY - amp * scaleY;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.035)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 6]);
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    ampLevels.forEach(({ amp, label, db }) => {
      const y = centerY - amp * scaleY;
      const isZero = amp === 0;

      ctx.beginPath();
      ctx.strokeStyle = isZero ? 'rgba(31, 35, 40, 0.28)' : 'rgba(31, 35, 40, 0.07)';
      ctx.lineWidth = isZero ? 1.2 : 0.8;
      if (!isZero) ctx.setLineDash([3, 4]);
      else ctx.setLineDash([]);
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Axis Labels on left
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = isZero ? 'var(--lavender-tonic)' : 'rgba(31, 35, 40, 0.45)';
      ctx.textAlign = 'right';
      ctx.fillText(label, plotLeft - 7, y + 3.5);

      // dB labels on right
      ctx.fillStyle = isZero ? 'rgba(31, 35, 40, 0.35)' : 'rgba(31, 35, 40, 0.25)';
      ctx.textAlign = 'left';
      ctx.fillText(db, plotRight + 6, y + 3.5);
    });

    // ── Vertical Time Grid & Ruler ──────────────────────────────
    let timeStep = 0.5;
    if (safeDuration <= 0.8) timeStep = 0.1;
    else if (safeDuration <= 1.8) timeStep = 0.25;
    else if (safeDuration <= 4.0) timeStep = 0.5;
    else timeStep = 1.0;

    // Minor time gridlines (half-step)
    const minorStep = timeStep / 2;
    for (let t = minorStep; t < safeDuration; t += timeStep) {
      const x = plotLeft + (t / safeDuration) * plotWidth;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.03)';
      ctx.lineWidth = 0.5;
      ctx.moveTo(x, plotTop);
      ctx.lineTo(x, plotBottom);
      ctx.stroke();
    }

    const numTicks = Math.floor(safeDuration / timeStep);
    for (let i = 0; i <= numTicks; i++) {
      const t = i * timeStep;
      if (t > safeDuration) continue;
      const x = plotLeft + (t / safeDuration) * plotWidth;

      // Vertical line across plot
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.06)';
      ctx.lineWidth = 0.8;
      ctx.moveTo(x, plotTop);
      ctx.lineTo(x, plotBottom);
      ctx.stroke();

      // Tick on bottom ruler
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.3)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, plotBottom);
      ctx.lineTo(x, plotBottom + 4);
      ctx.stroke();

      // Time stamp text
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(31, 35, 40, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(`${t.toFixed(2)}s`, x, plotBottom + 16);
    }

    // ── Helper: Render Waveform Envelope ────────────────────────
    const renderEnvelope = (wf, strokeCol, fillGradTop, fillGradBot, alpha = 1.0, lineWidth = 1.4) => {
      if (!wf || !wf.peaks || wf.peaks.length === 0) return;
      const peaks = wf.peaks;
      const count = peaks.length;
      const numBuckets = count / 2;
      const step = plotWidth / numBuckets;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Waveform fill
      const grad = ctx.createLinearGradient(0, centerY - scaleY, 0, centerY + scaleY);
      grad.addColorStop(0, fillGradTop);
      grad.addColorStop(0.48, 'rgba(250, 249, 246, 0.1)');
      grad.addColorStop(0.52, 'rgba(250, 249, 246, 0.1)');
      grad.addColorStop(1, fillGradBot);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(plotLeft, centerY);

      // Top edge (peaks[i+1] = max)
      for (let i = 0; i < count; i += 2) {
        const x = plotLeft + (i / 2) * step;
        const maxAmp = peaks[i + 1] || 0;
        ctx.lineTo(x, centerY - maxAmp * scaleY);
      }
      // Bottom edge in reverse (peaks[i] = min)
      for (let i = count - 2; i >= 0; i -= 2) {
        const x = plotLeft + (i / 2) * step;
        const minAmp = peaks[i] || 0;
        ctx.lineTo(x, centerY - minAmp * scaleY);
      }
      ctx.closePath();
      ctx.fill();

      // Top contour stroke
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let i = 0; i < count; i += 2) {
        const x = plotLeft + (i / 2) * step;
        const maxAmp = peaks[i + 1] || 0;
        const y = centerY - maxAmp * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bottom contour stroke
      ctx.beginPath();
      for (let i = 0; i < count; i += 2) {
        const x = plotLeft + (i / 2) * step;
        const minAmp = peaks[i] || 0;
        const y = centerY - minAmp * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
    };

    // ── Secondary (Original) Trace in Comparison Mode ───────────
    if (secondaryWaveform && showSecondary) {
      renderEnvelope(
        secondaryWaveform,
        secondaryColor,
        'rgba(69, 64, 79, 0.16)',
        'rgba(69, 64, 79, 0.16)',
        0.75,
        1.0
      );
    }

    // ── Diff Glow Mode (Highlights where processed differs) ──────
    if (showDiff && waveform?.peaks && secondaryWaveform?.peaks) {
      const p1 = waveform.peaks;
      const p2 = secondaryWaveform.peaks;
      const len = Math.min(p1.length, p2.length);
      const step = plotWidth / (len / 2);

      ctx.save();
      ctx.strokeStyle = '#986a2c';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#986a2c';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let i = 0; i < len; i += 2) {
        const diffMax = Math.abs((p1[i + 1] || 0) - (p2[i + 1] || 0));
        if (diffMax > 0.05) {
          const x = plotLeft + (i / 2) * step;
          const y = centerY - diffMax * scaleY;
          ctx.moveTo(x, centerY);
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── Primary Waveform ────────────────────────────────────────
    if (waveform) {
      renderEnvelope(
        waveform,
        color,
        gradientTop,
        gradientBot,
        1.0,
        1.6
      );
    }

    // ── Active Hover Crosshair & HUD ────────────────────────────
    if (hoverInfo && hoverInfo.x >= plotLeft && hoverInfo.x <= plotRight) {
      const hx = hoverInfo.x;

      ctx.save();
      // Dashed vertical crosshair
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, plotTop);
      ctx.lineTo(hx, plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating HUD Badge
      const ratio = (hx - plotLeft) / plotWidth;
      const tHover = ratio * safeDuration;
      let ampText = "0.00";
      if (waveform?.peaks) {
        const idx = Math.floor(ratio * (waveform.peaks.length / 2)) * 2;
        const pMax = waveform.peaks[idx + 1] || 0;
        ampText = `${pMax >= 0 ? '+' : ''}${pMax.toFixed(3)}`;
      }

      const hudText = `t: ${tHover.toFixed(3)}s  |  Amp: ${ampText}`;
      ctx.font = '10.5px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(hudText).width;
      const hudW = textWidth + 16;
      const hudH = 22;
      const hudX = Math.max(plotLeft + 4, Math.min(plotRight - hudW - 4, hx - hudW / 2));
      const hudY = plotTop + 10;

      ctx.fillStyle = 'rgba(250, 249, 246, 0.88)';
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudW, hudH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1f2328';
      ctx.textAlign = 'left';
      ctx.fillText(hudText, hudX + 8, hudY + 15);
      ctx.restore();
    }

    // ── Glowing Playhead Needle ─────────────────────────────────
    if (safeDuration > 0 && currentTime >= 0) {
      const playX = plotLeft + (currentTime / safeDuration) * plotWidth;
      if (playX >= plotLeft && playX <= plotRight) {
        ctx.save();
        ctx.strokeStyle = '#1f2328';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = 'var(--lavender-tonic)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(playX, plotTop);
        ctx.lineTo(playX, plotBottom);
        ctx.stroke();

        // Top playback beacon triangle
        ctx.fillStyle = 'var(--lavender-tonic)';
        ctx.beginPath();
        ctx.moveTo(playX - 5, plotTop);
        ctx.lineTo(playX + 5, plotTop);
        ctx.lineTo(playX, plotTop + 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }, [waveform, secondaryWaveform, showSecondary, showDiff, color, secondaryColor, gradientTop, gradientBot, duration, currentTime, hoverInfo, originalDuration, processedDuration]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverInfo({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const plotLeft = margin.left;
    const plotRight = rect.width - margin.right;
    const plotWidth = plotRight - plotLeft;

    if (x >= plotLeft && x <= plotRight && onSeek) {
      const ratio = (x - plotLeft) / plotWidth;
      onSeek(ratio * duration);
    }
  };

  // Compute duration info for header
  const hasDurationChange = originalDuration && processedDuration && Math.abs(processedDuration - originalDuration) > 0.01;

  return (
    <div className="glass-panel workstation-waveform" style={{
      display: 'flex',
      flexDirection: 'column',
      height: `${height}px`,
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      border: '1px solid rgba(31, 35, 40, 0.16)'
    }}>
      {/* ── Studio Header Bar ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(31, 35, 40, 0.1)',
        background: 'rgba(250, 249, 246, 0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: '700',
            color: '#1f2328',
            letterSpacing: '0.02em'
          }}>
            {title}
          </span>
          <span className="pixel-badge" style={{
            fontSize: '11px',
            color: color,
            borderColor: `${color}66`,
            padding: '1px 6px'
          }}>
            {tag}
          </span>

          {/* Duration annotation badge */}
          {hasDurationChange ? (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#986a2c',
              background: 'rgba(152, 106, 44, 0.12)',
              border: '1px solid rgba(152, 106, 44, 0.30)',
              borderRadius: '4px',
              padding: '1px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⏱ {originalDuration.toFixed(2)}s → {processedDuration.toFixed(2)}s
            </span>
          ) : (
            stats && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'rgba(31, 35, 40, 0.5)',
                background: 'rgba(31, 35, 40, 0.06)',
                border: '1px solid rgba(31, 35, 40, 0.12)',
                borderRadius: '4px',
                padding: '1px 8px',
              }}>
                ⏱ {(duration || 2.0).toFixed(2)}s
              </span>
            )
          )}

          {stats && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginLeft: '4px'
            }}>
              RMS: <strong style={{ color: '#1f2328' }}>{stats.rms?.toFixed(3)}</strong> | Peak: <strong style={{ color: '#1f2328' }}>{stats.peak?.toFixed(3)}</strong>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {secondaryWaveform && (
            <button
              className="swiss-btn"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                background: showSecondary ? 'rgba(69, 64, 79, 0.18)' : 'transparent',
                borderColor: showSecondary ? 'var(--accent-violet)' : 'rgba(31, 35, 40, 0.2)'
              }}
              onClick={() => setShowSecondary(!showSecondary)}
              title="Overlay Original vs Processed trace"
            >
              <Layers size={12} color={showSecondary ? 'var(--lavender-tonic)' : 'var(--text-muted)'} />
              <span>{showSecondary ? 'Overlay: ON' : 'Overlay: OFF'}</span>
            </button>
          )}

          {secondaryWaveform && (
            <button
              className="swiss-btn"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                background: showDiff ? 'rgba(152, 106, 44, 0.2)' : 'transparent',
                borderColor: showDiff ? '#986a2c' : 'rgba(31, 35, 40, 0.2)'
              }}
              onClick={() => setShowDiff(!showDiff)}
              title="Highlight where processed audio diverges from original"
            >
              <Sparkles size={12} color={showDiff ? '#986a2c' : 'var(--text-muted)'} />
              <span>{showDiff ? 'Diff Glow: ON' : 'Diff Glow'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── High-DPI Interactive Canvas ───────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          cursor: 'crosshair',
          overflow: 'hidden'
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
}
