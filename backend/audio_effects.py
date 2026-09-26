"""
audio_effects.py

Additional CSE220 signal-processing operations that are NOT part of the
Fourier frequency-domain core, kept in their own module so the concepts
stay clearly separated:

- scale_amplitude   : y[n] = A * x[n]              (amplitude scaling)
- time_shift        : y[n] = x[n - n0]              (time shifting / delay)
- convolution_echo  : y[n] = x[n] * h[n]            (convolution)
"""

import subprocess
import tempfile
import os
from pathlib import Path

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


def _autotalent_template_effect(audio, fs):
    """Run the supplied PyAutoTune/Autotalent engine when its local wrapper exists."""
    executable = Path(__file__).with_name("autotalent_cli.exe")
    if not executable.is_file() or len(audio) < 4096:
        return None
    try:
        with tempfile.TemporaryDirectory(prefix="signal-scissors-autotune-") as directory:
            source = Path(directory) / "input.f32"
            output = Path(directory) / "output.f32"
            np.asarray(audio, dtype="<f4").tofile(source)
            completed = subprocess.run(
                [str(executable), str(source), str(output), str(int(fs))],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30,
                check=False,
            )
            if completed.returncode or not output.is_file():
                return None
            tuned = np.fromfile(output, dtype="<f4")
            if len(tuned) != len(audio) or not np.isfinite(tuned).all():
                return None
            # Autotalent reports a fixed circular-buffer latency of N - 1.
            # Compensate it before returning so the workstation's original and
            # processed waveforms remain time-aligned for comparison.
            latency = 4095 if fs >= 88200 else 2047
            if len(tuned) > latency:
                tuned = np.concatenate((tuned[latency:], np.zeros(latency, dtype=tuned.dtype)))
            peak = float(np.max(np.abs(tuned)))
            if peak > 1.0:
                tuned *= 0.96 / peak
            return tuned.astype(np.float32)
    except (OSError, subprocess.SubprocessError, ValueError):
        return None

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
    Hard, scale-locked vocal correction with formants preserved by PSOLA.

    Unlike the earlier melody generator, unvoiced or low-confidence frames are
    never forced to an arbitrary high note.  Pitch tracking is bounded to the
    human vocal range, cleaned in log-pitch space, and rate-limited before
    synthesis.  The result has the quick, deliberate snap associated with
    social-media Auto-Tune while avoiding brief octave jumps.
    """
    audio = np.asarray(signal, dtype=np.float64)
    if audio.ndim > 1:
        audio = audio[0]
    if len(audio) < 1024 or fs < 4000:
        return np.array(signal, copy=True)

    # The supplied Autotalent template is retained as an opt-in experiment.
    # Its real-time circular-buffer design can produce artefacts when driven
    # as an offline whole-file processor, so production defaults to the
    # voice-preserving PSOLA path below.
    if os.environ.get("SIGNAL_SCISSORS_USE_AUTOTALENT") == "1":
        template_output = _autotalent_template_effect(audio, fs)
        if template_output is not None:
            return template_output

    frame_length = min(2048, max(512, 1 << int(np.floor(np.log2(min(len(audio), 2048))))))
    hop_length = max(64, frame_length // 4)
    fmin, fmax = 75.0, min(420.0, float(fs) / 2.2)
    try:
        f0, voiced, voiced_probability = librosa.pyin(
            audio,
            frame_length=frame_length,
            hop_length=hop_length,
            sr=int(fs),
            fmin=fmin,
            fmax=fmax,
        )
    except Exception:
        return np.array(signal, copy=True)

    # Reject weak/unvoiced frames rather than converting them to a melody note.
    valid = (
        np.asarray(voiced, dtype=bool)
        & np.isfinite(f0)
        & (f0 >= fmin)
        & (f0 <= fmax)
        & (np.asarray(voiced_probability) >= 0.65)
    )
    if np.count_nonzero(valid) < 3:
        return np.array(signal, copy=True)

    frame_positions = np.arange(len(f0))
    # Interpolate *only* to give PSOLA a continuous contour through consonants;
    # endpoints are held, never replaced with an unrelated high target note.
    stable_f0 = np.interp(frame_positions, frame_positions[valid], f0[valid])
    stable_f0 = np.exp(scipy.signal.medfilt(np.log(stable_f0), kernel_size=5))
    snapped = np.array([closest_pitch_from_scale(freq, scale) for freq in stable_f0])
    snapped = np.clip(snapped, fmin, fmax)

    # A 2-semitone/frame slew limiter rejects octave errors that occasionally
    # escape pYIN, while retaining intentionally fast Auto-Tune transitions.
    max_ratio = 2.0 ** (2.0 / 12.0)
    target_pitch = snapped.copy()
    for index in range(1, len(target_pitch)):
        target_pitch[index] = np.clip(
            target_pitch[index], target_pitch[index - 1] / max_ratio,
            target_pitch[index - 1] * max_ratio,
        )
    target_pitch = scipy.signal.medfilt(target_pitch, kernel_size=3)

    try:
        psola_out = psola.vocode(audio, sample_rate=int(fs), target_pitch=target_pitch, fmin=fmin, fmax=fmax)
    except Exception:
        return np.array(signal, copy=True)

    psola_out = np.asarray(psola_out, dtype=np.float64)
    if len(psola_out) != len(audio):
        psola_out = np.interp(np.linspace(0, len(psola_out) - 1, len(audio)), np.arange(len(psola_out)), psola_out)
    # Preserve the actual vocal signal. A small dry blend restores consonants
    # and avoids the metallic artifacts caused by a synthetic carrier.
    final_output = 0.92 * psola_out + 0.08 * audio
    max_val = np.max(np.abs(final_output))
    if max_val > 0:
        final_output = 0.96 * final_output / max_val

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


def megaphone_voice_effect(signal, fs):
    """Lo-fi public-address speaker: narrow speech band plus soft saturation."""
    audio = np.asarray(signal, dtype=np.float64)
    if len(audio) < 16:
        return audio.astype(np.float32)
    high = min(3400.0, fs * 0.43)
    low = min(350.0, high * 0.45)
    sos = scipy.signal.butter(4, [low, high], btype="bandpass", fs=fs, output="sos")
    filtered = scipy.signal.sosfiltfilt(sos, audio)
    return (np.tanh(filtered * 3.0) * 0.92).astype(np.float32)


def underwater_voice_effect(signal, fs):
    """Muffled submerged sound: low-pass absorption with slow pressure wobble."""
    audio = np.asarray(signal, dtype=np.float64)
    if len(audio) < 16:
        return audio.astype(np.float32)
    cutoff = min(900.0, fs * 0.38)
    sos = scipy.signal.butter(5, cutoff, btype="lowpass", fs=fs, output="sos")
    muffled = scipy.signal.sosfiltfilt(sos, audio)
    wobble = 0.82 + 0.12 * np.sin(2 * np.pi * 0.55 * np.arange(len(audio)) / fs)
    return (muffled * wobble).astype(np.float32)

