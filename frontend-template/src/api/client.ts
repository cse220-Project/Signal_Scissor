import axios from 'axios';

const BASE = 'http://localhost:8000/api';

export const api = axios.create({ baseURL: BASE });

export const uploadAudio = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/files/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const listFiles = () => api.get('/files/');
export const getFile = (id: string) => api.get(`/files/${id}/`);
export const deleteFile = (id: string) => api.delete(`/files/${id}/delete/`);
export const deleteAllFiles = () => api.delete('/files/delete-all/');
export const renameFile = (id: string, name: string) => api.patch(`/files/${id}/rename/`, { name });
export const getWaveform = (id: string, points = 1000) => api.get(`/files/${id}/waveform/`, { params: { points } });
export const getFFT = (id: string) => api.get(`/files/${id}/fft/`);
export const getSpectrogram = (id: string) => api.get(`/files/${id}/spectrogram/`);
export const analyzeFile = (id: string) => api.get(`/files/${id}/analyze/`);

/** Returns URL string that can be used directly as <audio src> */
export const getStreamUrl = (id: string) => `${BASE}/stream/${id}/`;

export const processPitchShift = (params: Record<string, unknown>) => api.post('/process/pitch-shift/', params);
export const processTimeStretch = (params: Record<string, unknown>) => api.post('/process/time-stretch/', params);
export const processCompare = (params: Record<string, unknown>) => api.post('/process/compare/', params);
export const processEffectChain = (params: Record<string, unknown>) => api.post('/process/effect-chain/', params);
export const processTrim = (params: Record<string, unknown>) => api.post('/process/trim/', params);

export const generateSignal = (params: Record<string, unknown>) => api.post('/generate/', params);

export const listPresets = () => api.get('/effects/presets/');
export const createPreset = (data: Record<string, unknown>) => api.post('/effects/presets/create/', data);
export const deletePreset = (id: string) => api.delete(`/effects/presets/${id}/delete/`);

export const getExportUrl = (id: string) => `${BASE}/export/${id}/`;

export const listProjects = () => api.get('/projects/');
export const createProject = (data: Record<string, unknown>) => api.post('/projects/create/', data);
