"""
audio_effects.py

Additional CSE220 signal-processing operations that are NOT part of the
Fourier frequency-domain core, kept in their own module so the concepts
stay clearly separated:

- scale_amplitude   : y[n] = A * x[n]              (amplitude scaling)
- time_shift        : y[n] = x[n - n0]              (time shifting / delay)
- convolution_echo  : y[n] = x[n] * h[n]            (convolution)
"""

import numpy as np


def scale_amplitude(signal, factor):
    """
    Amplitude scaling: y[n] = A * x[n]

    Returns the full floating-point result without clipping, so
    downstream processing (echo, further scaling, etc.) is not
    distorted.  Final clipping / normalization happens at the
    output boundary (save_wav / playback).
    """
    return signal * factor


def time_shift(signal, fs, delay_ms):
    """
    Time shifting / delay: y[n] = x[n - n0]
    Implemented as zero-padding at the start and trimming the same
    number of samples off the end, so output length == input length.
    """
    if delay_ms <= 0:
        return signal.copy()

    n0 = int(round((delay_ms / 1000.0) * fs))
    n0 = min(n0, len(signal))

    shifted = np.zeros_like(signal)
    if n0 < len(signal):
        shifted[n0:] = signal[:len(signal) - n0]
    return shifted


def get_echo_impulse_response(fs, delay_ms=250, decay=0.5, num_echoes=3):
    """
    Construct the discrete impulse response h[n] for the echo system:
    y[n] = x[n] * h[n]

    h[0] = 1.0 (direct signal)
    h[k * n0] = decay^k for k = 1..num_echoes (decaying echoes spaced delay_ms apart)

    Returns (t_h, h) where t_h is the time vector in seconds.
    """
    n0 = int(round((delay_ms / 1000.0) * fs))
    if n0 <= 0:
        return np.array([0.0]), np.array([1.0])

    h_length = n0 * num_echoes + 1
    h = np.zeros(h_length)
    h[0] = 1.0
    for k in range(1, num_echoes + 1):
        idx = n0 * k
        if idx < h_length:
            h[idx] = decay ** k

    t_h = np.arange(len(h)) / fs
    return t_h, h


def convolution_echo(signal, fs, delay_ms=250, decay=0.5, num_echoes=3):
    """
    Convolution-based echo effect: y[n] = x[n] * h[n]

    h[n] is built explicitly as decaying impulses spaced delay_ms apart.
    np.convolve computes the full direct convolution sum y[n] = sum_k x[k] * h[n-k].
    Output length is len(signal) + len(h) - 1, preserving the decaying echo tail.
    """
    t_h, h = get_echo_impulse_response(fs, delay_ms=delay_ms, decay=decay, num_echoes=num_echoes)

    y = np.convolve(signal, h, mode="full")

    max_val = np.max(np.abs(y))
    if max_val > 1.0:
        y = y / max_val

    return y


if __name__ == "__main__":
    from signal_io import generate_test_signal

    t, signal, fs, ch = generate_test_signal()

    scaled_up = scale_amplitude(signal, 1.5)
    scaled_down = scale_amplitude(signal, 0.5)
    print("Amplitude scaling:")
    print("  original max:", np.max(np.abs(signal)))
    print("  1.5x max:", np.max(np.abs(scaled_up)))
    print("  0.5x max:", np.max(np.abs(scaled_down)))

    shifted = time_shift(signal, fs, delay_ms=100)
    n0_expected = int(0.1 * fs)
    print("\nTime shift:")
    print("  first", n0_expected, "samples should be ~0:",
          np.allclose(shifted[:n0_expected], 0))
    print("  shifted[n0] should equal signal[0]:",
          np.isclose(shifted[n0_expected], signal[0]))

    echoed = convolution_echo(signal, fs, delay_ms=250, decay=0.5, num_echoes=3)
    print("\nConvolution echo:")
    print("  full output length preserved (len > input):", len(echoed) > len(signal))
    print("  max amplitude within [-1, 1]:", np.max(np.abs(echoed)) <= 1.0)