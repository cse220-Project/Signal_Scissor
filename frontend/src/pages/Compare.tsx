import { useAudioStore } from '../store/useAudioStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import WaveformCanvas from '../components/visualization/WaveformCanvas';
import SpectrumCanvas from '../components/visualization/SpectrumCanvas';

export default function Compare() {
  const { signalState, duration, currentTime, activeTrack } = useAudioStore();
  const { togglePlay, isPlaying, handleTrackChange, seekTo } = useAudioPlayer();

  const procStats = signalState?.stats;
  const origStats = signalState?.original_stats || procStats;

  const origRms = origStats?.rms ?? 0;
  const procRms = procStats?.rms ?? 0;
  const rmsDelta = origRms > 0 ? ((procRms - origRms) / origRms) * 100 : 0;

  const origPeak = origStats?.peak ?? 0;
  const procPeak = procStats?.peak ?? 0;
  const peakDelta = origPeak > 0 ? ((procPeak - origPeak) / origPeak) * 100 : 0;

  const origFreq = origStats?.dominant_freq ?? 0;
  const procFreq = procStats?.dominant_freq ?? 0;
  const freqDelta = procFreq - origFreq;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-ink-primary tracking-tight">
            A/B Signal Comparison
          </h1>
          <p className="text-[13px] text-ink-secondary">
            Inspect time-domain waveform alterations, spectral envelope changes, and numerical signal power deltas.
          </p>
        </div>

        {/* Playback & Track Toggle */}
        <div className="flex flex-wrap items-center gap-3 bg-pastel-green rounded-ios-2xl p-4 w-full">
          <div className="inline-flex bg-surface-raised p-1 rounded-pill">
            <button
              onClick={() => handleTrackChange('original')}
              className={`px-3 py-1.5 rounded-pill text-[12px] font-medium transition-all ${
                activeTrack === 'original'
                  ? 'bg-[#26211c] text-white font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Original (A)
            </button>
            <button
              onClick={() => handleTrackChange('processed')}
              className={`px-3 py-1.5 rounded-pill text-[12px] font-medium transition-all ${
                activeTrack === 'processed'
                  ? 'bg-[#26211c] text-white font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Processed (B)
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={isPlaying ? 'pause' : 'play_arrow'}
            onClick={togglePlay}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>

      {/* Side-by-Side Visualizers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none">
        {/* Waveform Comparison */}
        <Card variant="pastel-cream" className="space-y-3">
          <div className="panel-heading pb-2 border-b border-hairline">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-ink-primary">show_chart</span>
              <h3 className="text-[15px] font-semibold text-ink-primary">Time-Domain Overlay x[n]</h3>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-ink-tertiary">Gray: Original</span>
              <span className="text-ink-primary font-medium">Dark: Processed</span>
            </div>
          </div>

          <p className="text-[12px] text-ink-secondary leading-relaxed">
            Direct temporal alignment of input vs processed signals. Echo reflections and gain scaling appear as stretched tails or shifted envelopes.
          </p>

          <WaveformCanvas
            originalWaveform={signalState?.original_waveform}
            processedWaveform={signalState?.processed_waveform}
            duration={duration}
            currentTime={currentTime}
            activeTrack={activeTrack}
            height={140}
            onSeek={seekTo}
          />
        </Card>

        {/* Spectrum Comparison */}
        <Card variant="pastel-lavender" className="space-y-3">
          <div className="panel-heading pb-2 border-b border-hairline">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-ink-primary">equalizer</span>
              <h3 className="text-[15px] font-semibold text-ink-primary">Frequency Spectrum |X(f)|</h3>
            </div>
            <span className="text-[11px] font-mono text-ink-secondary">
              0 Hz – {signalState?.sample_rate ? signalState.sample_rate / 2 : 4000} Hz
            </span>
          </div>

          <p className="text-[12px] text-ink-secondary leading-relaxed">
            Magnitude comparison in dB. Filtered frequency regions show notch dips or bandpass attenuation relative to the original spectrum.
          </p>

          <SpectrumCanvas
            originalSpectrum={signalState?.original_spectrum}
            processedSpectrum={signalState?.processed_spectrum}
            dominantFreq={stats?.dominant_freq}
            height={140}
          />
        </Card>
      </div>

      {/* Quantitative Signal Delta Table */}
      <Card variant="surface" className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-hairline">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">table_rows</span>
          <h3 className="text-[15px] font-semibold text-ink-primary">Quantitative Signal Metrics Delta</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="metric-table w-full text-[13px] text-left">
            <thead>
              <tr className="border-b border-hairline text-ink-secondary text-[11px] uppercase tracking-wider">
                <th className="py-2.5 font-medium">Metric Parameter</th>
                <th className="py-2.5 font-medium">Original Signal</th>
                <th className="py-2.5 font-medium">Processed Signal</th>
                <th className="py-2.5 font-medium">Relative Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              <tr>
                <td className="py-2.5 font-medium text-ink-primary">RMS Power Level</td>
                <td className="py-2.5 font-mono text-ink-secondary">{origRms.toFixed(4)}</td>
                <td className="py-2.5 font-mono text-ink-primary font-medium">{procRms.toFixed(4)}</td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {rmsDelta >= 0 ? `+${rmsDelta.toFixed(1)}%` : `${rmsDelta.toFixed(1)}%`}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-ink-primary">Peak Absolute Amplitude</td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {origPeak > 0 ? origPeak.toFixed(4) : '—'}
                </td>
                <td className="py-2.5 font-mono text-ink-primary font-medium">
                  {procPeak > 0 ? procPeak.toFixed(4) : '—'}
                </td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {origPeak > 0 ? (peakDelta >= 0 ? `+${peakDelta.toFixed(1)}%` : `${peakDelta.toFixed(1)}%`) : 'Within [-1.0, 1.0]'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-ink-primary">Dominant Frequency Peak</td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {origFreq > 0 ? `${Math.round(origFreq)} Hz` : '—'}
                </td>
                <td className="py-2.5 font-mono text-ink-primary font-medium">
                  {procFreq > 0 ? `${Math.round(procFreq)} Hz` : '—'}
                </td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {origFreq > 0 && procFreq > 0 ? (freqDelta >= 0 ? `+${Math.round(freqDelta)} Hz` : `${Math.round(freqDelta)} Hz`) : 'Spectral Maximum'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-ink-primary">Signal Duration</td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {signalState?.original_duration ? `${signalState.original_duration.toFixed(2)} s` : `${duration.toFixed(2)} s`}
                </td>
                <td className="py-2.5 font-mono text-ink-primary font-medium">
                  {signalState?.processed_duration ? `${signalState.processed_duration.toFixed(2)} s` : `${duration.toFixed(2)} s`}
                </td>
                <td className="py-2.5 font-mono text-ink-secondary">
                  {signalState?.processed_duration && signalState?.original_duration && signalState.processed_duration > signalState.original_duration
                    ? `+${(signalState.processed_duration - signalState.original_duration).toFixed(2)} s echo tail`
                    : 'Equal duration'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
