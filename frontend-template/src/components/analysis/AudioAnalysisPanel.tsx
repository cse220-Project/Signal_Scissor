import { useAudioStore } from '../../store/useAudioStore';
import Card from '../ui/Card';

export default function AudioAnalysisPanel() {
  const { analysis, selectedFile } = useAudioStore();

  if (!selectedFile) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <p className="text-on-surface-variant text-center">Load a file to view analysis</p>
      </Card>
    );
  }

  const formatNumber = (num: number, unit = '') => {
    if (num >= 1000 && unit === 'Hz') return `${(num / 1000).toFixed(1)} kHz`;
    if (Number.isInteger(num)) return `${num}${unit ? ' ' + unit : ''}`;
    return `${num.toFixed(2)}${unit ? ' ' + unit : ''}`;
  };

  const metrics = analysis ? [
    { label: 'Duration', value: formatNumber(analysis.duration, 's') },
    { label: 'Sample Rate', value: formatNumber(analysis.sample_rate, 'Hz') },
    { label: 'Channels', value: analysis.channels === 1 ? 'Mono' : 'Stereo' },
    { label: 'File Size', value: formatNumber(selectedFile.file_size_bytes / 1024, 'KB') },
    { label: 'Peak Amp', value: formatNumber(analysis.peak_amplitude) },
    { label: 'RMS Level', value: formatNumber(analysis.rms) },
    { label: 'Zero Cross', value: formatNumber(analysis.zero_crossing_rate, '/s') },
    { label: 'Dom. Freq', value: formatNumber(analysis.dominant_frequency, 'Hz') },
    { label: 'Centroid', value: formatNumber(analysis.spectral_centroid, 'Hz') },
    { label: 'Bandwidth', value: formatNumber(analysis.spectral_bandwidth, 'Hz') },
    { label: 'Rolloff', value: formatNumber(analysis.spectral_rolloff, 'Hz') },
    { label: 'Nyquist', value: formatNumber(analysis.nyquist_frequency, 'Hz') },
  ] : [
    { label: 'Duration', value: formatNumber(selectedFile.duration_seconds, 's') },
    { label: 'Sample Rate', value: formatNumber(selectedFile.sample_rate, 'Hz') },
    { label: 'Channels', value: selectedFile.channels === 1 ? 'Mono' : 'Stereo' },
    { label: 'File Size', value: formatNumber(selectedFile.file_size_bytes / 1024, 'KB') },
  ];

  return (
    <Card className="h-full flex flex-col">
      <h3 className="text-title-md font-bold text-on-surface mb-4">File Properties</h3>
      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto">
        {metrics.map((m, i) => (
          <div key={i} className="bg-surface-container-low p-3 rounded-xl border border-surface-container flex flex-col">
            <span className="text-label-caps text-on-surface-variant mb-1">{m.label}</span>
            <span className="text-body-lg font-bold text-on-surface">{m.value}</span>
          </div>
        ))}
      </div>
      {!analysis && (
        <div className="mt-4 p-3 bg-primary-fixed/20 text-primary-container-on rounded-xl text-body-sm text-center">
          Run deep analysis for more metrics
        </div>
      )}
    </Card>
  );
}
