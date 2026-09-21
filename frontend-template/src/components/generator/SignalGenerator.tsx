import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import Select from '../ui/Select';
import { useAudioStore } from '../../store/useAudioStore';
import { generateSignal, getWaveform, getSpectrogram } from '../../api/client';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PARAMS = {
  signalType: 'sine',
  frequency: 440,
  amplitude: 0.8,
  duration: 2.0,
  sampleRate: '44100'
};

interface SignalGeneratorProps {
  onSignalChange?: (params: { type: string; frequency: number; amplitude: number; duration: number }) => void;
}

export default function SignalGenerator({ onSignalChange }: SignalGeneratorProps = {}) {
  const [signalName, setSignalName] = useState('');
  const [signalType, setSignalType] = useState(DEFAULT_PARAMS.signalType);
  const [frequency, setFrequency] = useState(DEFAULT_PARAMS.frequency);
  const [amplitude, setAmplitude] = useState(DEFAULT_PARAMS.amplitude);
  const [duration, setDuration] = useState(DEFAULT_PARAMS.duration);
  const [sampleRate, setSampleRate] = useState(DEFAULT_PARAMS.sampleRate);
  
  const { 
    isProcessing, 
    setIsProcessing, 
    setSelectedFile, 
    addFile, 
    setWaveformData, 
    setFFTData,
    setSpectrogramData,
    setIsPlaying,
    setCurrentTime,
    setDuration: setAudioDuration,
  } = useAudioStore();
  const navigate = useNavigate();

  useEffect(() => {
    onSignalChange?.({ type: signalType, frequency, amplitude, duration });
  }, [signalType, frequency, amplitude, duration, onSignalChange]);

  const autoName = `${signalType}_${signalType !== 'white_noise' && signalType !== 'impulse' ? `${frequency}Hz_` : ''}${duration}s`;

  const handleReset = () => {
    setSignalName('');
    setSignalType(DEFAULT_PARAMS.signalType);
    setFrequency(DEFAULT_PARAMS.frequency);
    setAmplitude(DEFAULT_PARAMS.amplitude);
    setDuration(DEFAULT_PARAMS.duration);
    setSampleRate(DEFAULT_PARAMS.sampleRate);

    setSelectedFile(null);
    setWaveformData(null);
    setFFTData(null);
    setSpectrogramData(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    try {
      const finalName = signalName.trim() || autoName;
      const res = await generateSignal({
        type: signalType,
        name: finalName,
        params: {
          frequency: frequency,
          amplitude: amplitude,
          duration: duration,
          sample_rate: parseInt(sampleRate),
          name: finalName
        }
      });
      const af = res.data.data;
      addFile(af);
      setSelectedFile(af);
      
      getWaveform(af.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(af.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
      
      navigate('/studio');
    } catch (e) {
      console.error('Generation failed:', e);
      alert('Generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const types = ['sine', 'square', 'sawtooth', 'triangle', 'chirp', 'white_noise', 'impulse'];

  return (
    <Card className="flex flex-col gap-4 !p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink-primary">Waveform Generator</h3>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1 -mr-1 rounded-ios-md text-[12px] font-medium text-ink-secondary hover:text-ink-primary hover:bg-[rgba(38,33,28,0.06)] active:bg-[rgba(38,33,28,0.12)] active:scale-[0.97] transition-all cursor-pointer"
          title="Reset parameters to default"
        >
          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
          <span>Reset</span>
        </button>
      </div>
      
      {/* Waveform Selector Chips */}
      <div className="flex flex-wrap gap-1.5">
        {types.map(t => (
          <button 
            key={t}
            onClick={() => setSignalType(t)}
            className={`px-3 py-1.5 rounded-ios-lg text-[12px] capitalize transition-all select-none ${
              signalType === t 
                ? 'bg-[#26211c] text-[#ffffff] font-semibold tracking-tight' 
                : 'bg-transparent text-[#26211c] font-normal border border-[rgba(38,33,28,0.14)] hover:bg-[rgba(38,33,28,0.04)]'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Optional Signal Name */}
      <div className="flex flex-col gap-1.5 pt-1">
        <label className="text-[12px] font-medium text-ink-secondary flex items-center justify-between">
          <span>Signal Name</span>
          <span className="text-[11px] text-ink-tertiary">Optional</span>
        </label>
        <input 
          type="text"
          value={signalName}
          onChange={(e) => setSignalName(e.target.value)}
          placeholder={`e.g. ${autoName}`}
          className="w-full px-3 py-2 rounded-ios-lg border border-[rgba(38,33,28,0.14)] bg-transparent text-[13px] text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-[#26211c] transition-colors"
        />
      </div>

      <div className="space-y-4 pt-1">
        {(signalType !== 'white_noise' && signalType !== 'impulse') && (
          <Slider 
            label="Frequency" 
            value={frequency} 
            onChange={setFrequency} 
            min={20} 
            max={2000} 
            step={1}
            formatValue={(v) => `${v} Hz`}
          />
        )}

        <Slider 
          label="Amplitude" 
          value={amplitude} 
          onChange={setAmplitude} 
          min={0.0} 
          max={1.0} 
          step={0.05} 
          formatValue={(v) => v.toFixed(2)}
        />

        <Slider 
          label="Duration" 
          value={duration} 
          onChange={setDuration} 
          min={0.5} 
          max={10.0} 
          step={0.5} 
          formatValue={(v) => `${v.toFixed(1)} s`}
        />

        <Select
          label="Sample Rate"
          value={sampleRate}
          onChange={(e) => setSampleRate(e.target.value)}
          options={[
            { value: '22050', label: '22,050 Hz' },
            { value: '44100', label: '44,100 Hz' },
            { value: '48000', label: '48,000 Hz' },
          ]}
        />
      </div>

      {/* Button Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button 
          variant="secondary"
          size="md"
          icon="restart_alt"
          onClick={handleReset}
          className="shrink-0"
        >
          Reset
        </Button>
        <Button 
          variant="primary"
          fullWidth 
          size="md"
          icon="waves"
          loading={isProcessing}
          onClick={handleGenerate}
        >
          Synthesize Waveform
        </Button>
      </div>
    </Card>
  );
}
