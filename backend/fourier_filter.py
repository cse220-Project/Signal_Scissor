import numpy as np

def compute_spectrum(signal, fs):
    """
    Compute the one-sided magnitude spectrum of a real signal using FFT.

    Correctly handles:
    - DC component (index 0): no doubling
    - Positive-frequency components: doubled to account for the mirrored
      negative-frequency energy
    - Nyquist component (last bin for even-length signals): no doubling
    - Both even and odd signal lengths

    Returns (frequencies, magnitude, full_fft_vals).
    """
    n = len(signal)

    # Full FFT (kept for callers that need it, e.g. filtering)
    fft_vals = np.fft.fft(signal)

    # One-sided FFT for display
    rfft_vals = np.fft.rfft(signal)
    freqs_pos = np.fft.rfftfreq(n, d=1/fs)

    magnitude = np.abs(rfft_vals) / n

    # Double the interior bins (positive freqs that have a mirror image)
    # DC (index 0) and Nyquist (last bin when n is even) stay at ×1
    magnitude[1:-1] *= 2
    if n % 2 != 0:
        # Odd length: the last bin is NOT a Nyquist bin, so double it too
        magnitude[-1] *= 2

    return freqs_pos, magnitude, fft_vals


def band_filter(signal, fs, low_freq, high_freq, mode="remove"):
    """
    Original algorithm — unchanged. Cut or keep a frequency band using FFT.

    mode="remove" -> zero out frequencies inside [low_freq, high_freq]
    mode="keep"   -> zero out everything OUTSIDE [low_freq, high_freq]
    """
    n = len(signal)
    fft_vals = np.fft.fft(signal)
    freqs = np.fft.fftfreq(n, d=1/fs)

    abs_freqs = np.abs(freqs)
    in_band = (abs_freqs >= low_freq) & (abs_freqs <= high_freq)

    filtered_fft = fft_vals.copy()
    if mode == "remove":
        filtered_fft[in_band] = 0
    elif mode == "keep":
        filtered_fft[~in_band] = 0
    else:
        raise ValueError("mode must be 'remove' or 'keep'")

    filtered_signal = np.fft.ifft(filtered_fft).real
    return filtered_signal


def process_band(signal, fs, low_freq, high_freq, operation="cut", strength=1.0):
    """
    NEW: Extended core algorithm (same Fourier -> modify -> inverse Fourier
    architecture as band_filter, generalized to 3 operations):

    operation="cut"        -> zero out the selected band completely
    operation="attenuate"  -> multiply selected band by `strength` in [0, 1]
                               e.g. strength=0.3 -> band kept at 30% magnitude
    operation="amplify"    -> multiply selected band by `strength` >= 1
                               e.g. strength=1.5 -> band boosted to 150%

    Everything outside [low_freq, high_freq] is left untouched in all cases.
    """
    n = len(signal)
    fft_vals = np.fft.fft(signal)
    freqs = np.fft.fftfreq(n, d=1/fs)

    abs_freqs = np.abs(freqs)
    in_band = (abs_freqs >= low_freq) & (abs_freqs <= high_freq)

    processed_fft = fft_vals.copy()

    if operation == "cut":
        processed_fft[in_band] = 0
    elif operation == "attenuate":
        processed_fft[in_band] = processed_fft[in_band] * strength
    elif operation == "amplify":
        processed_fft[in_band] = processed_fft[in_band] * strength
    else:
        raise ValueError("operation must be 'cut', 'attenuate', or 'amplify'")

    processed_signal = np.fft.ifft(processed_fft).real
    return processed_signal


def dominant_frequency(signal, fs):
    """
    NEW: Return the single strongest frequency component in the signal (Hz),
    ignoring the DC (0 Hz) bin.
    """
    freqs, mag, _ = compute_spectrum(signal, fs)
    if len(freqs) <= 1:
        return 0.0
    mag_no_dc = mag[1:]
    freqs_no_dc = freqs[1:]
    peak_idx = np.argmax(mag_no_dc)
    return float(freqs_no_dc[peak_idx])


if __name__ == "__main__":
    from signal_io import generate_test_signal

    t, signal, fs, ch = generate_test_signal(freqs=(200, 1000, 2500))
    freqs_pos, mag, _ = compute_spectrum(signal, fs)

    peak_idx = np.argsort(mag)[-6:][::-1]
    print("Top frequency peaks (Hz):", sorted(set(round(freqs_pos[i]) for i in peak_idx)))

    filtered = band_filter(signal, fs, low_freq=900, high_freq=1100, mode="remove")
    freqs_pos2, mag2, _ = compute_spectrum(filtered, fs)
    peak_idx2 = np.argsort(mag2)[-6:][::-1]
    print("Peaks after removing 900-1100 Hz:", sorted(set(round(freqs_pos2[i]) for i in peak_idx2)))