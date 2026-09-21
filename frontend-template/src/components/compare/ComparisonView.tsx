import { ComparisonResult } from '../../types';
import Card from '../ui/Card';
import NativeAudioPlayer from '../audio/NativeAudioPlayer';
import { getStreamUrl } from '../../api/client';
import DurationExplanation from './DurationExplanation';
import ComparisonSignalGraphs from './ComparisonSignalGraphs';

interface ComparisonViewProps {
  result: ComparisonResult;
}

import { useState } from 'react';

export default function ComparisonView({ result }: ComparisonViewProps) {
  const { metrics, pv_file, naive_file } = result;

  const pitchApplied = metrics.semitones !== 0;
  const stretchApplied = metrics.stretch_factor !== 1.0;

  const [pvProgressPct, setPvProgressPct] = useState(0);
  const [naiveProgressPct, setNaiveProgressPct] = useState(0);

  return (
    <div className="flex flex-col gap-5 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Phase Vocoder Output Card - Live Oscilloscope soft blue (#dce6f0) */}
        <div className="bg-[#dce6f0] rounded-[24px] p-5 md:p-6 flex flex-col gap-3 transition-all">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[14px] font-semibold text-ink-primary">Phase Vocoder Output</h3>
            <span className="text-[12px] font-medium text-ink-secondary">
              Phase Locked
            </span>
          </div>
          <NativeAudioPlayer
            url={getStreamUrl(pv_file.id)}
            className="bg-transparent !p-0"
            onPlaybackStateChange={(s) => setPvProgressPct(s.duration > 0 ? (s.currentTime / s.duration) * 100 : 0)}
          />
        </div>

        {/* Naive Resampling Output Card - Spectrum FFT soft lavender/gray (#e5e3e8) */}
        <div className="bg-[#e5e3e8] rounded-[24px] p-5 md:p-6 flex flex-col gap-3 transition-all">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[14px] font-semibold text-ink-primary">Naive Resampling</h3>
            <span className="text-[12px] font-medium text-ink-secondary">
              Time Domain
            </span>
          </div>
          <NativeAudioPlayer
            url={getStreamUrl(naive_file.id)}
            className="bg-transparent !p-0"
            onPlaybackStateChange={(s) => setNaiveProgressPct(s.duration > 0 ? (s.currentTime / s.duration) * 100 : 0)}
          />
        </div>
      </div>

      <DurationExplanation
        originalDuration={metrics.original.duration}
        semitones={metrics.semitones}
        pitchFactor={metrics.pitch_factor}
        stretchFactor={metrics.stretch_factor}
      />

      <Card variant="surface" className="flex flex-col gap-3">
        <h3 className="text-[15px] font-semibold text-ink-primary tracking-tight px-1">
          Metrics & Artifact Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-surface-raised text-[12px] text-ink-secondary">
                <th className="py-2.5 px-3 rounded-l-ios-md font-medium">Property</th>
                <th className="py-2.5 px-3 font-semibold text-ink-primary">Phase Vocoder</th>
                <th className="py-2.5 px-3 rounded-r-ios-md font-medium text-ink-secondary">Naive Resampling</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pitchApplied && (
                <tr className="border-b border-hairline">
                  <td className="py-3 px-3 text-ink-secondary">Pitch Shift</td>
                  <td className="py-3 px-3 text-ink-primary font-semibold">
                    {metrics.semitones > 0 ? '+' : ''}{metrics.semitones} st
                  </td>
                  <td className="py-3 px-3 text-ink-secondary">
                    {metrics.semitones > 0 ? '+' : ''}{metrics.semitones} st
                  </td>
                </tr>
              )}
              {stretchApplied && (
                <tr className="border-b border-hairline">
                  <td className="py-3 px-3 text-ink-secondary">Time Stretch</td>
                  <td className="py-3 px-3 text-ink-primary font-semibold">
                    {metrics.stretch_factor.toFixed(2)}x
                  </td>
                  <td className="py-3 px-3 text-ink-secondary">
                    {metrics.stretch_factor.toFixed(2)}x
                  </td>
                </tr>
              )}
              <tr className="border-b border-hairline">
                <td className="py-3 px-3 text-ink-secondary">Duration Behavior</td>
                <td className="py-3 px-3">
                  <span className="text-ink-primary font-semibold">{metrics.pv.duration.toFixed(2)}s</span>
                  <span className="text-[11px] text-ink-tertiary ml-1.5">(Preserves timing)</span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-ink-secondary">{metrics.naive.duration.toFixed(2)}s</span>
                  <span className="text-[11px] text-ink-tertiary ml-1.5">(Chipmunk effect)</span>
                </td>
              </tr>
              <tr className="border-b border-hairline">
                <td className="py-3 px-3 text-ink-secondary">DSP Mechanism</td>
                <td className="py-3 px-3 text-ink-primary">STFT Frame Synthesis + Phase Unwrapping</td>
                <td className="py-3 px-3 text-ink-secondary">Sinc Interpolation</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-ink-secondary">Vertical Phase Coherence</td>
                <td className="py-3 px-3 text-success font-medium">Locked (Transient crispness)</td>
                <td className="py-3 px-3 text-ink-tertiary">Unmanaged</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <ComparisonSignalGraphs 
        result={result} 
        pvProgressPct={pvProgressPct}
        naiveProgressPct={naiveProgressPct}
      />
    </div>
  );
}
