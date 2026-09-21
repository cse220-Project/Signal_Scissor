import React, { useState, useEffect } from 'react';

// Mock UI components if they don't exist exactly as imported
const UICard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-surface-container rounded-3xl shadow-card p-6 ${className || ''}`}>
    {children}
  </div>
);

const UIButton: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`px-4 py-2 bg-primary text-on-primary rounded-full font-bold ${className || ''}`}>
    {children}
  </button>
);

interface NodeData {
  id: string;
  label: string;
  desc: string;
  equation: string;
  source: string;
  sectionId: string;
  x: number;
  y: number;
  type: 'main' | 'side';
}

const nodes: NodeData[] = [
  { id: 'input', label: 'Input Audio', desc: 'Continuous physical sound waves converted to electrical signals.', equation: 'x(t)', source: 'Audio Interface', sectionId: 'sampling', x: 300, y: 50, type: 'main' },
  { id: 'sampling', label: 'Sampling', desc: 'Capturing amplitude values at discrete time intervals.', equation: 'x[n] = x(nTs)', source: 'Audio API', sectionId: 'sampling', x: 300, y: 150, type: 'main' },
  { id: 'framing', label: 'Framing', desc: 'Slicing signal into overlapping segments (frames).', equation: 'x_m[n] = x[n + mH_a]', source: 'dsp/stft.py → create_frames()', sectionId: 'stft', x: 300, y: 250, type: 'main' },
  { id: 'windowing', label: 'Windowing', desc: 'Applying a window function to reduce spectral leakage.', equation: 'x_w[n] = x_m[n] * w[n]', source: 'dsp/windowing.py → get_window()', sectionId: 'stft', x: 300, y: 350, type: 'main' },
  { id: 'stft', label: 'STFT', desc: 'Short-Time Fourier Transform computation over frames.', equation: 'X[m, k]', source: 'dsp/stft.py → compute_stft()', sectionId: 'stft', x: 300, y: 450, type: 'main' },
  { id: 'fft', label: 'FFT', desc: 'Fast Fourier Transform for efficient DFT computation.', equation: 'X[k] = Σ x[n]e^{-j2πkn/N}', source: 'dsp/fft_processor.py → compute_fft()', sectionId: 'fft', x: 300, y: 550, type: 'main' },
  { id: 'mag_phase', label: 'Magnitude & Phase', desc: 'Polar representation of complex spectral data.', equation: '|X|, ∠X', source: 'dsp/fft_processor.py', sectionId: 'phase-vocoder', x: 300, y: 650, type: 'main' },
  { id: 'inst_freq', label: 'Instantaneous Freq', desc: 'True frequency estimation using phase differences.', equation: 'ω_inst = ω_k + wrap(Δφ - ω_k)', source: 'dsp/phase_vocoder.py → estimate_instantaneous_frequency()', sectionId: 'phase-vocoder', x: 300, y: 750, type: 'main' },
  { id: 'phase_acc', label: 'Phase Accumulation', desc: 'Synthesizing new phases for time-stretched frames.', equation: 'φ_synth = φ_prev + ω_inst * (Hs/Ha)', source: 'dsp/phase_vocoder.py → time_stretch()', sectionId: 'time-stretch', x: 300, y: 850, type: 'main' },
  { id: 'ifft', label: 'IFFT', desc: 'Inverse FFT to convert back to time domain.', equation: 'x[n] = (1/N) Σ X[k]e^{j2πkn/N}', source: 'dsp/fft_processor.py → compute_ifft()', sectionId: 'reconstruction', x: 300, y: 950, type: 'main' },
  { id: 'wola', label: 'WOLA', desc: 'Weighted Overlap-Add for smooth frame reconstruction.', equation: 'y[n] = Σ y_m[n - mH_s]', source: 'dsp/stft.py → reconstruct_signal_wola()', sectionId: 'reconstruction', x: 300, y: 1050, type: 'main' },
  { id: 'time_stretch', label: 'Time Stretched', desc: 'Audio with modified duration but original pitch.', equation: 'Hs ≠ Ha', source: 'dsp/phase_vocoder.py → time_stretch()', sectionId: 'time-stretch', x: 300, y: 1150, type: 'main' },
  { id: 'resample', label: 'Resampling', desc: 'Changing playback rate to shift pitch back.', equation: 'y_final[n] = y(n * pitch_factor)', source: 'dsp/resampling.py → naive_resample()', sectionId: 'pitch-shift', x: 300, y: 1250, type: 'main' },
  { id: 'output', label: 'Pitch-Shifted Output', desc: 'Final audio with altered pitch and original duration.', equation: 'y[n]', source: 'dsp/effects.py → PitchShiftEffect', sectionId: 'pitch-shift', x: 300, y: 1350, type: 'main' },

  // Naive Branch
  { id: 'naive_resample', label: 'Naive Resampling', desc: 'Changing playback speed, which alters both pitch and duration (Chipmunk effect).', equation: 'y[n] = x(n * factor)', source: 'dsp/resampling.py → naive_resample()', sectionId: 'resampling', x: 600, y: 150, type: 'side' },
  { id: 'naive_output', label: 'Naive Output', desc: 'Output with shifted pitch AND altered duration.', equation: 'y_naive[n]', source: 'dsp/resampling.py', sectionId: 'resampling', x: 600, y: 1350, type: 'side' }
];

const edges = [
  { from: 'input', to: 'sampling' },
  { from: 'sampling', to: 'framing' },
  { from: 'framing', to: 'windowing' },
  { from: 'windowing', to: 'stft' },
  { from: 'stft', to: 'fft' },
  { from: 'fft', to: 'mag_phase' },
  { from: 'mag_phase', to: 'inst_freq' },
  { from: 'inst_freq', to: 'phase_acc' },
  { from: 'phase_acc', to: 'ifft' },
  { from: 'ifft', to: 'wola' },
  { from: 'wola', to: 'time_stretch' },
  { from: 'time_stretch', to: 'resample' },
  { from: 'resample', to: 'output' },
  
  // Side branch
  { from: 'input', to: 'naive_resample', type: 'side' },
  { from: 'naive_resample', to: 'naive_output', type: 'side' }
];

interface Props {
  onJumpToSection: (id: string) => void;
}

export default function TheoryRoadmap({ onJumpToSection }: Props) {
  const [selectedId, setSelectedId] = useState<string>('stft');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      <div className="text-center">
        <h2 className="text-headline-lg font-bold text-primary mb-2">Signal Processing Pipeline</h2>
        <p className="text-body-lg text-on-surface-variant">Trace the path from raw audio to pitch-shifted output.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden border border-outline-variant relative">
        {!isMobile ? (
          <div className="w-full h-[600px] overflow-y-auto overflow-x-hidden relative">
            <svg width="100%" height="1500" viewBox="0 0 900 1500" className="w-full h-[1500px]">
              {/* Edges */}
              {edges.map((e, i) => {
                const n1 = nodes.find(n => n.id === e.from)!;
                const n2 = nodes.find(n => n.id === e.to)!;
                const isSide = e.type === 'side';
                const strokeColor = isSide ? 'var(--secondary)' : 'var(--primary)';
                
                return (
                  <path
                    key={`edge-${i}`}
                    d={`M ${n1.x} ${n1.y + 25} C ${n1.x} ${(n1.y + n2.y) / 2}, ${n2.x} ${(n1.y + n2.y) / 2}, ${n2.x} ${n2.y - 25}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeDasharray={isSide ? '5,5' : 'none'}
                    markerEnd={`url(#arrow-${isSide ? 'side' : 'main'})`}
                  />
                );
              })}

              <defs>
                <marker id="arrow-main" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
                </marker>
                <marker id="arrow-side" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--secondary)" />
                </marker>
              </defs>

              {/* Nodes */}
              {nodes.map(n => {
                const isSelected = selectedId === n.id;
                const isSide = n.type === 'side';
                const fillColor = isSelected 
                  ? (isSide ? 'var(--secondary)' : 'var(--primary)')
                  : (isSide ? 'var(--secondary-container)' : 'var(--primary-container)');
                const textColor = isSelected 
                  ? (isSide ? 'var(--on-secondary)' : 'var(--on-primary)')
                  : (isSide ? 'var(--on-secondary-container)' : 'var(--on-primary-container)');
                const strokeColor = isSide ? 'var(--secondary)' : 'var(--primary)';

                return (
                  <g 
                    key={n.id} 
                    transform={`translate(${n.x}, ${n.y})`}
                    onClick={() => setSelectedId(n.id)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    <rect
                      x="-100" y="-25" width="200" height="50" rx="10"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? "3" : "1"}
                      className="transition-colors duration-300"
                    />
                    <text
                      x="0" y="5"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill={textColor}
                      className="font-bold text-body-sm font-sans"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 max-h-[600px] overflow-y-auto">
            {nodes.map(n => (
              <div 
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={`p-4 rounded-xl cursor-pointer border-2 transition-colors ${selectedId === n.id ? 'border-primary bg-primary-container text-on-primary-container' : 'border-transparent bg-surface-container text-on-surface'}`}
              >
                <span className="font-bold">{n.label}</span>
                {n.type === 'side' && <span className="ml-2 text-xs opacity-70">(Naive Branch)</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNode && (
        <UICard className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-title-md font-bold text-on-surface">{selectedNode.label}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${selectedNode.type === 'side' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                  {selectedNode.type === 'side' ? 'Naive Resampling' : 'Phase Vocoder'}
                </span>
              </div>
              <p className="text-body-lg text-on-surface-variant mb-4">{selectedNode.desc}</p>
              
              <div className="bg-surface p-4 rounded-xl mb-4 font-mono text-sm border border-outline-variant text-primary">
                {selectedNode.equation}
              </div>
              
              <div className="text-body-sm text-on-surface-variant font-mono bg-surface-container-low p-2 rounded">
                Source: {selectedNode.source}
              </div>
            </div>
            <div className="flex items-end justify-end">
              <UIButton onClick={() => onJumpToSection(selectedNode.sectionId)}>
                Jump to theory section →
              </UIButton>
            </div>
          </div>
        </UICard>
      )}
    </div>
  );
}
