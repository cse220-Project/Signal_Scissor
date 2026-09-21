import numpy as np
from scipy.io import wavfile


def generate_test_signal(duration=2.0, fs=8000, freqs=(200, 1000, 2500)):
    t = np.linspace(0, duration, int(fs * duration), endpoint=False)
    signal = sum(np.sin(2 * np.pi * f * t) for f in freqs)
    signal += 0.3 * np.random.randn(len(t))
    signal = signal / np.max(np.abs(signal))
    num_channels = 1  # synthetic test signal is always mono
    return t, signal.astype(np.float32), fs, num_channels


def generate_pulse_signal(duration=2.0, fs=8000, freq=440.0):
    """
    Generate an acoustic pulse burst followed by silence.
    Ideal for demonstrating convolution echo and time-delay effects in lab evaluations.
    """
    t = np.linspace(0, duration, int(fs * duration), endpoint=False)
    sig = np.zeros_like(t)

    # 180 ms windowed sinusoidal pulse burst starting at t = 0.08s
    pulse_len = int(0.18 * fs)
    t_pulse = np.linspace(0, 0.18, pulse_len, endpoint=False)
    window = 0.5 * (1 - np.cos(2 * np.pi * t_pulse / 0.18))
    pulse = np.sin(2 * np.pi * freq * t_pulse) * window

    start_idx = int(0.08 * fs)
    sig[start_idx:start_idx + pulse_len] = pulse
    sig += 0.005 * np.random.randn(len(t))
    sig = (sig / np.max(np.abs(sig))).astype(np.float32)
    return t, sig, fs, 1


def load_wav(path):
    """
    Load a real .wav file. Converts to mono float32 in range [-1, 1] based on
    sample data type (int16 -> /32768, int32 -> /2147483648, float -> clip),
    preserving the authentic relative amplitude of the original recording.
    """
    fs, raw_data = wavfile.read(path)

    if raw_data.ndim > 1:
        num_channels = raw_data.shape[1]
        data = raw_data.mean(axis=1)
    else:
        num_channels = 1
        data = raw_data

    dtype = data.dtype
    if np.issubdtype(dtype, np.integer):
        if dtype == np.int16:
            data = data.astype(np.float32) / 32768.0
        elif dtype == np.int32:
            data = data.astype(np.float32) / 2147483648.0
        elif dtype == np.uint8:
            data = (data.astype(np.float32) - 128.0) / 128.0
        else:
            info = np.iinfo(dtype)
            data = data.astype(np.float32) / max(abs(info.min), info.max)
    elif np.issubdtype(dtype, np.floating):
        data = np.clip(data.astype(np.float32), -1.0, 1.0)
    else:
        data = data.astype(np.float32)

    t = np.arange(len(data)) / fs
    return t, data, fs, num_channels


def save_wav(path, signal, fs):
    data = np.clip(signal, -1, 1)
    data = (data * 32767).astype(np.int16)
    wavfile.write(path, fs, data)