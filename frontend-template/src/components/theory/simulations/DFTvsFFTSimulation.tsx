import { useState } from 'react'; // eslint-disable-line
import Card from '../../ui/Card'

export default function DFTvsFFTSimulation() {
  const [nString, setNString] = useState('2048');
  const N = parseInt(nString, 10);

  const dftOps = N * N;
  const fftOps = N * Math.log2(N);
  const speedup = (dftOps / fftOps).toFixed(1);

  // Use log scale for display to prevent FFT from disappearing entirely
  const maxOps = 4096 * 4096;
  const maxLog = Math.log10(maxOps);
  
  const dftHeight = (Math.log10(dftOps) / maxLog) * 100;
  const fftHeight = (Math.log10(fftOps) / maxLog) * 100;

  return (
    <Card className="p-4">
      <div className="mb-4">
        <label className="text-label-caps block mb-2">Select N (Frame Size):</label>
        <select 
          className="bg-surface-container p-2 rounded text-body-sm w-full outline-none"
          value={nString} 
          onChange={(e) => setNString(e.target.value)}
        >
          {[64, 128, 256, 512, 1024, 2048, 4096].map(val => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 h-48 mb-4 items-end">
        <div className="flex flex-col items-center justify-end h-full">
          <div 
            className="w-16 bg-primary-container rounded-t-lg transition-all duration-500 ease-out flex items-end justify-center pb-2"
            style={{ height: `${dftHeight}%`, minHeight: '20px' }}
          >
          </div>
          <div className="text-label-caps mt-2">DFT ≈ N²</div>
          <div className="text-xs">{dftOps.toLocaleString()} ops</div>
        </div>
        <div className="flex flex-col items-center justify-end h-full">
          <div 
            className="w-16 bg-primary rounded-t-lg transition-all duration-500 ease-out flex items-end justify-center pb-2"
            style={{ height: `${fftHeight}%`, minHeight: '10px' }}
          >
          </div>
          <div className="text-label-caps mt-2">FFT ≈ N log₂(N)</div>
          <div className="text-xs">{fftOps.toLocaleString()} ops</div>
        </div>
      </div>

      <div className="text-center text-body-lg font-bold text-primary mb-2">
        Speedup: {speedup}x faster
      </div>

      <div className="text-body-sm text-on-surface-variant italic">
        Note: The project uses numpy.fft.fft() (N=2048 by default) — an FFT algorithm, not the naive DFT.
      </div>
    </Card>
  );
}
