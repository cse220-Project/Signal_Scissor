import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Slider from '../components/ui/Slider';
import WaveformCanvas from '../components/visualization/WaveformCanvas';
import SpectrumCanvas from '../components/visualization/SpectrumCanvas';
import InfoBox from '../components/ui/InfoBox';

export default function Signals() {
  const navigate = useNavigate();
  const { signalState, duration, currentTime, activeTrack, uploadFile, isLoading } = useAudioStore();

  // Custom tone synthesis state
  const [customFreq, setCustomFreq] = useState(440);
  const [customDuration, setCustomDuration] = useState(2.0);

  const generateCustomTone = async () => {
    // Generate PCM in browser and upload as WAV
    const sampleRate = Math.max(8000, Math.min(240000, Math.ceil(customFreq * 2.4)));
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
            <span className="trademark-signal">SIGNAL</span> Generator &amp; Capture Lab
          </h1>
          <p className="text-[13px] text-ink-secondary max-w-2xl">
            Synthesize benchmark sinusoids, impulse bursts, noise patterns, or record live microphone <span className="trademark-signal">SIGNAL</span>s.
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

      <InfoBox title="Looking for presets or recording?" defaultOpen={false}>
        <p>
          This page is for dialing in a <strong className="text-ink-primary font-medium">custom</strong> tone. Ready-made lab presets and microphone recording
          both live on <strong className="text-ink-primary font-medium">Control Center</strong> now, so there's one place to load a signal from. Whichever
          you choose, it becomes the "Active Signal" previewed on the right — click "Open in Studio" when you're ready to process it.
        </p>
      </InfoBox>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: All Input Sources (Sine Synthesizer, Presets, Mic) */}
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
                help="The pitch of the generated pure tone. Typical human hearing spans about 20 Hz to 20,000 Hz."
                hint="Audible range: ~20 Hz – 20,000 Hz"
                value={customFreq}
                min={0}
                max={100000}
                step={10}
                unit="Hz"
                onChange={setCustomFreq}
              />

              <Slider
                label="Duration"
                help="How long the generated tone lasts, in seconds."
                value={customDuration}
                min={0.5}
                max={60}
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

          {/* Pointer card: presets + recording now live in one place (Control Center) */}
          <Card variant="pastel-cream" className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-hairline">
              <span className="material-symbols-outlined text-[19px] text-ink-primary">dashboard</span>
              <h3 className="text-[15px] font-semibold text-ink-primary">Presets &amp; Recording</h3>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              The CSE 220 test presets (Multi-Tone, Pulse Burst, Tone+Noise, Harmonic Chord) and live microphone recording
              both moved to <strong className="text-ink-primary font-medium">Control Center</strong>, so there's a single place to load a signal from.
            </p>
            <Button
              variant="secondary"
              size="sm"
              icon="dashboard"
              fullWidth
              onClick={() => navigate('/')}
            >
              Open Control Center
            </Button>
          </Card>
        </div>

        {/* Right Column: Active Signal Preview Visualizer */}
        <div className="lg:col-span-7 space-y-4 sticky top-6">
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
                  height={130}
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
                  height={130}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
