import React, { useState } from 'react';

// Fallback if Card isn't properly exported
const UICard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-surface-container rounded-3xl shadow-card p-6 ${className || ''}`}>
    {children}
  </div>
);

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  desc: string;
  source: string;
}

const concepts: NodeData[] = [
  { id: 'sampling', label: 'Sampling', x: 400, y: 50, desc: 'Conversion of continuous audio into discrete time values.', source: 'dsp/resampling.py' },
  { id: 'nyquist', label: 'Nyquist Theorem', x: 200, y: 150, desc: 'Sampling frequency must be at least twice the highest frequency present.', source: 'Theory' },
  { id: 'aliasing', label: 'Aliasing', x: 600, y: 150, desc: 'Distortion occurring when frequencies exceed Nyquist rate.', source: 'Theory' },
  { id: 'discrete', label: 'Discrete Signal', x: 400, y: 150, desc: 'Sequence of digital audio samples.', source: 'Theory' },
  { id: 'windowing', label: 'Windowing', x: 400, y: 250, desc: 'Tapering frames to zero at edges to prevent spectral leakage.', source: 'dsp/windowing.py' },
  { id: 'stft', label: 'STFT', x: 400, y: 350, desc: 'Short-Time Fourier Transform for localized time-frequency analysis.', source: 'dsp/stft.py' },
  { id: 'fft', label: 'FFT', x: 400, y: 450, desc: 'Fast Fourier Transform, O(N log N) algorithm for DFT.', source: 'dsp/fft_processor.py' },
  { id: 'dft', label: 'DFT', x: 200, y: 450, desc: 'Discrete Fourier Transform, mathematical foundation of FFT.', source: 'Theory' },
  { id: 'magnitude', label: 'Magnitude', x: 300, y: 550, desc: 'Amplitude of each frequency bin, represents loudness.', source: 'dsp/fft_processor.py' },
  { id: 'phase', label: 'Phase', x: 500, y: 550, desc: 'Alignment/offset of frequency components.', source: 'dsp/fft_processor.py' },
  { id: 'phase_diff', label: 'Phase Difference', x: 500, y: 650, desc: 'Change in phase between successive frames.', source: 'dsp/phase_vocoder.py' },
  { id: 'phase_unwrap', label: 'Phase Unwrapping', x: 700, y: 650, desc: 'Resolving 2π phase jumps.', source: 'dsp/fft_processor.py' },
  { id: 'inst_freq', label: 'Inst. Frequency', x: 500, y: 750, desc: 'Exact frequency computed via phase deviation.', source: 'dsp/phase_vocoder.py' },
  { id: 'phase_acc', label: 'Phase Accumulation', x: 500, y: 850, desc: 'Integrating instantaneous frequencies for new time scale.', source: 'dsp/phase_vocoder.py' },
  { id: 'phase_vocoder', label: 'Phase Vocoder', x: 400, y: 950, desc: 'Algorithm combining STFT and phase updates for time-scaling.', source: 'dsp/phase_vocoder.py' },
  { id: 'time_stretch', label: 'Time Stretch', x: 300, y: 1050, desc: 'Altering audio duration without pitch change.', source: 'dsp/phase_vocoder.py' },
  { id: 'pitch_shift', label: 'Pitch Shift', x: 300, y: 1150, desc: 'Altering pitch via stretch + resampling.', source: 'dsp/effects.py' },
  { id: 'wola', label: 'WOLA', x: 500, y: 1050, desc: 'Weighted Overlap-Add to reconstruct continuous signal.', source: 'dsp/stft.py' },
  { id: 'ifft', label: 'IFFT', x: 650, y: 1050, desc: 'Inverse FFT to convert back to time domain.', source: 'dsp/fft_processor.py' },
  { id: 'resampling', label: 'Resampling', x: 300, y: 1250, desc: 'Interpolating discrete signal at new sample rate.', source: 'dsp/resampling.py' },
  { id: 'lti', label: 'LTI Systems', x: 700, y: 1150, desc: 'Linear Time-Invariant systems (filters/effects).', source: 'Theory' },
  { id: 'convolution', label: 'Convolution', x: 700, y: 1250, desc: 'Mathematical operation underlying LTI systems (Reverb).', source: 'dsp/effects.py' },
  { id: 'phase_lock', label: 'Phase Locking', x: 150, y: 950, desc: 'Preserving vertical phase coherence across bins.', source: 'dsp/phase_vocoder.py' },
  { id: 'phasiness', label: 'Phasiness', x: 650, y: 950, desc: 'Artifact caused by loss of phase coherence.', source: 'Theory' }
];

const links = [
  { source: 'sampling', target: 'nyquist' },
  { source: 'sampling', target: 'aliasing' },
  { source: 'sampling', target: 'discrete' },
  { source: 'discrete', target: 'windowing' },
  { source: 'windowing', target: 'stft' },
  { source: 'stft', target: 'fft' },
  { source: 'fft', target: 'dft' },
  { source: 'fft', target: 'magnitude' },
  { source: 'fft', target: 'phase' },
  { source: 'phase', target: 'phase_diff' },
  { source: 'phase_diff', target: 'phase_unwrap' },
  { source: 'phase_diff', target: 'inst_freq' },
  { source: 'inst_freq', target: 'phase_acc' },
  { source: 'phase_acc', target: 'phase_vocoder' },
  { source: 'phase_vocoder', target: 'time_stretch' },
  { source: 'time_stretch', target: 'pitch_shift' },
  { source: 'pitch_shift', target: 'resampling' },
  { source: 'wola', target: 'ifft' },
  { source: 'ifft', target: 'wola' },
  { source: 'phase_vocoder', target: 'wola' },
  { source: 'phase_lock', target: 'phase_vocoder' },
  { source: 'phase_vocoder', target: 'phasiness' },
  { source: 'lti', target: 'convolution' },
  { source: 'convolution', target: 'resampling' }
];

export default function ConceptMap() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const getConnectedNodes = (id: string) => {
    const connected = new Set<string>([id]);
    links.forEach(l => {
      if (l.source === id) connected.add(l.target);
      if (l.target === id) connected.add(l.source);
    });
    return connected;
  };

  const activeNodes = hoveredNode ? getConnectedNodes(hoveredNode) : new Set<string>();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="text-center">
        <h2 className="text-headline-lg font-bold text-primary mb-2">DSP Concept Relational Map</h2>
        <p className="text-body-lg text-on-surface-variant">Explore the mathematical foundations connecting the pieces of this project.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden border border-outline-variant relative">
        <div className="w-full h-[600px] overflow-y-auto overflow-x-auto relative">
          <svg width="900" height="1400" viewBox="0 0 900 1400" className="min-w-[900px]">
            {links.map((link, i) => {
              const src = concepts.find(c => c.id === link.source)!;
              const tgt = concepts.find(c => c.id === link.target)!;
              const isHovered = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode);
              
              return (
                <line
                  key={`link-${i}`}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke={isHovered ? 'var(--primary)' : 'var(--outline-variant)'}
                  strokeWidth={isHovered ? 3 : 1}
                  className={`transition-all duration-300 ${isHovered ? 'animate-pulse' : ''}`}
                  strokeDasharray={isHovered ? '5,5' : 'none'}
                />
              );
            })}

            {concepts.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const isConnected = activeNodes.has(node.id);
              
              let fill = 'var(--surface)';
              let stroke = 'var(--outline)';
              let textColor = 'var(--on-surface)';

              if (isSelected) {
                fill = 'var(--primary)';
                stroke = 'var(--primary)';
                textColor = 'var(--on-primary)';
              } else if (isHovered) {
                fill = 'var(--primary-container)';
                stroke = 'var(--primary)';
                textColor = 'var(--on-primary-container)';
              } else if (isConnected) {
                fill = 'var(--secondary-container)';
                stroke = 'var(--secondary)';
                textColor = 'var(--on-secondary-container)';
              }

              return (
                <g 
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform duration-200"
                  style={{ transformOrigin: `${node.x}px ${node.y}px`, transform: (isHovered || isSelected) ? 'scale(1.1)' : 'scale(1)' }}
                >
                  <circle r="40" fill={fill} stroke={stroke} strokeWidth="2" className="transition-colors duration-300" />
                  <text 
                    textAnchor="middle" 
                    alignmentBaseline="middle"
                    fill={textColor}
                    className="text-[10px] font-bold pointer-events-none"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {node.label.split(' ').map((word, i, arr) => (
                      <tspan x="0" dy={i === 0 ? `-${(arr.length-1)*6}px` : '12px'} key={i}>{word}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedNode && (
        <UICard className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-title-md font-bold text-primary mb-2">{selectedNode.label}</h3>
          <p className="text-body-lg text-on-surface mb-3">{selectedNode.desc}</p>
          <div className="inline-block bg-surface-container-low px-3 py-1 rounded text-body-sm font-mono text-on-surface-variant border border-outline-variant">
            Referenced in: {selectedNode.source}
          </div>
        </UICard>
      )}
    </div>
  );
}
