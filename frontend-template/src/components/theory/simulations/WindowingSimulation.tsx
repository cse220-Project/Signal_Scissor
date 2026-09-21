import { useState, useMemo } from 'react'; // eslint-disable-line
import Card from '../../ui/Card';
import SignalPlot from './SignalPlot';
import SpectrumPlot from './SpectrumPlot';

export default function WindowingSimulation() {
  const [windowType, setWindowType] = useState('Hann');
  const N = 64;

  const getWindow = (n: number, N: number, type: string) => {
    switch (type) {
      case 'Hann': return 0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1)));
      case 'Hamming': return 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1));
      case 'Blackman': return 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (N - 1));
      case 'Rectangular': default: return 1.0;
    }
  };

  const { windowData, windowedData, spectrumMags } = useMemo(() => {
    const raw = new Array(N);
    const win = new Array(N);
    const windowed = new Array(N);
    
    // Sine wave with fractional cycles to cause spectral leakage
    const freq = 5.5; 
    
    for (let n = 0; n < N; n++) {
      raw[n] = Math.sin(2 * Math.PI * freq * (n / N));
      win[n] = getWindow(n, N, windowType);
      windowed[n] = raw[n] * win[n];
    }

    // Naive DFT for spectrum
    const spec = new Array(N/2).fill(0);
    for (let k = 0; k < N/2; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const angle = 2 * Math.PI * k * n / N;
        re += windowed[n] * Math.cos(angle);
        im -= windowed[n] * Math.sin(angle);
      }
      spec[k] = Math.sqrt(re*re + im*im);
    }
    const maxSpec = Math.max(1, ...spec);
    return { rawData: raw, windowData: win, windowedData: windowed, spectrumMags: spec.map(v => v/maxSpec) };
  }, [windowType]);

  const freqs = Array.from({ length: N/2 }, (_, i) => i);

  const getWindowInfo = (type: string) => {
    switch (type) {
      case 'Hann': return 'Wider main lobe, much lower side lobes. Good general-purpose window.';
      case 'Hamming': return 'Optimized to cancel nearest side lobe. Good for close frequencies.';
      case 'Blackman': return 'Very wide main lobe, extremely low side lobes. Great for high dynamic range.';
      case 'Rectangular': default: return 'Narrowest main lobe, high side lobes (leakage). Bad for general audio.';
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4 text-body-sm text-on-surface-variant">
        Each STFT frame is finite. The hard cutoff of a finite window causes spectral leakage — energy spreads across neighboring bins. Windowing tapers the edges to reduce this.
      </div>

      <div className="mb-4">
        <label className="text-label-caps block mb-2">Window Function:</label>
        <select 
          className="bg-surface-container p-2 rounded text-body-sm w-full outline-none"
          value={windowType} 
          onChange={(e) => setWindowType(e.target.value)}
        >
          <option value="Rectangular">Rectangular</option>
          <option value="Hann">Hann</option>
          <option value="Hamming">Hamming</option>
          <option value="Blackman">Blackman</option>
        </select>
        <div className="text-xs mt-2 text-primary">{getWindowInfo(windowType)}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-label-caps text-center mb-1">Window Function</div>
          <SignalPlot data={windowData} height={100} color="#a7c4bc" />
        </div>
        <div>
          <div className="text-label-caps text-center mb-1">Windowed Signal</div>
          <SignalPlot data={windowedData} height={100} />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-label-caps text-center mb-1">Spectrum Magnitude (Notice Leakage)</div>
        <SpectrumPlot frequencies={freqs} magnitudes={spectrumMags} height={120} />
      </div>
    </Card>
  );
}
