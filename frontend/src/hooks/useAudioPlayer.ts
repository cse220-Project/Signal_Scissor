import { createContext, createElement, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { getAudioStreamUrl } from '../api/client';

function useAudioPlayerEngine() {
  const {
    isPlaying,
    activeTrack,
    currentTime,
    volume,
    loop,
    audioVersion,
    signalState,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useAudioStore();

  const [vuLevel, setVuLevel] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const originalBufferRef = useRef<AudioBuffer | null>(null);
  const processedBufferRef = useRef<AudioBuffer | null>(null);

  const startOffsetRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Audio Context
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = useAudioStore.getState().volume;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      gain.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Fetch and decode an audio track into an AudioBuffer
  const loadTrackBuffer = useCallback(async (track: 'original' | 'processed'): Promise<AudioBuffer | null> => {
    try {
      const ctx = getAudioContext();
      const url = getAudioStreamUrl(track, audioVersion);
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength === 0) return null;
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }, [audioVersion, getAudioContext]);

  // Stop currently playing source node
  const stopSource = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Load both buffers when audioVersion updates
  useEffect(() => {
    let active = true;
    setAudioLoaded(false);
    setAudioError(null);
    if (!signalState?.loaded) return;
    stopSource();

    Promise.all([
      loadTrackBuffer('original'),
      loadTrackBuffer('processed'),
    ]).then(([orig, proc]) => {
      if (!active) return;
      originalBufferRef.current = orig;
      processedBufferRef.current = proc;
      setAudioLoaded(Boolean(orig && proc));

      const target = useAudioStore.getState().activeTrack === 'processed' ? (proc || orig) : (orig || proc);
      if (target) {
        setDuration(target.duration);
      }
      if (!orig || !proc) {
        setAudioError('Could not load the audio tracks. Reload the signal to retry.');
        setIsPlaying(false);
      }
    }).catch(() => {
      if (!active) return;
      setAudioError('Failed to decode audio buffers');
      setIsPlaying(false);
    });

    return () => {
      active = false;
    };
  }, [audioVersion, loadTrackBuffer, signalState?.loaded, setDuration, setIsPlaying, stopSource]);

  // Play audio from given offset in seconds
  const playSource = useCallback((offsetSec: number = 0) => {
    stopSource();
    const ctx = getAudioContext();
    const buffer = activeTrack === 'processed' 
      ? (processedBufferRef.current || originalBufferRef.current)
      : (originalBufferRef.current || processedBufferRef.current);

    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gainNodeRef.current!);

    const clampedOffset = Math.max(0, Math.min(offsetSec, buffer.duration));
    startOffsetRef.current = clampedOffset;
    startTimeRef.current = ctx.currentTime;

    source.onended = () => {
      if (!loop && sourceNodeRef.current === source) {
        setIsPlaying(false);
        setCurrentTime(0);
        setVuLevel(0);
      }
    };

    source.start(0, clampedOffset);
    sourceNodeRef.current = source;

    // Animation frame to update current time & VU meter
    const updateProgress = () => {
      if (!ctx || !sourceNodeRef.current) return;
      const elapsed = ctx.currentTime - startTimeRef.current;
      let cur = startOffsetRef.current + elapsed;

      if (buffer.duration > 0) {
        if (loop) {
          cur = cur % buffer.duration;
        } else if (cur >= buffer.duration) {
          cur = buffer.duration;
        }
      }

      setCurrentTime(cur);

      // Compute RMS VU level from AnalyserNode
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const val = (data[i] - 128) / 128;
          sum += val * val;
        }
        const rmsVal = Math.sqrt(sum / data.length);
        setVuLevel(Math.min(1.0, rmsVal * 3.5));
      }

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [activeTrack, getAudioContext, isPlaying, loop, setCurrentTime, setIsPlaying, stopSource]);

  // Handle play / pause toggle
  useEffect(() => {
    if (isPlaying && audioLoaded) {
      playSource(currentTime);
    } else {
      stopSource();
      setVuLevel(0);
    }
    return () => {
      stopSource();
    };
  // Progress updates must not restart the source. These are the playback transitions.
  }, [isPlaying, activeTrack, loop, audioLoaded, audioVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle track switch (original <-> processed) while playing
  const handleTrackChange = useCallback((newTrack: 'original' | 'processed') => {
    stopSource();
    useAudioStore.getState().setActiveTrack(newTrack);
    const buf = newTrack === 'processed'
      ? (processedBufferRef.current || originalBufferRef.current)
      : (originalBufferRef.current || processedBufferRef.current);
    if (buf) {
      setDuration(buf.duration);
      setCurrentTime(Math.min(useAudioStore.getState().currentTime, buf.duration));
    }
    // The playback effect starts the new track after React applies the selection.
  }, [stopSource, setDuration, setCurrentTime]);

  // Seek handler
  const seekTo = useCallback((targetSec: number) => {
    const wasPlaying = isPlaying;
    stopSource();
    setCurrentTime(targetSec);
    if (wasPlaying) {
      playSource(targetSec);
    }
  }, [isPlaying, stopSource, setCurrentTime, playSource]);

  const togglePlay = useCallback(() => {
    if (audioLoaded) setIsPlaying(!isPlaying);
  }, [audioLoaded, isPlaying, setIsPlaying]);

  const stop = useCallback(() => {
    stopSource();
    setIsPlaying(false);
    setCurrentTime(0);
    setVuLevel(0);
  }, [stopSource, setIsPlaying, setCurrentTime]);

  useEffect(() => () => {
    stopSource();
    const context = audioCtxRef.current;
    if (context && context.state !== 'closed') void context.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
  }, [stopSource, setIsPlaying]);

  return {
    isPlaying,
    activeTrack,
    currentTime,
    vuLevel,
    audioLoaded,
    audioError,
    togglePlay,
    stop,
    seekTo,
    handleTrackChange,
  };
}

const AudioPlayerContext = createContext<ReturnType<typeof useAudioPlayerEngine> | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayerEngine();
  return createElement(AudioPlayerContext.Provider, { value: player }, children);
}

export function useAudioPlayer() {
  const player = useContext(AudioPlayerContext);
  if (!player) throw new Error('Audio controls must be inside AudioPlayerProvider');
  return player;
}
