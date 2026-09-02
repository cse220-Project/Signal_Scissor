import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import TransportBar from './components/TransportBar';
import WaveformVisualizer from './components/WaveformVisualizer';
import SpectrumVisualizer from './components/SpectrumVisualizer';
import EffectsRack from './components/EffectsRack';
import ImpulseResponseModal from './components/ImpulseResponseModal';
import TheoryModal from './components/TheoryModal';
import SignalStatsBar from './components/SignalStatsBar';
import ProcessingOverlay from './components/ProcessingOverlay';
import { Waves, SlidersHorizontal, SplitSquareVertical } from 'lucide-react';

export default function App() {
  // Signal & Engine State
  const [signalData, setSignalData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTask, setProcessingTask] = useState('pipeline');
  const abortControllerRef = useRef(null);
  const [activeTrack, setActiveTrack] = useState('processed');
  
  // Workstation View Modes: 'waveforms' | 'spectrum' | 'split'
  const [viewMode, setViewMode] = useState('waveforms');

  // Audio Playback Engine State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [vuLevel, setVuLevel] = useState(0);

  // Web Audio API refs
  const audioCtxRef = useRef(null);
  const audioBuffersRef = useRef({ original: null, processed: null });
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const animFrameRef = useRef(null);

  // DSP Configuration
  const [filterConfig, setFilterConfig] = useState({
    enabled: true,
    low_freq: 900,
    high_freq: 1100,
    operation: 'cut',
    strength: null
  });

  const [effectsConfig, setEffectsConfig] = useState({
    gain: 1.0,
    delay_ms: 0,
    shift_hz: 0,
    echo_enabled: false,
    echo_feedback: 32,
    echo_mix: 45
  });

  // Modals
  const [isImpulseOpen, setIsImpulseOpen] = useState(false);
  const [impulseData, setImpulseData] = useState(null);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [theoryData, setTheoryData] = useState(null);

  // Initialize Web Audio API
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      gainNode.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [volume]);

  // Fetch audio buffers from FastAPI backend
  const loadAudioBuffer = async (track) => {
    try {
      const ctx = getAudioContext();
      const res = await fetch(`/api/audio/${track}?t=${Date.now()}`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      audioBuffersRef.current[track] = decoded;
      return decoded;
    } catch (err) {
      console.error(`Failed to load audio for ${track}:`, err);
      return null;
    }
  };

  const refreshAudioBuffers = async () => {
    await Promise.all([
      loadAudioBuffer('original'),
      loadAudioBuffer('processed')
    ]);
  };

  const loadInitialSignal = async (preset = 'tones') => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProcessingTask('signal');
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/signal/test?preset=${preset}`, { signal: controller.signal });
      const data = await res.json();
      setSignalData(data);
      pauseOffsetRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      await refreshAudioBuffers();
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to load initial signal:', err);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    loadInitialSignal('tones');
    fetch('/api/theory')
      .then(res => res.json())
      .then(data => setTheoryData(data))
      .catch(err => console.error('Failed to fetch theory:', err));
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Audio Playback Controls
  const handleTogglePlay = () => {
    if (isPlaying) handlePause();
    else handlePlay();
  };

  const handlePlay = (offset = pauseOffsetRef.current) => {
    const ctx = getAudioContext();
    const buffer = audioBuffersRef.current[activeTrack];
    if (!buffer) return;

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (_) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNodeRef.current);

    const safeOffset = Math.min(buffer.duration, Math.max(0, offset));
    source.start(0, safeOffset);
    startTimeRef.current = ctx.currentTime - safeOffset;
    pauseOffsetRef.current = safeOffset;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      if (ctx.currentTime - startTimeRef.current >= buffer.duration) {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        setCurrentTime(0);
      }
    };
  };

  const handlePause = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (_) {}
      sourceNodeRef.current = null;
    }
    const ctx = audioCtxRef.current;
    if (ctx) {
      const elapsed = ctx.currentTime - startTimeRef.current;
      pauseOffsetRef.current = elapsed;
      setCurrentTime(elapsed);
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (_) {}
      sourceNodeRef.current = null;
    }
    pauseOffsetRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setVuLevel(0);
  };

  const handleSeek = (newTime) => {
    pauseOffsetRef.current = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      handlePlay(newTime);
    }
  };

  const handleToggleTrack = (track) => {
    setActiveTrack(track);
    if (isPlaying) {
      handlePlay(currentTime);
    }
  };

  // Playhead & VU Loop
  useEffect(() => {
    const updatePlayhead = () => {
      if (isPlaying && audioCtxRef.current && signalData) {
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(signalData.duration, elapsed));

        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setVuLevel(avg / 128.0);
        }
      } else if (!isPlaying) {
        setVuLevel(0);
      }
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animFrameRef.current = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, signalData]);

  // Cancel in-flight operation
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
  };

  // DSP Actions — each sets processingTask, uses AbortController
  const handleApplyFilter = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProcessingTask('filter');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/process/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterConfig),
        signal: controller.signal
      });
      const data = await res.json();
      setSignalData(data);
      await loadAudioBuffer('processed');
      if (isPlaying && activeTrack === 'processed') handlePlay(currentTime);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Filter processing error:', err);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplyEffects = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProcessingTask('effects');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/process/effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(effectsConfig),
        signal: controller.signal
      });
      const data = await res.json();
      setSignalData(data);
      await loadAudioBuffer('processed');
      if (isPlaying && activeTrack === 'processed') handlePlay(currentTime);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Effects processing error:', err);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplyAll = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProcessingTask('pipeline');
    setIsProcessing(true);
    try {
      const payload = {
        filter_enabled: filterConfig.enabled,
        low_freq: filterConfig.low_freq,
        high_freq: filterConfig.high_freq,
        operation: filterConfig.operation,
        strength: filterConfig.strength,
        gain: effectsConfig.gain,
        delay_ms: effectsConfig.delay_ms,
        shift_hz: effectsConfig.shift_hz,
        echo_enabled: effectsConfig.echo_enabled,
        echo_feedback: effectsConfig.echo_feedback,
        echo_mix: effectsConfig.echo_mix
      };
      const res = await fetch('/api/process/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const data = await res.json();
      setSignalData(data);
      await loadAudioBuffer('processed');
      if (isPlaying && activeTrack === 'processed') handlePlay(currentTime);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Pipeline processing error:', err);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleUploadFile = async (file) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProcessingTask('upload');
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/signal/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      const data = await res.json();
      setSignalData(data);
      handleStop();
      await refreshAudioBuffers();
    } catch (err) {
      if (err.name !== 'AbortError') console.error('File upload error:', err);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleExportWav = () => {
    window.location.href = '/api/export/wav';
  };

  const handleReset = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProcessingTask('signal');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST', signal: controller.signal });
      const data = await res.json();
      setSignalData(data);
      setFilterConfig({ enabled: true, low_freq: 900, high_freq: 1100, operation: 'cut', strength: null });
      setEffectsConfig({ gain: 1.0, delay_ms: 0, shift_hz: 0, echo_enabled: false, echo_feedback: 32, echo_mix: 45 });
      handleStop();
      await refreshAudioBuffers();
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Reset error:', err);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleOpenImpulseResponse = async () => {
    try {
      const delay = effectsConfig.delay_ms > 0 ? effectsConfig.delay_ms : 250;
      const res = await fetch(`/api/impulse-response?delay_ms=${delay}&feedback=${effectsConfig.echo_feedback}`);
      const data = await res.json();
      setImpulseData(data);
      setIsImpulseOpen(true);
    } catch (err) {
      console.error('Failed to get impulse response:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Aurora */}
      <div className="aurora-canvas-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="swiss-grid-overlay" />

      {/* ── ROW 0: Header ──────────────────────────────────────────── */}
      <Header
        sourceName={signalData?.source_name || 'Demo Signal'}
        onLoadPreset={loadInitialSignal}
        onUploadFile={handleUploadFile}
        onExportWav={handleExportWav}
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        isProcessing={isProcessing}
      />

      {/* ── ROW 1: View Mode Switcher ───────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 20,
        padding: '10px 28px 0 28px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <div className="glass-pill view-switcher">
          {[
            { id: 'waveforms', icon: <Waves             size={13} />, label: 'Dual Waveform'    },
            { id: 'spectrum',  icon: <SlidersHorizontal  size={13} />, label: 'Fourier Spectrum'  },
            { id: 'split',     icon: <SplitSquareVertical size={13} />, label: 'Lab Comparison'   },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              className={`view-tab ${viewMode === id ? 'active' : ''}`}
              onClick={() => setViewMode(id)}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {isProcessing && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-amber)',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
              background: 'var(--accent-amber)', boxShadow: '0 0 8px var(--accent-amber)'
            }} />
            DSP COMPUTING…
          </span>
        )}
      </div>

      {/* ── ROW 2: Transport Bar — full-width, own clean row ────────── */}
      <div style={{ position: 'relative', zIndex: 20, padding: '10px 28px' }}>
        <TransportBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={signalData?.duration || 2.0}
          activeTrack={activeTrack}
          onTogglePlay={handleTogglePlay}
          onStop={handleStop}
          onSeek={handleSeek}
          onToggleTrack={handleToggleTrack}
          volume={volume}
          onVolumeChange={setVolume}
          vuLevel={vuLevel}
        />
      </div>

      {/* ── ROW 3: Studio Workspace ─────────────────────────────────── */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 10,
        padding: '0 28px 24px 28px',
        display: 'flex', gap: '20px',
        maxWidth: '1800px', margin: '0 auto', width: '100%'
      }}>

        {/* Stage column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {viewMode === 'waveforms' && (<>
            <WaveformVisualizer
              title="Input Signal Trace"
              tag="ORIGINAL x[n]"
              waveform={signalData?.original_waveform}
              duration={signalData?.duration || 2.0}
              color="var(--lavender-tonic)"
              currentTime={currentTime}
              onSeek={handleSeek}
              height={248}
            />
            <WaveformVisualizer
              title="Filtered & Acoustic Output Trace"
              tag="PROCESSED y[n]"
              waveform={signalData?.processed_waveform}
              secondaryWaveform={signalData?.original_waveform}
              duration={signalData?.duration || 2.0}
              color="var(--accent-violet)"
              secondaryColor="rgba(200, 190, 250, 0.4)"
              currentTime={currentTime}
              onSeek={handleSeek}
              height={248}
            />
          </>)}

          {viewMode === 'spectrum' && (
            <SpectrumVisualizer
              originalSpectrum={signalData?.original_spectrum}
              processedSpectrum={signalData?.processed_spectrum}
              sampleRate={signalData?.sample_rate || 8000}
              band={[filterConfig.low_freq, filterConfig.high_freq]}
              onBandChange={([low, high]) => setFilterConfig({ ...filterConfig, low_freq: low, high_freq: high })}
              bandOperation={filterConfig.operation}
              isBandFilterActive={filterConfig.enabled}
              height={510}
            />
          )}

          {viewMode === 'split' && (<>
            <WaveformVisualizer
              title="A/B Waveform Overlay"
              tag="OVERLAY"
              waveform={signalData?.processed_waveform}
              secondaryWaveform={signalData?.original_waveform}
              duration={signalData?.duration || 2.0}
              color="var(--lavender-tonic)"
              secondaryColor="rgba(167, 139, 250, 0.48)"
              currentTime={currentTime}
              onSeek={handleSeek}
              height={248}
            />
            <SpectrumVisualizer
              originalSpectrum={signalData?.original_spectrum}
              processedSpectrum={signalData?.processed_spectrum}
              sampleRate={signalData?.sample_rate || 8000}
              band={[filterConfig.low_freq, filterConfig.high_freq]}
              onBandChange={([low, high]) => setFilterConfig({ ...filterConfig, low_freq: low, high_freq: high })}
              bandOperation={filterConfig.operation}
              isBandFilterActive={filterConfig.enabled}
              height={248}
            />
          </>)}

        </div>

        {/* Rack column */}
        <div style={{ width: '360px', flexShrink: 0 }}>
          <EffectsRack
            filterConfig={filterConfig}
            onFilterConfigChange={setFilterConfig}
            effectsConfig={effectsConfig}
            onEffectsConfigChange={setEffectsConfig}
            onApplyFilter={handleApplyFilter}
            onApplyEffects={handleApplyEffects}
            onApplyAll={handleApplyAll}
            onOpenImpulseResponse={handleOpenImpulseResponse}
            sampleRate={signalData?.sample_rate || 8000}
            isProcessing={isProcessing}
          />
        </div>

      </main>

      {/* Bottom Telemetry Bar */}
      <SignalStatsBar stats={signalData?.stats} sourceName={signalData?.source_name} />

      {/* Modals */}
      <ImpulseResponseModal isOpen={isImpulseOpen} onClose={() => setIsImpulseOpen(false)} impulseData={impulseData} />
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} theoryData={theoryData} />

      {/* ── Processing Overlay — blocks ALL interaction while DSP runs ── */}
      <ProcessingOverlay
        isVisible={isProcessing}
        taskType={processingTask}
        onCancel={handleCancel}
      />
    </div>
  );
}
