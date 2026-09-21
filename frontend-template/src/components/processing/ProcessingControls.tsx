import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import Toggle from '../ui/Toggle';
import Select from '../ui/Select';
import { useAudioStore } from '../../store/useAudioStore';
import { processPitchShift, processTimeStretch, getWaveform, getSpectrogram } from '../../api/client';

export default function ProcessingControls() {
  const [pitchShift, setPitchShift] = useState(0);
  const [timeStretch, setTimeStretch] = useState(1.0);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [fftSize, setFftSize] = useState('2048');
  const [hopSize, setHopSize] = useState('512');
  const [windowType, setWindowType] = useState('hann');
  const [phaseLocking, setPhaseLocking] = useState(true);

  const { selectedFile, isProcessing, setIsProcessing, setSelectedFile, addProcessedFile, setWaveformData, setSpectrogramData, addFile } = useAudioStore();

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      let currentFileId = selectedFile.id;
      let lastFile = selectedFile;

      // Step 1: Apply pitch shift if non-zero
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

      // Step 2: Apply time stretch if non-unity (on the result of step 1)
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

      // Update visualizers with the final output
      getWaveform(lastFile.id, 1200).then(r => setWaveformData(r.data.data)).catch(() => {});
      getSpectrogram(lastFile.id).then(r => setSpectrogramData(r.data.data)).catch(() => {});
    } catch (e) {
      console.error('Processing failed:', e);
      alert('Processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-title-md font-bold text-on-surface">DSP Controls</h3>
        <Button variant="ghost" size="sm" icon="tune" onClick={() => setAdvancedOpen(!advancedOpen)}>
          {advancedOpen ? 'Basic' : 'Advanced'}
        </Button>
      </div>

      <div className="space-y-6">
        <Slider
          label="Pitch Shift"
          min={-12} max={12} step={1}
          value={pitchShift}
          onChange={setPitchShift}
          formatValue={(v) => `${v > 0 ? '+' : ''}${v} st`}
        />

        <Slider
          label="Time Stretch"
          min={0.25} max={2.0} step={0.05}
          value={timeStretch}
          onChange={setTimeStretch}
          formatValue={(v) => `${v.toFixed(2)}x`}
        />

        {(pitchShift !== 0 && timeStretch !== 1.0) && (
          <p className="text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
            Both active — pitch shift applied first, then time stretch.
          </p>
        )}
      </div>

      {advancedOpen && (
        <div className="pt-4 border-t border-surface-container-high space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="FFT Size"
              value={fftSize}
              onChange={(e) => setFftSize(e.target.value)}
              options={[
                { value: '512', label: '512' },
                { value: '1024', label: '1024' },
                { value: '2048', label: '2048' },
                { value: '4096', label: '4096' },
              ]}
            />
            <Select
              label="Hop Size"
              value={hopSize}
              onChange={(e) => setHopSize(e.target.value)}
              options={[
                { value: '128', label: '128' },
                { value: '256', label: '256' },
                { value: '512', label: '512' },
                { value: '1024', label: '1024' },
              ]}
            />
          </div>

          <Select
            label="Window Function"
            value={windowType}
            onChange={(e) => setWindowType(e.target.value)}
            options={[
              { value: 'hann', label: 'Hann' },
              { value: 'hamming', label: 'Hamming' },
              { value: 'blackman', label: 'Blackman' },
              { value: 'rectangular', label: 'Rectangular' },
            ]}
          />

          <div className="pt-2">
            <Toggle
              checked={phaseLocking}
              onChange={setPhaseLocking}
              label="Phase Locking (Identity)"
            />
          </div>
        </div>
      )}

      <div className="mt-auto pt-6">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          icon="memory"
          loading={isProcessing}
          onClick={handleProcess}
          disabled={!selectedFile || (pitchShift === 0 && timeStretch === 1.0)}
        >
          Process Audio
        </Button>
      </div>
    </Card>
  );
}
