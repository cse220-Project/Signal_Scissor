import { useRef, useEffect, useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Slider from '../../ui/Slider';

export default function ResamplingSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resampleFactor, setResampleFactor] = useState(1.0);
  
  const originalSamples = 64;
  const nSamples = Math.floor(originalSamples / resampleFactor);

  const signal = useMemo(() => {
    const sig = new Float32Array(originalSamples);
    for (let i = 0; i < originalSamples; i++) {
      sig[i] = Math.sin((i / originalSamples) * 4 * Math.PI); // 2 periods
    }
    return sig;
  }, []);

  const resampled = useMemo(() => {
    const sig = new Float32Array(nSamples);
    for (let i = 0; i < nSamples; i++) {
      const idx = i * resampleFactor;
      const floor = Math.floor(idx);
      const ceil = Math.min(Math.ceil(idx), originalSamples - 1);
      const frac = idx - floor;
      
      const v1 = signal[floor] || 0;
      const v2 = signal[ceil] || 0;
      sig[i] = v1 * (1 - frac) + v2 * frac;
    }
    return sig;
  }, [nSamples, resampleFactor, signal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const w = rect.width / 2;
    const h = rect.height;

    const drawSignal = (sig: Float32Array, xOffset: number, label: string) => {
      ctx.strokeStyle = 'rgba(167, 196, 188, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xOffset, h/2);
      ctx.lineTo(xOffset + w, h/2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#49645d';
      ctx.lineWidth = 2;
      
      for(let i=0; i<sig.length; i++) {
        const x = xOffset + (i / sig.length) * (w - 20) + 10;
        const y = h/2 - sig[i] * (h/4);
        
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }
      ctx.stroke();

      // Draw dots
      ctx.fillStyle = '#111c2d';
      for(let i=0; i<sig.length; i++) {
        const x = xOffset + (i / sig.length) * (w - 20) + 10;
        const y = h/2 - sig[i] * (h/4);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2*Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = '#111c2d';
      ctx.font = '14px sans-serif';
      ctx.fillText(label, xOffset + 10, 20);
    };

    drawSignal(signal, 0, 'Original');
    drawSignal(resampled, w, `Resampled (${resampleFactor}x)`);

  }, [signal, resampled, resampleFactor]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Naive Resampling</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <span className="text-body-sm font-semibold">Resample Factor:</span>
        <Slider min={0.5} max={2.0} step={0.1} value={resampleFactor} onChange={(val: number) => setResampleFactor(Number(val))} />
        <span className="font-mono bg-surface-container px-2 py-1 rounded text-body-sm">{resampleFactor.toFixed(1)}x</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-center text-body-sm">
        <div className="bg-surface-container-low p-4 rounded-xl">
          <p>Original samples: {originalSamples}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl">
          <p>Resampled samples: {nSamples}</p>
          <p className="font-semibold text-primary mt-2">
            Effect: Pitch {resampleFactor > 1 ? "up" : "down"}, Duration {resampleFactor > 1 ? "shorter" : "longer"}
          </p>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="w-full h-48 bg-surface-container-lowest rounded-xl shadow-inner mb-4" />
      
      <p className="text-body-sm text-on-surface-variant italic">
        Why this matters: Naive resampling couples pitch and duration. Upsampling by factor p produces floor(N/p) samples — at the same sample rate, this sounds higher pitched AND shorter. The phase vocoder pipeline separates these effects.
      </p>
    </Card>
  );
}
