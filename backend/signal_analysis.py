"""
signal_analysis.py

Standalone signal-analysis functions, kept separate from the Fourier
filtering logic in fourier_filter.py:

- rms              : root-mean-square level
- peak_amplitude   : peak absolute amplitude
- dominant_frequency: strongest frequency component via FFT
"""

import numpy as np


def rms(signal):
    """
    Root-mean-square of a signal.

        RMS = sqrt( (1/N) * sum( x[n]^2 ) )
    """
    return float(np.sqrt(np.mean(signal ** 2)))

def peak_amplitude(signal):
    """
    Peak amplitude of a signal.

        Peak = max( |x[n]| )
    """
    return float(np.max(np.abs(signal)))

def dominant_frequency(signal, fs):
    """
    Determine the strongest frequency component using the FFT.

    Computes the one-sided magnitude spectrum, ignores the DC (0 Hz)
    bin, and returns the frequency (in Hz) with the largest magnitude.
    """
    from fourier_filter import compute_spectrum

    freqs, mag, _ = compute_spectrum(signal, fs)
    if len(freqs) <= 1:
        return 0.0

    # Ignore DC bin (index 0)
    mag_no_dc = mag[1:]
    freqs_no_dc = freqs[1:]
    peak_idx = np.argmax(mag_no_dc)
    return float(freqs_no_dc[peak_idx])

if __name__ == "__main__":
    from signal_io import generate_test_signal

    t, signal, fs, ch = generate_test_signal(freqs=(200, 1000, 2500))

    print("Signal analysis:")
    print(f"  RMS            = {rms(signal):.4f}")
    print(f"  Peak amplitude = {peak_amplitude(signal):.4f}")
    print(f"  Dominant freq  = {dominant_frequency(signal, fs):.1f} Hz")
