import { useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Select from '../components/ui/Select';

import { useTheme, ThemePreference } from '../context/ThemeContext';

export default function Settings() {
  const { signalState, resetToOriginal, loadPreset, isLoading } = useAudioStore();
  const { preference, setPreference } = useTheme();

  const [fps60, setFps60] = useState(true);
  const [highDpiCanvas, setHighDpiCanvas] = useState(true);
  const [audioFormat, setAudioFormat] = useState('wav16');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleFullReset = async () => {
    await resetToOriginal();
    await loadPreset('tones');
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-foreground tracking-tight">
          Workstation Settings
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Configure digital signal processing engine options, visualizer canvas fidelity, and diagnostic status.
        </p>
      </div>

      {/* Theme & Appearance (Sink Master inspired) */}
      <Card variant="surface" className="!p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <span className="material-symbols-outlined text-[19px] text-foreground">palette</span>
          <h3 className="text-[15px] font-semibold text-foreground">Theme &amp; Appearance</h3>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Select interface color mode. Built with Sink Master semantic OKLCH design tokens.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreference(t)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                preference === t
                  ? 'border-primary bg-accent text-foreground ring-1 ring-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span className="capitalize">{t} Mode</span>
            </button>
          ))}
        </div>
      </Card>

      {/* System Diagnostics */}
      <Card variant="pastel-cream" className="!p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-hairline">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">dns</span>
          <h3 className="text-[15px] font-semibold text-ink-primary">System & DSP Engine Diagnostics</h3>
        </div>

        <div className="space-y-2 text-[13px]">
          <div className="flex flex-wrap gap-2 justify-between items-center p-3 bg-surface/60 rounded-ios-lg">
            <span className="text-ink-secondary">API Service</span>
            <span className="font-mono text-ink-primary font-medium">FastAPI 2.0.0 (Uvicorn)</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center p-3 bg-surface/60 rounded-ios-lg">
            <span className="text-ink-secondary">Current Active Audio</span>
            <span className="font-mono text-ink-primary font-medium">
              {signalState?.source_name || 'Standard Multi-Tone'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center p-3 bg-surface/60 rounded-ios-lg">
            <span className="text-ink-secondary">Native DSP Sample Rate</span>
            <span className="font-mono text-ink-primary font-medium">
              {signalState?.sample_rate || 8000} Hz
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center p-3 bg-surface/60 rounded-ios-lg">
            <span className="text-ink-secondary">Nyquist Frequency Ceiling</span>
            <span className="font-mono text-ink-primary font-medium">
              {signalState?.sample_rate ? signalState.sample_rate / 2 : 4000} Hz
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center p-3 bg-surface/60 rounded-ios-lg">
            <span className="text-ink-secondary">DSP Math Libraries</span>
            <span className="font-mono text-ink-primary font-medium">NumPy 1.26+, SciPy (signal.convolve)</span>
          </div>
        </div>
      </Card>

      {/* Visualizer Display Preferences */}
      <Card variant="surface" className="!p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-hairline">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">display_settings</span>
          <h3 className="text-[15px] font-semibold text-ink-primary">Canvas & Visualizer Performance</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[13px] font-medium text-ink-primary block">
                60 FPS Hardware Acceleration
              </span>
              <span className="text-[12px] text-ink-secondary">
                Uses downsampled peak min/max envelopes for aliasing-free 60 FPS waveform rendering.
              </span>
            </div>
            <Toggle checked={fps60} onChange={setFps60} />
          </div>

          <div className="h-[1px] bg-hairline w-full" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[13px] font-medium text-ink-primary block">
                High-DPI Retina Scaling
              </span>
              <span className="text-[12px] text-ink-secondary">
                Renders canvas at native device pixel ratio for sharp lines on 4K and Retina screens.
              </span>
            </div>
            <Toggle checked={highDpiCanvas} onChange={setHighDpiCanvas} />
          </div>
        </div>
      </Card>

      {/* Audio Export Configuration */}
      <Card variant="surface" className="!p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-hairline">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">file_download</span>
          <h3 className="text-[15px] font-semibold text-ink-primary">Audio Export Configuration</h3>
        </div>

        <Select
          label="Export Encoding Format"
          value={audioFormat}
          options={[
            { value: 'wav16', label: '16-bit Linear PCM WAV (Recommended)' },
            { value: 'wav32', label: '32-bit Float WAV (Studio Master)' },
          ]}
          onChange={setAudioFormat}
        />
      </Card>

      {/* Reset & Maintenance */}
      <Card variant="pastel-peach" className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-hairline">
          <span className="material-symbols-outlined text-[19px] text-ink-primary">restart_alt</span>
          <h3 className="text-[15px] font-semibold text-ink-primary">Reset State & Clear Session</h3>
        </div>

        <p className="text-[13px] text-ink-secondary leading-relaxed">
          Restore DSP filters and acoustic convolution to baseline defaults and re-load the default standard multi-tone test signal.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            loading={isLoading}
            onClick={handleFullReset}
          >
            Reset All Filters & Signals
          </Button>

          {resetSuccess && (
            <span className="text-[12px] font-medium text-success flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Restored default workstation state
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
