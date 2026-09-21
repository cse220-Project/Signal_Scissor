import { useState, useEffect } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Slider from '../../ui/Slider';

export default function PhaseVocoderSimulation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stretchFactor, setStretchFactor] = useState(1.0);
  const [activeNode, setActiveNode] = useState(0);

  const nodes = [
    'Input', 'Framing', 'Window', 'FFT', 'Mag+Phase', 
    'Phase Diff', 'Inst. Freq', 'Phase Accum', 'IFFT', 'OLA', 'Output'
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveNode(prev => (prev + 1) % nodes.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, nodes.length]);

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Phase Vocoder Pipeline</h3>
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        <Button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-body-sm">Stretch Factor:</span>
          <Slider min={0.5} max={2.0} step={0.25} value={stretchFactor} onChange={(val: number) => setStretchFactor(Number(val))} />
          <span className="font-mono bg-surface-container px-2 py-1 rounded text-body-sm">{stretchFactor}x</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {nodes.map((node, i) => (
          <div 
            key={node} 
            className={`px-3 py-2 rounded-xl text-body-sm transition-all duration-300 ${
              i === activeNode 
                ? 'bg-primary text-on-primary scale-110 shadow-md' 
                : 'bg-surface-container text-on-surface'
            }`}
          >
            {node}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-center text-body-sm">
        <div className="p-4 bg-surface-container-low rounded-xl">
          <p className="font-semibold">Input Duration</p>
          <p className="text-display mt-2 text-primary">1.0s</p>
        </div>
        <div className="p-4 bg-surface-container-low rounded-xl">
          <p className="font-semibold">Output Duration</p>
          <p className="text-display mt-2 text-primary">{(1.0 * stretchFactor).toFixed(2)}s</p>
          <p className="text-xs text-on-surface-variant mt-1">Pitch: unchanged</p>
        </div>
      </div>

      <div className="bg-secondary-container p-4 rounded-xl text-on-surface text-body-sm font-mono">
        <p>Analysis hop: Ha = 512</p>
        <p>Synthesis hop: Hs = Ha × {stretchFactor}</p>
        <p>Phase advance: φ_synth[m,k] = φ_synth[m-1,k] + ω_inst[k] × (Hs/Ha)</p>
      </div>

      <p className="text-body-sm text-on-surface-variant mt-4 italic">
        Why this matters: The phase vocoder manipulates synthesis hop size independently of analysis hop size. By using Hs = Ha × stretch_factor, it changes the temporal spacing of output frames — stretching or compressing time while leaving frequency content intact.
      </p>
    </Card>
  );
}
