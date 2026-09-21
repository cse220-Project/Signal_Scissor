import { useState } from 'react';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import Toggle from '../ui/Toggle';
import Select from '../ui/Select';
import { useAudioStore } from '../../store/useAudioStore';
import { processPitchShift, processTimeStretch, getWaveform, getSpectrogram } from '../../api/client';

export default function StudioProcessingPanel() {
  const [pitchShift, setPitchShift] = useState(0);
  const [timeStretch, setTimeStretch] = useState(1.0);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [fftSize, setFftSize] = useState('2048');
  const [hopSize, setHopSize] = useState('512');
  const [windowType, setWindowType] = useState('hann');
  const [phaseLocking, setPhaseLocking] = useState(true);

  const {
    selectedFile,
    isProcessing,
    setIsProcessing,
    setSelectedFile,
    addProcessedFile,
    setWaveformData,
    setSpectrogramData,
    addFile
  } = useAudioStore();

  const handleReset = () => {
    setPitchShift(0);
    setTimeStretch(1.0);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      let currentFileId = selectedFile.id;
      let lastFile = selectedFile;

      if (pitchShift !== 0) {
        const res = await processPitchShift({
          file_id: currentFileId,
          semitones: pitchShift,
          n_fft: parseInt(fftSize),
          ha: parseInt(hopSize),
          window_type: windowType,
          phase_locking: phaseLocking,
        });
        lastFile = res.data.data.file;
        addFile(lastFile);
        addProcessedFile(lastFile);
        currentFileId = lastFile.id;
      }

      if (timeStretch !== 1.0) {
        const res = await processTimeStretch({
          file_id: currentFileId,
          stretch_factor: timeStretch,
          n_fft: parseInt(fftSize),
          ha: parseInt(hopSize),
          window_type: windowType,
          phase_locking: phaseLocking,
        });
        lastFile = res.data.data.file;
        addFile(lastFile);
        addProcessedFile(lastFile);
      }

      setSelectedFile(lastFile);

      getWaveform(lastFile.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(lastFile.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
    } catch (e: any) {
      console.error(e);
      alert('Processing failed: ' + (e?.response?.data?.error || e?.message || 'unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const hasChanges = pitchShift !== 0 || timeStretch !== 1.0;

  return (
    <div className="bg-[#f0e3db] rounded-[24px] p-6 flex flex-col gap-5 select-none shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-[#26211c] tracking-tight">Phase Vocoder Engine</h2>
          <p className="text-[12px] text-[#57534e] mt-0.5">Independent pitch scaling and time-compression</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-1.5 px-2.5 py-1 -mr-1 rounded-ios-md text-[12px] font-medium text-[#57534e] hover:text-[#26211c] hover:bg-[rgba(38,33,28,0.06)] active:bg-[rgba(38,33,28,0.12)] active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            title="Reset parameters to default"
          >
            <span className="material-symbols-outlined text-[15px]">restart_alt</span>
            <span>Reset</span>
          </button>
          <span className="text-[12px] font-medium text-[#57534e]">
            DSP Core
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <Slider
          label="Pitch Shift"
          value={pitchShift}
          onChange={setPitchShift}
          min={-12}
          max={12}
          step={0.5}
          formatValue={(v) => (v > 0 ? `+${v} st` : `${v} st`)}
          trackColor="#d9cfc7"
          activeColor="#26211c"
        />

        <Slider
          label="Time Stretch"
          value={timeStretch}
          onChange={setTimeStretch}
          min={0.25}
          max={4.0}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}x`}
          trackColor="#d9cfc7"
          activeColor="#26211c"
        />
      </div>

      {/* Advanced Toggle */}
      <div className="pt-1">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#57534e] hover:text-[#26211c] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: advancedOpen ? 'rotate(90deg)' : 'none' }}>
            chevron_right
          </span>
          <span>Advanced FFT Parameters</span>
        </button>

        {advancedOpen && (
          <div className="mt-3 p-4 rounded-[16px] bg-[rgba(38,33,28,0.04)] border border-[rgba(38,33,28,0.07)] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="FFT Frame Size"
                value={fftSize}
                onChange={(e) => setFftSize(e.target.value)}
                options={[
                  { value: '1024', label: '1024 (fast)' },
                  { value: '2048', label: '2048 (balanced)' },
                  { value: '4096', label: '4096 (high resolution)' },
                ]}
              />
              <Select
                label="Hop Size (Ha)"
                value={hopSize}
                onChange={(e) => setHopSize(e.target.value)}
                options={[
                  { value: '256', label: '256' },
                  { value: '512', label: '512 (standard)' },
                  { value: '1024', label: '1024' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Select
                label="Window Function"
                value={windowType}
                onChange={(e) => setWindowType(e.target.value)}
                options={[
                  { value: 'hann', label: 'Hann' },
                  { value: 'hamming', label: 'Hamming' },
                  { value: 'blackman', label: 'Blackman' },
                ]}
              />
              <div className="pt-4">
                <Toggle
                  label="Phase Locking"
                  checked={phaseLocking}
                  onChange={setPhaseLocking}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Process Action */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant="secondary"
          size="md"
          icon="restart_alt"
          onClick={handleReset}
          disabled={!hasChanges}
          className="shrink-0 bg-transparent hover:bg-[rgba(38,33,28,0.06)]"
        >
          Reset
        </Button>
        <Button
          variant="primary"
          fullWidth
          size="md"
          icon="tune"
          loading={isProcessing}
          onClick={handleProcess}
          disabled={!hasChanges || isProcessing}
        >
          Render Audio
        </Button>
      </div>
    </div>
  );
}
