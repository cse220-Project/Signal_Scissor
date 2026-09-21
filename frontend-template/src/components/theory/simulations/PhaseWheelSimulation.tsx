import { useRef, useEffect, useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Slider from '../../ui/Slider';

export default function PhaseWheelSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [advance, setAdvance] = useState(0.5);
  const [mode, setMode] = useState<'wrapped' | 'unwrapped'>('wrapped');
  
  const phaseRef = useRef({ unwrapped: 0, wrapped: 0 });
  const historyRef = useRef<{w: number, u: number}[]>([]);
  
  const isReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isActive = false;
    let lastTime = performance.now();

    const observer = new IntersectionObserver(([entry]) => { isActive = entry.isIntersecting; });
    observer.observe(canvas);

    const render = (time: number) => {
      if (isActive && ctx && !isReducedMotion) {
        if (time - lastTime > 50) {
          phaseRef.current.unwrapped += advance;
          // Wrap to -pi to pi
          phaseRef.current.wrapped = ((phaseRef.current.unwrapped + Math.PI) % (2 * Math.PI)) - Math.PI;
          if (phaseRef.current.wrapped < -Math.PI) phaseRef.current.wrapped += 2 * Math.PI;
          
          historyRef.current.push({ w: phaseRef.current.wrapped, u: phaseRef.current.unwrapped });
          if (historyRef.current.length > 100) historyRef.current.shift();
          lastTime = time;
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw Wheel
        const cx = rect.width / 4;
        const cy = rect.height / 2;
        const r = Math.min(cx, cy) - 20;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = '#a7c4bc';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw axes
        ctx.beginPath();
        ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
        ctx.strokeStyle = 'rgba(167, 196, 188, 0.3)';
        ctx.stroke();

        // Draw phasor
        const currentPhase = mode === 'wrapped' ? phaseRef.current.wrapped : phaseRef.current.unwrapped;
        const px = cx + r * Math.cos(currentPhase);
        const py = cy + r * Math.sin(currentPhase);
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = '#49645d';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2*Math.PI);
        ctx.fillStyle = '#49645d';
        ctx.fill();

        // Draw history graph
        const graphX = rect.width / 2;
        const graphW = rect.width / 2 - 20;
        const graphH = rect.height - 40;
        
        ctx.strokeStyle = 'rgba(167, 196, 188, 0.3)';
        ctx.strokeRect(graphX, 20, graphW, graphH);
        
        ctx.beginPath();
        ctx.moveTo(graphX, 20 + graphH/2);
        ctx.lineTo(graphX + graphW, 20 + graphH/2);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#49645d';
        ctx.lineWidth = 2;
        
        historyRef.current.forEach((pt, i) => {
          const x = graphX + (i / 100) * graphW;
          let yVal = mode === 'wrapped' ? pt.w / Math.PI : pt.u / (Math.PI * 4); // Scale arbitrary for display
          // clamp yVal for display
          yVal = Math.max(-1, Math.min(1, yVal));
          const y = 20 + graphH/2 - yVal * (graphH/2);
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [advance, mode, isReducedMotion]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Phase Wheel & Wrapping</h3>
      <div className="flex gap-4 mb-4 items-center">
        <Button onClick={() => setMode(mode === 'wrapped' ? 'unwrapped' : 'wrapped')}>
          Mode: {mode === 'wrapped' ? 'Wrapped Phase (-π to π)' : 'Unwrapped Phase (Continuous)'}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-body-sm">Phase Advance per step:</span>
          <Slider min={0.1} max={1.5} step={0.1} value={advance} onChange={(val: number) => setAdvance(Number(val))} />
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-64 bg-surface-container-lowest rounded-xl shadow-inner mb-4" />
      
      <div className="bg-primary-container p-4 rounded-xl text-on-primary-container text-body-sm font-mono mb-4">
        <p>Δφ[k] = φ_curr[k] - φ_prev[k]</p>
        <p>residual[k] = wrap(Δφ[k] - expected[k])</p>
      </div>

      <p className="text-body-sm text-on-surface-variant italic">
        Why this matters: Phase must be tracked continuously across frames. Because phase is defined modulo 2π, raw phase differences jump when they cross ±π. Wrapping corrects this to get the true instantaneous frequency deviation.
      </p>
    </Card>
  );
}
