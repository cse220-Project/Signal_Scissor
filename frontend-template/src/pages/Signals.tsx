import { useState } from 'react';
import SignalGenerator from '../components/generator/SignalGenerator';
import AnimatedSignalGraph from '../components/visualization/AnimatedSignalGraph';
import SpectrumAnalyzer from '../components/visualization/SpectrumAnalyzer';
import { useAudioStore } from '../store/useAudioStore';
import AudioPlayer from '../components/audio/AudioPlayer';
import { getStreamUrl } from '../api/client';

export default function Signals() {
  const { selectedFile } = useAudioStore();
  const [currentSignal, setCurrentSignal] = useState<{
    type: string;
    frequency: number;
    amplitude: number;
    duration: number;
  } | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h1 className="text-[26px] font-semibold text-ink-primary">Signal Laboratory</h1>
        <p className="text-[13px] text-ink-secondary">Generate pure signals to analyze Fourier transforms, windowing leakage, and harmonics.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <SignalGenerator onSignalChange={setCurrentSignal} />
        </div>

        <div className="lg:col-span-7 space-y-4">
          {selectedFile && (
            <AudioPlayer url={getStreamUrl(selectedFile.id)} title={selectedFile.original_filename} />
          )}
          
          <AnimatedSignalGraph previewSignal={selectedFile ? null : currentSignal} />
          <SpectrumAnalyzer previewSignal={selectedFile ? null : currentSignal} />
        </div>
      </div>
    </div>
  );
}

