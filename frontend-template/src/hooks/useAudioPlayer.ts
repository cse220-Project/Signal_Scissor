import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../store/useAudioStore';

export const useAudioPlayer = (url: string | null) => {
  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, duration, setDuration, volume, playbackRate } = useAudioStore();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      analyserNodeRef.current = audioCtxRef.current.createAnalyser();
      gainNodeRef.current.connect(analyserNodeRef.current);
      analyserNodeRef.current.connect(audioCtxRef.current.destination);
    }
    
    if (url) {
      setIsPlaying(false);
      pausedAtRef.current = 0;
      setCurrentTime(0);
      
      fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtxRef.current?.decodeAudioData(arrayBuffer))
        .then(buffer => {
          if (buffer) {
            setAudioBuffer(buffer);
            setDuration(buffer.duration);
          }
        })
        .catch(e => console.error("Error decoding audio data", e));
    }
    
    return () => {
      stop();
    };
  }, [url]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);
  
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
  }, [playbackRate]);

  const updateProgress = useCallback(() => {
    if (isPlaying && audioCtxRef.current) {
      const timeElapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
      let newTime = pausedAtRef.current + timeElapsed;
      
      if (newTime >= duration) {
        newTime = duration;
        setIsPlaying(false);
        pausedAtRef.current = 0;
        cancelAnimationFrame(rafRef.current);
      }
      setCurrentTime(newTime);
      rafRef.current = requestAnimationFrame(updateProgress);
    }
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
    if (!audioBuffer || !audioCtxRef.current) return;
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    sourceNodeRef.current = audioCtxRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBuffer;
    sourceNodeRef.current.playbackRate.value = playbackRate;
    
    sourceNodeRef.current.connect(gainNodeRef.current!);
    
    sourceNodeRef.current.start(0, pausedAtRef.current);
    startTimeRef.current = audioCtxRef.current.currentTime;
    
    setIsPlaying(true);
    
    sourceNodeRef.current.onended = () => {
      // Handled by updateProgress to ensure exact timing
    };
  }, [audioBuffer, playbackRate, setIsPlaying]);

  const pause = useCallback(() => {
    if (!audioCtxRef.current || !isPlaying) return;
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    const timeElapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
    pausedAtRef.current += timeElapsed;
    
    setIsPlaying(false);
  }, [isPlaying, playbackRate, setIsPlaying]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, [setCurrentTime, setIsPlaying]);

  const seek = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pause();
    }
    pausedAtRef.current = time;
    setCurrentTime(time);
    if (wasPlaying) {
      play();
    }
  }, [isPlaying, pause, play, setCurrentTime]);

  return { 
    play, 
    pause, 
    stop, 
    seek, 
    currentTime, 
    duration, 
    isPlaying, 
    volume, 
    playbackRate, 
    audioBuffer,
    analyserNode: analyserNodeRef.current 
  };
};
