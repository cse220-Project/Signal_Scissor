import React, { useEffect, useState, useRef } from 'react';


const UICard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-surface-container rounded-3xl shadow-card p-6 ${className || ''}`}>
    {children}
  </div>
);

interface StageInfo {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  source: string;
  visType: 'waveform' | 'bars' | 'math' | 'none';
}

const pipelineStages: StageInfo[] = [
  { id: 'raw', name: 'RAW AUDIO', subtitle: 'Continuous sound waves', desc: 'The original continuous-time analog signal.', source: 'Microphone/File', visType: 'waveform' },
  { id: 'sampling', name: 'Sampling', subtitle: 'Discrete sequence at Fs=44100 Hz', desc: 'Audio is sampled at regular intervals, converting continuous time to discrete time n.', source: 'Audio API', visType: 'waveform' },
  { id: 'frames', name: 'Framing', subtitle: 'N=2048 sample windows', desc: 'The continuous sequence is broken into overlapping frames (hop size Ha=512) for localized analysis.', source: 'dsp/stft.py', visType: 'bars' },
  { id: 'windowing', name: 'Windowing', subtitle: 'Hann window applied', desc: 'A Hann window tapers the edges of each frame to zero, preventing spectral leakage in the FFT.', source: 'dsp/windowing.py', visType: 'waveform' },
  { id: 'stft', name: 'STFT', subtitle: 'Array of FFT spectra', desc: 'Each windowed frame undergoes an FFT, transforming it from the time domain to the frequency domain.', source: 'dsp/stft.py', visType: 'bars' },
  { id: 'magphase', name: 'Magnitude + Phase', subtitle: '|X[k]| and ∠X[k]', desc: 'The complex STFT output is separated into magnitude (amplitude) and phase (offset) for each frequency bin k.', source: 'dsp/fft_processor.py', visType: 'math' },
  { id: 'phaseevol', name: 'Phase Evolution', subtitle: 'Δφ[k] and ω_inst[k]', desc: 'We calculate the phase difference between consecutive frames to estimate the true, instantaneous frequency in each bin.', source: 'dsp/phase_vocoder.py', visType: 'math' },
  { id: 'modphase', name: 'Modified Phase', subtitle: 'φ_synth[m,k] = φ_synth[m-1,k] + ω_inst[k]×(Hs/Ha)', desc: 'For time stretching, new phases are accumulated using the instantaneous frequency and the new hop size Hs.', source: 'dsp/phase_vocoder.py', visType: 'math' },
  { id: 'ifft', name: 'IFFT', subtitle: 'Reconstruct frames', desc: 'The modified magnitudes and phases are combined into complex numbers and transformed back to the time domain.', source: 'dsp/fft_processor.py', visType: 'bars' },
  { id: 'wola', name: 'Overlap-Add (WOLA)', subtitle: 'Smooth reconstruction', desc: 'The modified overlapping frames are added back together (Weighted Overlap-Add) to form a continuous signal.', source: 'dsp/stft.py', visType: 'waveform' },
  { id: 'stretch', name: 'Time-Stretched Audio', subtitle: 'Duration changed, pitch original', desc: 'The intermediate signal is now longer or shorter than the original, but the spectral envelope (pitch) is preserved.', source: 'dsp/phase_vocoder.py', visType: 'waveform' },
  { id: 'resample', name: 'Resampling', subtitle: 'naive_resample(signal, sr, pitch_factor)', desc: 'Linear interpolation changes the playback rate of the stretched signal, affecting both duration and pitch.', source: 'dsp/resampling.py', visType: 'math' },
  { id: 'output', name: 'Pitch-Shifted Audio', subtitle: 'Final Result', desc: 'The duration is back to normal, but the frequencies have been shifted by the pitch factor.', source: 'dsp/effects.py', visType: 'waveform' },
];

export default function PipelineVisualization() {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [visibleStages, setVisibleStages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    // Staggered entrance animation
    const animateIn = () => {
      pipelineStages.forEach((stage, i) => {
        setTimeout(() => {
          setVisibleStages(prev => new Set(prev).add(stage.id));
        }, i * 150); // 150ms stagger
      });
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateIn();
        observerRef.current?.disconnect();
      }
    }, { threshold: 0.1 });

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const renderMiniVis = (type: string) => {
    switch (type) {
      case 'waveform':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path d="M 0 20 Q 10 5, 20 20 T 40 20" fill="none" stroke="var(--primary)" strokeWidth="2" />
          </svg>
        );
      case 'bars':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" className="flex items-end gap-1">
            <rect x="5" y="20" width="6" height="15" fill="var(--primary)" />
            <rect x="15" y="10" width="6" height="25" fill="var(--primary)" />
            <rect x="25" y="25" width="6" height="10" fill="var(--primary)" />
          </svg>
        );
      case 'math':
        return <div className="font-bold text-primary text-xl font-mono">ƒx</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto" ref={containerRef}>
      <div className="text-center mb-8">
        <h2 className="text-headline-lg font-bold text-primary mb-2">From Mathematics to Your Voice</h2>
        <p className="text-body-lg text-on-surface-variant">The step-by-step transformation applied to every sample.</p>
      </div>

      <div className="flex flex-col items-center w-full relative">
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-outline-variant -translate-x-1/2 z-0"></div>

        {pipelineStages.map((stage, i) => {
          const isVisible = visibleStages.has(stage.id);
          const isActive = activeStage === stage.id;
          
          return (
            <div 
              key={stage.id}
              className={`w-full md:w-2/3 relative z-10 mb-8 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              onClick={() => setActiveStage(isActive ? null : stage.id)}
            >
              <UICard className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${isActive ? 'ring-2 ring-primary bg-primary-container/20' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline">
                    {renderMiniVis(stage.visType)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-title-md font-bold text-on-surface">{stage.name}</h4>
                    <p className="text-body-sm text-primary font-mono">{stage.subtitle}</p>
                  </div>
                  <div className="text-on-surface-variant opacity-50">
                    {isActive ? '▲' : '▼'}
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 pt-4 border-t border-outline-variant animate-in fade-in slide-in-from-top-2">
                    <p className="text-body-lg text-on-surface mb-3">{stage.desc}</p>
                    <div className="text-xs font-mono text-on-surface-variant bg-surface-container-low p-2 rounded">
                      Implementation: {stage.source}
                    </div>
                  </div>
                )}
              </UICard>
              
              {/* Arrow linking to next stage */}
              {i < pipelineStages.length - 1 && (
                <div className="flex justify-center my-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="text-outline">
                    <path d="M 10 0 L 10 20 M 5 15 L 10 20 L 15 15" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
