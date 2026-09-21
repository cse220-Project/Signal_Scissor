import { useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card'
import Slider from '../../ui/Slider';
import SignalPlot from './SignalPlot';
import SpectrumPlot from './SpectrumPlot';

export default function FourierSimulation() {
  const [f1] = useState(3);
  const [a1, setA1] = useState(1.0);
  const [f2] = useState(7);
  const [a2, setA2] = useState(0.5);
  const [f3] = useState(15);
  const [a3, setA3] = useState(0.0);

  const N = 500;
  const timeData = useMemo(() => {
    const data = new Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / 100; // time vector
      data[i] = a1 * Math.sin(2 * Math.PI * f1 * t) + 
                a2 * Math.sin(2 * Math.PI * f2 * t) + 
                a3 * Math.sin(2 * Math.PI * f3 * t);
    }
    // Normalize if max > 1
    const maxVal = Math.max(1, ...data.map(Math.abs));
    return data.map(v => v / maxVal);
  }, [f1, a1, f2, a2, f3, a3]);

  const maxFreq = 20;
  const freqs = Array.from({ length: maxFreq + 1 }, (_, i) => i);
  const mags = new Array(maxFreq + 1).fill(0);
  mags[f1] += a1;
  mags[f2] += a2;
  mags[f3] += a3;

  return (
    <Card className="p-4">
      <div className="mb-4 text-body-sm text-on-surface-variant">
        The FFT decomposes audio frames into their frequency components. The phase vocoder analyzes and manipulates these components independently.
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-label-caps">F1: {f1}Hz</label>
          <Slider value={a1} min={0} max={1} step={0.1} onChange={(v: number) => setA1(v)} />
        </div>
        <div>
          <label className="text-label-caps">F2: {f2}Hz</label>
          <Slider value={a2} min={0} max={1} step={0.1} onChange={(v: number) => setA2(v)} />
        </div>
        <div>
          <label className="text-label-caps">F3: {f3}Hz</label>
          <Slider value={a3} min={0} max={1} step={0.1} onChange={(v: number) => setA3(v)} />
        </div>
      </div>

      <div className="mb-2 text-center font-mono text-xs">
        x(t) = {a1.toFixed(1)}sin(2π({f1})t) + {a2.toFixed(1)}sin(2π({f2})t) + {a3.toFixed(1)}sin(2π({f3})t)
      </div>

      <SignalPlot data={timeData} height={120} label="Time Domain Composite" animated={true} />
      <SpectrumPlot frequencies={freqs} magnitudes={mags} height={120} label="Frequency Spectrum" />
    </Card>
  );
}
