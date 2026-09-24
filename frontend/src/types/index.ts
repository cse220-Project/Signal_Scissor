export interface WaveformPayload {
  peaks: number[];
  min_val: number;
  max_val: number;
  count: number;
  /** A short, frequency-aware trace used when the full overview would hide cycles. */
  preview?: {
    peaks: number[];
    min_val: number;
    max_val: number;
    count: number;
    duration: number;
    start_time: number;
  };
}

export interface SpectrumPayload {
  freqs: number[];
  mag_db: number[];
  nyquist: number;
}

export interface SignalStats {
  sample_rate: number;
  duration: number;
  samples: number;
  channels: number;
  rms: number;
  peak: number;
  dominant_freq: number;
}

export interface SpectrogramPayload {
  times: number[];
  freqs: number[];
  mag_db: number[][]; // [freq_bin][time_bin]
}

export interface SignalStateResponse {
  loaded: boolean;
  source_name?: string;
  sample_rate?: number;
  duration?: number;
  original_duration?: number;
  processed_duration?: number;
  num_channels?: number;
  samples?: number;
  processed_samples?: number;
  original_waveform?: WaveformPayload;
  processed_waveform?: WaveformPayload;
  original_spectrum?: SpectrumPayload;
  processed_spectrum?: SpectrumPayload;
  original_spectrogram?: SpectrogramPayload;
  processed_spectrogram?: SpectrogramPayload;
  stats?: SignalStats;
  original_stats?: SignalStats;
  last_band?: [number, number] | null;
  last_operation?: string | null;
}

export interface FilterParams {
  enabled: boolean;
  low_freq: number;
  high_freq: number;
  operation: 'cut' | 'keep' | 'attenuate' | 'amplify';
  strength?: number;
  target_track?: 'original' | 'processed';
}

export interface EffectsParams {
  gain: number;
  delay_ms: number;
  shift_hz: number;
  echo_enabled: boolean;
  echo_delay_ms: number;
  echo_feedback: number;
  echo_taps: number;
  echo_mix: number;
  voice_effect?: string | null;
  target_track?: 'original' | 'processed';
}

export interface ImpulseResponseStem {
  t_ms: number;
  amp: number;
}

export interface ImpulseResponseData {
  delay_ms: number;
  decay: number;
  num_echoes: number;
  wet_mix: number;
  sample_rate: number;
  stems: ImpulseResponseStem[];
  formula: string;
  total_samples: number;
}

export interface RealLifeAppPreset {
  id: string;
  name: string;
  category: 'Acoustics' | 'Telecommunications' | 'Audio Engineering' | 'Biomedical / Audiology';
  badge: string;
  icon: string;
  description: string;
  dspExplanation: string;
  realLifeUse: string;
  filter: Partial<FilterParams>;
  effects: Partial<EffectsParams>;
  recommendedSignal?: 'tones' | 'pulse' | 'noise' | 'multitone';
}
