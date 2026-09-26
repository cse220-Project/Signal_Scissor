import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import WaveformCanvas from '../components/visualization/WaveformCanvas';
import SpectrumCanvas from '../components/visualization/SpectrumCanvas';

export default function MicCapture() {
  const navigate = useNavigate();
  const { signalState, duration, currentTime, activeTrack, isLoading } = useAudioStore();
  const recorder = useAudioRecorder({ autoUpload: false });

  const handleUseRecording = async () => {
    if (await recorder.confirmRecording()) navigate('/studio');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-ink-primary tracking-tight">Live Microphone Capture</h1>
          <p className="text-[13px] text-ink-secondary leading-relaxed">Record live acoustic signals, voice, or ambient sound directly from your device microphone.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon="graphic_eq" onClick={() => navigate('/noise-remover')}>Noise Remover</Button>
          <Button variant="primary" size="sm" icon="science" onClick={() => navigate('/studio')}>Open in Studio</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="md:col-span-5 space-y-4">
          <Card variant="pastel-green" className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-hairline">
              <span className="material-symbols-outlined text-[20px] text-ink-primary">mic</span>
              <h3 className="text-[15px] font-semibold text-ink-primary">Record From Microphone</h3>
            </div>
            {!recorder.hasPreview ? <>
              <p className="text-[12px] text-ink-secondary leading-relaxed">Record for as long as you need, then stop manually to review the WAV before loading it into the DSP workspace.</p>
              {recorder.isRecording && <p className="text-center text-[14px] font-mono font-medium text-error animate-pulse">Recording... {recorder.recordDuration.toFixed(1)}s</p>}
              {recorder.recordError && <p className="text-error text-[12px] font-medium">{recorder.recordError}</p>}
              <Button variant={recorder.isRecording ? 'destructive' : 'primary'} size="lg" className="w-full justify-center" icon={recorder.isRecording ? 'stop' : 'mic'} onClick={recorder.isRecording ? recorder.stopRecording : recorder.startRecording} disabled={recorder.isFinalizing}>
                {recorder.isRecording ? 'Stop Recording' : recorder.isFinalizing ? 'Preparing…' : 'Start Recording'}
              </Button>
            </> : <div className="space-y-3">
              <p className="text-[12px] text-ink-secondary">Recording ready - listen back before using it.</p>
              <audio controls src={recorder.previewUrl ?? undefined} className="w-full" />
              {recorder.recordError && <p className="text-error text-[12px] font-medium">{recorder.recordError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon="download" onClick={() => recorder.downloadRecording()}>Download WAV</Button>
                <Button variant="secondary" size="sm" icon="refresh" onClick={recorder.discardRecording}>Re-record</Button>
                <Button variant="primary" size="sm" icon="check" loading={isLoading} onClick={handleUseRecording}>Use This Recording</Button>
              </div>
            </div>}
          </Card>

          <Card variant="pastel-cream" className="space-y-2">
            <h4 className="text-[13px] font-semibold text-ink-primary flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-ink-secondary">info</span>DSP Processing Workflow</h4>
            <ul className="text-[11px] text-ink-secondary space-y-1.5 list-disc list-inside"><li>Mono 16-bit PCM WAV auto-conversion</li><li>Instant Fourier analysis & Nyquist frequency scaling</li><li>Ready for noise reduction or custom convolution filtering</li></ul>
          </Card>
        </div>

        <div className="md:col-span-7 space-y-4">
          <div className="bg-pastel-blue rounded-ios-2xl p-5 md:p-6 space-y-4 select-none">
            <div className="panel-heading pb-2 border-b border-hairline flex justify-between items-center">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-ink-primary">preview</span><span className="text-[14px] font-semibold text-ink-primary">Active Signal: {signalState?.source_name || 'No Recording Yet'}</span></div>
              <span className="text-[11px] font-mono text-ink-secondary">{signalState?.sample_rate || 8000} Hz · {duration.toFixed(2)}s</span>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div><span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary block mb-1.5">Recorded Waveform x[n]</span><WaveformCanvas originalWaveform={signalState?.original_waveform} processedWaveform={signalState?.processed_waveform} duration={duration} currentTime={currentTime} activeTrack={activeTrack} height={130} /></div>
              <div><span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary block mb-1.5">Frequency Spectrum |X(f)| (dB)</span><SpectrumCanvas originalSpectrum={signalState?.original_spectrum} processedSpectrum={signalState?.processed_spectrum} dominantFreq={signalState?.stats?.dominant_freq} height={130} /></div>
            </div>
            {signalState?.loaded && <div className="pt-2 border-t border-hairline flex flex-wrap gap-2 justify-end">
              <Button variant="secondary" size="sm" icon="graphic_eq" onClick={() => navigate('/noise-remover')}>Remove Noise from Recording</Button>
              <Button variant="primary" size="sm" icon="tune" onClick={() => navigate('/studio')}>Filter in Studio</Button>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
