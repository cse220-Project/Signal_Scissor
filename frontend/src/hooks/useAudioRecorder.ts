import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function friendlyRecordingError(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No microphone was found on this device. Connect one and try again.';
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Microphone access was denied. Allow microphone permission for this site in your browser settings, then try again.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your microphone is busy or unavailable. Close other apps that might be using it and try again.';
      case 'OverconstrainedError':
        return 'No microphone matches the requested audio settings.';
      case 'SecurityError':
        return 'Microphone access is blocked here. Try loading the app over HTTPS or localhost.';
    }
  }
  return err instanceof Error ? err.message : 'Failed to record or process audio.';
}

interface UseAudioRecorderOptions {
  /** Auto-stop the recording once it reaches this many seconds. Undefined = no cap (manual stop only). */
  maxDurationSec?: number;
  /**
   * When true (default, matches original behavior), the recording is encoded and
   * uploaded into the DSP pipeline automatically as soon as it stops.
   * When false, the recording is held locally as a preview (playable via `previewUrl`)
   * until `confirmRecording()` is called, so the caller can offer a listen-back /
   * re-record step before committing it.
   */
  autoUpload?: boolean;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { maxDurationSec, autoUpload = true } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const pendingBlobRef = useRef<Blob | null>(null);

  const { uploadFile } = useAudioStore();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadPending = useCallback(async (): Promise<boolean> => {
    const blob = pendingBlobRef.current;
    if (!blob) return false;
    const file = new File([blob], `mic_recording_${Date.now()}.wav`, { type: 'audio/wav' });
    const success = await uploadFile(file);
    if (success) {
      pendingBlobRef.current = null;
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
    return success;
  }, [uploadFile]);

  const startRecording = useCallback(async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const rawBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          const arrayBuffer = await rawBlob.arrayBuffer();
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const decodeCtx = new AudioContextClass();
          const decoded = await decodeCtx.decodeAudioData(arrayBuffer);

          const numChannels = decoded.numberOfChannels;
          const length = decoded.length;
          const mono = new Float32Array(length);

          for (let c = 0; c < numChannels; c++) {
            const chData = decoded.getChannelData(c);
            for (let i = 0; i < length; i++) {
              mono[i] += chData[i] / numChannels;
            }
          }

          const wavBlob = encodeWav(mono, decoded.sampleRate);
          if (decodeCtx.state !== 'closed') void decodeCtx.close();

          pendingBlobRef.current = wavBlob;
          const url = URL.createObjectURL(wavBlob);
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });

          if (autoUpload) {
            await uploadPending();
          }
        } catch (err: unknown) {
          setRecordError(friendlyRecordingError(err));
        } finally {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordDuration(0);

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordDuration(elapsed);
        if (maxDurationSec && elapsed >= maxDurationSec) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 100);
    } catch (err: unknown) {
      setRecordError(friendlyRecordingError(err));
      setIsRecording(false);
    }
  }, [autoUpload, maxDurationSec, uploadPending]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const confirmRecording = useCallback((): Promise<boolean> => uploadPending(), [uploadPending]);

  const discardRecording = useCallback(() => {
    pendingBlobRef.current = null;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecordDuration(0);
    setRecordError(null);
  }, []);

  const downloadRecording = useCallback((filename?: string) => {
    const blob = pendingBlobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  return {
    isRecording,
    recordDuration,
    recordError,
    previewUrl,
    hasPreview: !!previewUrl,
    startRecording,
    stopRecording,
    confirmRecording,
    discardRecording,
    downloadRecording,
  };
}
