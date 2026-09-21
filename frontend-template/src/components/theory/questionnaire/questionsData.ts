export interface Question {
  id: number;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  levelName: string;
  category: string;
  question: string;
  answer: string;
  whyItMatters: string;
  projectConnection: string;
}

export const questions: Question[] = [
  // Level 1: Fundamentals (9)
  {
    id: 101,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Signals',
    question: 'What is a continuous-time signal?',
    answer: 'A signal that has a value for every possible real-numbered instant in time, such as an analog voltage from a microphone.',
    whyItMatters: 'Real-world sounds are continuous, but computers can only process discrete data, necessitating a conversion.',
    projectConnection: 'dsp/resampling.py → naive_resample()'
  },
  {
    id: 102,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Signals',
    question: 'What is a discrete-time signal?',
    answer: 'A signal defined only at separated, specific instants of time, typically represented as an array or sequence of numbers.',
    whyItMatters: 'Digital signal processing algorithms operate exclusively on discrete-time signals.',
    projectConnection: 'dsp/fft_processor.py → compute_fft()'
  },
  {
    id: 103,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Sampling',
    question: 'What is sampling?',
    answer: 'The process of measuring the value of a continuous-time signal at regular intervals to create a discrete-time signal.',
    whyItMatters: 'Determines the fidelity with which a computer can capture real-world sound.',
    projectConnection: 'dsp/resampling.py → naive_resample()'
  },
  {
    id: 104,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Sampling',
    question: 'What is sampling frequency?',
    answer: 'The number of samples taken per second, measured in Hertz (Hz). For example, CD quality audio uses a sampling frequency of 44.1 kHz.',
    whyItMatters: 'Dictates the maximum frequency that can be accurately represented in the digital signal.',
    projectConnection: 'dsp/effects.py → PitchShiftEffect'
  },
  {
    id: 105,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Sampling',
    question: 'What is the Nyquist frequency?',
    answer: 'The highest frequency that can be accurately represented in a sampled signal, equal to exactly half the sampling frequency.',
    whyItMatters: 'Frequencies above the Nyquist frequency will alias and cause distortion if not filtered out.',
    projectConnection: 'dsp/resampling.py → naive_resample()'
  },
  {
    id: 106,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Sampling',
    question: 'What is aliasing?',
    answer: 'An effect that causes different signals to become indistinguishable (or aliases of one another) when sampled. It occurs when a signal contains frequencies above the Nyquist frequency.',
    whyItMatters: 'Creates harsh, non-harmonic distortions that cannot be removed once sampling has occurred.',
    projectConnection: 'dsp/effects.py → LowPassFilterEffect'
  },
  {
    id: 107,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Waveforms',
    question: 'What is amplitude?',
    answer: 'The maximum displacement of a wave from its resting position. In audio, it corresponds to the volume or loudness of the sound.',
    whyItMatters: 'Amplitude changes affect how loud a signal sounds and are essential in mixing and dynamics processing.',
    projectConnection: 'dsp/fft_processor.py → magnitude_spectrum()'
  },
  {
    id: 108,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Waveforms',
    question: 'What is frequency?',
    answer: 'The number of occurrences of a repeating event per unit of time, usually measured in Hz. In audio, it determines pitch.',
    whyItMatters: 'Understanding frequency is required for pitch shifting, filtering, and any spectral processing.',
    projectConnection: 'dsp/phase_vocoder.py → estimate_instantaneous_frequency()'
  },
  {
    id: 109,
    level: 1,
    levelName: 'Fundamentals',
    category: 'Waveforms',
    question: 'What is phase?',
    answer: 'The position of a point in time (or instant) on a waveform cycle. It describes how far along a wave is in its current cycle.',
    whyItMatters: 'Phase relationships determine how signals combine (constructive vs destructive interference) and are the core of phase vocoder operations.',
    projectConnection: 'dsp/fft_processor.py → phase_spectrum()'
  },

  // Level 2: Fourier Analysis (9)
  {
    id: 201,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Theory',
    question: 'What is Fourier Series?',
    answer: 'A mathematical way to represent a periodic function as an infinite sum of simple sine and cosine waves of different frequencies and amplitudes.',
    whyItMatters: 'It forms the theoretical foundation that any complex periodic sound can be broken down into simpler tones.',
    projectConnection: 'dsp/fft_processor.py → compute_fft()'
  },
  {
    id: 202,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Theory',
    question: 'What is the Fourier Transform?',
    answer: 'A mathematical operation that decomposes a signal (which can be non-periodic) into its constituent frequencies, transforming a time-domain signal into a frequency-domain representation.',
    whyItMatters: 'Allows us to see which frequencies are present in a sound and how strong they are.',
    projectConnection: 'dsp/fft_processor.py → compute_fft()'
  },
  {
    id: 203,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Algorithms',
    question: 'Why is FFT used instead of DFT?',
    answer: 'The Fast Fourier Transform (FFT) is an algorithm that computes the Discrete Fourier Transform (DFT) much faster. DFT takes O(N²) operations, whereas FFT takes O(N log N) operations.',
    whyItMatters: 'Without the FFT, real-time audio processing in the frequency domain would be too computationally expensive.',
    projectConnection: 'dsp/fft_processor.py → compute_fft()'
  },
  {
    id: 204,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Frequency Domain',
    question: 'What is a DFT frequency bin?',
    answer: 'A discrete frequency band in the DFT output. The total frequency range (0 to Nyquist) is divided into N/2 bins, each representing a specific narrow frequency band.',
    whyItMatters: 'We manipulate the magnitude and phase of these bins to process audio in the frequency domain.',
    projectConnection: 'dsp/phase_vocoder.py → estimate_instantaneous_frequency()'
  },
  {
    id: 205,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Frequency Domain',
    question: 'What is the magnitude spectrum?',
    answer: 'The representation of the amplitude (strength) of each frequency component in a signal, computed as the absolute value of the complex FFT output.',
    whyItMatters: 'Tells us the spectral envelope and harmonic content of a sound, essential for EQ and vocoding.',
    projectConnection: 'dsp/fft_processor.py → magnitude_spectrum()'
  },
  {
    id: 206,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Frequency Domain',
    question: 'What is the phase spectrum?',
    answer: 'The representation of the phase angle of each frequency component, computed as the angle of the complex FFT output.',
    whyItMatters: 'Phase holds critical timing information. In a phase vocoder, phase differences are used to estimate exact frequencies.',
    projectConnection: 'dsp/fft_processor.py → phase_spectrum()'
  },
  {
    id: 207,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Resolution',
    question: 'What is frequency resolution?',
    answer: 'The spacing between frequency bins in the DFT, calculated as SampleRate / FFT_Size (N). It determines how precisely we can separate close frequencies.',
    whyItMatters: 'A higher frequency resolution (larger N) gives more detail in the frequency domain but less detail in the time domain.',
    projectConnection: 'dsp/effects.py → PitchShiftEffect'
  },
  {
    id: 208,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Theory',
    question: 'What is the difference between FT and DFT?',
    answer: 'The Fourier Transform (FT) is for continuous-time signals, while the Discrete Fourier Transform (DFT) is for discrete-time, sampled signals of finite length.',
    whyItMatters: 'Computers can only perform the DFT. We must be aware of the discrete nature, which leads to concepts like bins and spectral leakage.',
    projectConnection: 'dsp/fft_processor.py → compute_fft()'
  },
  {
    id: 209,
    level: 2,
    levelName: 'Fourier Analysis',
    category: 'Math',
    question: 'What are complex numbers in the context of FFT?',
    answer: 'The output of the FFT is an array of complex numbers, where the real and imaginary parts encode both the magnitude and phase of a frequency component.',
    whyItMatters: 'Complex math makes it elegant to manipulate magnitude and phase simultaneously before computing the IFFT.',
    projectConnection: 'dsp/fft_processor.py → compute_ifft()'
  },

  // Level 3: Windowing & STFT (9)
  {
    id: 301,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'Windowing',
    question: 'Why do we apply a window function before FFT?',
    answer: 'To taper the ends of a finite signal segment to zero, preventing the abrupt cut-offs that create artificial high frequencies in the spectrum.',
    whyItMatters: 'Without windowing, spectral leakage makes it difficult to distinguish true frequency components from artifacts.',
    projectConnection: 'dsp/windowing.py → get_window()'
  },
  {
    id: 302,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'Windowing',
    question: 'What is spectral leakage?',
    answer: 'The phenomenon where energy from a single frequency component spreads out into adjacent frequency bins, occurring when the signal is not periodic within the FFT window.',
    whyItMatters: 'Reduces the clarity of the frequency representation. Windowing mitigates this but widens the main lobe.',
    projectConnection: 'dsp/windowing.py → get_window()'
  },
  {
    id: 303,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'Windowing',
    question: 'What is a Hann window?',
    answer: 'A specific bell-shaped window function defined by 0.5*(1-cos(2πn/(N-1))). It provides a good compromise between frequency resolution and spectral leakage.',
    whyItMatters: 'It is widely used in STFT and phase vocoders because it perfectly satisfies the Constant Overlap-Add (COLA) property at 50% overlap.',
    projectConnection: 'dsp/windowing.py → create_hann_window()'
  },
  {
    id: 304,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'STFT',
    question: 'What is STFT?',
    answer: 'Short-Time Fourier Transform. It divides a longer signal into shorter segments (frames) and computes the FFT of each segment.',
    whyItMatters: 'Unlike standard FFT, STFT shows how the frequency content of a signal changes over time.',
    projectConnection: 'dsp/stft.py → compute_stft()'
  },
  {
    id: 305,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'STFT',
    question: 'Why use overlapping frames in STFT?',
    answer: 'To compensate for the signal loss at the edges of the frames caused by the window function tapering to zero.',
    whyItMatters: 'Ensures that all parts of the signal contribute equally to the analysis and allows seamless reconstruction.',
    projectConnection: 'dsp/stft.py → create_frames()'
  },
  {
    id: 306,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'STFT',
    question: 'What happens if hop size is too large?',
    answer: 'If the hop size exceeds the overlap required by the window function, the reconstructed signal will have amplitude modulation (a stuttering or tremolo effect).',
    whyItMatters: 'Determines the smoothness of the processed output. Standard hop sizes are N/4 or N/2.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },
  {
    id: 307,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'Theory',
    question: 'What is the time-frequency uncertainty principle?',
    answer: 'You cannot simultaneously have arbitrarily high resolution in both time and frequency. A longer window gives better frequency resolution but poorer time resolution, and vice versa.',
    whyItMatters: 'Requires a trade-off when choosing N_FFT (e.g., 2048 is good for pitch, but blurs transients).',
    projectConnection: 'dsp/effects.py → PitchShiftEffect'
  },
  {
    id: 308,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'Windowing',
    question: 'What is spectral smearing?',
    answer: 'The broadening of a single frequency component across multiple bins due to the use of a window function. It trades precise frequency location for reduced leakage.',
    whyItMatters: 'Affects the accuracy of peak detection in advanced phase vocoder algorithms.',
    projectConnection: 'dsp/windowing.py → get_window()'
  },
  {
    id: 309,
    level: 3,
    levelName: 'Windowing & STFT',
    category: 'Windowing',
    question: 'How do Hamming and Hann windows differ?',
    answer: 'Hann touches zero at the ends, while Hamming does not completely reach zero (0.54 - 0.46*cos). Hamming has lower maximum side-lobes, but Hann has a faster side-lobe roll-off.',
    whyItMatters: 'Different windows are chosen based on whether detecting faint tones (Hamming) or ensuring perfect reconstruction (Hann) is more important.',
    projectConnection: 'dsp/windowing.py → create_hamming_window()'
  },

  // Level 4: Phase Vocoder (9)
  {
    id: 401,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Concepts',
    question: 'What is a phase vocoder?',
    answer: 'An algorithm that can time-stretch or pitch-shift audio by analyzing and manipulating the frequency and phase information in the STFT domain.',
    whyItMatters: 'It allows changing the duration of a sound without altering its pitch, and vice versa.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 402,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Phase',
    question: 'Why compute phase differences between frames?',
    answer: 'To estimate the true instantaneous frequency of a component. The phase difference tells us how much the wave advanced between frames.',
    whyItMatters: 'Because bins are discrete, a frequency might lie between bins. Phase difference reveals its exact frequency.',
    projectConnection: 'dsp/phase_vocoder.py → estimate_instantaneous_frequency()'
  },
  {
    id: 403,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Phase',
    question: 'What is phase wrapping?',
    answer: 'The mathematical property where phase is only unambiguous within a range of 2π (usually -π to π). Any phase outside this range "wraps around" to fall within it. Formula: (φ+π)%(2π)−π.',
    whyItMatters: 'We must correctly handle wrapping when calculating phase differences to avoid massive errors in frequency estimation.',
    projectConnection: 'dsp/fft_processor.py → wrap_phase()'
  },
  {
    id: 404,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Phase',
    question: 'What is phase unwrapping?',
    answer: 'The process of resolving phase wrapping ambiguities by adding or subtracting multiples of 2π to create a continuous, monotonically changing phase sequence.',
    whyItMatters: 'Essential for calculating the true phase progression over time.',
    projectConnection: 'dsp/fft_processor.py → wrap_phase()'
  },
  {
    id: 405,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Frequency',
    question: 'What is instantaneous frequency?',
    answer: 'The true, precise frequency of a signal component at a specific point in time, estimated by: expected_k + wrap(Δφ_k - expected_k), where expected_k=2π*k*Ha/N.',
    whyItMatters: 'Used to maintain continuity of tones when the time scale is altered.',
    projectConnection: 'dsp/phase_vocoder.py → estimate_instantaneous_frequency()'
  },
  {
    id: 406,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Phase',
    question: 'Why can\'t we reuse the original phase directly when time-stretching?',
    answer: 'If frames are moved further apart in time, the original phase values are no longer valid for the new time positions. Reusing them causes discontinuities (clicks).',
    whyItMatters: 'We must synthesize new phases that maintain the correct phase progression for the estimated frequencies.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 407,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Synthesis',
    question: 'What is phase accumulation?',
    answer: 'The process of generating new phases for the output frames by continuously adding the phase advance (based on instantaneous frequency and synthesis hop size) to the previous frame\'s phase: φ_synth[m,k] = φ_synth[m-1,k] + ω_inst[k] * (Hs/Ha).',
    whyItMatters: 'Ensures smooth, continuous waveforms across frame boundaries in the synthesized signal.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 408,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Synthesis',
    question: 'What is the synthesis hop Hs?',
    answer: 'The distance (in samples) between adjacent frames when reconstructing the output signal. Hs = Ha * stretch_factor.',
    whyItMatters: 'By making Hs different from the analysis hop (Ha), we stretch or compress the signal in time.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 409,
    level: 4,
    levelName: 'Phase Vocoder',
    category: 'Synthesis',
    question: 'How does changing Hs change the output duration?',
    answer: 'If Hs > Ha, frames are placed further apart during reconstruction, stretching the sound (longer duration). If Hs < Ha, they are placed closer together, compressing it (shorter duration).',
    whyItMatters: 'This is the core mechanism of time stretching in a phase vocoder.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },

  // Level 5: Pitch Shifting (9)
  {
    id: 501,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Concepts',
    question: 'Why does time stretching preserve pitch?',
    answer: 'Because the phase vocoder algorithm explicitly calculates and maintains the exact frequencies (pitch) of the original signal, just sustaining them for a longer or shorter time.',
    whyItMatters: 'This decoupling of time and pitch is the main advantage of the phase vocoder.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 502,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Concepts',
    question: 'Why is resampling required after time stretching to shift pitch?',
    answer: 'Time stretching alters duration without changing pitch. Resampling changes both pitch and duration. By combining them, the duration change from resampling cancels out the time stretch, leaving only a pitch shift.',
    whyItMatters: 'This is the standard efficient method for pitch shifting: pitch_shift = time_stretch(1/factor) + resample(factor).',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },
  {
    id: 503,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Math',
    question: 'What is the pitch factor formula?',
    answer: 'pitch_factor = 2^(semitones/12). It calculates the ratio of the new frequency to the old frequency based on a shift in musical semitones.',
    whyItMatters: 'Maps musical intervals to the mathematical multipliers needed for resampling.',
    projectConnection: 'dsp/resampling.py → semitones_to_pitch_factor()'
  },
  {
    id: 504,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Math',
    question: 'Why does +12 semitones double the frequency?',
    answer: 'Because the musical scale is logarithmic. There are 12 semitones in an octave, and an octave represents a doubling of frequency (2^(12/12) = 2).',
    whyItMatters: 'Fundamental to how human hearing and western music perceive pitch.',
    projectConnection: 'dsp/resampling.py → semitones_to_pitch_factor()'
  },
  {
    id: 505,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Resampling',
    question: 'Why does naive resampling change BOTH pitch and duration?',
    answer: 'Playing a digital signal faster (or dropping samples) increases the pitch and reduces the total time, exactly like playing a tape or vinyl record at a faster speed.',
    whyItMatters: 'Naive resampling alone cannot shift pitch independently of duration.',
    projectConnection: 'dsp/resampling.py → naive_resample()'
  },
  {
    id: 506,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Concepts',
    question: 'How does the phase vocoder decouple pitch and duration?',
    answer: 'By working in the frequency domain, it can stretch the time axis (by moving frames and generating new phases) without altering the spectral envelope or the frequencies contained in those frames.',
    whyItMatters: 'Enables modern audio manipulation techniques like auto-tune and advanced samplers.',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },
  {
    id: 507,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Concepts',
    question: 'What happens when pitch_shift is called with +12 semitones?',
    answer: 'The signal is first time-stretched by a factor of 0.5 (making it half as long), then naively resampled by a factor of 2 (doubling the pitch and restoring the original duration).',
    whyItMatters: 'Understanding this 2-step process is crucial for implementing efficient pitch shifters.',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },
  {
    id: 508,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Concepts',
    question: 'What happens with -12 semitones?',
    answer: 'The signal is time-stretched by a factor of 2.0 (making it twice as long), then resampled by a factor of 0.5 (halving the pitch and restoring the original duration).',
    whyItMatters: 'Creates a deep, slow voice effect without slowing down the speech rate.',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },
  {
    id: 509,
    level: 5,
    levelName: 'Pitch Shifting',
    category: 'Concepts',
    question: 'What is the stretch factor used internally for +7 semitones?',
    answer: 'The pitch factor is 2^(7/12) ≈ 1.498. The stretch factor used internally is 1 / 1.498 ≈ 0.667.',
    whyItMatters: 'The time stretch factor is always the reciprocal of the desired pitch shift factor.',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },

  // Level 6: Reconstruction (9)
  {
    id: 601,
    level: 6,
    levelName: 'Reconstruction',
    category: 'IFFT',
    question: 'Why is IFFT needed?',
    answer: 'The Inverse Fast Fourier Transform (IFFT) converts the modified frequency domain data (magnitude and new phases) back into time-domain frames.',
    whyItMatters: 'Without IFFT, we cannot listen to the processed audio.',
    projectConnection: 'dsp/fft_processor.py → compute_ifft()'
  },
  {
    id: 602,
    level: 6,
    levelName: 'Reconstruction',
    category: 'Overlap-Add',
    question: 'What is overlap-add?',
    answer: 'A method of reconstructing a continuous signal by taking overlapping time-domain frames, aligning them based on the hop size, and adding them together.',
    whyItMatters: 'Recombines the short segments analyzed by STFT back into a single continuous waveform.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },
  {
    id: 603,
    level: 6,
    levelName: 'Reconstruction',
    category: 'WOLA',
    question: 'What is WOLA (Weighted Overlap-Add)?',
    answer: 'An overlap-add technique where frames are multiplied by a synthesis window before adding, and the final sum is normalized by dividing by the sum of the squared windows.',
    whyItMatters: 'Reduces artifacts caused by spectral modifications and ensures amplitude is maintained correctly.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },
  {
    id: 604,
    level: 6,
    levelName: 'Reconstruction',
    category: 'Overlap-Add',
    question: 'Why must window overlap be sufficient?',
    answer: 'If the overlap is too small, there will be gaps or dips in amplitude between frames, causing amplitude modulation (tremolo).',
    whyItMatters: 'For a Hann window, at least 50% overlap (hop size N/2) is required for perfect reconstruction.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },
  {
    id: 605,
    level: 6,
    levelName: 'Reconstruction',
    category: 'WOLA',
    question: 'What is the WOLA normalization?',
    answer: 'Dividing the overlapped and added signal by the sum of the squared window values at each sample point.',
    whyItMatters: 'Guarantees perfect amplitude reconstruction regardless of the specific hop size, as long as the overlap is sufficient.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },
  {
    id: 606,
    level: 6,
    levelName: 'Reconstruction',
    category: 'Windows',
    question: 'Do we apply a window during IFFT?',
    answer: 'Yes, in WOLA, a synthesis window is applied to the time-domain frame immediately after computing the IFFT, before adding it to the output buffer.',
    whyItMatters: 'Smooths out any discontinuities at the edges of the frame introduced by frequency-domain processing.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },
  {
    id: 607,
    level: 6,
    levelName: 'Reconstruction',
    category: 'Phase',
    question: 'What happens if we reconstruct without updating phases?',
    answer: 'If frames are moved (time-stretched) but phases are not updated via phase accumulation, the overlapping frames will have random phase alignments, causing severe constructive/destructive interference (clicks, static, hollow sound).',
    whyItMatters: 'Demonstrates why the phase vocoder algorithm is necessary compared to simple granular synthesis.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 608,
    level: 6,
    levelName: 'Reconstruction',
    category: 'Math',
    question: 'What is a conjugate symmetric spectrum?',
    answer: 'For a real-valued time signal, the top half of the FFT spectrum is the complex conjugate of the bottom half.',
    whyItMatters: 'If we modify the spectrum, we must maintain this symmetry, or the IFFT will produce imaginary numbers in the time domain.',
    projectConnection: 'dsp/fft_processor.py → compute_ifft()'
  },
  {
    id: 609,
    level: 6,
    levelName: 'Reconstruction',
    category: 'Buffer',
    question: 'How large must the output buffer be for WOLA?',
    answer: 'It must be large enough to hold all the overlapping frames placed at intervals of the synthesis hop size Hs, plus the length of one full frame (N_FFT).',
    whyItMatters: 'Memory allocation must be correct to avoid out-of-bounds errors during overlap-add.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  },

  // Level 7: Artifacts (9)
  {
    id: 701,
    level: 7,
    levelName: 'Artifacts',
    category: 'Artifacts',
    question: 'What is phasiness?',
    answer: 'A characteristic "metallic," "reverberant," or "smeared" artifact in phase vocoder audio, caused by phase incoherence between spectral components.',
    whyItMatters: 'It is the primary drawback of the standard phase vocoder, making voices sound robotic or synthetic.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch_with_phase_locking()'
  },
  {
    id: 702,
    level: 7,
    levelName: 'Artifacts',
    category: 'Transients',
    question: 'Why does a standard phase vocoder sound smeared on transients?',
    answer: 'Transients (like drum hits or consonants) require all frequencies to have perfectly aligned phases to create a sharp spike. The standard phase vocoder updates phases independently, ruining this vertical alignment.',
    whyItMatters: 'Causes percussive sounds to lose their punch and become a "smear" of noise.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 703,
    level: 7,
    levelName: 'Artifacts',
    category: 'Phase Locking',
    question: 'What is phase locking?',
    answer: 'An advanced technique to reduce phasiness by forcing adjacent frequency bins that belong to the same spectral peak to maintain their original phase relationships.',
    whyItMatters: 'Significantly improves audio quality, preserving the natural sound of transients and speech.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch_with_phase_locking()'
  },
  {
    id: 704,
    level: 7,
    levelName: 'Artifacts',
    category: 'Phase Locking',
    question: 'What is identity phase locking?',
    answer: 'A specific phase locking method where the phase of a peak bin is accumulated normally, and surrounding bins are "locked" to it by applying the original phase difference between the peak and the bin.',
    whyItMatters: 'Preserves the vertical phase coherence of a sine wave that has leaked across multiple bins.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch_with_phase_locking()'
  },
  {
    id: 705,
    level: 7,
    levelName: 'Artifacts',
    category: 'Phase Locking',
    question: 'Why do spectral peaks matter for phase locking?',
    answer: 'Spectral peaks represent the prominent sinusoidal components (harmonics) of a sound. Energy in surrounding bins is usually just spectral leakage from that peak.',
    whyItMatters: 'By identifying peaks, we know which bins should be grouped together and locked to the same phase progression.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch_with_phase_locking()'
  },
  {
    id: 706,
    level: 7,
    levelName: 'Artifacts',
    category: 'Artifacts',
    question: 'What causes the "chipmunk" effect?',
    answer: 'When pitching up a voice using resampling without preserving formants, the resonant frequencies of the vocal tract are also shifted up, unnatural for the size of a human head.',
    whyItMatters: 'The standard phase vocoder does not preserve formants. True voice manipulation requires formant-preserving algorithms.',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },
  {
    id: 707,
    level: 7,
    levelName: 'Artifacts',
    category: 'Artifacts',
    question: 'What is pre-echo?',
    answer: 'An artifact where a transient sound (like a click) is preceded by a short, quiet noise burst, caused by the energy of the transient being smeared across the entire length of a large FFT window.',
    whyItMatters: 'Another reason why smaller N_FFT sizes are preferred for percussive signals.',
    projectConnection: 'dsp/stft.py → compute_stft()'
  },
  {
    id: 708,
    level: 7,
    levelName: 'Artifacts',
    category: 'Artifacts',
    question: 'How does window size affect phasiness?',
    answer: 'A larger window size (e.g., 4096) increases frequency resolution but worsens time smearing and phasiness on transients. A smaller window (e.g., 512) improves transients but may cause pitch artifacts.',
    whyItMatters: 'Finding the right balance (e.g., 2048 for voice) is essential for good quality.',
    projectConnection: 'dsp/effects.py → PitchShiftEffect'
  },
  {
    id: 709,
    level: 7,
    levelName: 'Artifacts',
    category: 'Artifacts',
    question: 'What is the "stuttering" artifact?',
    answer: 'Occurs when time-stretching by a very large factor. The algorithm repeats the same spectral frame for too long, losing the micro-variations of natural sound.',
    whyItMatters: 'Extreme time stretching requires specialized synthesis techniques beyond a basic phase vocoder.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },

  // Level 8: LTI & Convolution (9)
  {
    id: 801,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'LTI Systems',
    question: 'What is an LTI system?',
    answer: 'Linear Time-Invariant system. Linear means it obeys superposition (f(a+b) = f(a)+f(b)). Time-invariant means a delay in the input causes an identical delay in the output.',
    whyItMatters: 'Most standard audio filters (EQ, reverb, delay) are LTI systems.',
    projectConnection: 'dsp/effects.py → LowPassFilterEffect'
  },
  {
    id: 802,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'LTI Systems',
    question: 'What is impulse response?',
    answer: 'The output of an LTI system when presented with a brief input signal (an impulse, or Dirac delta).',
    whyItMatters: 'The impulse response completely characterizes an LTI system. If you know it, you can calculate the output for ANY input.',
    projectConnection: 'dsp/effects.py → ReverbEffect'
  },
  {
    id: 803,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'LTI Systems',
    question: 'What is convolution?',
    answer: 'A mathematical operation that combines an input signal and an impulse response to produce the output signal of an LTI system.',
    whyItMatters: 'Convolution is the time-domain equivalent of multiplication in the frequency domain.',
    projectConnection: 'dsp/effects.py → ReverbEffect'
  },
  {
    id: 804,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'LTI Systems',
    question: 'How does delay relate to impulse response?',
    answer: 'A simple delay is an LTI system where the impulse response is a single spike occurring D samples after time zero.',
    whyItMatters: 'Complex effects like echo and reverb are built by combining multiple delayed and scaled impulse responses.',
    projectConnection: 'dsp/effects.py → EchoEffect'
  },
  {
    id: 805,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'LTI Systems',
    question: 'Is the phase vocoder an LTI system? Why not?',
    answer: 'No. Pitch shifting and time stretching are NOT time-invariant (they change the time axis) and phase modification introduces nonlinearities.',
    whyItMatters: 'We cannot analyze or implement a phase vocoder using simple convolution or impulse responses.',
    projectConnection: 'dsp/phase_vocoder.py → pitch_shift()'
  },
  {
    id: 806,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'Filtering',
    question: 'What is the Convolution Theorem?',
    answer: 'Convolution in the time domain is equivalent to point-wise multiplication in the frequency domain.',
    whyItMatters: 'Allows us to apply complex filters (like reverb) much faster using the FFT.',
    projectConnection: 'dsp/effects.py → ReverbEffect'
  },
  {
    id: 807,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'Filtering',
    question: 'How do Low Pass and High Pass filters relate to the frequency domain?',
    answer: 'A Low Pass filter zeroes out bins above a cutoff frequency. A High Pass filter zeroes out bins below a cutoff.',
    whyItMatters: 'These are basic frequency-domain modifications easily performed in the STFT domain.',
    projectConnection: 'dsp/effects.py → LowPassFilterEffect'
  },
  {
    id: 808,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'Effects',
    question: 'What is Reverb in terms of DSP?',
    answer: 'A dense series of echoes (reflections) that simulate the acoustic properties of a physical space.',
    whyItMatters: 'Usually implemented efficiently via fast convolution using the FFT of a recorded impulse response.',
    projectConnection: 'dsp/effects.py → ReverbEffect'
  },
  {
    id: 809,
    level: 8,
    levelName: 'LTI & Convolution',
    category: 'Effects',
    question: 'What is a comb filter?',
    answer: 'A filter that adds a delayed version of a signal to itself, causing constructive and destructive interference that looks like the teeth of a comb in the frequency spectrum.',
    whyItMatters: 'Often forms the basis of flanger, chorus, and algorithmic reverb effects.',
    projectConnection: 'dsp/effects.py → EchoEffect'
  },

  // Level 9: Project Defense (9)
  {
    id: 901,
    level: 9,
    levelName: 'Project Defense',
    category: 'Architecture',
    question: 'Why was STFT chosen over direct waveform manipulation?',
    answer: 'Direct waveform manipulation (like granular synthesis) struggles with maintaining phase coherence for complex polyphonic signals. STFT allows precise manipulation of exact frequencies.',
    whyItMatters: 'Demonstrates understanding of the core architectural decision of the project.',
    projectConnection: 'dsp/stft.py → compute_stft()'
  },
  {
    id: 902,
    level: 9,
    levelName: 'Project Defense',
    category: 'Architecture',
    question: 'Why is naive resampling useful as a baseline comparison?',
    answer: 'It shows the fundamental link between playback speed, duration, and pitch. Comparing it against the phase vocoder highlights the phase vocoder\'s ability to decouple time and pitch.',
    whyItMatters: 'Proves the necessity of the complex phase vocoder algorithm.',
    projectConnection: 'dsp/resampling.py → naive_resample()'
  },
  {
    id: 903,
    level: 9,
    levelName: 'Project Defense',
    category: 'Implementation',
    question: 'What default N_FFT and Ha does this project use?',
    answer: 'The project uses a default N_FFT of 2048 and an Analysis Hop (Ha) of 512 (75% overlap).',
    whyItMatters: 'These parameters provide a good balance between frequency resolution for pitch shifting and temporal resolution to minimize transient smearing.',
    projectConnection: 'dsp/effects.py → PitchShiftEffect'
  },
  {
    id: 904,
    level: 9,
    levelName: 'Project Defense',
    category: 'Implementation',
    question: 'Where is FFT implemented in this project?',
    answer: 'In the dsp/fft_processor.py file, specifically utilizing numpy.fft.fft within the compute_fft() function.',
    whyItMatters: 'Identifies the low-level processing engine of the application.',
    projectConnection: 'dsp/fft_processor.py → compute_fft()'
  },
  {
    id: 905,
    level: 9,
    levelName: 'Project Defense',
    category: 'Implementation',
    question: 'Where is STFT implemented?',
    answer: 'In the dsp/stft.py file, using create_frames(), windowing, and then calling the FFT processor on an array of frames.',
    whyItMatters: 'Shows how the lower-level FFT is orchestrated into a time-frequency representation.',
    projectConnection: 'dsp/stft.py → compute_stft()'
  },
  {
    id: 906,
    level: 9,
    levelName: 'Project Defense',
    category: 'Implementation',
    question: 'Where is phase accumulation implemented?',
    answer: 'In dsp/phase_vocoder.py within the time_stretch() function, where φ_synth[m,k] is updated based on instantaneous frequency and synthesis hop size.',
    whyItMatters: 'Pinpoints the core mathematical operation that makes time stretching possible.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch()'
  },
  {
    id: 907,
    level: 9,
    levelName: 'Project Defense',
    category: 'Parameters',
    question: 'How would increasing N_FFT affect frequency resolution?',
    answer: 'Increasing N_FFT (e.g., from 2048 to 4096) narrows the frequency bins, giving higher frequency resolution, but increases time smearing (worse time resolution).',
    whyItMatters: 'Shows understanding of the time-frequency trade-off in STFT.',
    projectConnection: 'dsp/stft.py → compute_stft()'
  },
  {
    id: 908,
    level: 9,
    levelName: 'Project Defense',
    category: 'Implementation',
    question: 'Where is Identity Phase Locking implemented?',
    answer: 'In dsp/phase_vocoder.py within the time_stretch_with_phase_locking() function, where peaks are identified and neighboring bins are phase-locked to them.',
    whyItMatters: 'Highlights the advanced feature implemented to combat phasiness artifacts.',
    projectConnection: 'dsp/phase_vocoder.py → time_stretch_with_phase_locking()'
  },
  {
    id: 909,
    level: 9,
    levelName: 'Project Defense',
    category: 'Implementation',
    question: 'What is the role of WOLA in the pitch_shift effect?',
    answer: 'It reconstructs the time-stretched signal from the modified STFT frames before the final naive_resample step is applied.',
    whyItMatters: 'Shows understanding of the complete signal flow from analysis to reconstruction.',
    projectConnection: 'dsp/stft.py → reconstruct_signal_wola()'
  }
];
