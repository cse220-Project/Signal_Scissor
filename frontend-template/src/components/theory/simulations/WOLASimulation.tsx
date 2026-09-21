import { useRef, useEffect, useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Slider from '../../ui/Slider';

export default function WOLASimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hopSize, setHopSize] = useState(32);
  
  const frameLength = 64;
  const numFrames = 4;
  const totalSamples = frameLength + (numFrames - 1) * hopSize;

  const isReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return false;
  }, []);

  const frames = useMemo(() => {
    const f = [];
    for (let m = 0; m < numFrames; m++) {
      const sig = new Float32Array(frameLength);
      for (let i = 0; i < frameLength; i++) {
        const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameLength - 1)));
        // Just a sine wave that aligns across frames for continuous look
        const phase = (i + m * hopSize) * 0.1; 
        sig[i] = Math.sin(phase) * hann;
      }
      f.push(sig);
    }
    return f;
  }, [hopSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isActive = false;
    let time = 0;

    const observer = new IntersectionObserver(([entry]) => { isActive = entry.isIntersecting; });
    observer.observe(canvas);

    const render = () => {
      if (isActive && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, rect.width, rect.height);
        
        const activeFrame = isPlaying && !isReducedMotion ? Math.floor(time / 60) % (numFrames + 1) : numFrames;

        const w = rect.width;
        const h = rect.height;
        const topH = h * 0.6;
        const botH = h * 0.4;

        // Draw individual frames
        for (let m = 0; m < numFrames; m++) {
          if (m >= activeFrame && activeFrame !== numFrames) continue;
          
          const xOffset = (m * hopSize / totalSamples) * w;
          const frameW = (frameLength / totalSamples) * w;

          ctx.beginPath();
          ctx.strokeStyle = m === activeFrame - 1 ? '#49645d' : 'rgba(167, 196, 188, 0.6)';
          ctx.lineWidth = m === activeFrame - 1 ? 2 : 1;
          
          for (let i = 0; i < frameLength; i++) {
            const x = xOffset + (i / frameLength) * frameW;
            const y = topH/2 - frames[m][i] * (topH/2 - 10);
            if(i===0) ctx.moveTo(x,y);
            else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }

        // Draw reconstructed sum
        const sum = new Float32Array(totalSamples);
        const winSqSum = new Float32Array(totalSamples);

        for (let m = 0; m < numFrames; m++) {
          if (m >= activeFrame && activeFrame !== numFrames) continue;
          for (let i = 0; i < frameLength; i++) {
            const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameLength - 1)));
            const idx = m * hopSize + i;
            sum[idx] += frames[m][i] * hann;
            winSqSum[idx] += hann * hann;
          }
        }

        ctx.beginPath();
        ctx.strokeStyle = '#111c2d';
        ctx.lineWidth = 2;
        for (let i = 0; i < totalSamples; i++) {
          const val = winSqSum[i] > 1e-6 ? sum[i] / winSqSum[i] : 0;
          const x = (i / totalSamples) * w;
          const y = topH + botH/2 - val * (botH/2 - 10);
          if(i===0) ctx.moveTo(x,y);
          else ctx.lineTo(x,y);
        }
        ctx.stroke();

        ctx.fillStyle = '#111c2d';
        ctx.font = '12px sans-serif';
        ctx.fillText('Overlapping Frames', 10, 20);
        ctx.fillText('Reconstructed (Sum & Normalize)', 10, topH + 20);

        if (isPlaying && !isReducedMotion) time++;
      }
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [frames, hopSize, isPlaying, totalSamples, isReducedMotion]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Weighted Overlap-Add (WOLA)</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play Animation'}
        </Button>
        <span className="text-body-sm font-semibold ml-4">Hop Size:</span>
        <Slider min={8} max={48} step={8} value={hopSize} onChange={(val: number) => setHopSize(Number(val))} />
        <span className="font-mono bg-surface-container px-2 py-1 rounded text-body-sm">{hopSize}</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-64 bg-surface-container-lowest rounded-xl shadow-inner mb-4" />
      
      <div className="bg-primary-container p-4 rounded-xl text-on-primary-container text-body-sm font-mono mb-4">
        <p>y_frame[m] = IFFT(Y[m,:])</p>
        <p>output[n] = Σ_m (y_frame[m] × window[n - m×Hs]) / Σ_m window²[n - m×Hs]</p>
      </div>

      <p className="text-body-sm text-on-surface-variant italic">
        Why this matters: Individual IFFT frames are local reconstructions with edges tapered by windows. Overlap-add with window² normalization recombines them into a smooth, continuous output signal.
      </p>
    </Card>
  );
}
