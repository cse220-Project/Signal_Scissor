import { useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LogSpectrumCanvas from '../components/visualization/LogSpectrumCanvas';
import SpectrumDifferenceCanvas from '../components/visualization/SpectrumDifferenceCanvas';
import SpectrogramCanvas from '../components/visualization/SpectrogramCanvas';
import WaveformCanvas from '../components/visualization/WaveformCanvas';

export default function Compare() {
  const { signalState, filter, effects, duration, currentTime, activeTrack } = useAudioStore();
  const { togglePlay, isPlaying, handleTrackChange, seekTo } = useAudioPlayer();

  const [isLogScale, setIsLogScale] = useState(true);
  const [spectrumViewMode, setSpectrumViewMode] = useState<'both' | 'original' | 'processed'>('both');

  const procStats = signalState?.stats;
  const origStats = signalState?.original_stats || procStats;

  // Stats calculation
  const origRms = origStats?.rms ?? 0;
  const procRms = procStats?.rms ?? 0;
  const rmsDelta = origRms > 0 ? ((procRms - origRms) / origRms) * 100 : 0;
  const origRmsDb = origRms > 0 ? 20 * Math.log10(origRms) : -80;
  const procRmsDb = procRms > 0 ? 20 * Math.log10(procRms) : -80;

  const origPeak = origStats?.peak ?? 0;
  const procPeak = procStats?.peak ?? 0;
  const peakDelta = origPeak > 0 ? ((procPeak - origPeak) / origPeak) * 100 : 0;

  const origFreq = origStats?.dominant_freq ?? 0;
  const procFreq = procStats?.dominant_freq ?? 0;
  const freqDelta = procFreq - origFreq;

  const origDur = signalState?.original_duration ?? duration;
  const procDur = signalState?.processed_duration ?? duration;
  const durDelta = procDur - origDur;

  const sampleRate = signalState?.sample_rate || 8000;
  const channels = signalState?.num_channels || 1;

  // Active Filter Band
  const activeBand = filter.enabled ? [filter.low_freq, filter.high_freq] as [number, number] : signalState?.last_band || null;
  const activeOperation = filter.enabled ? filter.operation : signalState?.last_operation || null;

  // Delta badge component
  const DeltaBadge = ({ value, unit = '%', invert = false }: { value: number; unit?: string; invert?: boolean }) => {
    const isPositive = value > 0;
    const isNeutral = Math.abs(value) < 0.05;
    const color = isNeutral
      ? 'text-muted-foreground bg-muted'
      : (isPositive && !invert) || (!isPositive && invert)
        ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
        : 'text-rose-500 bg-rose-500/10 border border-rose-500/20';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${color}`}>
        {isNeutral ? '— Preserved' : (
          <>
            <span>{isPositive ? '▲' : '▼'}</span>
            {isPositive ? '+' : ''}{unit === 'Hz' ? `${Math.round(value)}` : value.toFixed(1)}{unit}
          </>
        )}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12 select-none">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">query_stats</span>
            <h1 className="text-[26px] font-bold text-foreground tracking-tight">
              <span className="trademark-signal">SIGNAL</span> Processing Analysis Lab
            </h1>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
            Detailed spectral & temporal breakdown comparing <span className="text-sky-400 font-semibold">Original</span> and <span className="text-emerald-400 font-semibold">Processed</span> audio <span className="trademark-signal">SIGNAL</span>s.
          </p>
        </div>

        {/* Playback & Track Controls */}
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-secondary p-1 rounded-ios-xl border border-border shadow-sm">
            <button
              onClick={() => handleTrackChange('original')}
              className={`px-4 py-2 rounded-ios-lg text-[12px] font-semibold transition-all flex items-center gap-2 ${
                activeTrack === 'original'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-300 inline-block" />
              Original
            </button>
            <button
              onClick={() => handleTrackChange('processed')}
              className={`px-4 py-2 rounded-ios-lg text-[12px] font-semibold transition-all flex items-center gap-2 ${
                activeTrack === 'processed'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 inline-block" />
              Processed
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={isPlaying ? 'pause' : 'play_arrow'}
            onClick={togglePlay}
          >
            {isPlaying ? 'Pause Audio' : 'Play Audio'}
          </Button>
        </div>
      </div>

      {/* Track Legend & Global Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 bg-sky-500/10 border border-sky-500/20 rounded-ios-lg">
          <span className="w-3.5 h-3.5 rounded-full bg-sky-400 shrink-0 shadow-sm shadow-sky-400/50" />
          <div>
            <div className="text-[12px] font-bold text-sky-400">Original Audio</div>
            <div className="text-[11px] text-muted-foreground">Unprocessed input <span className="trademark-signal">SIGNAL</span> state</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-ios-lg">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
          <div>
            <div className="text-[12px] font-bold text-emerald-400">Processed Output</div>
            <div className="text-[11px] text-muted-foreground">Post-DSP filter & effect pipeline</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/60 border border-border rounded-ios-lg font-mono text-[11px]">
          <div>
            <span className="text-muted-foreground block">Sampling Rate:</span>
            <span className="font-semibold text-foreground">{sampleRate} Hz</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Nyquist Limit:</span>
            <span className="font-semibold text-foreground">{sampleRate / 2} Hz</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Channels:</span>
            <span className="font-semibold text-foreground">{channels === 1 ? 'Mono (1ch)' : 'Stereo (2ch)'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FREQUENCY SPECTRUM COMPARISON (MAIN VISUALIZATION)                     */}
      {/* ========================================================================= */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-ios-md bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[20px]">equalizer</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-foreground">
                1. Frequency Spectrum Comparison |X(f)| vs |Y(f)|
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Main visualization comparing frequency distribution in dB. Logarithmic scale highlights low-frequency harmonics and cutoff region details.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary p-1 rounded-ios-lg border border-border">
              <button
                onClick={() => setSpectrumViewMode('both')}
                className={`px-2.5 py-1 rounded-ios-md text-[11px] font-medium transition-all ${
                  spectrumViewMode === 'both' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dual (A + B)
              </button>
              <button
                onClick={() => { setSpectrumViewMode('original'); handleTrackChange('original'); }}
                className={`px-2.5 py-1 rounded-ios-md text-[11px] font-medium transition-all ${
                  spectrumViewMode === 'original' ? 'bg-sky-500 text-white font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Original Only
              </button>
              <button
                onClick={() => { setSpectrumViewMode('processed'); handleTrackChange('processed'); }}
                className={`px-2.5 py-1 rounded-ios-md text-[11px] font-medium transition-all ${
                  spectrumViewMode === 'processed' ? 'bg-emerald-500 text-white font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Processed Only
              </button>
            </div>

            <button
              onClick={() => setIsLogScale(!isLogScale)}
              className="px-3 py-1 bg-secondary hover:bg-accent border border-border rounded-ios-md text-[11px] font-mono font-semibold text-foreground transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              {isLogScale ? 'Log (20 Hz–100 kHz)' : 'Linear (0 Hz–Nyquist)'}
            </button>
          </div>
        </div>

        {/* Main Spectrum Canvas */}
        <LogSpectrumCanvas
          originalSpectrum={signalState?.original_spectrum}
          processedSpectrum={signalState?.processed_spectrum}
          filterBand={activeBand}
          filterOperation={activeOperation}
          dominantFreq={procFreq}
          height={260}
          isLogScale={isLogScale}
          showOriginal={spectrumViewMode !== 'processed'}
          showProcessed={spectrumViewMode !== 'original'}
        />

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/60">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-400 rounded-full inline-block" />
              <span>Original Spectrum</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
              <span className="text-foreground font-medium">Processed Spectrum</span>
            </span>
            {activeBand && (
              <span className="inline-flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-1 bg-rose-500/40 border border-rose-500 rounded-full inline-block" />
                <span>Active Filter Region ({activeOperation})</span>
              </span>
            )}
          </div>
          <div>Y-Axis: -80 dB (Noise Floor) to 0 dB (Peak)</div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. FREQUENCY DIFFERENCE / CHANGE GRAPH (DELTA dB)                         */}
      {/* ========================================================================= */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-ios-md bg-purple-500/10 text-purple-400">
              <span className="material-symbols-outlined text-[20px]">ssid_chart</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-foreground">
                2. Frequency Difference Graph ΔdB(f) = dB(Processed) - dB(Original)
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Exposes exact spectral magnitude shift per frequency bin in <span className="font-semibold text-purple-400">Light Purple Trace</span>. Answers: <span className="italic font-medium text-foreground">&quot;Which frequencies changed, and by how much?&quot;</span>
              </p>
            </div>
          </div>
        </div>

        <SpectrumDifferenceCanvas
          originalSpectrum={signalState?.original_spectrum}
          processedSpectrum={signalState?.processed_spectrum}
          height={190}
          isLogScale={isLogScale}
        />

        <div className="grid grid-cols-3 gap-3 text-center text-[11px] pt-1 border-t border-border/60">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-ios-md text-purple-300 font-semibold">
            ▲ Positive ΔdB = Frequencies Amplified / Boosted
          </div>
          <div className="p-2 bg-secondary border border-border rounded-ios-md text-muted-foreground font-semibold">
            — 0 dB = Frequencies Preserved / Intact
          </div>
          <div className="p-2 bg-purple-900/20 border border-purple-500/30 rounded-ios-md text-purple-400 font-semibold">
            ▼ Negative ΔdB = Frequencies Cut / Attenuated
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3 & 4. WAVEFORM COMPARISON & ACTIVE FILTER STATUS                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time-Domain Waveform Overlay */}
        <Card variant="surface" className="space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
              <h3 className="text-[15px] font-bold text-foreground">
                3. Time-Domain Waveform Comparison x[n] vs y[n]
              </h3>
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Temporal alignment showing normalized signal envelopes, peak clipping, and echo decay tails over time ({duration.toFixed(2)}s total).
          </p>

          <WaveformCanvas
            originalWaveform={signalState?.original_waveform}
            processedWaveform={signalState?.processed_waveform}
            duration={duration}
            currentTime={currentTime}
            activeTrack={activeTrack}
            height={170}
            onSeek={seekTo}
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
            <div className="flex items-center gap-3">
              <span className="text-sky-400 font-medium">● Original Envelope</span>
              <span className="text-emerald-400 font-medium">● Processed Envelope</span>
            </div>
            <div>X-Axis: 0.0s – {duration.toFixed(2)}s</div>
          </div>
        </Card>

        {/* Filter & DSP Parameters Info */}
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <span className="material-symbols-outlined text-primary text-[20px]">settings_input_component</span>
            <h3 className="text-[15px] font-bold text-foreground">
              4. Active Filter & Frequency Operation
            </h3>
          </div>

          <div className="space-y-3 text-[12px]">
            {/* Filter status card */}
            <div className="p-3 bg-secondary/80 rounded-ios-lg border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Fourier Frequency Filter:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${filter.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {filter.enabled ? `Active (${filter.operation})` : 'Bypassed'}
                </span>
              </div>
              {filter.enabled ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-muted-foreground">
                  <div>Low Cutoff: <span className="text-foreground font-semibold">{filter.low_freq} Hz</span></div>
                  <div>High Cutoff: <span className="text-foreground font-semibold">{filter.high_freq} Hz</span></div>
                  <div>Bandwidth: <span className="text-foreground font-semibold">{filter.high_freq - filter.low_freq} Hz</span></div>
                  <div>Operation: <span className="text-foreground font-semibold uppercase">{filter.operation}</span></div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">No band filter currently applied to the signal.</p>
              )}
            </div>

            {/* Effects status card */}
            <div className="p-3 bg-secondary/80 rounded-ios-lg border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Time & Voice Effects:</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Gain: {effects.gain}x | Shift: {effects.shift_hz > 0 ? `+${effects.shift_hz}` : effects.shift_hz} Hz
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-muted-foreground">
                <div>Echo Delay: <span className="text-foreground font-semibold">{effects.echo_enabled ? `${effects.echo_delay_ms} ms` : 'Disabled'}</span></div>
                <div>Feedback: <span className="text-foreground font-semibold">{effects.echo_enabled ? `${effects.echo_feedback}%` : 'N/A'}</span></div>
                <div>Echo Taps: <span className="text-foreground font-semibold">{effects.echo_enabled ? effects.echo_taps : 'N/A'}</span></div>
                <div>Voice Effect: <span className="text-foreground font-semibold capitalize">{effects.voice_effect || 'Standard'}</span></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 5. SPECTROGRAM COMPARISON (STFT HEATMAPS)                                 */}
      {/* ========================================================================= */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-ios-md bg-purple-500/10 text-purple-400">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-foreground">
                5. STFT Spectrogram Comparison (Time vs Frequency Intensity)
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Visualizes <span className="font-semibold text-foreground">when specific frequencies occur over time</span>. Highlights frequency attenuation or reverb tails.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SpectrogramCanvas
            spectrogram={signalState?.original_spectrogram}
            title="Original Spectrogram"
            subtitle="Before Processing"
            colorScheme="cyan-emerald"
            height={180}
          />
          <SpectrogramCanvas
            spectrogram={signalState?.processed_spectrogram}
            title="Processed Spectrogram"
            subtitle="After Processing"
            colorScheme="cyan-emerald"
            height={180}
          />
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 6 & 7. PROCESSING SUMMARY METRICS & HIGHLIGHTED INSIGHTS                  */}
      {/* ========================================================================= */}
      <Card variant="surface" className="space-y-5 p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">format_list_bulleted</span>
            <h2 className="text-[17px] font-bold text-foreground">
              6. Calculated Quantitative <span className="trademark-signal">SIGNAL</span> Metrics
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">Exact calculated audio values</span>
        </div>

        {/* Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead>
              <tr className="border-b border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 font-semibold">Parameter Metric</th>
                <th className="py-2.5 font-semibold text-sky-400">Original</th>
                <th className="py-2.5 font-semibold text-emerald-400">Processed</th>
                <th className="py-2.5 font-semibold">Quantitative Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[12px]">
              <tr className="hover:bg-accent/40 transition-colors">
                <td className="py-3 font-sans font-medium text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">volume_up</span>
                  RMS Signal Energy (Linear / dB)
                </td>
                <td className="py-3 text-muted-foreground">
                  {origRms.toFixed(4)} ({origRmsDb.toFixed(1)} dB)
                </td>
                <td className="py-3 text-foreground font-semibold">
                  {procRms.toFixed(4)} ({procRmsDb.toFixed(1)} dB)
                </td>
                <td className="py-3">
                  <DeltaBadge value={rmsDelta} />
                </td>
              </tr>
              <tr className="hover:bg-accent/40 transition-colors">
                <td className="py-3 font-sans font-medium text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">trending_up</span>
                  Peak Absolute Amplitude
                </td>
                <td className="py-3 text-muted-foreground">{origPeak.toFixed(4)}</td>
                <td className="py-3 text-foreground font-semibold">{procPeak.toFixed(4)}</td>
                <td className="py-3">
                  <DeltaBadge value={peakDelta} />
                </td>
              </tr>
              <tr className="hover:bg-accent/40 transition-colors">
                <td className="py-3 font-sans font-medium text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">graphic_eq</span>
                  Dominant Peak Frequency
                </td>
                <td className="py-3 text-muted-foreground">{origFreq > 0 ? `${Math.round(origFreq)} Hz` : '—'}</td>
                <td className="py-3 text-foreground font-semibold">{procFreq > 0 ? `${Math.round(procFreq)} Hz` : '—'}</td>
                <td className="py-3">
                  <DeltaBadge value={freqDelta} unit="Hz" />
                </td>
              </tr>
              <tr className="hover:bg-accent/40 transition-colors">
                <td className="py-3 font-sans font-medium text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">timer</span>
                  Audio Signal Duration
                </td>
                <td className="py-3 text-muted-foreground">{origDur.toFixed(2)} s</td>
                <td className="py-3 text-foreground font-semibold">{procDur.toFixed(2)} s</td>
                <td className="py-3">
                  <DeltaBadge value={durDelta} unit="s" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Observations & Automated DSP Highlights */}
        <div className="bg-primary/10 border border-primary/20 rounded-ios-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
            <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
            7. Key Processing Observations & Insights
          </div>
          <ul className="text-[12px] text-muted-foreground space-y-1.5 pl-6 list-disc">
            {filter.enabled && (
              <li>
                <span className="font-semibold text-foreground uppercase">{filter.operation} Band Filter</span> active between{' '}
                <span className="font-mono font-semibold text-foreground">{filter.low_freq} Hz – {filter.high_freq} Hz</span>.
                Frequencies in this region were {filter.operation === 'cut' ? 'completely removed (-80 dB cut)' : filter.operation === 'attenuate' ? 'attenuated' : 'preserved'}.
              </li>
            )}
            {Math.abs(rmsDelta) > 1 && (
              <li>
                RMS signal power {rmsDelta > 0 ? 'increased' : 'decreased'} by{' '}
                <span className={`font-mono font-semibold ${rmsDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {rmsDelta > 0 ? '+' : ''}{rmsDelta.toFixed(1)}%
                </span>{' '}
                ({(procRmsDb - origRmsDb).toFixed(1)} dB overall energy shift).
              </li>
            )}
            {effects.echo_enabled && (
              <li>
                Echo delay convolution added <span className="font-semibold text-foreground">{effects.echo_taps} delayed taps</span> ({effects.echo_delay_ms}ms spacing, {effects.echo_feedback}% feedback), extending tail duration by <span className="font-mono text-emerald-400">+{durDelta.toFixed(2)}s</span>.
              </li>
            )}
            {effects.shift_hz !== 0 && (
              <li>
                Single-Sideband (SSB) frequency modulation translated spectral components by{' '}
                <span className="font-mono font-semibold text-amber-400">{effects.shift_hz > 0 ? `+${effects.shift_hz}` : effects.shift_hz} Hz</span>.
              </li>
            )}
            {!filter.enabled && !effects.echo_enabled && effects.shift_hz === 0 && (
              <li>No aggressive filtering active. Output track closely preserves input frequency spectrum.</li>
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
}
