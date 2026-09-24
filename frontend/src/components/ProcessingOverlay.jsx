import React, { useEffect, useRef } from 'react';
import { X, Cpu, Waves, SlidersHorizontal, Upload } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────
   ProcessingOverlay
   Full-viewport glass overlay that blocks all interaction while a DSP
   task or file-load is in progress. Provides a Cancel button that
   calls onCancel() which should abort the in-flight request.
───────────────────────────────────────────────────────────────────── */

const TASK_META = {
  filter:   { icon: <SlidersHorizontal size={28} />, title: 'Fourier Band Filter',   sub: 'Computing FFT, applying band operation…'      },
  effects:  { icon: <Waves             size={28} />, title: 'Acoustic Effects Chain', sub: 'Scaling, delaying, convolving impulse…'         },
  pipeline: { icon: <Cpu              size={28} />, title: 'Full DSP Pipeline',      sub: 'Running complete filter + effects chain…'       },
  upload:   { icon: <Upload            size={28} />, title: 'Loading Audio File',     sub: '' },
  signal:   { icon: <Waves             size={28} />, title: 'Generating Signal',      sub: 'Synthesizing test tones with numpy…'           },
};

export default function ProcessingOverlay({ isVisible, taskType = 'pipeline', onCancel }) {
  const meta = TASK_META[taskType] || TASK_META.pipeline;
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  // Pixel-art oscilloscope animation
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const animate = () => {
      frameRef.current += 1;
      const t = frameRef.current;

      ctx.fillStyle = 'rgba(250, 249, 246, 0.96)';
      ctx.fillRect(0, 0, W, H);

      // Scanline texture
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = 'rgba(31, 35, 40, 0.02)';
        ctx.fillRect(0, y, W, 1);
      }

      // Pixel grid
      ctx.strokeStyle = 'rgba(31, 35, 40, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 8) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 8) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Aurora glow orbs
      const orbs = [
        { x: W * 0.22, y: H * 0.4, r: 80, color: '#59636e', phase: 0 },
        { x: W * 0.78, y: H * 0.5, r: 90, color: '#45404f', phase: 2 },
        { x: W * 0.5,  y: H * 0.8, r: 70, color: '#3f7856', phase: 4 },
      ];
      orbs.forEach(({ x, y, r, color, phase }) => {
        const pulse = 0.12 + 0.06 * Math.sin((t + phase * 20) * 0.04);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * (1 + pulse));
        grad.addColorStop(0, color + '55');
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r * (1 + pulse), 0, Math.PI * 2); ctx.fill();
      });

      // Waveform bars — retro pixel style
      const barCount = 28;
      const barW = 4;
      const gap = (W - barCount * barW) / (barCount + 1);
      for (let i = 0; i < barCount; i++) {
        const xPos = gap + i * (barW + gap);
        const phase = (t * 0.06 + i * 0.35) % (Math.PI * 2);
        const barH = (Math.sin(phase) * 0.4 + Math.sin(phase * 2.3 + 1) * 0.2 + 0.5) * (H * 0.55);
        const alpha = 0.65 + 0.3 * Math.sin(phase);

        // Lavender Tonic gradient bar
        const barGrad = ctx.createLinearGradient(xPos, H / 2 - barH / 2, xPos, H / 2 + barH / 2);
        barGrad.addColorStop(0, `rgba(200, 190, 250, ${alpha})`);
        barGrad.addColorStop(0.5, `rgba(167, 139, 250, ${alpha * 0.8})`);
        barGrad.addColorStop(1, `rgba(94, 234, 212, ${alpha * 0.5})`);

        ctx.fillStyle = barGrad;
        ctx.fillRect(xPos, H / 2 - barH / 2, barW, barH);

        // Pixel top cap
        ctx.fillStyle = '#59636e';
        ctx.fillRect(xPos, H / 2 - barH / 2 - 2, barW, 2);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="workstation-processing" style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(31, 35, 40, 0.3)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      animation: 'overlayIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseIcon {
          0%, 100% { filter: drop-shadow(0 0 6px #59636e88); }
          50%       { filter: drop-shadow(0 0 18px #59636ecc); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1.0); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: 'rgba(250, 249, 246, 0.96)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(31, 35, 40, 0.22)',
        borderRadius: '24px',
        boxShadow: '0 32px 80px rgba(250, 249, 246, 0.8), 0 0 0 1px rgba(31, 35, 40, 0.12), inset 0 1px 0 rgba(31, 35, 40, 0.06)',
        width: '460px', maxWidth: '92vw',
        overflow: 'hidden',
        animation: 'cardIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        {/* Pixel-art oscilloscope canvas */}
        <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            width={460}
            height={140}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {/* Swiss horizontal rule overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(31, 35, 40, 0.4) 30%, rgba(31, 35, 40, 0.4) 70%, transparent)'
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '28px 32px 32px 32px' }}>

          {/* Icon + Spinner ring */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px'
          }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
              {/* Spinning arc ring */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#59636e',
                borderRightColor: 'rgba(31, 35, 40, 0.3)',
                animation: 'spinRing 1s linear infinite'
              }} />
              <div style={{
                position: 'absolute', inset: '5px', borderRadius: '50%',
                border: '1.5px solid transparent',
                borderTopColor: '#45404f',
                borderLeftColor: 'rgba(69, 64, 79, 0.3)',
                animation: 'spinRing 1.5s linear infinite reverse'
              }} />
              {/* Icon center */}
              <div style={{
                position: 'absolute', inset: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--lavender-tonic, #59636e)',
                animation: 'pulseIcon 2s ease-in-out infinite'
              }}>
                {meta.icon}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em',
                color: 'var(--lavender-tonic, #59636e)', textTransform: 'uppercase',
                marginBottom: '5px'
              }}>
                ◉ PROCESSING
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display, "Liberation Sans", sans-serif)',
                fontSize: '20px', fontWeight: '400',
                color: '#1f2328', lineHeight: '1.2', marginBottom: '6px'
              }}>
                {meta.title}
              </h2>
              <p style={{
                fontFamily: 'var(--font-sans, Archivo, sans-serif)',
                fontSize: '12.5px', color: 'rgba(31, 35, 40, 0.65)', lineHeight: '1.5'
              }}>
                {meta.sub}
              </p>
            </div>
          </div>

          {/* Retro dot-bounce progress */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: i < 3 ? 'var(--lavender-tonic, #59636e)' : 'rgba(31, 35, 40, 0.2)',
                  boxShadow: i < 3 ? '0 0 6px #59636e' : 'none',
                  animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite`
                }} />
              ))}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: '11px',
              color: 'rgba(31, 35, 40, 0.5)', letterSpacing: '0.06em'
            }}>
              Python DSP Engine Running…
            </span>
          </div>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            style={{
              width: '100%', padding: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'var(--font-sans, Archivo, sans-serif)',
              fontSize: '13px', fontWeight: '700', letterSpacing: '0.04em',
              background: 'rgba(31, 35, 40, 0.08)',
              border: '1px solid rgba(31, 35, 40, 0.25)',
              borderRadius: '10px',
              color: 'rgba(31, 35, 40, 0.75)',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(185, 74, 72, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(185, 74, 72, 0.5)';
              e.currentTarget.style.color = '#b94a48';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(185, 74, 72, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(31, 35, 40, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(31, 35, 40, 0.25)';
              e.currentTarget.style.color = 'rgba(31, 35, 40, 0.75)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <X size={15} />
            Cancel Operation
          </button>

          {/* Swiss footer note */}
          <p style={{
            textAlign: 'center', marginTop: '14px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px', color: 'rgba(31, 35, 40, 0.25)', letterSpacing: '0.06em'
          }}>
            CSE 220 DSP ENGINE · FOURIER_FILTER.PY · AUDIO_EFFECTS.PY
          </p>
        </div>
      </div>
    </div>
  );
}
