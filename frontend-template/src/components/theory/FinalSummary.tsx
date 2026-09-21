import React from 'react';

const UICard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className, title }) => (
  <div className={`bg-surface-container rounded-3xl shadow-card p-6 flex flex-col ${className || ''}`}>
    {title && <h3 className="text-title-md font-bold text-primary mb-4 pb-2 border-b border-outline-variant">{title}</h3>}
    <div className="flex-1">{children}</div>
  </div>
);

export default function FinalSummary() {
  return (
    <div className="flex flex-col gap-12 max-w-5xl mx-auto py-8">
      
      {/* Hero Statement */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-display font-bold text-primary mb-6">Everything Connects Here</h2>
        <p className="text-body-lg text-on-surface-variant leading-relaxed">
          This project is essentially an applied Signals & Systems laboratory: sampling theory explains how audio becomes discrete data, Fourier analysis reveals its frequency structure, STFT provides localized time-frequency analysis, phase processing enables time-scale modification, and resampling converts that time-scale modification into independent pitch control.
        </p>
      </div>

      {/* Animated Flow */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-card border border-outline-variant">
        <div className="flex flex-col items-center text-center space-y-4 font-mono font-bold text-sm">
          <div className="bg-primary text-on-primary px-6 py-2 rounded-full w-64">Signals & Systems</div>
          <div className="text-primary">↓</div>
          <div className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full w-64">Sampling Theory</div>
          <div className="text-primary">↓</div>
          <div className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full w-64">Fourier Analysis (DFT/FFT)</div>
          <div className="text-primary">↓</div>
          <div className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full w-64">STFT</div>
          <div className="text-primary">↓</div>
          <div className="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-full w-64">Magnitude + Phase Analysis</div>
          <div className="text-primary">↓</div>
          <div className="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-full w-64">Phase-Vocoder Processing</div>
          <div className="text-primary">↓</div>
          <div className="bg-surface-container-high text-on-surface px-6 py-2 rounded-full w-64 border border-outline">Time-Scale Modification</div>
          <div className="text-primary">↓</div>
          <div className="bg-surface-container-high text-on-surface px-6 py-2 rounded-full w-64 border border-outline">Resampling</div>
          <div className="text-primary">↓</div>
          <div className="bg-surface-container-high text-on-surface px-6 py-2 rounded-full w-64 border border-outline">Reconstruction (WOLA)</div>
          <div className="text-primary">↓</div>
          <div className="bg-primary text-on-primary px-6 py-2 rounded-full w-64 text-lg">Pitch-Shifted Audio</div>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UICard title="Core Mathematics" className="bg-surface-container-low">
          <ul className="space-y-3 text-body-sm text-on-surface">
            <li>• <strong>Fourier Transform:</strong> Frequency representation</li>
            <li>• <strong>DFT:</strong> Discrete version for computers</li>
            <li>• <strong>STFT:</strong> Windowed temporal-frequency views</li>
            <li>• <strong>Phase Calculus:</strong> Instantaneous frequency derivation</li>
            <li>• <strong>Convolution:</strong> LTI system processing (Reverb)</li>
          </ul>
        </UICard>

        <UICard title="Implementation" className="bg-surface-container-low">
          <ul className="space-y-3 text-body-sm text-on-surface font-mono text-xs">
            <li>• compute_fft()</li>
            <li>• compute_stft()</li>
            <li>• estimate_instantaneous_frequency()</li>
            <li>• time_stretch()</li>
            <li>• naive_resample()</li>
            <li>• pitch_shift()</li>
          </ul>
        </UICard>

        <UICard title="Audio Result" className="bg-surface-container-low">
          <ul className="space-y-3 text-body-sm text-on-surface">
            <li>• <strong>Frequency Analysis:</strong> Viewing the spectrum</li>
            <li>• <strong>Time Stretching:</strong> Changing duration independently</li>
            <li>• <strong>Pitch Shifting:</strong> Changing pitch independently</li>
            <li>• <strong>Effects Processing:</strong> Applying DSP filters</li>
          </ul>
        </UICard>
      </div>

      {/* Quote Card */}
      <div className="mt-8 bg-secondary-container text-on-secondary-container p-10 rounded-3xl text-center shadow-card border border-secondary">
        <p className="text-headline-lg font-medium italic">
          "Enter knowing almost nothing about phase vocoders. Leave understanding the complete signal processing pipeline from sample to pitch-shifted output."
        </p>
      </div>

    </div>
  );
}
