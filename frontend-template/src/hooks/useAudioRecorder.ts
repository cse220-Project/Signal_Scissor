import { useRef, useState, useCallback, useEffect } from 'react';

type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error';

interface UseAudioRecorderReturn {
  state: RecorderState;
  elapsed: number;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  recordedMime: string;
  error: string | null;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}


export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedMime, setRecordedMime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Cleanup everything
  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      mediaRecorderRef.current = null;
    }
  }, []);

  // Revoke previous object URL before creating new one
  const revokeOldUrl = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    revokeOldUrl();
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordedMime('');
    setElapsed(0);
    setError(null);
    setState('idle');
    chunksRef.current = [];
  }, [cleanup, revokeOldUrl]);

  const startRecording = useCallback(async () => {
    // Unsupported browser check
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Audio recording is not supported in this browser. You can still upload an audio file.');
      setState('error');
      return;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setError('No supported audio recording format found in this browser. Please upload a file instead.');
      setState('error');
      return;
    }

    // Discard any previous recording
    revokeOldUrl();
    setRecordedBlob(null);
    setRecordedUrl(null);
    setError(null);
    chunksRef.current = [];

    setState('requesting');

    let stream: MediaStream;
    try {
      // Ask for standard audio, disabling extra processing that sometimes causes silence on Windows
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: false, 
          autoGainControl: true 
        }, 
        video: false 
      });
    } catch (err: unknown) {
      const isDenied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setError(
        isDenied
          ? 'Microphone access was denied. Allow microphone access in your browser settings and try again.'
          : 'Could not access the microphone. Please check your device and try again.'
      );
      setState('error');
      return;
    }

    streamRef.current = stream;

    // Set up silent analyser for live visualizer
    try {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      // Connect source → analyser ONLY (NOT to destination → no speaker feedback)
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch {
      // Visualizer is optional — don't abort if AudioContext fails
    }

    // Start MediaRecorder
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType });
    } catch {
      cleanup();
      setError('Failed to start recording. Please try again.');
      setState('error');
      return;
    }

    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mr.onstop = () => {
      const chunks = chunksRef.current;
      if (chunks.length === 0) {
        setError('No audio was recorded. Please try again.');
        setState('error');
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setRecordedMime(mimeType);
      setState('recorded');
    };

    mr.onerror = () => {
      cleanup();
      setError('Recording failed unexpectedly. Please try again.');
      setState('error');
    };

    mr.start(); // collect as one big chunk to ensure proper WebM headers/Cues

    // Elapsed timer using Date.now() — stable regardless of chunk delivery
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);

    setState('recording');
  }, [cleanup, revokeOldUrl]);

  const stopRecording = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Stop stream tracks — this releases the microphone indicator in the browser
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    // Stop MediaRecorder — triggers onstop which finalises the blob
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      revokeOldUrl();
    };
  }, [cleanup, revokeOldUrl]);

  return {
    state,
    elapsed,
    recordedBlob,
    recordedUrl,
    recordedMime,
    error,
    analyserRef,
    startRecording,
    stopRecording,
    reset,
  };
}
