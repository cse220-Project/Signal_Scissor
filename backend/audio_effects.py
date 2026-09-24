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


def get_echo_impulse_response(fs, delay_ms=250, decay=0.55, num_echoes=3, wet_mix=0.7):
    """
    Construct the discrete impulse response h[n] for the acoustic echo system:
    y[n] = x[n] * h[n]

    h[0] = 1.0 (direct signal arrival)
    h[k * n0] = wet_mix * (decay ^ k) for k = 1..num_echoes (decaying reflections spaced delay_ms apart)

    Returns (t_h, h) where t_h is the time vector in seconds.
    """
    n0 = int(round((delay_ms / 1000.0) * fs))
    if n0 <= 0:
        return np.array([0.0], dtype=np.float32), np.array([1.0], dtype=np.float32)

    h_length = n0 * num_echoes + 1
    h = np.zeros(h_length, dtype=np.float32)
    h[0] = 1.0
    for k in range(1, num_echoes + 1):
        idx = n0 * k
        if idx < h_length:
            h[idx] = float(wet_mix * (decay ** k))

    t_h = np.arange(len(h)) / fs
    return t_h, h


def convolution_echo(signal, fs, delay_ms=250, decay=0.55, num_echoes=3, wet_mix=0.7):
    """
    Convolution-based echo effect: y[n] = x[n] * h[n]

    h[n] is built explicitly as decaying impulses spaced delay_ms apart.
    np.convolve computes the full direct convolution sum:
        y[n] = sum_k x[k] * h[n - k]
    Output length is len(signal) + len(h) - 1, preserving the decaying reverberant tail.
    """
    t_h, h = get_echo_impulse_response(fs, delay_ms=delay_ms, decay=decay, num_echoes=num_echoes, wet_mix=wet_mix)

    y = np.convolve(signal, h, mode="full").astype(np.float32)

    # Soft-clip with tanh instead of hard normalization.
    # Hard normalization (y / max_val) squashes the entire signal,
    # making echo reflections invisible in the waveform.
    # tanh preserves the echo structure while keeping the output bounded.
    max_val = float(np.max(np.abs(y)))
    if max_val > 1.0:
        y = np.tanh(y).astype(np.float32)

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


import scipy.signal

def pitch_shift(signal, fs, semitones):
    """
    Pitch shift an audio signal by N semitones while preserving duration.
    Uses STFT phase vocoder resampling with magnitude and phase separation.
    """
    if abs(semitones) < 0.01 or len(signal) == 0:
        return np.array(signal, copy=True)

    factor = 2.0 ** (semitones / 12.0)
    num_samples = len(signal)
    target_samples = int(round(num_samples / factor))
    if target_samples <= 0:
        return np.array(signal, copy=True)

    resampled = scipy.signal.resample(signal, target_samples)

    n_fft = 512
    hop = 128
    _, _, stft = scipy.signal.stft(resampled, fs=fs, nperseg=n_fft, noverlap=n_fft - hop)

    mag = np.abs(stft)
    phase = np.angle(stft)

    num_frames_target = max(1, (num_samples - n_fft) // hop + 1)
    orig_frames = np.arange(stft.shape[1])
    target_frames = np.linspace(0, max(0, stft.shape[1] - 1), num_frames_target)

    new_mag = np.zeros((stft.shape[0], num_frames_target), dtype=np.float64)
    new_phase = np.zeros((stft.shape[0], num_frames_target), dtype=np.float64)

    for ch in range(stft.shape[0]):
        new_mag[ch, :] = np.interp(target_frames, orig_frames, mag[ch, :])
        new_phase[ch, :] = np.interp(target_frames, orig_frames, phase[ch, :])

    stft_new = new_mag * np.exp(1j * new_phase)
    _, shifted = scipy.signal.istft(stft_new, fs=fs, nperseg=n_fft, noverlap=n_fft - hop)

    if len(shifted) > num_samples:
        shifted = shifted[:num_samples]
    elif len(shifted) < num_samples:
        shifted = np.pad(shifted, (0, num_samples - len(shifted)))

    max_val = np.max(np.abs(shifted))
    if max_val > 0:
        shifted = shifted / max_val

    return shifted.astype(np.float32)


import librosa
import psola

SEMITONES_IN_OCTAVE = 12

def degrees_from(scale: str):
    degrees = librosa.key_to_degrees(scale)
    degrees = np.concatenate((degrees, [degrees[0] + SEMITONES_IN_OCTAVE]))
    return degrees

def closest_pitch_from_scale(f0, scale="C:maj"):
    if np.isnan(f0) or f0 <= 0:
        return np.nan
    degrees = degrees_from(scale)
    midi_note = librosa.hz_to_midi(f0)
    degree = midi_note % SEMITONES_IN_OCTAVE
    degree_id = np.argmin(np.abs(degrees - degree))
    degree_difference = degree - degrees[degree_id]
    midi_note -= degree_difference
    return librosa.midi_to_hz(midi_note)

def aclosest_pitch_from_scale(f0, scale="C:maj"):
    sanitized_pitch = np.zeros_like(f0)
    for i in range(f0.shape[0]):
        sanitized_pitch[i] = closest_pitch_from_scale(f0[i], scale)
    smoothed = scipy.signal.medfilt(sanitized_pitch, kernel_size=11)
    nan_mask = np.isnan(smoothed)
    smoothed[nan_mask] = sanitized_pitch[nan_mask]
    return smoothed

def autotune_voice_effect(signal, fs, scale="C:maj"):
    """
    Instagram / TikTok Auto-Tune "Sing" Vocoder Engine:
    Forces every word of spoken speech into a catchy musical song melody (C4-E4-G4-A4-C5).
    Re-synthesizes speech with hard pitch quantization via PSOLA & Formant Vocoder.
    """
    audio = np.asarray(signal, dtype=np.float64)
    if audio.ndim > 1:
        audio = audio[0]
    if len(audio) == 0:
        return np.array(signal, copy=True)

    # 1. Generate active song melody pitch contour f_target(t)
    melody_notes = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 523.25, 440.00]
    note_dur = 0.30  # seconds per musical note in the melody

    frame_length = 1024
    hop_length = 256
    fmin = librosa.note_to_hz('C2')
    fmax = librosa.note_to_hz('C7')

    # Track vocal pitch
    try:
        f0, _, _ = librosa.pyin(
            audio,
            frame_length=frame_length,
            hop_length=hop_length,
            sr=int(fs),
            fmin=fmin,
            fmax=fmax
        )
    except Exception:
        f0 = np.full((len(audio) // hop_length + 1,), np.nan)

    # Convert detected pitch to closest scale notes
    target_pitch = np.zeros_like(f0)
    t_frames = np.arange(len(f0)) * (hop_length / float(fs))

    for k in range(len(f0)):
        mel_freq = melody_notes[int(t_frames[k] / note_dur) % len(melody_notes)]
        if np.isnan(f0[k]) or f0[k] <= 0:
            target_pitch[k] = mel_freq
        else:
            snapped = closest_pitch_from_scale(f0[k], scale)
            target_pitch[k] = snapped if not np.isnan(snapped) else mel_freq

    # Smooth pitch contours with median filter
    target_pitch = scipy.signal.medfilt(target_pitch, kernel_size=7)

    # 2. Re-synthesize pitch with PSOLA
    try:
        psola_out = psola.vocode(audio, sample_rate=int(fs), target_pitch=target_pitch, fmin=fmin, fmax=fmax)
    except Exception:
        psola_out = audio

    # 3. Formant Vocoding for intense T-Pain / Instagram Sing Vocoder Effect
    t = np.arange(len(audio)) / float(fs)
    carrier = np.zeros_like(t)
    phase_acc = 0.0
    for i in range(len(t)):
        k_idx = min(int(i / hop_length), len(target_pitch) - 1)
        freq = target_pitch[k_idx] if target_pitch[k_idx] > 0 else 261.63
        phase_acc += 2.0 * np.pi * freq / fs
        carrier[i] = (
            1.00 * np.sin(phase_acc) +
            0.60 * np.sin(2 * phase_acc) +
            0.30 * np.sin(3 * phase_acc) +
            0.15 * np.sin(4 * phase_acc)
        )

    # STFT Formant envelope modulation
    n_fft = 512
    hop = 128
    n_frames = (len(audio) - n_fft) // hop + 1
    vocoded_out = np.zeros_like(audio)
    window = np.hanning(n_fft)

    for i in range(n_frames):
        start = i * hop
        speech_frame = audio[start : start + n_fft] * window
        carrier_frame = carrier[start : start + n_fft] * window

        speech_mag = np.abs(np.fft.rfft(speech_frame))
        env = scipy.signal.medfilt(speech_mag, kernel_size=11)

        carrier_fft = np.fft.rfft(carrier_frame)
        carrier_phase = np.angle(carrier_fft)

        vocoded_fft = env * np.exp(1j * carrier_phase)
        vocoded_out[start : start + n_fft] += np.fft.irfft(vocoded_fft) * window

    # Mix 40% PSOLA + 45% Formant Vocoder + 15% original vocal crispness
    final_output = 0.40 * psola_out + 0.45 * vocoded_out + 0.15 * audio
    max_val = np.max(np.abs(final_output))
    if max_val > 0:
        final_output = final_output / max_val

    return final_output.astype(np.float32)





def robotic_voice_effect(signal, fs, mod_freq=150.0):
    """
    Robotic Metallic Voice Effect (Ring Modulation + Comb Chamber).
    """
    t = np.arange(len(signal)) / float(fs)
    carrier = np.sin(2 * np.pi * mod_freq * t)
    ring_mod = signal * carrier

    delay_samples = int(round(fs * 0.012))
    comb = np.zeros_like(signal)
    for i in range(len(signal)):
        if i >= delay_samples:
            comb[i] = ring_mod[i] + 0.6 * comb[i - delay_samples]
        else:
            comb[i] = ring_mod[i]

    out = 0.4 * signal + 0.6 * comb
    max_v = np.max(np.abs(out))
    if max_v > 0:
        out = out / max_v
    return out.astype(np.float32)


def baby_voice_effect(signal, fs):
    """
    Baby / Chipmunk Voice Effect (High pitch + formant shift).
    """
    return pitch_shift(signal, fs, semitones=7.0)


def monster_voice_effect(signal, fs):
    """
    Monster / Deep Villain Voice Effect (Low pitch + sub-bass boost).
    """
    return pitch_shift(signal, fs, semitones=-7.0)
