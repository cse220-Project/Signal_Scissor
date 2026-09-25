import { useRef, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import WaveformCanvas from '../components/visualization/WaveformCanvas';
import LogSpectrumCanvas from '../components/visualization/LogSpectrumCanvas';
import SpectrogramCanvas from '../components/visualization/SpectrogramCanvas';
import TransportBar from '../components/studio/TransportBar';
import FilterControls from '../components/studio/FilterControls';
import EffectsControls from '../components/studio/EffectsControls';
import SignalStatsBar from '../components/studio/SignalStatsBar';
import ImpulseResponseModal from '../components/studio/ImpulseResponseModal';
import Button from '../components/ui/Button';
import InfoBox from '../components/ui/InfoBox';
import { downloadCanvasAsPng } from '../utils/exportCanvas';

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
  const waveformCardRef = useRef<HTMLDivElement | null>(null);
  const spectrumCardRef = useRef<HTMLDivElement | null>(null);
  const [waveZoom, setWaveZoom] = useState<'overview' | 'detail'>('detail');
  const [isLogScale, setIsLogScale] = useState(true);
  const [showSpectrogram, setShowSpectrogram] = useState(false);
  const [spectrogramRangeDb, setSpectrogramRangeDb] = useState(80);

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

      <InfoBox title="How this page works" defaultOpen={false}>
        <p>
          <strong className="text-ink-primary font-medium">1.</strong> Play back the loaded signal below and look at its waveform and spectrum.{' '}
          <strong className="text-ink-primary font-medium">2.</strong> Adjust the Fourier Filter and/or Effects panels.{' '}
          <strong className="text-ink-primary font-medium">3.</strong> Click "Apply to Original" or "Apply to Processed" (or "Process Pipeline" to run both at once) to hear and see the result.
        </p>
      </InfoBox>

      {/* Main player */}
      <TransportBar />

      {/* Visualizers Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
        {/* Waveform Section */}
        <div className="bg-pastel-cream rounded-ios-2xl p-5" ref={waveformCardRef}>
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
              <button
                type="button"
                title="Save this plot as a PNG image"
                onClick={() => downloadCanvasAsPng(waveformCardRef.current, `waveform_${signalState?.source_name || 'signal'}`)}
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-2 bg-surface-raised/70 p-0.5 rounded-ios-md w-fit">
            <button
              type="button"
              onClick={() => setWaveZoom('detail')}
              title="Zoomed-in view: shows individual wave cycles over a short window"
              className={`px-2.5 py-1 rounded-ios-sm text-[11px] font-medium transition-colors ${
                waveZoom === 'detail' ? 'bg-primary text-primary-foreground' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Zoomed Detail
            </button>
            <button
              type="button"
              onClick={() => setWaveZoom('overview')}
              title="Full-duration view: shows the whole signal's envelope"
              className={`px-2.5 py-1 rounded-ios-sm text-[11px] font-medium transition-colors ${
                waveZoom === 'overview' ? 'bg-primary text-primary-foreground' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Full Overview
            </button>
          </div>

          <WaveformCanvas
            originalWaveform={signalState?.original_waveform}
            processedWaveform={signalState?.processed_waveform}
            duration={signalState?.duration || duration}
            currentTime={currentTime}
            activeTrack={activeTrack}
            height={150}
            onSeek={seekTo}
            zoomMode={waveZoom}
            showHoverReadout
          />
        </div>

        {/* Spectrum Section */}
        <div className="bg-pastel-lavender rounded-ios-2xl p-5" ref={spectrumCardRef}>
          <div className="panel-heading mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-ink-primary">
                equalizer
              </span>
              <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
                Magnitude Spectrum |X(f)| (dB)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-ink-tertiary">
                Nyquist: {signalState?.sample_rate ? signalState.sample_rate / 2 : 4000} Hz
              </span>
              <button
                type="button"
                title="Save this plot as a PNG image"
                onClick={() => downloadCanvasAsPng(spectrumCardRef.current, `spectrum_${signalState?.source_name || 'signal'}`)}
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLogScale((v) => !v)}
            title="Toggle between logarithmic and linear frequency axis"
            className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-ios-md bg-surface-raised/70 hover:bg-surface-raised text-[11px] font-medium text-ink-secondary hover:text-ink-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">tune</span>
            {isLogScale ? 'Log Scale (20Hz–Nyquist)' : 'Linear Scale (0–Nyquist)'}
          </button>

          <LogSpectrumCanvas
            originalSpectrum={signalState?.original_spectrum}
            processedSpectrum={signalState?.processed_spectrum}
            filterBand={filter.enabled ? [filter.low_freq, filter.high_freq] : null}
            filterOperation={filter.enabled ? filter.operation : null}
            dominantFreq={signalState?.stats?.dominant_freq}
            height={150}
            isLogScale={isLogScale}
          />
        </div>
      </div>

      {/* Spectrogram (time vs frequency) - collapsible, uses data already returned by the backend */}
      <div className="rounded-ios-2xl border border-hairline bg-surface p-5">
        <button
          type="button"
          onClick={() => setShowSpectrogram((v) => !v)}
          className="w-full flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-ink-primary">grid_view</span>
            <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
              STFT Spectrogram (Time vs Frequency)
            </span>
          </div>
          <span className="material-symbols-outlined text-[20px] text-ink-tertiary">
            {showSpectrogram ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showSpectrogram && (
          <div className="mt-4 space-y-3">
            {(signalState?.original_spectrogram || signalState?.processed_spectrogram) && (
              <div className="flex items-center gap-1 w-fit bg-surface-raised/70 p-1 rounded-ios-lg">
                <span className="text-[10px] text-ink-tertiary px-1.5">dB range:</span>
                {[40, 60, 80, 100].map((db) => (
                  <button
                    key={db}
                    type="button"
                    onClick={() => setSpectrogramRangeDb(db)}
                    className={`px-2 py-1 rounded-ios-md text-[11px] font-medium transition-all ${
                      spectrogramRangeDb === db ? 'bg-primary text-primary-foreground font-semibold' : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {db}
                  </button>
                ))}
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {signalState?.original_spectrogram || signalState?.processed_spectrogram ? (
              <>
                <SpectrogramCanvas
                  spectrogram={signalState?.original_spectrogram}
                  title="Original"
                  subtitle="Before processing"
                  colorScheme="cyan-emerald"
                  height={170}
                  dynamicRangeDb={spectrogramRangeDb}
                />
                <SpectrogramCanvas
                  spectrogram={signalState?.processed_spectrogram}
                  title="Processed"
                  subtitle="After processing"
                  colorScheme="cyan-emerald"
                  height={170}
                  dynamicRangeDb={spectrogramRangeDb}
                />
              </>
            ) : (
              <p className="md:col-span-2 text-[12px] text-ink-tertiary text-center py-6">
                No spectrogram available for this signal yet — apply a filter or effect to generate one.
              </p>
            )}
          </div>
          </div>
        )}
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
