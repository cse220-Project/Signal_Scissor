import { useState, useRef, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { loadPreset, uploadFile, signalState, isLoading, error } = useAudioStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const success = await uploadFile(file);
      if (success) {
        navigate('/studio');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const success = await uploadFile(file);
      if (success) {
        navigate('/studio');
      }
    }
  };

  const handleLoadPresetAndGo = async (preset: string) => {
    const success = await loadPreset(preset);
    if (success) {
      navigate('/studio');
    }
  };

  const sampleRate = signalState?.sample_rate || 8000;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="space-y-1.5">
        <h1 className="text-[28px] md:text-[32px] font-semibold text-ink-primary tracking-tight leading-tight">
          <span className="trademark-logo">SIGNAL Scissors</span> DSP Studio
        </h1>
        <p className="text-[14px] text-ink-secondary max-w-2xl leading-relaxed">
          Interactive digital audio workstation for discrete Fourier filtering, single-sideband frequency translation, and multi-tap acoustic echo convolution.
        </p>
      </header>

      {/* Top Grid: Audio Upload Dropzone & Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Upload Zone */}
        <div className="md:col-span-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`min-h-[240px] rounded-ios-2xl border border-hairline p-6 md:p-8 transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none ${
              isDragging ? 'bg-accent scale-[1.01] border-primary/40' : 'bg-surface hover:bg-accent hover:border-primary/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mb-3.5">
              <span className="material-symbols-outlined text-[24px] text-ink-primary">
                cloud_upload
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-ink-primary mb-1">
              Drop an Audio File Here
            </h3>
            <p className="text-[13px] text-ink-secondary max-w-xs mb-4">
              Any audio format · up to 60 MB
            </p>
            <Button variant="secondary" size="sm" icon="folder_open">
              Browse Files
            </Button>
          </div>
          {error && (
            <p className="text-center text-error mt-2.5 text-[12px] font-medium">{error}</p>
          )}
        </div>

        {/* Engine Status KPI Card */}
        <div className="md:col-span-4 flex">
          <Card variant="pastel-cream" className="w-full flex flex-col justify-between !p-5">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-hairline mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
                  <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
                    DSP Engine
                  </span>
                </div>
                <span className="text-[11px] font-medium text-ink-secondary">Online</span>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-ink-secondary">Sampling Rate</span>
                  <span className="font-mono text-ink-primary font-medium">{sampleRate} Hz</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-ink-secondary">Nyquist Frequency</span>
                  <span className="font-mono text-ink-primary font-medium">{sampleRate / 2} Hz</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-ink-secondary">Fourier Filter</span>
                  <span className="text-ink-primary">Single-Sided FFT</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-ink-secondary">Echo Model</span>
                  <span className="text-ink-primary">Discrete Conv h[n]</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-hairline text-[11px] text-ink-tertiary flex items-center justify-between">
              <span>Active Signal:</span>
              <span className="font-medium text-ink-secondary truncate max-w-[140px]">
                {signalState?.source_name || 'Multi-Tone Demo'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Synthetic Signal Presets Section */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[16px] font-semibold text-ink-primary">
            Quick-Load Synthetic Signals (CSE 220 Labs)
          </h2>
          <span className="text-[12px] text-ink-secondary">Single-click synthesis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            variant="pastel-cream"
            onClick={() => handleLoadPresetAndGo('tones')}
            className="cursor-pointer group !p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[19px] text-ink-primary">
                graphic_eq
              </span>
              <span className="text-[11px] font-mono text-ink-tertiary">2.0s · 8 kHz</span>
            </div>
            <h3 className="text-[14px] font-semibold text-ink-primary mb-1">Standard Multi-Tone</h3>
            <p className="text-[12px] text-ink-secondary leading-relaxed mb-3">
              Sum of 200 Hz, 1000 Hz, and 2500 Hz sinusoids with Gaussian noise.
            </p>
            <span className="text-[11px] font-medium text-ink-primary group-hover:underline">
              Load & Open Studio →
            </span>
          </Card>

          <Card
            variant="pastel-blue"
            onClick={() => handleLoadPresetAndGo('pulse')}
            className="cursor-pointer group !p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[19px] text-ink-primary">
                sensors
              </span>
              <span className="text-[11px] font-mono text-ink-tertiary">Echo Demo</span>
            </div>
            <h3 className="text-[14px] font-semibold text-ink-primary mb-1">Acoustic Pulse Burst</h3>
            <p className="text-[12px] text-ink-secondary leading-relaxed mb-3">
              Hann-windowed 440 Hz burst followed by silence to illustrate reflection tails.
            </p>
            <span className="text-[11px] font-medium text-ink-primary group-hover:underline">
              Load & Open Studio →
            </span>
          </Card>

          <Card
            variant="pastel-lavender"
            onClick={() => handleLoadPresetAndGo('noise')}
            className="cursor-pointer group !p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[19px] text-ink-primary">
                grain
              </span>
              <span className="text-[11px] font-mono text-ink-tertiary">Filtering Lab</span>
            </div>
            <h3 className="text-[14px] font-semibold text-ink-primary mb-1">Tone + White Noise</h3>
            <p className="text-[12px] text-ink-secondary leading-relaxed mb-3">
              Single 300 Hz tone immersed in broadband Gaussian white noise.
            </p>
            <span className="text-[11px] font-medium text-ink-primary group-hover:underline">
              Load & Open Studio →
            </span>
          </Card>

          <Card
            variant="pastel-green"
            onClick={() => handleLoadPresetAndGo('multitone')}
            className="cursor-pointer group !p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-[19px] text-ink-primary">
                music_note
              </span>
              <span className="text-[11px] font-mono text-ink-tertiary">4 Harmonics</span>
            </div>
            <h3 className="text-[14px] font-semibold text-ink-primary mb-1">Harmonic Multi-Tone</h3>
            <p className="text-[12px] text-ink-secondary leading-relaxed mb-3">
              Four distinct frequencies: 150 Hz, 440 Hz, 1200 Hz, and 3200 Hz.
            </p>
            <span className="text-[11px] font-medium text-ink-primary group-hover:underline">
              Load & Open Studio →
            </span>
          </Card>
        </div>
      </section>

      {/* Quick Launch Cards */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-ink-primary">Workspace Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            variant="pastel-blue"
            onClick={() => navigate('/studio')}
            className="!p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">
                  science
                </span>
                <h3 className="text-[15px] font-semibold text-ink-primary">DSP Studio</h3>
              </div>
              <span className="text-ink-secondary text-[16px] group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              Main interactive workstation with 60 FPS downsampled waveform canvas, spectrum analyzer, and dual transport.
            </p>
          </Card>

          <Card
            variant="pastel-lavender"
            onClick={() => navigate('/effects')}
            className="!p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">
                  auto_fix_high
                </span>
                <h3 className="text-[15px] font-semibold text-ink-primary">Real-Life Applications</h3>
              </div>
              <span className="text-ink-secondary text-[16px] group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              Explore Telephone bandwidth filtering, 60 Hz hum notch, Cathedral convolution reverb, and Doppler simulation.
            </p>
          </Card>

          <Card
            variant="pastel-peach"
            onClick={() => navigate('/compare')}
            className="!p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">
                  compare_arrows
                </span>
                <h3 className="text-[15px] font-semibold text-ink-primary">A/B Comparison</h3>
              </div>
              <span className="text-ink-secondary text-[16px] group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              Direct waveform overlay, FFT spectral difference subtraction, and numerical RMS / peak delta metrics.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
