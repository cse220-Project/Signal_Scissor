import { useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Slider from '../components/ui/Slider';

export default function Theory() {
  const [activeTab, setActiveTab] = useState<'math' | 'simulations' | 'quiz'>('math');

  // Simulation 1: Fourier Harmonics Synthesizer
  const [harmonicsCount, setHarmonicsCount] = useState(3);
  const [waveformType, setWaveformType] = useState<'square' | 'sawtooth'>('square');

  // Simulation 2: Nyquist Sampling Theorem
  const [sampleRateRate, setSampleRateRate] = useState(16);
  const [signalFrequency, setSignalFrequency] = useState(3);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const quizQuestions = [
    {
      q: 'For an audio signal sampled at fs = 8000 Hz, what is the Nyquist frequency (maximum representable frequency)?',
      options: ['16000 Hz', '8000 Hz', '4000 Hz', '2000 Hz'],
      correct: 2,
      explanation: 'By the Nyquist-Shannon sampling theorem, the Nyquist frequency is f_Nyquist = fs / 2 = 8000 / 2 = 4000 Hz.',
    },
    {
      q: 'Why does compute_spectrum() double the amplitude of interior positive FFT bins (indices 1 to N/2 - 1)?',
      options: [
        'To make the graph look louder',
        'To conserve total signal energy by accounting for mirrored negative frequencies in the single-sided spectrum',
        'Because the Fast Fourier Transform loses half the samples',
        'To counteract window attenuation',
      ],
      correct: 1,
      explanation: 'A real-valued time signal has a conjugate-symmetric two-sided DFT. Doubling interior positive bins preserves Parseval theorem energy conservation.',
    },
    {
      q: 'If the echo delay spacing is 250 ms and sampling rate is 8000 Hz, how many samples is n₀?',
      options: ['250 samples', '2000 samples', '8000 samples', '1000 samples'],
      correct: 1,
      explanation: 'n₀ = round((delay_ms / 1000) * fs) = round((250 / 1000) * 8000) = 0.25 * 8000 = 2000 samples.',
    },
    {
      q: 'What distinguishes an LTI convolution echo from a simple time delay y[n] = x[n - n₀]?',
      options: [
        'Time delay is non-linear',
        'Echo convolves x[n] with an impulse response h[n] containing multiple decaying reflection taps (h[n] = δ[n] + α·δ[n-n₀] + ...)',
        'Echo does not change the duration',
        'Time delay shifts frequency, echo does not',
      ],
      correct: 1,
      explanation: 'A simple delay produces one time-shifted copy of fixed duration, whereas echo convolves x[n] with h[n], capturing both direct arrival and multiple decaying reflections.',
    },
    {
      q: 'In the PSTN telephone bandwidth filter, why is the frequency range kept strictly between 300 Hz and 3400 Hz?',
      options: [
        'Because microphones could not record frequencies above 3400 Hz in the 1800s',
        'To preserve the essential speech intelligibility formants while conserving transmission bandwidth over copper lines',
        'To prevent audio amplifiers from overheating',
        'Because higher frequencies cause severe electrical resistance',
      ],
      correct: 1,
      explanation: 'Human vocal tract formants providing speech intelligibility are centered in 300–3400 Hz. Removing out-of-band noise saves massive bandwidth across transmission channels.',
    },
  ];

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) score++;
    });
    return score;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="rounded-ios-2xl bg-pastel-cream p-6 md:p-8 space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-secondary">Theory Laboratory</span>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-pastel-lavender text-ink-primary text-[12px] font-medium mb-1">
          <span className="material-symbols-outlined text-[15px]">school</span>
          <span>Course Manifest: CSE 220</span>
        </div>
        <h1 className="text-[28px] md:text-[34px] leading-tight font-semibold text-ink-primary tracking-tight">
          Signals and Systems DSP Theory
        </h1>
        <p className="text-[14px] text-ink-secondary max-w-2xl leading-relaxed">
          Comprehensive mathematical formulations, LTI system physics, interactive discrete-time simulations, and student self-assessment.
        </p>
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button
          onClick={() => setActiveTab('math')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'math'
              ? 'bg-navy text-white font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Mathematical Formulations
        </button>
        <button
          onClick={() => setActiveTab('simulations')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'simulations'
              ? 'bg-navy text-white font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Interactive Simulations
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 rounded-ios-lg text-[14px] font-medium transition-colors ${
            activeTab === 'quiz'
              ? 'bg-navy text-white font-semibold'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-raised'
          }`}
        >
          Self-Assessment Quiz
        </button>
      </div>

      {/* Tab 1: Math Formulations */}
      {activeTab === 'math' && (
        <div className="space-y-4">
          {/* Concept 1 */}
          <Card variant="surface" className="space-y-3">
            <div className="panel-heading pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">calculate</span>
                <h3 className="text-[16px] font-semibold text-ink-primary">
                  1. Discrete Fourier Transform (DFT) & Energy Conservation
                </h3>
              </div>
              <Badge variant="blue">fourier_filter.py</Badge>
            </div>

            <div className="bg-pastel-lavender rounded-ios-lg p-4 font-mono text-[14px] text-ink-primary overflow-x-auto">
              X[k] = ∑ (n=0 to N-1) x[n] · e^(-j 2π k n / N)
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed">
              Transforms discrete-time audio sequence x[n] into frequency domain representation X[k]. Since real signals have conjugate-symmetric negative frequencies (X[N-k] = X*[k]), our single-sided magnitude spectrum doubles interior positive bins (k = 1 to N/2 - 1) by ×2 while keeping DC (k=0) and Nyquist (k=N/2) at ×1. This preserves Parseval's energy conservation theorem.
            </p>
          </Card>

          {/* Concept 2 */}
          <Card variant="surface" className="space-y-3">
            <div className="panel-heading pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">tune</span>
                <h3 className="text-[16px] font-semibold text-ink-primary">
                  2. Ideal Frequency-Domain Band Filtering
                </h3>
              </div>
              <Badge variant="peach">fourier_filter.py</Badge>
            </div>

            <div className="bg-pastel-lavender rounded-ios-lg p-4 font-mono text-[14px] text-ink-primary overflow-x-auto">
              Y[k] = X[k] · H[k], &nbsp;&nbsp; y[n] = IDFT&#123;Y[k]&#125;
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed">
              Modifies spectral bins directly in the frequency domain. In <strong>cut mode</strong>, Fourier coefficients inside [f_low, f_high] are set to zero (ideal notch). In <strong>keep mode</strong>, all out-of-band components are zeroed (ideal bandpass). Inverse FFT synthesis reconstitutes the filtered time-domain waveform.
            </p>
          </Card>

          {/* Concept 3 */}
          <Card variant="surface" className="space-y-3">
            <div className="panel-heading pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">waves</span>
                <h3 className="text-[16px] font-semibold text-ink-primary">
                  3. Linear Time-Invariant (LTI) Systems & Discrete Convolution
                </h3>
              </div>
              <Badge variant="lavender">audio_effects.py</Badge>
            </div>

            <div className="bg-pastel-lavender rounded-ios-lg p-4 font-mono text-[14px] text-ink-primary overflow-x-auto">
              y[n] = (x * h)[n] = ∑ (k = -∞ to +∞) x[k] · h[n - k]
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed">
              Any Linear Time-Invariant system is completely characterized by its impulse response h[n]. For multi-tap echo, the impulse response is modeled as:
            </p>

            <div className="bg-surface-raised rounded-ios-lg p-3 font-mono text-[12px] text-ink-primary">
              h[n] = δ[n] + wet · α · δ[n - n₀] + wet · α² · δ[n - 2n₀] + ...
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed">
              The convolution output length is len(x) + len(h) - 1, naturally accounting for the reverberant decay tail that extends beyond the end of the input signal.
            </p>
          </Card>

          {/* Concept 4 */}
          <Card variant="surface" className="space-y-3">
            <div className="panel-heading pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">transform</span>
                <h3 className="text-[16px] font-semibold text-ink-primary">
                  4. Single-Sideband Frequency Translation (Hilbert Transform)
                </h3>
              </div>
              <Badge variant="green">server.py</Badge>
            </div>

            <div className="bg-pastel-lavender rounded-ios-lg p-4 font-mono text-[14px] text-ink-primary overflow-x-auto">
              x_a[n] = x[n] + j · H&#123;x[n]&#125;, &nbsp;&nbsp; y[n] = Re&#123;x_a[n] · e^(j 2π Δf t)&#125;
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed">
              To shift all frequencies by Δf Hz without generating unwanted mirror sum-and-difference sidebands, we construct an analytic signal x_a[n] with zero negative-frequency power using an FFT mask. Rotating by e^(j 2π Δf t) shifts every harmonic cleanly.
            </p>
          </Card>
        </div>
      )}

      {/* Tab 2: Interactive Simulations */}
      {activeTab === 'simulations' && (
        <div className="space-y-5">
          {/* Simulation 1: Fourier Series Harmonics */}
          <Card variant="surface" className="space-y-4">
            <div className="panel-heading pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">graphic_eq</span>
                <h3 className="text-[15px] font-semibold text-ink-primary">
                  Interactive Fourier Series Synthesis
                </h3>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setWaveformType('square')}
                  className={`text-[12px] px-2.5 py-1 rounded-pill ${
                    waveformType === 'square' ? 'bg-navy text-white' : 'bg-surface-raised text-ink-secondary'
                  }`}
                >
                  Square Wave (Odd Harmonics)
                </button>
                <button
                  onClick={() => setWaveformType('sawtooth')}
                  className={`text-[12px] px-2.5 py-1 rounded-pill ${
                    waveformType === 'sawtooth' ? 'bg-navy text-white' : 'bg-surface-raised text-ink-secondary'
                  }`}
                >
                  Sawtooth Wave (All Harmonics)
                </button>
              </div>
            </div>

            <Slider
              label="Number of Fourier Harmonics"
              value={harmonicsCount}
              min={1}
              max={15}
              step={1}
              unit="terms"
              onChange={setHarmonicsCount}
            />

            {/* Canvas Plot */}
            <div className="bg-surface-raised rounded-ios-lg p-3">
              <canvas
                id="fourier-sim-canvas"
                width={700}
                height={120}
                className="w-full h-[120px] block"
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  const w = canvas.width;
                  const h = canvas.height;
                  const centerY = h / 2;

                  ctx.strokeStyle = 'rgba(31, 35, 40, 0.15)';
                  ctx.beginPath();
                  ctx.moveTo(0, centerY);
                  ctx.lineTo(w, centerY);
                  ctx.stroke();

                  ctx.strokeStyle = '#1f2328';
                  ctx.lineWidth = 2;
                  ctx.beginPath();

                  for (let x = 0; x < w; x++) {
                    const t = (x / w) * 4 * Math.PI;
                    let val = 0;

                    if (waveformType === 'square') {
                      for (let k = 1; k <= harmonicsCount; k++) {
                        const n = 2 * k - 1;
                        val += (4 / (n * Math.PI)) * Math.sin(n * t);
                      }
                    } else {
                      for (let n = 1; n <= harmonicsCount; n++) {
                        val += (2 / (n * Math.PI)) * (n % 2 === 1 ? 1 : -1) * Math.sin(n * t);
                      }
                    }

                    const y = centerY - val * (centerY * 0.7);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.stroke();
                }}
              />
            </div>
            <p className="text-[12px] text-ink-secondary">
              Notice how increasing the number of Fourier harmonics steepens the waveform edges, while Gibbs phenomenon ripple remains near sharp discontinuities.
            </p>
          </Card>

          {/* Simulation 2: Nyquist Sampling Theorem */}
          <Card variant="surface" className="space-y-4">
            <div className="panel-heading pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-ink-primary">timeline</span>
                <h3 className="text-[15px] font-semibold text-ink-primary">
                  Nyquist-Shannon Sampling & Aliasing Demonstration
                </h3>
              </div>
              <span className="text-[11px] font-mono text-ink-tertiary">
                Nyquist Condition: fs &gt; 2·f_sig ({2 * signalFrequency} samples/s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Slider
                label="Continuous Signal Frequency (f_sig)"
                value={signalFrequency}
                min={1}
                max={8}
                step={1}
                unit="Hz"
                onChange={setSignalFrequency}
              />

              <Slider
                label="Discrete Sampling Rate (fs)"
                value={sampleRateRate}
                min={4}
                max={32}
                step={2}
                unit="samples/s"
                onChange={setSampleRateRate}
              />
            </div>

            <div className="bg-surface-raised rounded-ios-lg p-3">
              <canvas
                id="sampling-sim-canvas"
                width={700}
                height={130}
                className="w-full h-[130px] block"
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  const w = canvas.width;
                  const h = canvas.height;
                  const centerY = h / 2;

                  // 1. Continuous analog wave
                  ctx.strokeStyle = 'rgba(140, 149, 159, 0.4)';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  for (let x = 0; x < w; x++) {
                    const t = x / w;
                    const val = Math.sin(2 * Math.PI * signalFrequency * t);
                    const y = centerY - val * (centerY * 0.75);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.stroke();

                  // 2. Discrete sampled points & stems
                  const totalSamples = Math.floor(sampleRateRate);
                  ctx.strokeStyle = sampleRateRate >= 2 * signalFrequency ? '#3f7856' : '#8B3A3A';
                  ctx.fillStyle = sampleRateRate >= 2 * signalFrequency ? '#3f7856' : '#8B3A3A';
                  ctx.lineWidth = 1.5;

                  for (let i = 0; i <= totalSamples; i++) {
                    const t = i / totalSamples;
                    const x = t * w;
                    const val = Math.sin(2 * Math.PI * signalFrequency * t);
                    const y = centerY - val * (centerY * 0.75);

                    ctx.beginPath();
                    ctx.moveTo(x, centerY);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-secondary">
                {sampleRateRate >= 2 * signalFrequency ? (
                  <span className="text-success font-medium">✓ Adequately sampled: fs ≥ 2·f_sig (No aliasing)</span>
                ) : (
                  <span className="text-error font-medium">⚠ Undersampled: fs &lt; 2·f_sig (Severe aliasing distortion!)</span>
                )}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Student Quiz */}
      {activeTab === 'quiz' && (
        <Card variant="pastel-cream" className="space-y-5">
          <div className="panel-heading pb-2 border-b border-hairline">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-ink-primary">quiz</span>
              <h3 className="text-[16px] font-semibold text-ink-primary">
                CSE 220 Signals & Systems Self-Assessment
              </h3>
            </div>
            {showResults && (
              <Badge variant={calculateScore() >= 4 ? 'success' : 'peach'}>
                Score: {calculateScore()} / {quizQuestions.length}
              </Badge>
            )}
          </div>

          <div className="space-y-5">
            {quizQuestions.map((item, qIdx) => {
              const selectedOpt = answers[qIdx];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = selectedOpt === item.correct;

              return (
                <div key={qIdx} className="space-y-2 pb-4 border-b border-hairline last:border-0">
                  <h4 className="text-[14px] font-medium text-ink-primary">
                    {qIdx + 1}. {item.q}
                  </h4>

                  <div className="space-y-1.5">
                    {item.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      let btnStyle = 'bg-surface-raised text-ink-primary hover:bg-surface-muted';

                      if (showResults) {
                        if (optIdx === item.correct) {
                          btnStyle = 'bg-success-soft text-success font-medium';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-error-soft text-error';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-navy text-white font-medium';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                          className={`w-full text-left px-3.5 py-2 rounded-ios-md text-[13px] transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showResults && optIdx === item.correct && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <p className="text-[12px] text-ink-secondary pt-1">
                      <strong className="text-ink-primary">Explanation: </strong>
                      {item.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            {showResults ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setAnswers({});
                  setShowResults(false);
                }}
              >
                Retake Quiz
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={Object.keys(answers).length === 0}
                onClick={() => setShowResults(true)}
              >
                Submit Answers
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
