import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import AudioPlayer from '../components/audio/AudioPlayer';
import { StudioWaveform, StudioLiveSignal, StudioLiveSpectrum } from '../components/studio/StudioVisualizers';
import StudioProcessingPanel from '../components/studio/StudioProcessingPanel';
import StudioEffectsChain from '../components/studio/StudioEffectsChain';
import { StudioAnalysisMetrics, StudioSpectrogramCard } from '../components/studio/StudioAnalysisCards';
import UploadZone from '../components/audio/UploadZone';
import Button from '../components/ui/Button';
import AudioFileCard from '../components/audio/AudioFileCard';
import {
  uploadAudio,
  getWaveform,
  getSpectrogram,
  analyzeFile,
  getStreamUrl,
  getExportUrl,
  listFiles,
  deleteAllFiles,
} from '../api/client';

export default function Studio() {
  const navigate = useNavigate();
  const {
    files,
    setFiles,
    clearFiles,
    selectedFile,
    setSelectedFile,
    addFile,
    waveformData,
    setWaveformData,
    analysis,
    setAnalysis,
    spectrogramData,
    setSpectrogramData,
  } = useAudioStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClearSessions = async () => {
    if (!window.confirm("Are you sure you want to remove all recent sessions? This will permanently delete all uploaded and processed audio files.")) {
      return;
    }
    
    setIsClearing(true);
    try {
      await deleteAllFiles();
      clearFiles();
    } catch (e) {
      console.error("Failed to clear sessions", e);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    if (!selectedFile) {
      listFiles().then(res => {
        const backendFiles = res.data.data || [];
        setFiles(backendFiles);
      }).catch(() => {});
    }
  }, [setFiles, selectedFile]);

  useEffect(() => {
    if (selectedFile) {
      if (!waveformData) {
        getWaveform(selectedFile.id, 1200)
          .then((res) => setWaveformData(res.data.data))
          .catch(() => {});
      }
      if (!spectrogramData) {
        getSpectrogram(selectedFile.id)
          .then((res) => setSpectrogramData(res.data.data))
          .catch(() => {});
      }
      if (!analysis) {
        analyzeFile(selectedFile.id)
          .then((res) => setAnalysis(res.data.data))
          .catch(() => {});
      }
    }
  }, [selectedFile?.id]);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadAudio(file);
      const { data } = res.data;
      const af = data;
      addFile(af);
      setSelectedFile(af);

      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      try {
        const wRes = await getWaveform(af.id, 1200);
        setWaveformData(wRes.data.data);
      } catch {}

      try {
        const sRes = await getSpectrogram(af.id);
        setSpectrogramData(sRes.data.data);
      } catch {}
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="max-w-3xl mx-auto mt-8 animate-in fade-in duration-300 space-y-8">
        <div className="space-y-4">
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-[26px] font-semibold text-ink-primary">Audio Input</h1>
            <p className="text-[13px] text-ink-secondary">Upload or record audio to adjust pitch, time-scale, and inspect spectral domains.</p>
          </div>
          <UploadZone
            onFileSelect={handleFileSelect}
            isUploading={isUploading}
          />
          {uploadError && (
            <p className="text-center text-error text-[12px]">{uploadError}</p>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="pt-8 border-t border-hairline">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-ink-primary">Recent Sessions</h2>
            {files.length > 0 && (
              <button
                onClick={handleClearSessions}
                disabled={isClearing}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-ios-lg border border-hairline bg-surface hover:bg-error-soft text-ink-secondary hover:text-error hover:border-error/20 text-[12px] font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>{isClearing ? 'Clearing...' : 'Clear Sessions'}</span>
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="py-12 text-center text-ink-tertiary bg-surface rounded-ios-2xl border border-hairline border-dashed">
              <span className="material-symbols-outlined text-[28px] mb-2 opacity-60">library_music</span>
              <p className="text-[13px]">No audio sessions loaded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-hairline bg-surface rounded-ios-2xl border border-hairline overflow-hidden">
              {files.map((file) => (
                <AudioFileCard
                  key={file.id}
                  file={file}
                  onClick={() => {
                    setSelectedFile(file);
                    getWaveform(file.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
                    getSpectrogram(file.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const streamUrl = getStreamUrl(selectedFile.id);

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-ink-primary">Studio Workspace</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="compare_arrows"
            onClick={() => navigate('/compare')}
            title="Compare Phase Vocoder vs Naive Resampling"
          >
            Compare
          </Button>
          <a
            href={getExportUrl(selectedFile.id)}
            download={selectedFile.original_filename}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-ios-lg text-[13px] font-medium border border-[rgba(38,33,28,0.18)] text-[#26211c] hover:bg-[rgba(38,33,28,0.04)] active:scale-[0.98] transition-all"
            title="Download active processed WAV file"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Download WAV</span>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
              setWaveformData(null);
              setAnalysis(null);
              setSpectrogramData(null);
            }}
          >
            Close Audio
          </Button>
        </div>
      </div>

      {/* Main player */}
      <AudioPlayer url={streamUrl} title={selectedFile.original_filename} />

      {/* Row 1: Direct Bento Visualizers in Checklist Soft Color Variants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StudioWaveform />
        <StudioLiveSignal />
        <StudioLiveSpectrum />
      </div>

      {/* Row 2: 2-Column Processing and Deep Analysis Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 space-y-4">
          <StudioProcessingPanel />
          <StudioEffectsChain />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <StudioAnalysisMetrics />
          <StudioSpectrogramCard />
        </div>
      </div>
    </div>
  );
}
