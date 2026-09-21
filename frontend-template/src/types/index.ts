export interface AudioFile {
  id: string;
  original_filename: string;
  file_path: string;
  sample_rate: number;
  num_samples: number;
  channels: number;
  duration_seconds: number;
  file_size_bytes: number;
  created_at: string;
  file_type: 'original' | 'processed' | 'generated';
  parent?: string;
  processing_params?: Record<string, unknown>;
}

export interface AudioProject {
  id: string;
  name: string;
  created_at: string;
  audio_files: AudioFile[];
}

export interface AudioAnalysis {
  duration: number;
  sample_rate: number;
  num_samples: number;
  channels: number;
  peak_amplitude: number;
  rms: number;
  zero_crossing_rate: number;
  dominant_frequency: number;
  nyquist_frequency: number;
  n_fft: number;
  hop_size: number;
  spectral_centroid: number;
  spectral_bandwidth: number;
  spectral_rolloff: number;
}

export interface WaveformData {
  peaks: Array<{ min: number; max: number }>;
}

export interface FFTData {
  frequencies: number[];
  magnitudes_db: number[];
}

export interface SpectrogramData {
  times: number[];
  frequencies: number[];
  magnitude_db: number[][];
}

export interface ComparisonResult {
  pv_file: AudioFile;
  naive_file: AudioFile;
  metrics: {
    semitones: number;
    stretch_factor: number;
    pitch_factor: number;
    original: { duration: number; dominant_freq: number };
    pv: { duration: number; dominant_freq: number; expected_freq: number };
    naive: { duration: number; dominant_freq: number; expected_freq: number };
  };
}

export interface EffectParam {
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  type: 'float' | 'int' | 'bool' | 'select';
  label: string;
  options?: string[];
}

export interface Effect {
  name: string;
  description: string;
  parameters: Record<string, EffectParam>;
}

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  effect_chain: Array<{ effect_name: string; parameters: Record<string, unknown> }>;
  is_builtin: boolean;
}

export interface ProcessingStatus {
  stage: string;
  progress: number;
  done: boolean;
  error?: string;
}
