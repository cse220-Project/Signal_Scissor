import { useState, useMemo } from 'react';

interface ConceptEntry {
  concept: string;
  math: string;
  purpose: string;
  file: string;
  fn: string;
}

const CONCEPT_TABLE: ConceptEntry[] = [
  {
    concept: 'FFT (Fast Fourier Transform)',
    math: 'X[k] = Σₙ x[n]·e^(−j2πkn/N)',
    purpose: 'Converts a discrete audio frame into its frequency-domain representation efficiently, enabling per-bin phase and magnitude manipulation.',
    file: 'dsp/fft_processor.py',
    fn: 'compute_fft()',
  },
  {
    concept: 'IFFT (Inverse FFT)',
    math: 'x[n] = (1/N) Σₖ X[k]·e^(j2πkn/N)',
    purpose: 'Reconstructs a time-domain frame from a modified complex spectrum.',
    file: 'dsp/fft_processor.py',
    fn: 'compute_ifft()',
  },
  {
    concept: 'Magnitude Spectrum',
    math: '|X[k]| = abs(X[k])',
    purpose: 'Captures how much of each frequency is present in a frame. The phase vocoder preserves magnitude across synthesis frames.',
    file: 'dsp/fft_processor.py',
    fn: 'magnitude_spectrum()',
  },
  {
    concept: 'Phase Spectrum',
    math: '∠X[k] = angle(X[k])',
    purpose: 'Captures the timing/position of each frequency component. The phase vocoder accumulates phase continuously to preserve coherence.',
    file: 'dsp/fft_processor.py',
    fn: 'phase_spectrum()',
  },
  {
    concept: 'Phase Wrapping',
    math: 'wrap(φ) = (φ + π) mod 2π − π',
    purpose: 'Normalises phase differences to (−π, π] so instantaneous frequency can be estimated without discontinuities.',
    file: 'dsp/fft_processor.py',
    fn: 'wrap_phase()',
  },
  {
    concept: 'Windowing (Hann)',
    math: 'w[n] = 0.5 · (1 − cos(2πn / (N−1)))',
    purpose: 'Tapers each STFT frame to reduce spectral leakage caused by the hard truncation of a finite-length signal segment.',
    file: 'dsp/windowing.py',
    fn: 'create_hann_window()',
  },
  {
    concept: 'Frame Creation (Framing)',
    math: 'frames[m] = signal[m·Ha : m·Ha + N]',
    purpose: 'Divides the signal into overlapping short-time segments so STFT can analyse local frequency content.',
    file: 'dsp/stft.py',
    fn: 'create_frames()',
  },
  {
    concept: 'STFT',
    math: 'STFT{x}(m,k) = Σₙ x[n]·w[n−m·Ha]·e^(−j2πkn/N)',
    purpose: 'Provides a time-frequency representation of the signal. The phase vocoder operates frame-by-frame on the STFT.',
    file: 'dsp/stft.py',
    fn: 'compute_stft()',
  },
  {
    concept: 'WOLA Reconstruction',
    math: 'y[n] = Σₘ (frame_m × w) / Σₘ w²',
    purpose: 'Recombines phase-modified IFFT frames into a continuous output signal with window² normalization to avoid amplitude artifacts.',
    file: 'dsp/stft.py',
    fn: 'reconstruct_signal_wola()',
  },
  {
    concept: 'Instantaneous Frequency',
    math: 'ω_inst[k] = ω_k + wrap(Δφ[k] − ω_k·Ha)',
    purpose: 'Estimates the true frequency of each spectral bin by tracking phase evolution across frames. Required for coherent synthesis.',
    file: 'dsp/phase_vocoder.py',
    fn: 'estimate_instantaneous_frequency()',
  },
  {
    concept: 'Phase Accumulation',
    math: 'φ_synth[m,k] = φ_synth[m−1,k] + ω_inst[k] · (Hs/Ha)',
    purpose: 'Builds a coherent phase trajectory for the synthesis frames. Using Hs ≠ Ha changes duration while preserving pitch.',
    file: 'dsp/phase_vocoder.py',
    fn: 'time_stretch()',
  },
  {
    concept: 'Time Stretching',
    math: 'Hs = Ha × stretch_factor',
    purpose: 'Changes signal duration by adjusting synthesis hop. A larger Hs spreads frames further apart; smaller compresses them.',
    file: 'dsp/phase_vocoder.py',
    fn: 'time_stretch()',
  },
  {
    concept: 'Identity Phase Locking',
    math: 'φ_locked[k] = φ_synth[peak] + (φ_orig[k] − φ_orig[peak])',
    purpose: 'Groups spectral bins by their nearest amplitude peak and locks their phase to the peak, reducing phasiness artifacts.',
    file: 'dsp/phase_vocoder.py',
    fn: 'time_stretch_with_phase_locking()',
  },
  {
    concept: 'Pitch Shifting',
    math: 'p = 2^(s/12), stretch by 1/p, resample by p',
    purpose: 'Shifts pitch by s semitones while preserving duration. Implemented as phase-vocoder time stretch followed by resampling.',
    file: 'dsp/phase_vocoder.py',
    fn: 'pitch_shift()',
  },
  {
    concept: 'Naive Resampling',
    math: 'output[n] = signal[n · p] (linear interpolation)',
    purpose: 'Changes the sample playback rate, coupling pitch and duration. Used as the resampling step inside pitch_shift().',
    file: 'dsp/resampling.py',
    fn: 'naive_resample()',
  },
  {
    concept: 'Semitones to Pitch Factor',
    math: 'pitch_factor = 2^(semitones / 12)',
    purpose: 'Converts a musical interval (semitones) to the linear frequency ratio required by the pitch shift algorithm.',
    file: 'dsp/resampling.py',
    fn: 'semitones_to_pitch_factor()',
  },
  {
    concept: 'Convolution (Reverb)',
    math: 'y[n] = Σₖ x[k] · h[n−k]',
    purpose: 'LTI system operation used by the Reverb and Echo effects. The impulse response h[n] encodes the room/echo characteristics.',
    file: 'dsp/effects.py',
    fn: 'ReverbEffect.process()',
  },
  {
    concept: 'Low-Pass Filter',
    math: 'H(s) = 1 / (1 + s/ωc)  [Butterworth 4th order]',
    purpose: 'Attenuates high-frequency content. Used by Telephone, Underwater, and similar preset effects.',
    file: 'dsp/effects.py',
    fn: 'LowPassFilterEffect.process()',
  },
];

/**
 * ConceptMappingTable — shows all project concepts mapped to their
 * mathematical formulation, purpose, and verified source implementation.
 */
export default function ConceptMappingTable() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? CONCEPT_TABLE.filter(
          (c) =>
            c.concept.toLowerCase().includes(q) ||
            c.math.toLowerCase().includes(q) ||
            c.purpose.toLowerCase().includes(q) ||
            c.file.toLowerCase().includes(q) ||
            c.fn.toLowerCase().includes(q)
        )
      : CONCEPT_TABLE;
  }, [search]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>
          search
        </span>
        <input
          type="text"
          placeholder="Search concepts, equations, or files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant/40 rounded-2xl pl-11 pr-4 py-3 text-body-lg text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          No concepts match "{search}"
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((entry) => {
          const isExpanded = expanded === entry.concept;
          return (
            <div
              key={entry.concept}
              className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden shadow-card transition-all duration-300"
            >
              {/* Header row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : entry.concept)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-container-low transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-title-md font-bold text-on-surface truncate">{entry.concept}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-body-sm text-primary bg-primary-container/50 px-2 py-0.5 rounded-md hidden sm:block">
                    {entry.fn}
                  </span>
                  <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} style={{ fontSize: 20 }}>
                    expand_more
                  </span>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-outline-variant/20">
                  {/* Math */}
                  <div className="pt-4">
                    <p className="text-label-caps text-on-surface-variant mb-2">FORMULA</p>
                    <div className="font-mono text-body-lg text-primary bg-surface-container px-4 py-3 rounded-xl overflow-x-auto whitespace-nowrap">
                      {entry.math}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div>
                    <p className="text-label-caps text-on-surface-variant mb-1">PURPOSE</p>
                    <p className="text-body-sm text-on-surface leading-relaxed">{entry.purpose}</p>
                  </div>

                  {/* Source */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-label-caps text-on-surface-variant">SOURCE:</span>
                    <span className="font-mono text-body-sm bg-primary-container/50 text-on-primary-container px-2 py-0.5 rounded-md">
                      {entry.file}
                    </span>
                    <span className="text-on-surface-variant">→</span>
                    <span className="font-mono text-body-sm bg-secondary-container text-on-secondary-fixed px-2 py-0.5 rounded-md">
                      {entry.fn}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
