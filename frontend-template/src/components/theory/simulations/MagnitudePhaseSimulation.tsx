import { useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card'
import Slider from '../../ui/Slider';
import SignalPlot from './SignalPlot';
import SpectrumPlot from './SpectrumPlot';

export default function MagnitudePhaseSimulation() {
  const [phaseOffset, setPhaseOffset] = useState(0);

  const N = 400;
  const f1 = 2;
  const a1 = 1;
  const f2 = 5;
  const a2 = 0.5;

  const timeData = useMemo(() => {
    const data = new Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / 100;
      data[i] = a1 * Math.sin(2 * Math.PI * f1 * t + phaseOffset) + 
                a2 * Math.sin(2 * Math.PI * f2 * t + phaseOffset);
    }
    const maxVal = Math.max(1, ...data.map(Math.abs));
    return data.map(v => v / maxVal);
  }, [phaseOffset]);

  const freqs = [0, 1, 2, 3, 4, 5, 6, 7];
  const mags = [0, 0, a1, 0, 0, a2, 0, 0];
  const phases = [0, 0, phaseOffset, 0, 0, phaseOffset, 0, 0];

  return (
    <Card className="p-4">
      <div className="mb-4 text-body-sm text-on-surface-variant">
        The phase vocoder uses both magnitude and phase. Magnitude alone cannot reconstruct a coherent waveform — phase evolution determines where each frequency component is in time.
        <br/><br/>
        <strong>Magnitude = how much. Phase = when (timing position).</strong>
      </div>
      
      <div className="mb-4">
        <label className="text-label-caps">Phase Offset: {(phaseOffset / Math.PI).toFixed(2)}π</label>
        <Slider value={phaseOffset} min={-Math.PI} max={Math.PI} step={0.1} onChange={(v: number) => setPhaseOffset(v)} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-label-caps text-center mb-1">Magnitude</div>
          <SpectrumPlot frequencies={freqs} magnitudes={mags} height={100} />
        </div>
        <div>
          <div className="text-label-caps text-center mb-1">Phase (-π to π)</div>
          <SpectrumPlot frequencies={freqs} magnitudes={phases.map(p => p + Math.PI)} height={100} />
        </div>
      </div>

      <SignalPlot data={timeData} height={120} label="Reconstructed Time Signal" />
    </Card>
  );
}
