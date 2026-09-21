interface TheoryNavProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const NAV_ITEMS = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'sampling', label: 'Sampling' },
  { id: 'fourier', label: 'Fourier' },
  { id: 'dft-fft', label: 'DFT & FFT' },
  { id: 'magnitude-phase', label: 'Mag & Phase' },
  { id: 'windowing', label: 'Windowing' },
  { id: 'stft', label: 'STFT' },
  { id: 'phase-vocoder', label: 'Phase Vocoder' },
  { id: 'pitch-shifting', label: 'Pitch Shift' },
  { id: 'resampling', label: 'Resampling' },
  { id: 'wola', label: 'WOLA' },
  { id: 'lti-convolution', label: 'LTI & Convolution' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'concept-map', label: 'Concept Map' },
  { id: 'viva', label: 'Viva' },
];

/**
 * TheoryNav — compact sticky horizontal navigation for the Theory page.
 * Highlights the currently visible section, scrolls on overflow.
 */
export default function TheoryNav({ activeSection, onNavigate }: TheoryNavProps) {
  return (
    <div className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-sm border-b border-surface-container-high shadow-card/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-shrink-0 text-label-caps px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { NAV_ITEMS };
