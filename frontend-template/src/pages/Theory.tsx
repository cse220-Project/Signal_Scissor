import { useState, useCallback } from 'react';

// Layout & navigation
import TheoryHero from '../components/theory/TheoryHero';
import TheoryNav from '../components/theory/TheoryNav';
import TheorySection from '../components/theory/TheorySection';

// Shared display components
import ConceptCard from '../components/theory/ConceptCard';
import EquationCard, { Eq } from '../components/theory/EquationCard';
import ImplementationCard from '../components/theory/ImplementationCard';
import ConceptMappingTable from '../components/theory/ConceptMappingTable';

// Simulations — Batch A
import SamplingSimulation from '../components/theory/simulations/SamplingSimulation';
import FourierSimulation from '../components/theory/simulations/FourierSimulation';
import DFTvsFFTSimulation from '../components/theory/simulations/DFTvsFFTSimulation';
import MagnitudePhaseSimulation from '../components/theory/simulations/MagnitudePhaseSimulation';
import WindowingSimulation from '../components/theory/simulations/WindowingSimulation';

// Simulations — Batch B
import STFTSimulation from '../components/theory/simulations/STFTSimulation';
import PhaseVocoderSimulation from '../components/theory/simulations/PhaseVocoderSimulation';
import PhaseWheelSimulation from '../components/theory/simulations/PhaseWheelSimulation';
import TimeStretchSimulation from '../components/theory/simulations/TimeStretchSimulation';
import PitchShiftSimulation from '../components/theory/simulations/PitchShiftSimulation';
import ResamplingSimulation from '../components/theory/simulations/ResamplingSimulation';
import ConvolutionSimulation from '../components/theory/simulations/ConvolutionSimulation';
import WOLASimulation from '../components/theory/simulations/WOLASimulation';

// Complex visualizations
import TheoryRoadmap from '../components/theory/TheoryRoadmap';
import ConceptMap from '../components/theory/ConceptMap';
import PipelineVisualization from '../components/theory/PipelineVisualization';
import FinalSummary from '../components/theory/FinalSummary';

// Questionnaire
import Questionnaire from '../components/theory/questionnaire/Questionnaire';

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Theory() {
  const [activeSection, setActiveSection] = useState('foundations');

  const handleVisible = useCallback((id: string) => {
    setActiveSection(id);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    scrollToSection(id);
    setActiveSection(id);
  }, []);

  const handleExplore = useCallback(() => {
    scrollToSection('foundations');
  }, []);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Hero */}
      <TheoryHero onExplore={handleExplore} />

      {/* Sticky navigation */}
      <TheoryNav activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main content */}
      <div className="space-y-16 pt-10 pb-24">

        {/* ── 01 FOUNDATIONS ─────────────────────────────────────── */}
        <TheorySection
          id="foundations"
          index="01"
          title="Signals & Systems Foundations"
          subtitle="The mathematical language underlying digital audio processing."
          whyCard="Every audio processing operation in this project — from reading a WAV file to reconstructing pitch-shifted output — depends on the foundational concepts of continuous and discrete signals, linear systems, and the relationship between time and frequency domains."
          initiallyVisible={true}
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <ConceptCard
              concept="Continuous-Time Signal"
              math="x(t), t ∈ ℝ"
              description="A function defined for every instant of time. Real-world audio is a continuous pressure wave. The Fourier Transform operates on continuous signals."
              tags={['Analog', 'Theory']}
            />
            <ConceptCard
              concept="Discrete-Time Signal"
              math="x[n], n ∈ ℤ"
              description="A sequence of values indexed by integers. After analog-to-digital conversion, audio becomes a discrete signal. All DSP algorithms operate on discrete sequences."
              tags={['Digital', 'Implementation']}
            />
            <ConceptCard
              concept="LTI System"
              math="y[n] = T{x[n]}"
              description="A Linear Time-Invariant system satisfies superposition and time-invariance. Filters, echo, and reverb are LTI. The phase vocoder itself is NOT LTI — it is time-varying."
              tags={['LTI', 'Systems']}
              variant="highlight"
            />
            <ConceptCard
              concept="Frequency"
              math="f (Hz) = cycles per second"
              description="Determines the perceived pitch of a tone. The DFT bin k corresponds to frequency f_k = k·Fs/N, where Fs is the sampling rate and N is the FFT size."
              tags={['Fundamental']}
            />
            <ConceptCard
              concept="Phase"
              math="φ = initial angle of a sinusoid"
              description="Determines where in its cycle a sinusoid starts. Phase encodes temporal position. In the phase vocoder, tracking phase evolution across frames is the core operation."
              tags={['Fundamental', 'Critical']}
              variant="highlight"
            />
            <ConceptCard
              concept="Amplitude"
              math="A = peak magnitude"
              description="Determines the loudness/intensity of a component. The magnitude spectrum |X[k]| captures amplitude per frequency bin."
              tags={['Fundamental']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EquationCard label="Fourier Transform (continuous)">
              {'X(jω) = ∫₋∞^∞ x(t)·e^(−jωt) dt'}
            </EquationCard>
            <EquationCard label="Inverse Fourier Transform">
              {'x(t) = (1/2π) ∫₋∞^∞ X(jω)·e^(jωt) dω'}
            </EquationCard>
          </div>
        </TheorySection>

        {/* ── 02 SAMPLING ─────────────────────────────────────────── */}
        <TheorySection
          id="sampling"
          index="02"
          title="Sampling & Discrete-Time Signals"
          subtitle="Converting continuous audio into a discrete sequence the computer can process."
          whyCard="Audio files are discrete sequences of numbers. The phase vocoder reads these samples and processes them at integer indices. Understanding sampling frequency, Nyquist, and aliasing explains why the project works correctly only within the Nyquist band."
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <EquationCard label="Nyquist Frequency">
              {'f_N = Fs / 2'}
              <br />
              <span className="text-body-sm text-on-surface-variant">Maximum representable frequency at sampling rate Fs</span>
            </EquationCard>
            <EquationCard label="Frequency Bin">
              {'f_k = k · Fs / N'}
              <br />
              <span className="text-body-sm text-on-surface-variant">Frequency in Hz corresponding to FFT bin k</span>
            </EquationCard>
          </div>

          <SamplingSimulation />

          <div className="mt-6">
            <ImplementationCard
              file="dsp/fft_processor.py"
              fn="frequency_axis()"
              description="Returns the frequency axis for N bins at a given sample rate using numpy.fft.rfftfreq. Default Fs=44100 Hz used by the backend."
            />
          </div>
        </TheorySection>

        {/* ── 03 FOURIER ──────────────────────────────────────────── */}
        <TheorySection
          id="fourier"
          index="03"
          title="Fourier Analysis"
          subtitle="Decomposing a signal into its sinusoidal frequency components."
          whyCard="The phase vocoder requires a frequency-domain representation of each audio frame. Fourier analysis is the mathematical bridge from a waveform to the per-bin magnitude and phase data that the algorithm manipulates."
          onVisible={handleVisible}
        >
          <div className="mb-6">
            <EquationCard label="Discrete Fourier Transform (DFT)" description="The DFT computes the complex spectrum X[k] for each frequency bin k. The FFT is an efficient algorithm for computing the DFT.">
              {'X[k] = Σₙ₌₀^(N−1) x[n] · e^(−j2πkn/N)'}
            </EquationCard>
          </div>

          <FourierSimulation />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-label-caps text-on-surface-variant mb-1">n</p>
              <p className="text-body-sm text-on-surface">Sample index (0 to N−1)</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-label-caps text-on-surface-variant mb-1">k</p>
              <p className="text-body-sm text-on-surface">Frequency bin index (0 to N−1)</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-label-caps text-on-surface-variant mb-1">N</p>
              <p className="text-body-sm text-on-surface">FFT size. Default: 2048 in this project</p>
            </div>
          </div>
        </TheorySection>

        {/* ── 04 DFT & FFT ────────────────────────────────────────── */}
        <TheorySection
          id="dft-fft"
          index="04"
          title="DFT & FFT"
          subtitle="Why the Fast Fourier Transform is essential for real-time audio processing."
          whyCard="The project uses numpy.fft.fft() — an FFT algorithm. For N=2048 samples, the FFT computes only ~22,528 operations instead of ~4,194,304 for a naive DFT. This speedup makes per-frame FFT computationally practical."
          onVisible={handleVisible}
        >
          <DFTvsFFTSimulation />

          <div className="mt-6">
            <ImplementationCard
              file="dsp/fft_processor.py"
              fn="compute_fft()"
              description="Wraps numpy.fft.fft(frame). Called for every STFT frame. At N=2048 and Ha=512, this runs hundreds of times per second of audio."
            />
          </div>
        </TheorySection>

        {/* ── 05 MAGNITUDE & PHASE ────────────────────────────────── */}
        <TheorySection
          id="magnitude-phase"
          index="05"
          title="Magnitude and Phase"
          subtitle="The two components of a complex spectrum that together fully describe a signal."
          whyCard="The phase vocoder separates magnitude and phase. Magnitude is preserved across synthesis frames (the frequency content stays the same). Phase is tracked and accumulated across frames to maintain temporal coherence. Without phase, reconstruction is incoherent."
          onVisible={handleVisible}
        >
          <div className="mb-6">
            <EquationCard label="Polar decomposition of complex spectrum" description="Every DFT bin is a complex number decomposed into magnitude (how much) and phase (when).">
              {'X[k] = |X[k]| · e^(jφ[k])'}
            </EquationCard>
          </div>

          <MagnitudePhaseSimulation />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImplementationCard
              file="dsp/fft_processor.py"
              fn="magnitude_spectrum()"
              description="Returns np.abs(spectrum) — the magnitude of each complex bin."
            />
            <ImplementationCard
              file="dsp/fft_processor.py"
              fn="phase_spectrum()"
              description="Returns np.angle(spectrum) — the phase angle (radians) of each complex bin."
            />
          </div>
        </TheorySection>

        {/* ── 06 WINDOWING ────────────────────────────────────────── */}
        <TheorySection
          id="windowing"
          index="06"
          title="Windowing & Spectral Leakage"
          subtitle="Controlling how a finite signal frame interacts with Fourier analysis."
          whyCard="The STFT divides audio into finite frames. A finite rectangular frame implicitly multiplies the signal by a rectangular window — whose DFT has large side lobes, causing spectral leakage. Smooth windows (Hann, Hamming, Blackman) reduce side lobes at the cost of a wider main lobe."
          onVisible={handleVisible}
        >
          <div className="mb-6">
            <EquationCard label="Hann Window" description="The default window in this project. Smooth, well-balanced leakage properties.">
              {'w[n] = 0.5 · (1 − cos(2πn / (N−1)))'}
            </EquationCard>
          </div>

          <WindowingSimulation />

          <div className="mt-6">
            <ImplementationCard
              file="dsp/windowing.py"
              fn="get_window()"
              description="Returns the window array for types: hann (default), hamming, blackman, rectangular. Called inside compute_stft() and reconstruct_signal_wola()."
            />
          </div>
        </TheorySection>

        {/* ── 07 STFT ─────────────────────────────────────────────── */}
        <TheorySection
          id="stft"
          index="07"
          title="Short-Time Fourier Transform"
          subtitle="Localised frequency analysis — the core analysis tool of the phase vocoder."
          whyCard="A single FFT of the entire signal gives a global frequency view but loses all timing information. The STFT applies FFT to short overlapping frames, giving a time-indexed sequence of local spectra — the time-frequency representation the phase vocoder needs."
          onVisible={handleVisible}
        >
          <div className="mb-6">
            <EquationCard label="STFT" description="The windowed FFT of frame m. Analysis hop Ha advances the window by Ha samples each frame.">
              {'STFT{x}(m,k) = Σₙ x[n] · w[n−m·Ha] · e^(−j2πkn/N)'}
            </EquationCard>
          </div>

          <STFTSimulation />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImplementationCard
              file="dsp/stft.py"
              fn="create_frames()"
              description="Extracts overlapping frames using stride indexing. Returns shape (n_frames, N)."
            />
            <ImplementationCard
              file="dsp/stft.py"
              fn="compute_stft()"
              description="Applies get_window() then compute_fft() to each frame. Returns STFT matrix, magnitude array, and phase array."
            />
          </div>
        </TheorySection>

        {/* ── 08 PHASE VOCODER ────────────────────────────────────── */}
        <TheorySection
          id="phase-vocoder"
          index="08"
          title="The Phase Vocoder"
          subtitle="Coherent time-scale modification via frame-by-frame phase accumulation."
          whyCard="The phase vocoder is the heart of this project. It modifies the synthesis hop Hs relative to analysis hop Ha to stretch or compress time. Without careful phase tracking across frames, the output sounds phasey and incoherent. The algorithm works entirely in the frequency domain."
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <EquationCard label="Instantaneous frequency" description="Estimates the true frequency of bin k from its phase advance.">
              {'ω_inst[k] = ω_k + wrap(Δφ[k] − ω_k · Ha)'}
            </EquationCard>
            <EquationCard label="Phase accumulation" description="Builds a coherent phase for synthesis frame m.">
              {'φ_synth[m,k] = φ_synth[m−1,k] + ω_inst[k] · (Hs/Ha)'}
            </EquationCard>
          </div>

          <PhaseVocoderSimulation />

          <div className="mt-6">
            <ImplementationCard
              file="dsp/phase_vocoder.py"
              fn="time_stretch()"
              description="Phase vocoder time stretching. Default: N_FFT=2048, Ha=512. Hs = round(Ha × stretch_factor). RMS-normalized output."
            />
          </div>
        </TheorySection>

        {/* ── 09 PHASE DIFFERENCE & UNWRAPPING ────────────────────── */}
        <TheorySection
          id="phase-vocoder"
          index="09"
          title="Phase Difference & Phase Wrapping"
          subtitle="How phase evolves between frames — and why wrapping must be handled."
          whyCard="Phase is defined modulo 2π. When a bin's phase crosses ±π between frames, the raw difference jumps by ≈2π. The wrap_phase() function corrects this jump to get the true residual — which is added to the expected phase advance to estimate instantaneous frequency."
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <EquationCard label="Phase difference">
              {'Δφ[k] = φ_curr[k] − φ_prev[k]'}
            </EquationCard>
            <EquationCard label="Wrap formula (from fft_processor.py)">
              {'wrap(φ) = (φ + π) mod 2π − π'}
            </EquationCard>
          </div>

          <PhaseWheelSimulation />

          <div className="mt-6">
            <ImplementationCard
              file="dsp/fft_processor.py"
              fn="wrap_phase()"
              description="Implements (phase + π) % (2π) − π using numpy, called inside estimate_instantaneous_frequency()."
            />
          </div>
        </TheorySection>

        {/* ── 11 TIME STRETCHING ──────────────────────────────────── */}
        <TheorySection
          id="pitch-shifting"
          index="11"
          title="Time Stretching"
          subtitle="Changing signal duration while preserving pitch."
          whyCard="Time stretching is the first step of pitch shifting. By using Hs = Ha × stretch_factor, synthesis frames are spaced further (or closer) than analysis frames, changing total output length while spectral content stays the same."
          onVisible={handleVisible}
        >
          <EquationCard label="Synthesis hop" description="The key relationship: Hs controls duration, not pitch." compact>
            {'Hs = Ha × stretch_factor  (default Ha = 512)'}
          </EquationCard>

          <div className="mt-6">
            <TimeStretchSimulation />
          </div>

          <div className="mt-6">
            <ImplementationCard
              file="dsp/phase_vocoder.py"
              fn="time_stretch()"
              description="Called internally by pitch_shift() with stretch_factor = 1/pitch_factor. Also exposed as TimeStretchEffect in effects.py."
            />
          </div>
        </TheorySection>

        {/* ── 12 PITCH SHIFTING ───────────────────────────────────── */}
        <TheorySection
          id="pitch-shifting"
          index="12"
          title="Pitch Shifting"
          subtitle="Independent pitch modification without changing duration."
          whyCard="Pitch shifting = time stretch + resampling. Time stretching by 1/p gives a signal with the original pitch but wrong duration. Resampling by p then restores the original duration while shifting pitch. This two-step pipeline decouples pitch from duration."
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <EquationCard label="Pitch factor from semitones">
              {'p = 2^(s / 12)'}
              <br />
              <span className="text-body-sm text-on-surface-variant">+12 semitones → p=2 (octave up) | −12 → p=0.5 (octave down)</span>
            </EquationCard>
            <EquationCard label="Pitch shift pipeline">
              {'stretch by (1/p) → resample by p'}
              <br />
              <span className="text-body-sm text-on-surface-variant">Duration preserved; pitch shifted by factor p</span>
            </EquationCard>
          </div>

          <PitchShiftSimulation />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImplementationCard
              file="dsp/phase_vocoder.py"
              fn="pitch_shift()"
              description="Calls time_stretch(signal, sr, 1/pitch_factor) then naive_resample(stretched, sr, pitch_factor). Supports phase_locking=True for better quality."
            />
            <ImplementationCard
              file="dsp/resampling.py"
              fn="semitones_to_pitch_factor()"
              description="Returns 2^(semitones/12). Used to convert the UI semitone slider value to the linear pitch ratio."
            />
          </div>
        </TheorySection>

        {/* ── 13 RESAMPLING ───────────────────────────────────────── */}
        <TheorySection
          id="resampling"
          index="13"
          title="Naive Resampling & Interpolation"
          subtitle="How resampling couples pitch and duration — and why it's used deliberately."
          whyCard="Naive resampling changes the number of samples, coupling pitch and duration. When used as the final step of pitch_shift() after time stretching, this coupling is exploited deliberately: the time-stretched signal already has the correct spectral content; resampling snaps it back to the original sample count."
          onVisible={handleVisible}
        >
          <div className="mb-6">
            <EquationCard label="Linear interpolation resampling" description="From dsp/resampling.py: index positions are computed at pitch_factor spacing, then linearly interpolated.">
              {'output[n] = signal[⌊n·p⌋]·(1−α) + signal[⌊n·p⌋+1]·α'}
              <br />
              {'where α = n·p − ⌊n·p⌋'}
            </EquationCard>
          </div>

          <ResamplingSimulation />

          <div className="mt-6">
            <ImplementationCard
              file="dsp/resampling.py"
              fn="naive_resample()"
              description="n_samples = int(len(signal)/pitch_factor). Indices = arange(n_samples) × pitch_factor. Linear interpolation between floor/ceil. Called by pitch_shift()."
            />
          </div>
        </TheorySection>

        {/* ── 16 WOLA ─────────────────────────────────────────────── */}
        <TheorySection
          id="wola"
          index="16"
          title="IFFT + Overlap-Add / WOLA"
          subtitle="Reconstructing a continuous signal from phase-modified STFT frames."
          whyCard="After phase manipulation, each bin's complex spectrum is converted back to a time-domain frame via IFFT. These frames overlap in time and must be summed with window² normalization (WOLA) to produce a smooth, continuous output without amplitude discontinuities at frame boundaries."
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <EquationCard label="Synthesis frame">
              {'y_frame[m] = IFFT(|X[m]| · e^(jφ_synth[m]))'}
            </EquationCard>
            <EquationCard label="WOLA normalization">
              {'output[n] = Σₘ (y_frame[m]·w[n]) / Σₘ w²[n]'}
            </EquationCard>
          </div>

          <WOLASimulation />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImplementationCard
              file="dsp/stft.py"
              fn="reconstruct_signal_wola()"
              description="Accumulates windowed IFFT frames into the output buffer and divides by the summed window² at each position. Clips to original_length."
            />
            <ImplementationCard
              file="dsp/fft_processor.py"
              fn="compute_ifft()"
              description="Returns np.real(np.fft.ifft(spectrum)). Taking only the real part discards numerical imaginary residuals from floating-point arithmetic."
            />
          </div>
        </TheorySection>

        {/* ── 17 PHASE LOCKING ────────────────────────────────────── */}
        <TheorySection
          id="wola"
          index="17"
          title="Phase Locking & Phasiness"
          subtitle="Reducing phase-vocoder artifacts by preserving spectral coherence."
          whyCard="The standard phase vocoder processes each bin independently. This breaks the relative phase relationships between harmonically related bins, causing a 'phasey' or smeared quality, especially on transients. Phase locking preserves these relationships by using spectral peak bins as phase anchors."
          onVisible={handleVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <ConceptCard
              concept="Phasiness"
              description="An artifact where phase-incoherent spectral components produce a smeared, metallic, or underwater-sounding output. Particularly audible on transients and voiced speech."
              tags={['Artifact']}
              variant="highlight"
            />
            <ConceptCard
              concept="Identity Phase Locking"
              description="Find local spectral magnitude peaks. For every non-peak bin k, set its synthesis phase to: φ_synth[peak] + (φ_orig[k] − φ_orig[peak]). This preserves relative phases around each peak."
              tags={['Enhancement', 'Implementation']}
              variant="highlight"
            />
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 mb-4">
            <p className="text-label-caps text-on-surface-variant mb-3">PHASE LOCKING FORMULA</p>
            <EquationCard compact>
              {'φ_locked[k] = φ_synth[peak] + (φ_orig[k] − φ_orig[peak])'}
            </EquationCard>
            <p className="text-body-sm text-on-surface-variant mt-3">
              Peaks found where: mag[k−1] &lt; mag[k] &gt; mag[k+1]. Each non-peak bin is locked to the phase of its nearest amplitude peak.
            </p>
          </div>

          <ImplementationCard
            file="dsp/phase_vocoder.py"
            fn="time_stretch_with_phase_locking()"
            description="Peak-based identity phase locking applied every synthesis frame. Enabled by passing phase_locking=True to pitch_shift(). Used by PitchShiftEffect when configured."
          />
        </TheorySection>

        {/* ── 18 LTI & CONVOLUTION ────────────────────────────────── */}
        <TheorySection
          id="lti-convolution"
          index="18"
          title="LTI Systems, Convolution & Effects"
          subtitle="How linear time-invariant systems describe the project's effects pipeline."
          whyCard="Reverb, echo, and filtering are LTI operations implemented via convolution. The phase vocoder is NOT LTI — it involves time-varying phase manipulation. Understanding the distinction is important: convolution describes the effects chain, not the core pitch-shifting algorithm."
          onVisible={handleVisible}
        >
          <div className="mb-6">
            <EquationCard label="Discrete convolution" description="LTI system output. h[n] is the impulse response encoding the system's behavior (room acoustics for reverb, delay + decay for echo).">
              {'y[n] = Σₖ x[k] · h[n−k]  =  x[n] * h[n]'}
            </EquationCard>
          </div>

          <ConvolutionSimulation />

          <div className="mt-6 rounded-2xl bg-error/5 border border-error/20 p-4 flex gap-3">
            <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5" style={{ fontSize: 18 }}>
              info
            </span>
            <p className="text-body-sm text-on-surface">
              <strong>Important distinction:</strong> Reverb and Echo in <Eq>dsp/effects.py</Eq> use <Eq>scipy.signal.convolve</Eq> — a true LTI convolution. The phase vocoder (<Eq>time_stretch</Eq>, <Eq>pitch_shift</Eq>) is <strong>not</strong> an LTI system because its behaviour depends on the instantaneous phase of each frame, making it time-varying.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImplementationCard
              file="dsp/effects.py"
              fn="ReverbEffect.process()"
              description="Generates a decaying random impulse response and convolves it with the input via scipy.signal.convolve."
            />
            <ImplementationCard
              file="dsp/effects.py"
              fn="EchoEffect.process()"
              description="Adds a delayed, attenuated copy: out[d:] += signal[:-d] × decay. Equivalent to convolution with a two-tap impulse response."
            />
          </div>
        </TheorySection>

        {/* ── INTERACTIVE ROADMAP ─────────────────────────────────── */}
        <TheorySection
          id="pipeline"
          index="19"
          title="Interactive DSP Pipeline Roadmap"
          subtitle="Click any node to explore its mathematics, equations, and source implementation."
          onVisible={handleVisible}
        >
          <TheoryRoadmap onJumpToSection={handleNavigate} />
        </TheorySection>

        {/* ── COMPLETE PIPELINE VISUALIZATION ─────────────────────── */}
        <TheorySection
          id="pipeline"
          index="20"
          title="From Mathematics to Your Voice"
          subtitle="The complete phase vocoder pipeline — every step animated and annotated."
          onVisible={handleVisible}
        >
          <PipelineVisualization />
        </TheorySection>

        {/* ── CONCEPT MAP ─────────────────────────────────────────── */}
        <TheorySection
          id="concept-map"
          index="21"
          title="Concept Relationship Map"
          subtitle="How every DSP concept in this project connects to the others."
          onVisible={handleVisible}
        >
          <ConceptMap />
        </TheorySection>

        {/* ── CONCEPT → IMPLEMENTATION MAPPING ───────────────────── */}
        <TheorySection
          id="concept-map"
          index="22"
          title="Project Concept → Implementation Mapping"
          subtitle="Every major concept mapped to its verified source file and function."
          whyCard="This table is the definitive reference: each concept you've studied above corresponds to a real function in the project's backend. Click any row to see the formula, purpose, and exact source location."
          onVisible={handleVisible}
        >
          <ConceptMappingTable />
        </TheorySection>

        {/* ── VIVA / QUESTIONNAIRE ────────────────────────────────── */}
        <TheorySection
          id="viva"
          index="23"
          title='Can You Explain the DSP?'
          subtitle="80+ viva-style questions covering every concept in this project. Test your understanding from fundamentals to project defense."
          onVisible={handleVisible}
        >
          <Questionnaire />
        </TheorySection>

        {/* ── FINAL SUMMARY ───────────────────────────────────────── */}
        <FinalSummary />

      </div>
    </div>
  );
}
