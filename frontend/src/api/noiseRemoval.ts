import { api } from "./client";

export type NoiseLevel = "light" | "balanced" | "strong";
export interface NoiseConfig {
  formats: string[];
  levels: NoiseLevel[];
  max_bytes: number;
  max_duration_seconds: number;
  timeout_seconds: number;
  retention_seconds: number;
  available: boolean;
  message: string | null;
}
export interface NoiseResult {
  status: "completed";
  id: string;
  level: NoiseLevel;
  original_filename: string;
  output_filename: string;
  output_format: string;
  file_size: number;
  duration: number;
  expires_at: number;
  preview_url: string;
  download_url: string;
}

export async function getNoiseConfig(
  signal: AbortSignal,
): Promise<NoiseConfig> {
  const response = await api.get("/api/noise-removal/config", { signal });
  return response.data;
}

export async function removeNoise(
  file: File,
  level: NoiseLevel,
  config: NoiseConfig,
  signal: AbortSignal,
  onProgress: (percent: number | null) => void,
): Promise<NoiseResult> {
  const data = new FormData();
  data.append("file", file);
  data.append("level", level);
  const response = await api.post("/api/noise-removal", data, {
    signal,
    timeout: (config.timeout_seconds + 60) * 1000,
    onUploadProgress: ({ loaded, total }) => {
      onProgress(
        total ? Math.min(100, Math.floor((loaded / total) * 100)) : null,
      );
    },
  });
  return response.data;
}

export function noiseMediaUrl(path: string): string {
  return api.getUri({ url: path });
}
