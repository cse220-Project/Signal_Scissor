import { useRef, useEffect, useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Select from '../../ui/Select';

export default function ConvolutionSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [irType, setIrType] = useState('echo');
  
  const isReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return false;
  }, []);

  const inputSignal = useMemo(() => {
    const sig = new Float32Array(64);
    for (let i = 10; i < 20; i++) sig[i] = Math.sin((i - 10) * 0.5) * Math.exp(-(i - 10) * 0.2);
    return sig;
  }, []);

  const impulseResponse = useMemo(() => {
    if (irType === 'impulse') return new Float32Array([1]);
    if (irType === 'ma') return new Float32Array([0.2, 0.2, 0.2, 0.2, 0.2]);
    // echo
    const ir = new Float32Array(20);
    ir[0] = 1;
    ir[10] = 0.5;
    ir[18] = 0.25;
    return ir;
  }, [irType]);

  const outputSignal = useMemo(() => {
    const out = new Float32Array(inputSignal.length + impulseResponse.length - 1);
    for (let n = 0; n < out.length; n++) {
      for (let k = 0; k < impulseResponse.length; k++) {
        if (n - k >= 0 && n - k < inputSignal.length) {
          out[n] += inputSignal[n - k] * impulseResponse[k];
        }
      }
    }
    return out;
  }, [inputSignal, impulseResponse]);

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
        
        const panelH = rect.height / 3;
        const drawPanel = (yOffset: number, title: string, data: Float32Array, highlightK: number = -1) => {
          ctx.fillStyle = '#111c2d';
          ctx.font = '12px sans-serif';
          ctx.fillText(title, 10, yOffset + 20);

          ctx.beginPath();
          ctx.strokeStyle = 'rgba(167, 196, 188, 0.3)';
          ctx.moveTo(10, yOffset + panelH / 2);
          ctx.lineTo(rect.width - 10, yOffset + panelH / 2);
          ctx.stroke();

          for(let i=0; i<data.length; i++) {
            const x = 20 + i * 4;
            const y = yOffset + panelH / 2 - data[i] * (panelH/2 - 10);
            
            ctx.beginPath();
            ctx.moveTo(x, yOffset + panelH / 2);
            ctx.lineTo(x, y);
            ctx.strokeStyle = (i === highlightK) ? '#49645d' : 'rgba(73, 100, 93, 0.7)';
            ctx.lineWidth = (i === highlightK) ? 2 : 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, 2*Math.PI);
            ctx.fillStyle = (i === highlightK) ? '#49645d' : 'rgba(73, 100, 93, 0.7)';
            ctx.fill();
          }
        };

        const currentN = isReducedMotion ? -1 : Math.floor(time / 10) % outputSignal.length;

        drawPanel(0, 'Input x[n]', inputSignal);
        drawPanel(panelH, 'Impulse Response h[n]', impulseResponse);
        drawPanel(panelH * 2, 'Output y[n]', outputSignal, currentN);

        if (!isReducedMotion) time++;
      }
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [inputSignal, impulseResponse, outputSignal, isReducedMotion]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Convolution & LTI Systems</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <span className="text-body-sm font-semibold">Impulse Response:</span>
        <Select 
          value={irType} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIrType(e.target.value)} 
          options={[
            { value: 'impulse', label: 'Impulse (identity)' },
            { value: 'echo', label: 'Short echo' },
            { value: 'ma', label: 'Moving average' }
          ]} 
        />
      </div>

      <canvas ref={canvasRef} className="w-full h-64 bg-surface-container-lowest rounded-xl shadow-inner mb-4" />
      
      <div className="bg-primary-container p-4 rounded-xl text-on-primary-container text-body-sm font-mono mb-4">
        <p>y[n] = Σ_k x[k] h[n-k]</p>
      </div>

      <div className="text-body-sm text-on-surface-variant italic space-y-2">
        <p>Note: The Reverb and Echo effects in this project use scipy.signal.convolve in dsp/effects.py.</p>
        <p>Note: The phase vocoder itself is NOT an LTI system — it involves time-varying phase manipulation.</p>
        <p>Why this matters: Convolution describes how LTI systems transform a signal. This project uses convolution for its effects pipeline, while using the phase vocoder for pitch/time manipulation.</p>
      </div>
    </Card>
  );
}
