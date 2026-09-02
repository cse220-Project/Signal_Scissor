import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function SpectrumVisualizer({
  originalSpectrum,
  processedSpectrum,
  sampleRate = 8000,
  band = [900, 1100],
  onBandChange = null,
  bandOperation = "cut",
  isBandFilterActive = false,
  height = 240
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);
  const [isDraggingBand, setIsDraggingBand] = useState(null);

  const nyquist = sampleRate / 2;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const h = canvas.height;

    // Champion Blue background
    ctx.fillStyle = '#151130';
    ctx.fillRect(0, 0, width, h);

    const minDb = -80;
    const maxDb = 8;
    const dbRange = maxDb - minDb;

    // Horizontal dB reference lines
    const dbTicks = [-60, -40, -20, 0];
    ctx.strokeStyle = 'rgba(200, 190, 250, 0.07)';
    ctx.lineWidth = 1;
    ctx.font = '10px Archivo, sans-serif';
    ctx.fillStyle = 'rgba(200, 190, 250, 0.3)';

    dbTicks.forEach((db) => {
      const y = h - ((db - minDb) / dbRange) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(`${db}dB`, 8, y - 4);
    });

    // Vertical Frequency grid lines
    const freqSteps = [250, 500, 1000, 1500, 2000, 2500, 3000, 3500];
    freqSteps.forEach((freq) => {
      if (freq < nyquist) {
        const x = (freq / nyquist) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.fillText(`${freq >= 1000 ? (freq / 1000).toFixed(1) + 'k' : freq}`, x + 4, h - 8);
      }
    });

    // Highlighted Scissor Band
    if (isBandFilterActive && band && band.length === 2) {
      const lowX = Math.max(0, Math.min(width, (band[0] / nyquist) * width));
      const highX = Math.max(0, Math.min(width, (band[1] / nyquist) * width));
      const bandW = highX - lowX;

      const bandColor = bandOperation === 'cut' ? '#F472B6' : (bandOperation === 'keep' ? '#C8BEFA' : '#A78BFA');

      ctx.fillStyle = bandOperation === 'cut' 
        ? 'rgba(244, 114, 182, 0.14)' 
        : (bandOperation === 'keep' ? 'rgba(200, 190, 250, 0.16)' : 'rgba(167, 139, 250, 0.18)');
      ctx.fillRect(lowX, 0, bandW, h);

      ctx.strokeStyle = bandColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lowX, 0);
      ctx.lineTo(lowX, h);
      ctx.moveTo(highX, 0);
      ctx.lineTo(highX, h);
      ctx.stroke();

      ctx.fillStyle = bandColor;
      ctx.fillRect(lowX - 2, 0, 4, 16);
      ctx.fillRect(highX - 2, 0, 4, 16);

      ctx.font = '10px Archivo, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        `Band: ${band[0].toFixed(0)} - ${band[1].toFixed(0)} Hz [${bandOperation.toUpperCase()}]`,
        Math.max(12, lowX + 6),
        16
      );
    }

    // Render Curves
    const renderCurve = (spec, strokeColor, fillTop, fillBot, alpha = 1.0) => {
      if (!spec || !spec.freqs || !spec.mag_db || spec.freqs.length === 0) return;
      const freqs = spec.freqs;
      const mags = spec.mag_db;
      const count = freqs.length;

      ctx.save();
      ctx.globalAlpha = alpha;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, fillTop);
      grad.addColorStop(1, fillBot);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let i = 0; i < count; i++) {
        const x = (freqs[i] / nyquist) * width;
        const normDb = Math.max(minDb, Math.min(maxDb, mags[i]));
        const y = h - ((normDb - minDb) / dbRange) * h;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const x = (freqs[i] / nyquist) * width;
        const normDb = Math.max(minDb, Math.min(maxDb, mags[i]));
        const y = h - ((normDb - minDb) / dbRange) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
    };

    // Original Spectrum (Lavender Tonic)
    if (originalSpectrum) {
      renderCurve(
        originalSpectrum,
        '#C8BEFA',
        'rgba(200, 190, 250, 0.28)',
        'rgba(200, 190, 250, 0.0)',
        0.95
      );
    }

    // Processed Spectrum (Vivid Violet)
    if (processedSpectrum) {
      renderCurve(
        processedSpectrum,
        '#A78BFA',
        'rgba(167, 139, 250, 0.28)',
        'rgba(167, 139, 250, 0.0)',
        0.88
      );
    }

    // Hover tooltip
    if (hoverData) {
      const hoverX = (hoverData.freq / nyquist) * width;
      ctx.strokeStyle = 'rgba(200, 190, 250, 0.35)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(21, 17, 48, 0.95)';
      ctx.fillRect(Math.min(width - 125, Math.max(8, hoverX - 60)), 26, 120, 22);
      ctx.strokeStyle = 'rgba(200, 190, 250, 0.3)';
      ctx.strokeRect(Math.min(width - 125, Math.max(8, hoverX - 60)), 26, 120, 22);

      ctx.fillStyle = '#C8BEFA';
      ctx.font = '10px Archivo, sans-serif';
      ctx.fillText(
        `${hoverData.freq.toFixed(0)}Hz · ${hoverData.db.toFixed(1)}dB`,
        Math.min(width - 118, Math.max(14, hoverX - 52)),
        41
      );
    }
  }, [originalSpectrum, processedSpectrum, sampleRate, nyquist, band, bandOperation, isBandFilterActive, hoverData]);

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

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const freq = ratio * nyquist;
    const yRatio = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const db = -80 + yRatio * 88;
    setHoverData({ freq, db });

    if (isDraggingBand && onBandChange && band) {
      if (isDraggingBand === 'left') {
        const newLow = Math.max(10, Math.min(band[1] - 20, freq));
        onBandChange([newLow, band[1]]);
      } else if (isDraggingBand === 'right') {
        const newHigh = Math.min(nyquist, Math.max(band[0] + 20, freq));
        onBandChange([band[0], newHigh]);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (!band || !onBandChange) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const lowX = (band[0] / nyquist) * rect.width;
    const highX = (band[1] / nyquist) * rect.width;

    if (Math.abs(mouseX - lowX) < 14) {
      setIsDraggingBand('left');
    } else if (Math.abs(mouseX - highX) < 14) {
      setIsDraggingBand('right');
    }
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
          <SlidersHorizontal size={14} color="var(--lavender-tonic)" />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: '700', letterSpacing: '0.01em', color: '#FFFFFF' }}>
            Fourier Transform Spectrum Analyzer
          </span>
          <span className="swiss-tag" style={{ color: 'var(--lavender-tonic)', marginLeft: '4px' }}>
            [FFT MAGNITUDE]
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-sans)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--lavender-tonic)', boxShadow: '0 0 8px var(--lavender-tonic)' }} />
            <span style={{ color: 'var(--lavender-tonic)', fontWeight: '600' }}>Original |X(f)|</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-violet)' }} />
            <span style={{ color: 'var(--accent-violet)', fontWeight: '600' }}>Processed |Y(f)|</span>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef} 
        style={{ flex: 1, position: 'relative', cursor: isDraggingBand ? 'ew-resize' : 'crosshair', overflow: 'hidden' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={() => setIsDraggingBand(null)}
        onMouseLeave={() => { setHoverData(null); setIsDraggingBand(null); }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
