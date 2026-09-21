import { create } from 'zustand';
import { AudioFile, AudioAnalysis, WaveformData, FFTData, SpectrogramData, ComparisonResult, Effect, EffectPreset, ProcessingStatus } from '../types';

interface AudioStore {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  files: AudioFile[];
  selectedFile: AudioFile | null;
  originalFile: AudioFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  analysis: AudioAnalysis | null;
  waveformData: WaveformData | null;
  fftData: FFTData | null;
  spectrogramData: SpectrogramData | null;
  isProcessing: boolean;
  processingStatus: ProcessingStatus | null;
  processedFiles: AudioFile[];
  comparisonResult: ComparisonResult | null;
  effectChain: Array<{ effect: Effect; enabled: boolean }>;
  presets: EffectPreset[];
  activeTab: string;
  vizMode: 'waveform' | 'spectrum' | 'spectrogram';

  setSelectedFile: (file: AudioFile | null) => void;
  setFiles: (files: AudioFile[]) => void;
  addFile: (file: AudioFile) => void;
  removeFile: (id: string) => void;
  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  setAnalysis: (a: AudioAnalysis | null) => void;
  setWaveformData: (w: WaveformData | null) => void;
  setFFTData: (f: FFTData | null) => void;
  setSpectrogramData: (s: SpectrogramData | null) => void;
  setIsProcessing: (v: boolean) => void;
  setProcessingStatus: (s: ProcessingStatus | null) => void;
  addProcessedFile: (f: AudioFile) => void;
  setComparisonResult: (r: ComparisonResult | null) => void;
  addToEffectChain: (effect: Effect) => void;
  removeFromEffectChain: (index: number) => void;
  toggleEffect: (index: number) => void;
  updateEffectParam: (index: number, paramName: string, value: unknown) => void;
  clearEffectChain: () => void;
  setPresets: (p: EffectPreset[]) => void;
  setActiveTab: (t: string) => void;
  setVizMode: (m: 'waveform' | 'spectrum' | 'spectrogram') => void;
  clearFiles: () => void;
  setOriginalFile: (f: AudioFile | null) => void;
  restoreToOriginal: () => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  theme: 'light',
  setTheme: (newTheme: 'light' | 'dark') => set(() => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  files: [],
  selectedFile: null,
  originalFile: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackRate: 1,
  analysis: null,
  waveformData: null,
  fftData: null,
  spectrogramData: null,
  isProcessing: false,
  processingStatus: null,
  processedFiles: [],
  comparisonResult: null,
  effectChain: [],
  presets: [],
  activeTab: 'studio',
  vizMode: 'waveform',

  setSelectedFile: (file) => set((state) => {
    // If the incoming file is an original, update originalFile too
    if (file && file.file_type === 'original') {
      return { selectedFile: file, originalFile: file };
    }
    // If originalFile not yet set, set it on the first file regardless
    if (file && !state.originalFile) {
      return { selectedFile: file, originalFile: file };
    }
    return { selectedFile: file };
  }),
  setFiles: (files) => set({ files }),
  addFile: (file) => set((state) => ({
    files: [file, ...state.files.filter((f) => f.id !== file.id)]
  })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: v }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
  setAnalysis: (a) => set({ analysis: a }),
  setWaveformData: (w) => set({ waveformData: w }),
  setFFTData: (f) => set({ fftData: f }),
  setSpectrogramData: (s) => set({ spectrogramData: s }),
  setIsProcessing: (v) => set({ isProcessing: v }),
  setProcessingStatus: (s) => set({ processingStatus: s }),
  addProcessedFile: (f) => set((state) => ({ processedFiles: [...state.processedFiles, f] })),
  setComparisonResult: (r) => set({ comparisonResult: r }),
  addToEffectChain: (effect) => set((state) => ({ effectChain: [...state.effectChain, { effect, enabled: true }] })),
  removeFromEffectChain: (index) => set((state) => ({ effectChain: state.effectChain.filter((_, i) => i !== index) })),
  toggleEffect: (index) => set((state) => {
    const newChain = [...state.effectChain];
    newChain[index].enabled = !newChain[index].enabled;
    return { effectChain: newChain };
  }),
  updateEffectParam: (index, paramName, value) => set((state) => {
    const newChain = [...state.effectChain];
    newChain[index].effect.parameters[paramName].value = value as number | string | boolean;
    return { effectChain: newChain };
  }),
  clearEffectChain: () => set({ effectChain: [] }),
  setPresets: (p) => set({ presets: p }),
  setActiveTab: (t) => set({ activeTab: t }),
  setVizMode: (m) => set({ vizMode: m }),
  clearFiles: () => set({
    files: [],
    selectedFile: null,
    originalFile: null,
    processedFiles: [],
    analysis: null,
    waveformData: null,
    fftData: null,
    spectrogramData: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0
  }),
  setOriginalFile: (f) => set({ originalFile: f }),
  restoreToOriginal: () => set((state) => {
    const orig = state.originalFile;
    if (!orig) return {};
    return {
      selectedFile: orig,
      waveformData: null,
      spectrogramData: null,
      analysis: null,
      comparisonResult: null,
    };
  }),

}));
