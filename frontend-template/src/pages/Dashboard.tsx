import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/audio/UploadZone';
import Card from '../components/ui/Card';
import { useAudioStore } from '../store/useAudioStore';
import { uploadAudio, getWaveform, getSpectrogram } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addFile, setSelectedFile, setWaveformData, setAnalysis, setSpectrogramData } = useAudioStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadAudio(file);
      const af = res.data.data;
      addFile(af);
      setSelectedFile(af);
      if (res.data.data.analysis) setAnalysis(res.data.data.analysis);

      getWaveform(af.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(af.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});

      navigate('/studio');
    } catch (e: any) {
      setUploadError(e?.response?.data?.error || e?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-[28px] md:text-[34px] font-semibold text-ink-primary tracking-tight">
          Audio Processing Workspace
        </h1>
        <p className="text-[14px] text-ink-secondary max-w-xl leading-relaxed">
          Manipulate pitch and duration independently using Short-Time Fourier Transform phase unwrapping and phase-locked resynthesis.
        </p>
      </header>

      {/* Top Grid: Upload Area & Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8">
          <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
          {uploadError && (
            <p className="text-center text-error mt-2.5 text-[12px]">{uploadError}</p>
          )}
        </div>

        <div className="md:col-span-4 flex">
          <Card variant="pastel-cream" className="w-full flex flex-col justify-center items-center !p-5">
            <div className="w-full max-w-[240px] flex flex-col">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-hairline">
                <span className="text-[15px] font-semibold text-ink-primary tracking-tight">Engine Status</span>
                <span className="text-[11px] text-ink-secondary">Online</span>
              </div>

              <div className="text-[12px]">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-ink-secondary">FFT Window</span>
                  <span className="text-ink-primary">2048</span>
                </div>
                <div className="h-[1px] bg-hairline w-full" />

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-ink-secondary">Hop Size</span>
                  <span className="text-ink-primary">512 · 75%</span>
                </div>
                <div className="h-[1px] bg-hairline w-full" />

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-ink-secondary">Coherence</span>
                  <span className="text-ink-primary">Phase Locking</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-hairline text-[11px] text-ink-tertiary text-center">
                44.1 kHz · 32-bit float
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-[15px] font-semibold text-ink-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            variant="pastel-blue" 
            onClick={() => navigate('/signals')}
            className="!p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-ink-primary">
                  show_chart
                </span>
                <h3 className="text-[15px] font-semibold text-ink-primary">Signal Generator</h3>
              </div>
              <svg 
                width="15" 
                height="15" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-ink-secondary opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              Generate pure sines, sweeps, and noise to benchmark STFT windowing.
            </p>
          </Card>

          <Card 
            variant="pastel-lavender" 
            onClick={() => navigate('/compare')}
            className="!p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-ink-primary">
                  compare_arrows
                </span>
                <h3 className="text-[15px] font-semibold text-ink-primary">Vocoder vs Resampling</h3>
              </div>
              <svg 
                width="15" 
                height="15" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-ink-secondary opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              Compare time-domain chipmunk resampling vs true phase preservation.
            </p>
          </Card>

          <Card 
            variant="pastel-peach" 
            onClick={() => navigate('/theory')}
            className="!p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-ink-primary">
                  menu_book
                </span>
                <h3 className="text-[15px] font-semibold text-ink-primary">Theory & Mathematics</h3>
              </div>
              <svg 
                width="15" 
                height="15" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-ink-secondary opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
            <p className="text-[12px] text-ink-secondary leading-relaxed">
              Explore mathematical derivations: Fourier transforms, instantaneous frequency.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
