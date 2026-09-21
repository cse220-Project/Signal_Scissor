import { useState } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import Slider from '../../ui/Slider';
import Badge from '../../ui/Badge';

export default function PitchShiftSimulation() {
  const [semitones, setSemitones] = useState(0);

  const pitchFactor = Math.pow(2, semitones / 12);
  const stretchFactor = 1 / pitchFactor;
  const resampleFactor = pitchFactor;

  const getIntervalName = (s: number) => {
    const abs = Math.abs(s);
    if (abs === 12) return 'Octave';
    if (abs === 7) return 'Perfect Fifth';
    if (abs === 5) return 'Perfect Fourth';
    if (abs === 0) return 'Unison';
    return `${abs} Semitone${abs !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-title-md mb-4">Pitch Shifting Pipeline</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <span className="text-body-sm font-semibold">Semitones:</span>
        <Slider min={-12} max={12} step={1} value={semitones} onChange={(val: number) => setSemitones(Number(val))} />
        <Badge>{semitones > 0 ? `+${semitones}` : semitones}</Badge>
        <span className="text-body-sm text-on-surface-variant ml-2">({getIntervalName(semitones)})</span>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        <div className="bg-surface-container p-4 rounded-xl flex-1 text-center">
          <p className="font-bold text-on-surface">Input</p>
          <p className="text-xs text-on-surface-variant mt-2">1.0s duration</p>
          <p className="text-xs text-on-surface-variant">Original pitch</p>
        </div>
        
        <div className="text-primary text-xl font-bold">→</div>
        
        <div className="bg-primary-container text-on-primary-container p-4 rounded-xl flex-1 text-center">
          <p className="font-bold">Time Stretch</p>
          <p className="text-xs mt-2 font-mono">Factor: {stretchFactor.toFixed(2)}x</p>
          <p className="text-xs mt-1">{stretchFactor.toFixed(2)}s duration</p>
          <p className="text-xs">Original pitch</p>
        </div>
        
        <div className="text-primary text-xl font-bold">→</div>
        
        <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl flex-1 text-center">
          <p className="font-bold">Resample</p>
          <p className="text-xs mt-2 font-mono">Factor: {resampleFactor.toFixed(2)}x</p>
          <p className="text-xs mt-1">1.0s duration</p>
          <p className="text-xs">Shifted pitch</p>
        </div>
        
        <div className="text-primary text-xl font-bold">→</div>
        
        <div className="bg-surface-container p-4 rounded-xl flex-1 text-center">
          <p className="font-bold text-on-surface">Output</p>
          <p className="text-xs text-on-surface-variant mt-2">1.0s duration</p>
          <p className="text-xs text-on-surface-variant">Shifted pitch</p>
        </div>
      </div>

      <div className="bg-surface-container-low p-4 rounded-xl text-body-sm font-mono mb-4">
        <p>pitch_factor = 2^(semitones/12) = {pitchFactor.toFixed(3)}</p>
        <p>time_stretch(1 / pitch_factor)</p>
        <p>naive_resample(pitch_factor)</p>
      </div>

      <p className="text-body-sm text-on-surface-variant italic">
        Why this matters: Pitch shifting = time stretch + resampling. Time stretching by 1/p gives a signal with the same pitch but wrong duration. Resampling by p then corrects duration back to original while shifting the pitch.
      </p>
    </Card>
  );
}
