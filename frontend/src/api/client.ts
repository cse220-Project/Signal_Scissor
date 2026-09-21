import axios from 'axios';
import { FilterParams, EffectsParams, SignalStateResponse, ImpulseResponseData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''; // Uses Vite proxy or relative path when served by FastAPI

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export async function getHealth(): Promise<{ status: string; service: string }> {
  const res = await api.get('/api/health');
  return res.data;
}

export async function loadTestSignal(preset: string = 'tones'): Promise<SignalStateResponse> {
  const res = await api.get<SignalStateResponse>(`/api/signal/test?preset=${encodeURIComponent(preset)}`);
  return res.data;
}

export async function uploadAudioFile(file: File): Promise<SignalStateResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<SignalStateResponse>('/api/signal/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function applyFilter(params: FilterParams): Promise<SignalStateResponse> {
  const res = await api.post<SignalStateResponse>('/api/process/filter', params);
  return res.data;
}

export async function applyEffects(params: EffectsParams): Promise<SignalStateResponse> {
  const res = await api.post<SignalStateResponse>('/api/process/effects', params);
  return res.data;
}

export async function applyAllDsp(
  filter: FilterParams,
  effects: EffectsParams
): Promise<SignalStateResponse> {
  const payload = {
    filter_enabled: filter.enabled,
    low_freq: filter.low_freq,
    high_freq: filter.high_freq,
    operation: filter.operation,
    strength: filter.strength,
    gain: effects.gain,
    delay_ms: effects.delay_ms,
    shift_hz: effects.shift_hz,
    echo_enabled: effects.echo_enabled,
    echo_delay_ms: effects.echo_delay_ms,
    echo_feedback: effects.echo_feedback,
    echo_taps: effects.echo_taps,
    echo_mix: effects.echo_mix,
  };
  const res = await api.post<SignalStateResponse>('/api/process/all', payload);
  return res.data;
}

export async function resetSignal(): Promise<SignalStateResponse> {
  const res = await api.post<SignalStateResponse>('/api/reset');
  return res.data;
}

export async function fetchImpulseResponse(
  delayMs: number = 250,
  feedback: number = 55,
  numEchoes: number = 3,
  wetMix: number = 65
): Promise<ImpulseResponseData> {
  const res = await api.get<ImpulseResponseData>('/api/impulse-response', {
    params: {
      delay_ms: delayMs,
      feedback,
      num_echoes: numEchoes,
      wet_mix: wetMix,
    },
  });
  return res.data;
}

export async function fetchTheory(): Promise<any> {
  const res = await api.get('/api/theory');
  return res.data;
}

export function getAudioStreamUrl(track: 'original' | 'processed', timestamp: number = Date.now()): string {
  return `${API_BASE}/api/audio/${track}?t=${timestamp}`;
}

export function getExportWavUrl(): string {
  return `${API_BASE}/api/export/wav`;
}

export async function getSignalState(): Promise<SignalStateResponse> {
  const res = await api.get<SignalStateResponse>('/api/signal/state');
  return res.data;
}
