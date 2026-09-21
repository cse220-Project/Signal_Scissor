/**
 * useAudioEngine — singleton shared Web Audio API context.
 *
 * A single AudioContext, GainNode and AnalyserNode are shared
 * across the entire application so:
 *  - only one audio graph exists
 *  - the AnalyserNode can be read by any visualization component
 *  - volume/mute controls affect all playback uniformly
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';

interface AudioEngine {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  audioBuffer: AudioBuffer | null;
  analyserNode: AnalyserNode | null;
}

// Module-level singletons — survive React re-renders.
let _audioCtx: AudioContext | null = null;
let _gainNode: GainNode | null = null;
let _analyserNode: AnalyserNode | null = null;

function getOrCreateCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _gainNode = _audioCtx.createGain();
    _analyserNode = _audioCtx.createAnalyser();
    _analyserNode.fftSize = 2048;
    _gainNode.connect(_analyserNode);
    _analyserNode.connect(_audioCtx.destination);
  }
  return { ctx: _audioCtx, gain: _gainNode!, analyser: _analyserNode! };
}

export const useAudioEngine = (url: string | null): AudioEngine => {
  const {
    isPlaying, setIsPlaying,
    setCurrentTime,
    duration, setDuration,
    volume, playbackRate,
  } = useAudioStore();

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const urlRef = useRef<string | null>(null);

  // Initialise context on first use
  useEffect(() => {
    getOrCreateCtx();
  }, []);

  // Apply volume changes
  useEffect(() => {
    if (_gainNode) _gainNode.gain.value = volume;
  }, [volume]);

  // Apply playback rate changes
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
  }, [playbackRate]);

  // Load audio when URL changes
  useEffect(() => {
    if (!url || url === urlRef.current) return;
    urlRef.current = url;

    // Stop any currently playing audio
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    pausedAtRef.current = 0;
    setCurrentTime(0);

    const { ctx } = getOrCreateCtx();

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(ab => ctx.decodeAudioData(ab))
      .then(buf => {
        setAudioBuffer(buf);
        setDuration(buf.duration);
      })
      .catch(e => console.error('[AudioEngine] decode error:', e));

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [url, setCurrentTime, setDuration, setIsPlaying]);

  // Progress loop
  const updateProgress = useCallback(() => {
    const { ctx } = getOrCreateCtx();
    if (!isPlaying) return;

    const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate;
    let t = pausedAtRef.current + elapsed;

    if (t >= duration) {
      t = duration;
      setIsPlaying(false);
      pausedAtRef.current = 0;
      cancelAnimationFrame(rafRef.current);
      setCurrentTime(t);
      return;
    }
    setCurrentTime(t);
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [isPlaying, playbackRate, duration, setCurrentTime, setIsPlaying]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, updateProgress]);

  const play = useCallback(() => {
    if (!audioBuffer) return;
    const { ctx, gain } = getOrCreateCtx();
    if (ctx.state === 'suspended') ctx.resume();

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current.disconnect();
    }

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.playbackRate.value = playbackRate;
    src.connect(gain);
    src.start(0, pausedAtRef.current);
    sourceNodeRef.current = src;
    startTimeRef.current = ctx.currentTime;
    setIsPlaying(true);
  }, [audioBuffer, playbackRate, setIsPlaying]);

  const pause = useCallback(() => {
    if (!isPlaying) return;
    const { ctx } = getOrCreateCtx();
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    pausedAtRef.current += (ctx.currentTime - startTimeRef.current) * playbackRate;
    setIsPlaying(false);
  }, [isPlaying, playbackRate, setIsPlaying]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, [setCurrentTime, setIsPlaying]);

  const seek = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) pause();
    pausedAtRef.current = Math.max(0, Math.min(time, duration));
    setCurrentTime(pausedAtRef.current);
    if (wasPlaying) {
      // Small delay so pause() finishes stopping the old source
      setTimeout(() => play(), 10);
    }
  }, [isPlaying, duration, pause, play, setCurrentTime]);

  return {
    play,
    pause,
    stop,
    seek,
    audioBuffer,
    analyserNode: _analyserNode,
  };
};

/** Get the shared AnalyserNode without managing playback. */
export const useAnalyserNode = (): AnalyserNode | null => {
  const [node, setNode] = useState<AnalyserNode | null>(_analyserNode);
  useEffect(() => {
    // Ensure context is created
    const { analyser } = getOrCreateCtx();
    setNode(analyser);
  }, []);
  return node;
};
