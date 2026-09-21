import { useRef, useEffect, useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Button from '../../ui/Button';

export default function TimeStretchSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stretchFactor, setStretchFactor] = useState(1.0);
  
  const factors = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  
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
    let playhead = 0;

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
        
        const w = rect.width / 2;
        const h = rect.height;
        
        const drawWave = (xOffset: number, factor: number) => {
          ctx.beginPath();
          ctx.strokeStyle = '#49645d';
          ctx.lineWidth = 2;
          
          const maxSamples = 200;
          const displaySamples = maxSamples * factor;
          
          for(let i=0; i<displaySamples; i++) {
            // Constant frequency, just different duration
            const y = h/2 - Math.sin(i * 0.1) * (h/4);
            const x = xOffset + (i / (maxSamples * 2)) * w; // scaled to fit max possible stretch (2.0)
            if(i===0) ctx.moveTo(x,y);
            else ctx.lineTo(x,y);
          }
          ctx.stroke();

          if (!isReducedMotion) {
            const phX = xOffset + (playhead / (maxSamples * 2)) * w;
            ctx.beginPath();
            ctx.moveTo(phX, 0);
            ctx.lineTo(phX, h);
            ctx.strokeStyle = 'rgba(167, 196, 188, 0.8)';
            ctx.stroke();
          }
        };

        drawWave(0, 1.0);
        ctx.fillStyle = '#111c2d';
        ctx.font = '14px sans-serif';
        ctx.fillText('Original', 10, 20);

        drawWave(w, stretchFactor);
        ctx.fillText(`Time Stretched (${stretchFactor}x)`, w + 10, 20);

        if (!isReducedMotion) {
          playhead = (playhead + 1) % (200 * Math.max(1.0, stretchFactor));
        }
      }
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [stretchFactor, isReducedMotion]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Time Stretching</h3>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        {factors.map(f => (
          <Button 
            key={f} 
            variant={stretchFactor === f ? 'primary' : 'secondary'}
            onClick={() => setStretchFactor(f)}
          >
            {f}x
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-center text-body-sm bg-surface-container-low p-4 rounded-xl">
        <div>
          <p className="font-semibold text-primary">Input duration: 1.0s</p>
        </div>
        <div>
          <p className="font-semibold text-primary">Output duration: {stretchFactor.toFixed(2)}s</p>
          <p className="text-xs text-on-surface-variant">Pitch: unchanged (phase vocoder preserves pitch)</p>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-48 bg-surface-container-lowest rounded-xl shadow-inner mb-4" />
      
      <div className="bg-primary-container p-4 rounded-xl text-on-primary-container text-body-sm font-mono mb-4">
        <p>Hs = Ha × stretch_factor</p>
        <p>(default Ha = 512)</p>
      </div>

      <p className="text-body-sm text-on-surface-variant italic">
        Why this matters: Time stretching changes only duration, not pitch. The phase vocoder achieves this by using a synthesis hop (Hs) that differs from the analysis hop (Ha), changing the temporal spacing of output frames.
      </p>
    </Card>
  );
}
