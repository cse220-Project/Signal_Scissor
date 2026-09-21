import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Slider from '../components/ui/Slider';
import WaveformCanvas from '../components/visualization/WaveformCanvas';
import SpectrumCanvas from '../components/visualization/SpectrumCanvas';

export default function Signals() {
  const navigate = useNavigate();
  const { signalState, duration, currentTime, activeTrack, loadPreset, uploadFile, isLoading } = useAudioStore();
  const { isRecording, recordDuration, recordError, startRecording, stopRecording } = useAudioRecorder();

  // Custom tone synthesis state
  const [customFreq, setCustomFreq] = useState(440);
  const [customDuration, setCustomDuration] = useState(2.0);

  const generateCustomTone = async () => {
    // Generate PCM in browser and upload as WAV
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * customDuration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      buffer[i] = Math.sin(2 * Math.PI * customFreq * t);
    }

    // Convert Float32Array to 16-bit PCM WAV Blob
    const wavBlob = encodeWav(buffer, sampleRate);
    const file = new File([wavBlob], `pure_tone_${customFreq}Hz.wav`, { type: 'audio/wav' });
    await uploadFile(file);
  };

  const encodeWav = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold text-ink-primary tracking-tight">
            Signal Generator & Capture Lab
          </h1>
          <p className="text-[13px] text-ink-secondary">
            Synthesize benchmark sinusoids, impulse bursts, noise patterns, or record live microphone signals.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="science"
          onClick={() => navigate('/studio')}
        >
          Open in Studio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 space-y-4">
      {/* Pure Sine Generator */}
      <Card variant="pastel-peach" className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-hairline">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">tune</span>
          <h3 className="text-[15px] font-semibold text-ink-primary">Parametric Pure Sine Synthesizer</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Slider
            label="Carrier Frequency (f₀)"
            value={customFreq}
            min={50}
            max={3800}
            step={10}
            unit="Hz"
            onChange={setCustomFreq}
          />

          <Slider
            label="Duration"
            value={customDuration}
            min={0.5}
            max={4.0}
            step={0.5}
            unit="s"
            onChange={setCustomDuration}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="secondary"
            size="sm"
            icon="add_circle"
            loading={isLoading}
            onClick={generateCustomTone}
          >
            Generate & Load Sine Wave
          </Button>
        </div>
      </Card>
        {/* Synthetic Signals Card */}
        <Card variant="pastel-cream" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hairline">
            <span className="material-symbols-outlined text-[19px] text-ink-primary">auto_graph</span>
            <h3 className="text-[15px] font-semibold text-ink-primary">CSE 220 Test Presets</h3>
          </div>

          <p className="text-[12px] text-ink-secondary leading-relaxed">
            Deterministic laboratory signals designed for verifying FFT bin identification, bandpass filtering, and echo reflections.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
            <Button
              variant="pill"
              size="sm"
              loading={isLoading}
              onClick={() => loadPreset('tones')}
            >
              Multi-Tone (200, 1k, 2.5k)
            </Button>

            <Button
              variant="pill"
              size="sm"
              loading={isLoading}
              onClick={() => loadPreset('pulse')}
            >
              Hann Pulse Burst (440Hz)
            </Button>

            <Button
              variant="pill"
              size="sm"
              loading={isLoading}
              onClick={() => loadPreset('noise')}
            >
              Tone (300Hz) + Noise
            </Button>

            <Button
              variant="pill"
              size="sm"
              loading={isLoading}
              onClick={() => loadPreset('multitone')}
            >
              Harmonic Chord (4 Tones)
            </Button>
          </div>
        </Card>

        </div>
        <div className="lg:col-span-7 space-y-4">
      {/* Active Signal Preview Card */}
      <div className="bg-pastel-blue rounded-ios-2xl p-5 md:p-6 space-y-4 select-none">
        <div className="panel-heading pb-2 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-ink-primary">preview</span>
            <span className="text-[14px] font-semibold text-ink-primary">
              Active Signal: {signalState?.source_name || 'Standard Multi-Tone'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-ink-secondary">
            {signalState?.sample_rate || 8000} Hz · {duration.toFixed(2)}s
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary block mb-1.5">
              Waveform x[n]
            </span>
            <WaveformCanvas
              originalWaveform={signalState?.original_waveform}
              processedWaveform={signalState?.processed_waveform}
              duration={duration}
              currentTime={currentTime}
              activeTrack={activeTrack}
              height={110}
            />
          </div>

          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary block mb-1.5">
              Spectrum |X(f)| (dB)
            </span>
            <SpectrumCanvas
              originalSpectrum={signalState?.original_spectrum}
              processedSpectrum={signalState?.processed_spectrum}
              dominantFreq={signalState?.stats?.dominant_freq}
              height={110}
            />
          </div>
        </div>
      </div>

        {/* Live Microphone Recording Card */}
        <Card variant="pastel-green" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hairline">
            <span className="material-symbols-outlined text-[19px] text-ink-primary">mic</span>
            <h3 className="text-[15px] font-semibold text-ink-primary">Live Microphone Capture</h3>
          </div>

          <p className="text-[12px] text-ink-secondary leading-relaxed">
            Capture speech, whistling, or acoustic sounds from your computer microphone to test real-world Fourier filtering and convolution echo.
          </p>

          <div className="bg-surface-raised rounded-ios-lg p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRecording ? 'bg-error animate-pulse' : 'bg-ink-tertiary'
                }`}
              />
              <span className="font-mono text-[14px] font-medium text-ink-primary">
                {isRecording ? `${recordDuration.toFixed(1)}s Recording...` : 'Ready to record'}
              </span>
            </div>

            {recordError && (
              <p className="text-error text-[11px]">{recordError}</p>
            )}

            <Button
              variant={isRecording ? 'destructive' : 'primary'}
              size="md"
              icon={isRecording ? 'stop' : 'mic'}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? 'Stop & Load Recording' : 'Start Recording'}
            </Button>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
