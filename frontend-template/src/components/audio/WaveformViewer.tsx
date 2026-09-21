import { useRef } from 'react';
import { useWaveformCanvas } from '../../hooks/useWaveformCanvas';
import { useAudioStore } from '../../store/useAudioStore';

export default function WaveformViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { waveformData, currentTime, duration } = useAudioStore();

  useWaveformCanvas({
    canvasRef,
    waveformData,
    currentTime,
    duration,
    selection: null,
    color: '#3a2c5e',
  });

  return (
    <div className="w-full h-32 bg-transparent rounded-ios-2xl overflow-hidden p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-semibold text-ink-secondary">WAVEFORM</h4>
        <span className="text-[10px] text-ink-tertiary">Time Domain</span>
      </div>
      <div className="w-full h-[calc(100%-24px)] bg-transparent rounded-ios-lg overflow-hidden relative">
        <canvas 
          ref={canvasRef} 
          className="canvas-viz w-full h-full bg-transparent"
        />
        {!waveformData && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] text-ink-tertiary">
            Waveform rendering...
          </div>
        )}
      </div>
    </div>
  );
}
