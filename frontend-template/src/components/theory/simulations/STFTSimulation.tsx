import { useRef, useEffect, useState, useCallback, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Slider from '../../ui/Slider';
import Select from '../../ui/Select';
import Badge from '../../ui/Badge';

export default function STFTSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windowSize, setWindowSize] = useState(64);
  const [hopSize, setHopSize] = useState(16);
  const [windowType, setWindowType] = useState('hann');
  
  const frameRef = useRef(0);
  const totalSamples = 256;
  const isReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  // Generate synthetic signal
  const signal = useMemo(() => {
    const sig = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      sig[i] = Math.sin(2 * Math.PI * 0.05 * i) + 0.5 * Math.sin(2 * Math.PI * 0.15 * i);
    }
    return sig;
  }, [totalSamples]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, currentPos: number) => {
    ctx.clearRect(0, 0, width, height);
    const topHeight = height * 0.4;
    const bottomHeight = height * 0.4;
    
    // Draw original signal
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(73, 100, 93, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < totalSamples; i++) {
      const x = (i / totalSamples) * width;
      const y = topHeight / 2 - (signal[i] / 1.5) * (topHeight / 2 - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw sliding window
    const windowStart = currentPos;
    const windowEnd = currentPos + windowSize;
    const startX = (windowStart / totalSamples) * width;
    const endX = (windowEnd / totalSamples) * width;
    
    ctx.fillStyle = 'rgba(167, 196, 188, 0.3)';
    ctx.fillRect(startX, 0, endX - startX, topHeight);
    
    ctx.strokeStyle = '#49645d';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, endX - startX, topHeight);

    // Draw windowed frame & magnitude spectrum pseudo-visualization below
    ctx.beginPath();
    ctx.strokeStyle = '#111c2d';
    for (let i = 0; i < windowSize; i++) {
      const globalIdx = (windowStart + i) % totalSamples;
      // Window function
      let w = 1;
      if (windowType === 'hann') w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
      else if (windowType === 'hamming') w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (windowSize - 1));
      
      const val = signal[globalIdx] * w;
      const x = (i / windowSize) * width;
      const y = topHeight + 20 + bottomHeight / 2 - (val / 1.5) * (bottomHeight / 2 - 10);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [signal, windowSize, windowType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isActive = false;

    const observer = new IntersectionObserver(([entry]) => {
      isActive = entry.isIntersecting;
    });
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

        draw(ctx, rect.width, rect.height, frameRef.current);

        if (isPlaying && !isReducedMotion) {
          frameRef.current = (frameRef.current + hopSize / 10) % (totalSamples - windowSize);
        }
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [isPlaying, draw, hopSize, totalSamples, windowSize, isReducedMotion]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">STFT Sliding Window</h3>
      <div className="flex gap-4 mb-4 items-center flex-wrap">
        <Button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-body-sm">Window Size:</span>
          <Slider min={32} max={128} step={16} value={windowSize} onChange={(val: number) => setWindowSize(Number(val))} />
          <Badge>{windowSize}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm">Hop Size:</span>
          <Slider min={8} max={64} step={8} value={hopSize} onChange={(val: number) => setHopSize(Number(val))} />
          <Badge>{hopSize}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm">Window:</span>
          <Select 
            value={windowType} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWindowType(e.target.value)} 
            options={[
              { value: 'hann', label: 'Hann' },
              { value: 'hamming', label: 'Hamming' },
              { value: 'rectangular', label: 'Rectangular' }
            ]} 
          />
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-64 bg-surface-container-lowest rounded-xl shadow-inner mb-4" />
      
      <div className="bg-primary-container p-4 rounded-xl text-on-primary-container text-body-sm">
        <p className="font-semibold mb-2">Time-Frequency Tradeoff:</p>
        <ul className="list-disc ml-5">
          <li>Larger window → Better frequency resolution, worse time localization</li>
          <li>Smaller window → Better time localization, worse frequency resolution</li>
        </ul>
      </div>
      <p className="text-body-sm text-on-surface-variant mt-4 italic">
        Why STFT: The STFT is the core analysis tool. It gives the phase vocoder a local frequency-domain snapshot at each time frame, enabling per-bin phase manipulation.
      </p>
    </Card>
  );
}
