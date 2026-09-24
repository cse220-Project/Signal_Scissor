import { useAudioStore } from '../store/useAudioStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import WaveformCanvas from '../components/visualization/WaveformCanvas';
import SpectrumCanvas from '../components/visualization/SpectrumCanvas';
import TransportBar from '../components/studio/TransportBar';
import FilterControls from '../components/studio/FilterControls';
import EffectsControls from '../components/studio/EffectsControls';
import SignalStatsBar from '../components/studio/SignalStatsBar';
import ImpulseResponseModal from '../components/studio/ImpulseResponseModal';
import Button from '../components/ui/Button';

export default function Studio() {
  const {
    signalState,
    filter,
    duration,
    currentTime,
    activeTrack,
    applyFullPipeline,
    resetToOriginal,
    isLoading,
  } = useAudioStore();

  const { seekTo } = useAudioPlayer();

  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-ink-primary tracking-tight">
            DSP Studio Workstation
          </h1>
          <p className="text-[13px] text-ink-secondary">
            Current <span className="trademark-signal">SIGNAL</span>: <span className="font-medium text-ink-primary">{signalState?.source_name || 'Loading...'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="restart_alt"
            onClick={resetToOriginal}
            loading={isLoading}
          >
            Reset <span className="trademark-signal">SIGNAL</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon="bolt"
            onClick={applyFullPipeline}
            loading={isLoading}
          >
            Process Pipeline
          </Button>
        </div>
      </div>

      {/* Main player */}
      <TransportBar />

      {/* Visualizers Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
        {/* Waveform Section */}
        <div className="bg-pastel-cream rounded-ios-2xl p-5">
          <div className="panel-heading mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-ink-primary">
                show_chart
              </span>
              <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
                Discrete-Time Waveform x[n]
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-sky-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm shadow-sky-400/50" />
                Original
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
                Processed
              </span>
            </div>
          </div>

          <WaveformCanvas
            originalWaveform={signalState?.original_waveform}
            processedWaveform={signalState?.processed_waveform}
            duration={signalState?.duration || duration}
            currentTime={currentTime}
            activeTrack={activeTrack}
            height={130}
            onSeek={seekTo}
          />
        </div>

        {/* Spectrum Section */}
        <div className="bg-pastel-lavender rounded-ios-2xl p-5">
          <div className="panel-heading mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-ink-primary">
                equalizer
              </span>
              <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
                Magnitude Spectrum |X(f)| (dB)
              </span>
            </div>
            <span className="text-[11px] font-mono text-ink-tertiary">
              Nyquist: {signalState?.sample_rate ? signalState.sample_rate / 2 : 4000} Hz
            </span>
          </div>

          <SpectrumCanvas
            originalSpectrum={signalState?.original_spectrum}
            processedSpectrum={signalState?.processed_spectrum}
            filterBand={filter.enabled ? [filter.low_freq, filter.high_freq] : null}
            dominantFreq={signalState?.stats?.dominant_freq}
            height={130}
          />
        </div>
      </div>

      {/* Control Racks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Fourier Filter Rack */}
        <div className="lg:col-span-7 space-y-4">
          <FilterControls />
          <EffectsControls />
        </div>

        {/* Signal Stats & Measurement Column */}
        <div className="lg:col-span-5">
          <SignalStatsBar
            stats={signalState?.stats}
            sourceName={signalState?.source_name}
            sampleRate={signalState?.sample_rate}
            duration={signalState?.duration || duration}
          />
        </div>
      </div>

      {/* Impulse Response Modal */}
      <ImpulseResponseModal />
    </div>
  );
}
