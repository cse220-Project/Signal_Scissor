import { create } from 'zustand';
import {
  SignalStateResponse,
  FilterParams,
  EffectsParams,
  ImpulseResponseData,
  RealLifeAppPreset
} from '../types';
import {
  getSignalState,
  loadTestSignal,
  uploadAudioFile,
  applyFilter,
  applyEffects,
  applyAllDsp,
  resetSignal,
  fetchImpulseResponse,
} from '../api/client';

interface AudioStoreState {
  signalState: SignalStateResponse | null;
  isLoading: boolean;
  error: string | null;

  // Filter and Effects State
  filter: FilterParams;
  effects: EffectsParams;
  impulseResponse: ImpulseResponseData | null;
  activeRealLifePreset: string | null;

  // Audio Playback
  isPlaying: boolean;
  activeTrack: 'original' | 'processed';
  currentTime: number;
  duration: number;
  volume: number;
  loop: boolean;
  audioVersion: number;

  // UI state
  showImpulseModal: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadPreset: (preset?: string) => Promise<boolean>;
  uploadFile: (file: File) => Promise<boolean>;
  setFilter: (params: Partial<FilterParams>) => void;
  setEffects: (params: Partial<EffectsParams>) => void;
  applyFilterAction: (targetTrack?: 'original' | 'processed') => Promise<void>;
  applyEffectsAction: (targetTrack?: 'original' | 'processed') => Promise<void>;
  applyFullPipeline: (targetTrack?: 'original' | 'processed') => Promise<void>;
  resetToOriginal: () => Promise<void>;
  updateImpulseResponse: () => Promise<void>;
  applyRealLifePreset: (preset: RealLifeAppPreset, targetTrack?: 'original' | 'processed') => Promise<void>;
  setNoiseReducedState: (data: SignalStateResponse) => void;

  // Playback setters
  setIsPlaying: (playing: boolean) => void;
  setActiveTrack: (track: 'original' | 'processed') => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setVolume: (vol: number) => void;
  setLoop: (loop: boolean) => void;
  setShowImpulseModal: (show: boolean) => void;
  setError: (err: string | null) => void;
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  signalState: null,
  isLoading: false,
  error: null,

  filter: {
    enabled: false,
    low_freq: 900,
    high_freq: 1100,
    operation: 'cut',
    strength: 1.0,
  },

  effects: {
    gain: 1.0,
    delay_ms: 0,
    shift_hz: 0,
    echo_enabled: false,
    echo_delay_ms: 250,
    echo_feedback: 55,
    echo_taps: 3,
    echo_mix: 65,
  },

  impulseResponse: null,
  activeRealLifePreset: null,

  isPlaying: false,
  activeTrack: 'processed',
  currentTime: 0,
  duration: 2.0,
  volume: 0.85,
  loop: false,
  audioVersion: 1,

  showImpulseModal: false,

  initialize: async () => {
    if (get().signalState || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const data = await getSignalState();
      if (data.loaded) {
        set({ signalState: data, duration: data.duration || 0, audioVersion: Date.now() });
      } else {
        await get().loadPreset('tones');
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Could not connect to the audio engine' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPreset: async (preset: string = 'tones'): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const data = await loadTestSignal(preset);
      set({
        signalState: data,
        duration: data.duration || 2.0,
        currentTime: 0,
        isPlaying: false,
        audioVersion: Date.now(),
        activeRealLifePreset: null,
        filter: {
          ...get().filter,
          enabled: false,
        },
        effects: {
          ...get().effects,
          echo_enabled: preset === 'pulse', // auto-enable echo demonstration for pulse
        },
      });
      await get().updateImpulseResponse();
      return true;
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to load test preset' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadFile: async (file: File): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const data = await uploadAudioFile(file);
      set({
        signalState: data,
        duration: data.duration || 2.0,
        currentTime: 0,
        isPlaying: false,
        audioVersion: Date.now(),
        activeRealLifePreset: null,
      });
      await get().updateImpulseResponse();
      return true;
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to upload audio' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  setFilter: (params) => {
    set({ filter: { ...get().filter, ...params } });
  },

  setEffects: (params) => {
    set({ effects: { ...get().effects, ...params } });
  },

  applyFilterAction: async (targetTrack: 'original' | 'processed' = 'original') => {
    set({ isLoading: true, error: null });
    try {
      const filterParams: FilterParams = { ...get().filter, target_track: targetTrack };
      const data = await applyFilter(filterParams);
      set({
        signalState: data,
        activeTrack: 'processed',
        duration: data.duration || get().duration,
        audioVersion: Date.now(),
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to apply filter' });
    } finally {
      set({ isLoading: false });
    }
  },

  applyEffectsAction: async (targetTrack: 'original' | 'processed' = 'original') => {
    set({ isLoading: true, error: null });
    try {
      const effectsParams: EffectsParams = { ...get().effects, target_track: targetTrack };
      const data = await applyEffects(effectsParams);
      set({
        signalState: data,
        activeTrack: 'processed',
        duration: data.duration || get().duration,
        audioVersion: Date.now(),
      });
      await get().updateImpulseResponse();
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to apply effects' });
    } finally {
      set({ isLoading: false });
    }
  },

  applyFullPipeline: async (targetTrack: 'original' | 'processed' = 'original') => {
    set({ isLoading: true, error: null });
    try {
      const data = await applyAllDsp(get().filter, get().effects, targetTrack);
      set({
        signalState: data,
        activeTrack: 'processed',
        duration: data.duration || get().duration,
        audioVersion: Date.now(),
      });
      await get().updateImpulseResponse();
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to process signal' });
    } finally {
      set({ isLoading: false });
    }
  },

  resetToOriginal: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await resetSignal();
      set({
        signalState: data,
        duration: data.duration || get().duration,
        filter: { ...get().filter, enabled: false },
        effects: {
          gain: 1.0,
          delay_ms: 0,
          shift_hz: 0,
          echo_enabled: false,
          echo_delay_ms: 250,
          echo_feedback: 55,
          echo_taps: 3,
          echo_mix: 65,
        },
        activeRealLifePreset: null,
        audioVersion: Date.now(),
      });
      await get().updateImpulseResponse();
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to reset signal' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateImpulseResponse: async () => {
    const { effects } = get();
    try {
      const ir = await fetchImpulseResponse(
        effects.echo_delay_ms,
        effects.echo_feedback,
        effects.echo_taps,
        effects.echo_mix
      );
      set({ impulseResponse: ir });
    } catch {
      // Non-blocking
    }
  },

  applyRealLifePreset: async (preset: RealLifeAppPreset, targetTrack: 'original' | 'processed' = 'original') => {
    set({ isLoading: true, error: null, activeRealLifePreset: preset.id });
    try {
      const newFilter: FilterParams = {
        enabled: preset.filter.enabled ?? false,
        low_freq: preset.filter.low_freq ?? 300,
        high_freq: preset.filter.high_freq ?? 3400,
        operation: preset.filter.operation ?? 'keep',
        strength: preset.filter.strength ?? 1.0,
      };

      const newEffects: EffectsParams = {
        gain: preset.effects.gain ?? 1.0,
        delay_ms: preset.effects.delay_ms ?? 0,
        shift_hz: preset.effects.shift_hz ?? 0,
        echo_enabled: preset.effects.echo_enabled ?? false,
        echo_delay_ms: preset.effects.echo_delay_ms ?? 250,
        echo_feedback: preset.effects.echo_feedback ?? 55,
        echo_taps: preset.effects.echo_taps ?? 3,
        echo_mix: preset.effects.echo_mix ?? 65,
        voice_effect: preset.effects.voice_effect ?? null,
      };

      set({ filter: newFilter, effects: newEffects });

      const data = await applyAllDsp(newFilter, newEffects, targetTrack);
      set({
        signalState: data,
        activeTrack: 'processed',
        duration: data.duration || get().duration,
        audioVersion: Date.now(),
      });
      await get().updateImpulseResponse();
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || err?.message || 'Failed to apply preset' });
    } finally {
      set({ isLoading: false });
    }
  },

  setNoiseReducedState: (data) => set({
    signalState: data,
    activeTrack: 'processed',
    currentTime: 0,
    isPlaying: false,
    duration: data.processed_duration || data.duration || get().duration,
    audioVersion: Date.now(),
  }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setActiveTrack: (track) => set({ activeTrack: track }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (dur) => set({ duration: dur }),
  setVolume: (vol) => set({ volume: vol }),
  setLoop: (loop) => set({ loop }),
  setShowImpulseModal: (show) => set({ showImpulseModal: show }),
  setError: (err) => set({ error: err }),
}));
