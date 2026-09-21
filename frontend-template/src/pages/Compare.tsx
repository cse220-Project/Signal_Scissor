import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Slider from '../components/ui/Slider';
import ComparisonView from '../components/compare/ComparisonView';
import AudioPlayer from '../components/audio/AudioPlayer';
import { useAudioStore } from '../store/useAudioStore';
import { processCompare, listFiles, getStreamUrl } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Compare() {
  const [semitones, setSemitones] = useState(5);
  const [stretchFactor, setStretchFactor] = useState(1.0);
  const [isComparing, setIsComparing] = useState(false);
  const { comparisonResult, setComparisonResult, selectedFile, setSelectedFile, files, setFiles } = useAudioStore();
  const navigate = useNavigate();

  // Load available files if files array is empty
  useEffect(() => {
    if (files.length === 0) {
      listFiles()
        .then(res => {
          if (res.data?.data) {
            setFiles(res.data.data);
            if (!selectedFile && res.data.data.length > 0) {
              setSelectedFile(res.data.data[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [files.length, selectedFile, setFiles, setSelectedFile]);

  // Clear comparison result when the selected file changes
  useEffect(() => {
    setComparisonResult(null);
  }, [selectedFile?.id, setComparisonResult]);


  const handleCompare = async () => {
    if (!selectedFile) {
      alert("Please upload or select an audio file first.");
      navigate('/');
      return;
    }

    setIsComparing(true);
    try {
      const res = await processCompare({
        file_id: selectedFile.id,
        semitones: semitones,
        stretch_factor: stretchFactor,
        n_fft: 2048,
        ha: 512,
        window_type: 'hann',
      });
      setComparisonResult(res.data.data);
    } catch (e) {
      console.error('Comparison failed:', e);
      alert('Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  };

  const streamUrl = selectedFile ? getStreamUrl(selectedFile.id) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h1 className="text-[26px] font-semibold text-ink-primary">Algorithm Comparison</h1>
        <p className="text-[13px] text-ink-secondary">
          Compare frequency-domain Phase Vocoder against naive time-domain resampling.
        </p>
      </header>

      {/* Active Audio Player if selected */}
      {selectedFile && (
        <AudioPlayer url={streamUrl} title={selectedFile.original_filename} />
      )}

      <div className="bg-[#e3e8e4] rounded-[24px] p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#26211c] tracking-tight">Benchmark Parameters</h2>
          <span className="text-[12px] font-medium text-[#57534e]">Frequency vs Time Domain</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Pitch Shift Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#26211c]">tune</span>
                <span className="text-[13.5px] font-semibold text-[#26211c] tracking-tight">Target Pitch Shift</span>
              </div>
              <span className="text-[13px] font-semibold text-[#26211c]">
                {semitones > 0 ? '+' : ''}{semitones} st
              </span>
            </div>
            <Slider
              min={-12} max={12} step={1}
              value={semitones}
              onChange={setSemitones}
              trackColor="#d9cfc7"
              activeColor="#26211c"
            />
          </div>

          {/* Time Stretch Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#26211c]">speed</span>
                <span className="text-[13.5px] font-semibold text-[#26211c] tracking-tight">Target Time Stretch</span>
              </div>
              <span className="text-[13px] font-semibold text-[#26211c]">
                {stretchFactor.toFixed(2)}x
              </span>
            </div>
            <Slider
              min={0.25} max={2.0} step={0.05}
              value={stretchFactor}
              onChange={setStretchFactor}
              trackColor="#d9cfc7"
              activeColor="#26211c"
            />
          </div>
        </div>
        <div className="flex justify-center pt-1">
          <Button
            variant="primary"
            size="md"
            icon="compare_arrows"
            disabled={!selectedFile || isComparing}
            loading={isComparing}
            onClick={handleCompare}
            className="px-8"
          >
            Run Comparison
          </Button>
        </div>
      </div>

      {comparisonResult && <ComparisonView result={comparisonResult} />}
    </div>
  );
}
