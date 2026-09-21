import { useState, useCallback, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

/**
 * Decode any browser-recorded blob (WebM/Opus, OGG, MP4…) into a standard
 * 16-bit mono WAV using the browser's own AudioContext decoder.
 * This makes the file readable by soundfile on the backend without needing FFmpeg.
 */
async function blobToWavFile(blob: Blob, baseFilename: string): Promise<File> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close().catch(() => {});
  }

  // Mix down to mono by averaging all channels
  const numChannels = audioBuffer.numberOfChannels;
  const numSamples = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;

  const monoData = new Float32Array(numSamples);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < numSamples; i++) {
      monoData[i] += channelData[i] / numChannels;
    }
  }

  // Build 16-bit PCM WAV
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);          // subchunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, monoData[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  const wavFilename = baseFilename.replace(/\.[^.]+$/, '.wav');
  return new File([wavBuffer], wavFilename, { type: 'audio/wav' });
}

/** Minimal silent bar visualizer driven by AnalyserNode (no speaker output). */
function LiveVisualizer({ analyserRef }: { analyserRef: React.MutableRefObject<AnalyserNode | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barCount = 28;
      const gap = 3;
      const barW = (W - gap * (barCount - 1)) / barCount;

      if (!analyser) {
        ctx.fillStyle = 'rgba(38,33,28,0.12)';
        for (let i = 0; i < barCount; i++) {
          ctx.fillRect(i * (barW + gap), H / 2 - 2, barW, 4);
        }
        return;
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const step = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = data[i * step] / 255;
        const barH = Math.max(3, val * H * 0.85);
        const x = i * (barW + gap);
        const y = (H - barH) / 2;
        ctx.fillStyle = `rgba(38,33,28,${0.15 + val * 0.75})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      }
    };

    draw();
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); };
  }, [analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={48}
      className="w-full max-w-[220px]"
      aria-hidden="true"
    />
  );
}

export default function UploadZone({ onFileSelect, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [recordingName, setRecordingName] = useState('My Recording');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timestampRef = useRef<string>('');

  const {
    state: recState,
    elapsed,
    recordedBlob,
    recordedUrl,
    error: hookError,
    analyserRef,
    startRecording,
    stopRecording,
    reset: resetRecorder,
  } = useAudioRecorder();

  useEffect(() => {
    if (hookError) setRecorderError(hookError);
  }, [hookError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleStartRecording = async () => {
    setRecorderError(null);
    setRecordingName('My Recording');
    timestampRef.current = formatTimestamp();
    await startRecording();
  };

  const handleCancelRecording = () => {
    setRecorderError(null);
    resetRecorder();
  };

  const handleUseAudio = async () => {
    if (!recordedBlob || isConverting) return;
    setIsConverting(true);
    setRecorderError(null);
    try {
      const finalName = recordingName.trim() || `recording-${timestampRef.current || formatTimestamp()}`;
      // Decode the WebM/Opus blob → 16-bit mono WAV in the browser.
      const wavFile = await blobToWavFile(recordedBlob, `${finalName}.webm`);
      onFileSelect(wavFile);
      resetRecorder();
    } catch (err) {
      setRecorderError('Failed to prepare audio. Please try recording again.');
    } finally {
      setIsConverting(false);
    }
  };

  // --- Uploading / Converting state ---
  if (isUploading || isConverting) {
    return (
      <div className="w-full min-h-[200px] rounded-ios-2xl bg-surface border border-hairline flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-pill bg-lavender flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px] text-ink-primary animate-spin">sync</span>
        </div>
        <h3 className="text-[15px] font-semibold text-ink-primary mb-3">
          {isConverting ? 'Preparing audio…' : 'Analyzing and loading audio...'}
        </h3>
        {!isConverting && (
          <div className="w-full max-w-xs">
            <ProgressBar progress={uploadProgress || 0} />
          </div>
        )}
      </div>
    );
  }

  // --- Recording state ---
  if (recState === 'recording' || recState === 'requesting') {
    return (
      <div
        className="w-full min-h-[200px] rounded-ios-2xl border border-hairline bg-surface flex flex-col items-center justify-center p-8 text-center gap-4"
        role="status"
        aria-label="Recording in progress"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-error animate-pulse" aria-hidden="true" />
          <span className="text-[14px] font-semibold text-ink-primary tracking-tight">
            {recState === 'requesting' ? 'Requesting microphone…' : 'Recording'}
          </span>
        </div>

        <p className="font-mono text-[28px] font-semibold text-ink-primary tabular-nums" aria-live="off">
          {formatElapsed(elapsed)}
        </p>

        {recState === 'recording' && <LiveVisualizer analyserRef={analyserRef} />}

        <Button
          variant="primary"
          size="md"
          icon="stop_circle"
          onClick={stopRecording}
          disabled={recState === 'requesting'}
          className="mt-1"
        >
          Stop Recording
        </Button>
      </div>
    );
  }

  // --- Recorded / review state ---
  if (recState === 'recorded' && recordedUrl) {
    const durationLabel = formatElapsed(elapsed);
    return (
      <div className="w-full min-h-[200px] rounded-ios-2xl border border-hairline bg-surface flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-ink-secondary">mic</span>
          <span className="text-[14px] font-semibold text-ink-primary">Recorded Audio</span>
          <span className="text-[12px] text-ink-tertiary font-mono">· {durationLabel}</span>
        </div>

        <input
          type="text"
          value={recordingName}
          onChange={(e) => setRecordingName(e.target.value)}
          placeholder="Name this recording..."
          className="w-full max-w-[240px] px-3 py-2 text-[14px] font-medium text-ink-primary bg-white border border-hairline rounded-ios-lg focus:outline-none focus:border-ink-secondary focus:ring-1 focus:ring-ink-secondary text-center transition-all"
          disabled={isConverting}
          aria-label="Recording Name"
        />

        <audio
          src={recordedUrl}
          controls
          className="w-full max-w-sm h-10 accent-[#26211c]"
          aria-label="Preview of recorded audio"
        />

        {recorderError && (
          <p className="text-error text-[12px]" role="alert">{recorderError}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap justify-center mt-1">
          <Button variant="primary" size="md" icon="check_circle" onClick={handleUseAudio} disabled={isConverting}>
            Use Audio
          </Button>
          <Button variant="secondary" size="md" icon="close" onClick={handleCancelRecording} disabled={isConverting}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --- Idle state (+ error fallthrough) ---
  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* Upload Box */}
        <div
          className={`w-full min-h-[200px] rounded-ios-2xl border border-hairline flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'bg-pastel-lavender scale-[1.005] border-lavender-ink/20'
              : 'bg-surface hover:bg-surface-raised'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Drop audio file here or click to choose a file"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleChange}
            accept="audio/*"
            className="hidden"
            aria-hidden="true"
          />
          <div className={`w-12 h-12 rounded-pill flex items-center justify-center mb-3 transition-colors ${
            isDragging ? 'bg-lavender text-ink-primary' : 'bg-surface-raised text-ink-secondary'
          }`}>
            <span className="material-symbols-outlined text-[22px]">upload_file</span>
          </div>
          <h3 className="text-[16px] font-semibold text-ink-primary mb-1">Drop audio file</h3>
          <p className="text-[13px] text-ink-secondary mb-4 px-2">WAV, MP3, FLAC, M4A, AAC up to 50MB</p>
          <Button
            variant="secondary"
            size="sm"
            className="hover:bg-lavender hover:text-ink-primary transition-all"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Choose File
          </Button>
        </div>

        {/* Record Box */}
        <div
          className="w-full min-h-[200px] rounded-ios-2xl border border-hairline bg-surface hover:bg-surface-raised flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer"
          onClick={handleStartRecording}
          role="button"
          tabIndex={0}
          aria-label="Record audio from microphone"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStartRecording(); }}
        >
          <div className="w-12 h-12 rounded-pill flex items-center justify-center mb-3 bg-surface-raised text-ink-secondary">
            <span className="material-symbols-outlined text-[22px]">mic</span>
          </div>
          <h3 className="text-[16px] font-semibold text-ink-primary mb-1">Record audio</h3>
          <p className="text-[13px] text-ink-secondary mb-4 px-2">Use your microphone to record directly</p>
          <Button
            variant="secondary"
            size="sm"
            icon="mic"
            className="hover:bg-lavender hover:text-ink-primary transition-all"
            onClick={(e) => { e.stopPropagation(); handleStartRecording(); }}
          >
            Start Recording
          </Button>
        </div>
      </div>

      {/* Error message */}
      {(recorderError || (recState === 'error' && hookError)) && (
        <p className="text-center text-error text-[12px] px-2" role="alert">
          {recorderError || hookError}
        </p>
      )}
    </div>
  );
}
