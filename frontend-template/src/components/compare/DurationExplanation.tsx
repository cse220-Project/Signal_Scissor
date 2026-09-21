import { useState } from 'react';
import Card from '../ui/Card';

interface DurationExplanationProps {
  originalDuration: number;
  semitones: number;
  pitchFactor: number;
  stretchFactor: number;
}

const DoodlyArrow = ({ className = '' }: { className?: string }) => (
  <svg 
    width="24" 
    height="36" 
    viewBox="0 0 24 36" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2 L 12 32" />
    <path d="M6 24 L 12 32 L 18 24" />
  </svg>
);

export default function DurationExplanation({
  originalDuration,
  semitones,
  pitchFactor,
  stretchFactor,
}: DurationExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Phase Vocoder values
  const pvAfterPitch = originalDuration;
  const pvFinal = originalDuration * stretchFactor;

  // Naive values
  const naiveAfterPitch = originalDuration / pitchFactor;
  const naiveFinal = (originalDuration / pitchFactor) * stretchFactor;

  const showPitchStep = semitones !== 0;
  const showStretchStep = stretchFactor !== 1.0;

  return (
    <Card variant="surface" className="flex flex-col overflow-hidden transition-all duration-300 bg-white shadow-sm !p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center px-1 py-1 cursor-pointer select-none outline-none"
        aria-expanded={isExpanded}
      >
        <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight">
          Know how we got the output
        </h3>
        <span
          className={`material-symbols-outlined text-ink-secondary text-[20px] transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(38,33,28,0.1)] rounded-ios-lg overflow-hidden border border-[rgba(38,33,28,0.1)]">
            
            {/* Phase Vocoder Column */}
            <div className="bg-white p-5 flex flex-col items-center text-center">
              <h4 className="text-[14px] font-bold tracking-wider text-ink-primary uppercase mb-1">
                Phase Vocoder
              </h4>
              <p className="text-[14px] text-ink-secondary font-semibold mb-5">Duration preserved</p>

              <div className="flex flex-col items-center gap-1 font-mono text-[15px] font-bold">
                <div className="text-ink-primary">{originalDuration.toFixed(2)} s</div>
                
                {showPitchStep && (
                  <>
                    <div className="flex flex-col items-center text-ink-tertiary text-[12px] my-1">
                      <DoodlyArrow className="text-ink-secondary my-1" />
                      <span className="font-semibold text-ink-secondary">pitch shift ({semitones > 0 ? '+' : ''}{semitones} st)</span>
                    </div>
                    <div className="text-ink-primary">{pvAfterPitch.toFixed(2)} s</div>
                  </>
                )}

                {showStretchStep && (
                  <>
                    <div className="flex flex-col items-center text-ink-tertiary text-[12px] my-1">
                      <DoodlyArrow className="text-ink-secondary my-1" />
                      <span className="font-semibold text-ink-secondary">× {stretchFactor.toFixed(2)}</span>
                    </div>
                    <div className="text-ink-primary">{pvFinal.toFixed(2)} s</div>
                  </>
                )}

                {!showPitchStep && !showStretchStep && (
                  <div className="text-ink-primary mt-2">{pvFinal.toFixed(2)} s</div>
                )}
              </div>
            </div>

            {/* Naive Resampling Column */}
            <div className="bg-white p-5 flex flex-col items-center text-center">
              <h4 className="text-[14px] font-bold tracking-wider text-ink-primary uppercase mb-1">
                Naive Resampling
              </h4>
              <p className="text-[14px] text-ink-secondary font-semibold mb-5">Pitch + duration coupled</p>

              <div className="flex flex-col items-center gap-1 font-mono text-[15px] font-bold">
                <div className="text-ink-primary">{originalDuration.toFixed(2)} s</div>
                
                {showPitchStep && (
                  <>
                    <div className="flex flex-col items-center text-ink-tertiary text-[12px] my-1">
                      <DoodlyArrow className="text-ink-secondary my-1" />
                      <span className="font-semibold text-ink-secondary">÷ {pitchFactor.toFixed(4)}</span>
                    </div>
                    <div className="text-ink-primary">{naiveAfterPitch.toFixed(2)} s</div>
                  </>
                )}

                {showStretchStep && (
                  <>
                    <div className="flex flex-col items-center text-ink-tertiary text-[12px] my-1">
                      <DoodlyArrow className="text-ink-secondary my-1" />
                      <span className="font-semibold text-ink-secondary">× {stretchFactor.toFixed(2)}</span>
                    </div>
                    <div className="text-ink-primary">{naiveFinal.toFixed(2)} s</div>
                  </>
                )}

                {!showPitchStep && !showStretchStep && (
                  <div className="text-ink-primary mt-2">{naiveFinal.toFixed(2)} s</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Card>
  );
}
