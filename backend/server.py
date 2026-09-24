"""
server.py - High-Performance FastAPI Backend for Signal Scissors
Wraps authentic CSE 220 signal processing algorithms:
- fourier_filter.py
- audio_effects.py
- signal_analysis.py
- signal_io.py
"""

import io
import logging
import os
import shutil
import subprocess
import tempfile
import numpy as np
import scipy.signal
from scipy.io import wavfile
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException  # type: ignore
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
# pyrefly: ignore [missing-import]
from fastapi.responses import Response, FileResponse, JSONResponse  # type: ignore
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles  # type: ignore
# pyrefly: ignore [missing-import]
from pydantic import BaseModel  # type: ignore
from typing import Optional

from signal_io import generate_test_signal, generate_pulse_signal, load_wav, save_wav
from fourier_filter import compute_spectrum, band_filter, process_band
from audio_effects import (
    scale_amplitude,
    time_shift,
    convolution_echo,
    get_echo_impulse_response,
    autotune_voice_effect,
    robotic_voice_effect,
    baby_voice_effect,
    monster_voice_effect,
)
from signal_analysis import rms, peak_amplitude, dominant_frequency
from noise_routes import router as noise_router, NoiseUploadLimit

app = FastAPI(title="Signal Scissors DSP Engine", version="2.0.0")
logger = logging.getLogger(__name__)
app.include_router(noise_router)
app.add_middleware(NoiseUploadLimit)

MAX_AUDIO_UPLOAD_BYTES = 60 * 1024 * 1024

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# In-Memory Signal State
# -----------------------------------------------------------------------------
class SignalState:
    def __init__(self):
        self.t = None
        self.signal = None          # Original float32 in [-1, 1]
        self.freq_processed = None   # After band filter
        self.processed = None        # Final processed signal
        self.fs = 8000
        self.num_channels = 1
        self.source_name = "Demo Multi-Tone Signal"
        self.last_band = None
        self.last_operation = None

state = SignalState()


def frequency_shift_channel(data, sample_rate, shift_hz):
    """
    Real-audio frequency translation via FFT analytic signal (Hilbert-like transform).
    Preserved exactly as implemented in gui.py.
    """
    data = np.asarray(data, dtype=float)
    count = data.size
    if count == 0 or abs(shift_hz) < 1e-9:
        return np.array(data, copy=True)
    spectrum = np.fft.fft(data)
    mask = np.zeros(count)
    if count % 2 == 0:
        mask[0] = mask[count // 2] = 1.0
        mask[1 : count // 2] = 2.0
    else:
        mask[0] = 1.0
        mask[1 : (count + 1) // 2] = 2.0
    analytic = np.fft.ifft(spectrum * mask)
    time_axis = np.arange(count) / float(sample_rate)
    return np.real(analytic * np.exp(2j * np.pi * shift_hz * time_axis))


def frequency_shift(data, fs, shift_hz):
    data = np.asarray(data)
    if data.ndim == 1:
        return frequency_shift_channel(data, fs, shift_hz)
    if data.ndim == 2:
        return np.column_stack([frequency_shift_channel(data[:, ch], fs, shift_hz) for ch in range(data.shape[1])])
    raise ValueError("Audio data must be 1D or 2D array.")


def downsample_envelope(signal, max_points=1200, target_length=None):
    """
    Downsamples a 1D signal into min/max peak envelope pairs for ultra-fast,
    aliasing-free 60 FPS Canvas rendering. When target_length is provided,
    normalizes the time axis so multiple signals of different lengths (e.g. original vs echoed)
    align to the exact same temporal grid.
    """
    n = len(signal)
    if target_length is None:
        target_length = n

    total_buckets = int(max_points / 2)
    bucket_size = target_length / total_buckets
    peaks = []

    for i in range(total_buckets):
        start = int(i * bucket_size)
        end = int(min((i + 1) * bucket_size, target_length))
        if start >= n:
            # Signal has ended (e.g. original signal shorter than echo tail)
            peaks.append(0.0)
            peaks.append(0.0)
            continue

        chunk_end = min(end, n)
        if start >= chunk_end:
            peaks.append(0.0)
            peaks.append(0.0)
            continue

        chunk = signal[start:chunk_end]
        peaks.append(float(np.min(chunk)))
        peaks.append(float(np.max(chunk)))

    return {
        "peaks": peaks,
        "min_val": float(np.min(signal)) if n > 0 else 0.0,
        "max_val": float(np.max(signal)) if n > 0 else 0.0,
        "count": len(peaks)
    }


def waveform_preview(signal, fs, dominant_freq):
    """Return a short, cycle-aware waveform for a readable time-domain plot.

    A full-length envelope is useful for navigation, but a long pure tone makes
    every screen pixel contain both its minimum and maximum.  This preview
    keeps roughly four cycles (with enough discrete samples at high
    frequencies), so a sine wave remains recognisable regardless of recording
    duration.
    """
    signal = np.asarray(signal)
    if len(signal) == 0:
        return {"peaks": [], "min_val": 0.0, "max_val": 0.0, "count": 0,
                "duration": 0.0, "start_time": 0.0}

    # Fall back to a 50 ms look when no meaningful tonal peak is available.
    if not np.isfinite(dominant_freq) or dominant_freq <= 0:
        preview_samples = int(round(fs * 0.05))
    else:
        preview_samples = int(np.ceil(4 * fs / dominant_freq))

    # At high frequencies four cycles can contain very few samples.  Showing
    # at least 32 samples gives the user a legible discrete-time trace.
    preview_samples = min(len(signal), max(32, preview_samples))
    # Avoid presenting a blank chart for a delayed signal or pulse.  The
    # preview begins at the first sample that is materially above silence.
    peak = float(np.max(np.abs(signal)))
    active = np.flatnonzero(np.abs(signal) >= peak * 0.05) if peak > 0 else np.array([], dtype=int)
    start = int(active[0]) if len(active) else 0
    preview = signal[start:start + preview_samples]
    return {
        **downsample_envelope(preview, max_points=max(2, 2 * len(preview))),
        "duration": float(len(preview) / fs),
        "start_time": float(start / fs),
    }


def compute_spectrogram_payload(signal, fs, max_time_bins=100, max_freq_bins=64):
    """Computes STFT Spectrogram downsampled grid for responsive visualization."""
    if signal is None or len(signal) < 128:
        return {"times": [], "freqs": [], "mag_db": []}

    nperseg = min(256, len(signal))
    noverlap = nperseg // 2
    f, t, Sxx = scipy.signal.spectrogram(signal, fs, nperseg=nperseg, noverlap=noverlap)

    mag_db = 20 * np.log10(np.maximum(np.abs(Sxx), 1e-6))

    if len(t) > max_time_bins:
        step_t = max(1, len(t) // max_time_bins)
        t = t[::step_t]
        mag_db = mag_db[:, ::step_t]

    if len(f) > max_freq_bins:
        step_f = max(1, len(f) // max_freq_bins)
        f = f[::step_f]
        mag_db = mag_db[::step_f, :]

    return {
        "times": t.tolist(),
        "freqs": f.tolist(),
        "mag_db": mag_db.tolist()
    }


def compute_spectrum_payload(signal, fs, max_points=1000):
    """
    Computes magnitude spectrum (dB) and decimates for 60 FPS graph rendering.
    """
    freqs, mag, _ = compute_spectrum(signal, fs)
    # Convert magnitude to dB
    mag_db = 20 * np.log10(np.maximum(mag, 1e-9))
    
    n = len(freqs)
    if n > max_points:
        # Never stride through an FFT spectrum: a narrow pure-tone peak can
        # fall between stride positions and disappear completely.  Instead,
        # retain the strongest bin in each display bucket (max-hold).
        edges = np.linspace(0, n, max_points + 1, dtype=int)
        selected = []
        for start, end in zip(edges[:-1], edges[1:]):
            if end <= start:
                continue
            selected.append(start + int(np.argmax(mag_db[start:end])))
        freqs = freqs[selected]
        mag_db = mag_db[selected]
    
    return {
        "freqs": freqs.tolist(),
        "mag_db": mag_db.tolist(),
        "nyquist": float(fs / 2.0)
    }


def get_signal_stats(signal, fs, num_channels=1):
    return {
        "sample_rate": int(fs),
        "duration": float(len(signal) / fs),
        "samples": int(len(signal)),
        "channels": int(num_channels),
        "rms": float(rms(signal)),
        "peak": float(peak_amplitude(signal)),
        "dominant_freq": float(dominant_frequency(signal, fs)),
    }


def signal_to_wav_bytes(signal, fs):
    clipped = np.clip(signal, -1.0, 1.0)
    int_data = (clipped * 32767).astype(np.int16)
    bio = io.BytesIO()
    wavfile.write(bio, fs, int_data)
    return bio.getvalue()


def get_full_state_payload():
    """Helper to assemble full waveform, spectrum, spectrogram, and metadata."""
    if state.signal is None:
        return {"loaded": False}

    orig_len = len(state.signal)
    proc_len = len(state.processed) if state.processed is not None else orig_len
    max_len = max(orig_len, proc_len)
    max_duration = float(max_len / state.fs)

    orig_env = downsample_envelope(state.signal, max_points=1200, target_length=max_len)
    proc_env = downsample_envelope(state.processed if state.processed is not None else state.signal, max_points=1200, target_length=max_len)

    original_stats = get_signal_stats(state.signal, state.fs, state.num_channels)
    processed_signal = state.processed if state.processed is not None else state.signal
    stats = get_signal_stats(processed_signal, state.fs, state.num_channels)
    # Keep the overview payload for navigation and attach a cycle-scaled trace
    # for the graph itself.
    orig_env["preview"] = waveform_preview(state.signal, state.fs, original_stats["dominant_freq"])
    proc_env["preview"] = waveform_preview(processed_signal, state.fs, stats["dominant_freq"])

    orig_spec = compute_spectrum_payload(state.signal, state.fs)
    proc_spec = compute_spectrum_payload(state.processed, state.fs) if state.processed is not None else orig_spec

    orig_sg = compute_spectrogram_payload(state.signal, state.fs)
    proc_sg = compute_spectrogram_payload(state.processed, state.fs) if state.processed is not None else orig_sg

    return {
        "loaded": True,
        "source_name": state.source_name,
        "sample_rate": state.fs,
        "duration": max_duration,
        "original_duration": float(orig_len / state.fs),
        "processed_duration": float(proc_len / state.fs),
        "num_channels": state.num_channels,
        "samples": orig_len,
        "processed_samples": proc_len,
        "original_waveform": orig_env,
        "processed_waveform": proc_env,
        "original_spectrum": orig_spec,
        "processed_spectrum": proc_spec,
        "original_spectrogram": orig_sg,
        "processed_spectrogram": proc_sg,
        "stats": stats,
        "original_stats": original_stats,
        "last_band": state.last_band,
        "last_operation": state.last_operation
    }


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Signal Scissors DSP API"}


@app.get("/api/signal/state")
def current_signal_state():
    """Read the current session without generating or processing audio."""
    return get_full_state_payload()


@app.get("/api/signal/test")
def load_test(preset: str = "tones"):
    """
    Generate synthetic test signal using signal_io.generate_test_signal or generate_pulse_signal.
    Supports preset frequencies for course lab demonstrations.
    """
    if preset == "pulse":
        t, sig, fs, ch = generate_pulse_signal(duration=2.0, fs=8000, freq=440.0)
        state.t, state.signal, state.fs, state.num_channels = t, sig, fs, ch
        state.source_name = "Acoustic Pulse Burst (Echo Demo)"
    elif preset == "noise":
        t = np.linspace(0, 2.0, int(8000 * 2.0), endpoint=False)
        sig = 0.5 * np.sin(2 * np.pi * 300 * t) + 0.5 * np.random.randn(len(t))
        sig = sig / np.max(np.abs(sig))
        state.t, state.signal, state.fs, state.num_channels = t, sig, 8000, 1
        state.source_name = "Tone (300 Hz) + White Noise"
    elif preset == "multitone":
        t, sig, fs, ch = generate_test_signal(duration=2.0, fs=8000, freqs=(150, 440, 1200, 3200))
        state.t, state.signal, state.fs, state.num_channels = t, sig, fs, ch
        state.source_name = "Multi-Tone (150, 440, 1200, 3200 Hz)"
    else:
        # Standard CSE220 test signal: 200, 1000, 2500 Hz
        t, sig, fs, ch = generate_test_signal(duration=2.0, fs=8000, freqs=(200, 1000, 2500))
        state.t, state.signal, state.fs, state.num_channels = t, sig, fs, ch
        state.source_name = "Standard Test Signal (200, 1000, 2500 Hz)"

    state.freq_processed = np.array(state.signal, copy=True)
    state.processed = np.array(state.signal, copy=True)
    state.last_band = None
    state.last_operation = None

    return get_full_state_payload()


@app.post("/api/signal/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Load an audio file up to 60 MB, using FFmpeg for format decoding."""
    source_path = None
    decoded_path = None
    stage = "reading uploaded file"
    try:
        suffix = os.path.splitext(file.filename or "")[1] or ".audio"
        stage = "storing uploaded file"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            source_path = tmp.name
            size = 0
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_AUDIO_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Audio files must be 60 MB or smaller.")
                tmp.write(chunk)
        if size == 0:
            raise HTTPException(status_code=400, detail="Choose a non-empty audio file.")

        stage = "decoding audio"
        try:
            if suffix.lower() == ".wav":
                t, data, fs, num_channels = load_wav(source_path)
            else:
                ffmpeg = shutil.which("ffmpeg")
                if not ffmpeg:
                    raise HTTPException(status_code=503, detail="Audio decoding is unavailable because FFmpeg is not installed.")
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                    decoded_path = tmp.name
                subprocess.run(
                    [ffmpeg, "-nostdin", "-v", "error", "-y", "-i", source_path,
                     "-map", "0:a:0", "-vn", "-acodec", "pcm_s16le", decoded_path],
                    check=True, capture_output=True, timeout=60,
                )
                t, data, fs, num_channels = load_wav(decoded_path)
        except (ValueError, EOFError, OSError, subprocess.SubprocessError) as exc:
            logger.warning("Audio upload rejected during decoding", exc_info=True)
            raise HTTPException(status_code=400, detail="Could not decode this audio file. Choose a valid audio file and try again.") from exc
        if fs <= 0 or data.size == 0 or not np.all(np.isfinite(data)):
            raise HTTPException(status_code=400, detail="The audio file must contain valid samples and a positive sample rate.")

        stage = "calculating waveform and metadata"
        state.t = t
        state.signal = data
        state.freq_processed = np.array(data, copy=True)
        state.processed = np.array(data, copy=True)
        state.fs = fs
        state.num_channels = num_channels
        state.source_name = file.filename
        state.last_band = None
        state.last_operation = None
        payload = get_full_state_payload()
        stage = "serializing upload response"
        return JSONResponse(content=payload)
    except HTTPException:
        raise
    except Exception as exc:
        # Keep internal paths and exception details in server logs, not responses.
        logger.exception("Audio upload failed while %s", stage)
        raise HTTPException(status_code=500, detail=f"Could not load the audio file while {stage}. Check the backend logs for details.") from exc
    finally:
        for path in (source_path, decoded_path):
            if path is None:
                continue
            try:
                os.remove(path)
            except OSError:
                logger.warning("Could not remove audio upload temporary file", exc_info=True)


class FilterRequest(BaseModel):
    enabled: bool = True
    low_freq: float = 900.0
    high_freq: float = 1100.0
    operation: str = "cut"  # "cut", "keep", "attenuate", "amplify"
    strength: Optional[float] = None
    target_track: Optional[str] = "original"  # "original" or "processed"


@app.post("/api/process/filter")
def apply_filter(req: FilterRequest):
    """
    Apply frequency-domain band filtering using fourier_filter.py.
    Can be applied to either the original signal or the currently processed signal.
    """
    if state.signal is None:
        raise HTTPException(status_code=400, detail="No audio loaded")

    # Select base signal according to target_track
    base_sig = state.processed if (req.target_track == "processed" and state.processed is not None) else state.signal

    if not req.enabled:
        state.freq_processed = np.array(base_sig, copy=True)
        state.processed = np.array(base_sig, copy=True)
        state.last_band = None
        return get_full_state_payload()

    nyquist = state.fs / 2.0
    if req.low_freq < 0 or req.high_freq <= req.low_freq:
        raise HTTPException(status_code=400, detail="High frequency must be greater than low frequency.")
    if req.high_freq > nyquist:
        raise HTTPException(status_code=400, detail=f"High frequency cannot exceed Nyquist ({nyquist} Hz).")

    op = req.operation.lower()
    if op == "keep":
        state.freq_processed = band_filter(base_sig, state.fs, req.low_freq, req.high_freq, mode="keep")
    else:
        strength = req.strength
        if strength is None:
            strength = 0.30 if op == "attenuate" else (1.50 if op == "amplify" else 1.0)
        state.freq_processed = process_band(base_sig, state.fs, req.low_freq, req.high_freq, operation=op, strength=strength)

    state.processed = np.array(state.freq_processed, copy=True)
    state.last_band = [req.low_freq, req.high_freq]
    state.last_operation = op
    return get_full_state_payload()


class EffectsRequest(BaseModel):
    gain: float = 1.0               # Amplitude scaling
    delay_ms: float = 0.0           # Pure time shifting y[n] = x[n - n0]
    shift_hz: float = 0.0           # Frequency translation
    echo_enabled: bool = False      # Convolution echo y[n] = x * h
    echo_delay_ms: float = 250.0    # Echo delay spacing in ms
    echo_feedback: float = 55.0     # Echo decay percentage (0-90%)
    echo_taps: int = 3              # Number of echo reflections (1-6)
    echo_mix: float = 65.0          # Wet/dry mix percentage (0-100%)
    voice_effect: Optional[str] = None # "autotune", "robotic", "baby", "monster"
    target_track: Optional[str] = "original"  # "original" or "processed"


@app.post("/api/process/effects")
def apply_effects(req: EffectsRequest):
    """
    Apply time-domain, voice transformation, and convolution effects using audio_effects.py.
    Can be applied to either the original signal or the currently processed signal.
    """
    if state.signal is None:
        raise HTTPException(status_code=400, detail="No signal loaded")

    # Select base signal according to target_track
    if req.target_track == "processed" and state.processed is not None:
        base_sig = state.processed
    elif state.freq_processed is not None:
        base_sig = state.freq_processed
    else:
        base_sig = state.signal

    result = np.array(base_sig, copy=True)

    # 1. Amplitude scaling: y[n] = A * x[n]
    if req.gain != 1.0:
        result = scale_amplitude(result, req.gain)

    # 2. Pure time shifting: y[n] = x[n - n0]
    if req.delay_ms > 0:
        result = time_shift(result, state.fs, req.delay_ms)

    # 3. Frequency translation (single sideband / analytic signal)
    if abs(req.shift_hz) > 1e-9:
        result = frequency_shift(result, state.fs, req.shift_hz)

    # 4. Voice transformation effects
    if req.voice_effect:
        ve = req.voice_effect.lower()
        if ve == "autotune":
            result = autotune_voice_effect(result, state.fs)
        elif ve == "robotic":
            result = robotic_voice_effect(result, state.fs)
        elif ve == "baby":
            result = baby_voice_effect(result, state.fs)
        elif ve == "monster":
            result = monster_voice_effect(result, state.fs)

    # 5. Convolution echo: y[n] = x[n] * h[n]
    if req.echo_enabled:
        feedback = max(0.05, min(0.92, req.echo_feedback / 100.0))
        wet_mix = max(0.05, min(1.0, req.echo_mix / 100.0))
        delay_val = max(10.0, req.echo_delay_ms if req.echo_delay_ms > 0 else 250.0)
        taps = max(1, min(6, int(req.echo_taps)))
        result = convolution_echo(result, state.fs, delay_ms=delay_val, decay=feedback, num_echoes=taps, wet_mix=wet_mix)

    state.processed = result
    return get_full_state_payload()


class FullProcessRequest(BaseModel):
    filter_enabled: bool = False
    low_freq: float = 900.0
    high_freq: float = 1100.0
    operation: str = "cut"
    strength: Optional[float] = None
    gain: float = 1.0
    delay_ms: float = 0.0
    shift_hz: float = 0.0
    echo_enabled: bool = False
    echo_delay_ms: float = 250.0
    echo_feedback: float = 55.0
    echo_taps: int = 3
    echo_mix: float = 65.0
    voice_effect: Optional[str] = None
    target_track: Optional[str] = "original"  # "original" or "processed"


@app.post("/api/process/all")
def apply_all(req: FullProcessRequest):
    """
    Applies the full DSP pipeline:
    Fourier Band Filter -> Amplitude Scale -> Time Shift -> Freq Shift -> Voice Transformation -> Convolution Echo
    Can start from either the original signal or current processed signal.
    """
    if state.signal is None:
        raise HTTPException(status_code=400, detail="No signal loaded")

    base_sig = state.processed if (req.target_track == "processed" and state.processed is not None) else state.signal

    # Step A: Frequency filtering
    if req.filter_enabled:
        op = req.operation.lower()
        if op == "keep":
            state.freq_processed = band_filter(base_sig, state.fs, req.low_freq, req.high_freq, mode="keep")
        else:
            strength = req.strength
            if strength is None:
                strength = 0.30 if op == "attenuate" else (1.50 if op == "amplify" else 1.0)
            state.freq_processed = process_band(base_sig, state.fs, req.low_freq, req.high_freq, operation=op, strength=strength)
        state.last_band = [req.low_freq, req.high_freq]
        state.last_operation = op
    else:
        state.freq_processed = np.array(base_sig, copy=True)
        state.last_band = None

    # Step B: Audio effects
    result = np.array(state.freq_processed, copy=True)
    if req.gain != 1.0:
        result = scale_amplitude(result, req.gain)

    if req.delay_ms > 0:
        result = time_shift(result, state.fs, req.delay_ms)

    if abs(req.shift_hz) > 1e-9:
        result = frequency_shift(result, state.fs, req.shift_hz)

    if req.voice_effect:
        ve = req.voice_effect.lower()
        if ve == "autotune":
            result = autotune_voice_effect(result, state.fs)
        elif ve == "robotic":
            result = robotic_voice_effect(result, state.fs)
        elif ve == "baby":
            result = baby_voice_effect(result, state.fs)
        elif ve == "monster":
            result = monster_voice_effect(result, state.fs)

    if req.echo_enabled:
        feedback = max(0.05, min(0.92, req.echo_feedback / 100.0))
        wet_mix = max(0.05, min(1.0, req.echo_mix / 100.0))
        delay_val = max(10.0, req.echo_delay_ms if req.echo_delay_ms > 0 else 250.0)
        taps = max(1, min(6, int(req.echo_taps)))
        result = convolution_echo(result, state.fs, delay_ms=delay_val, decay=feedback, num_echoes=taps, wet_mix=wet_mix)

    state.processed = result
    return get_full_state_payload()


@app.post("/api/reset")
def reset_signal():
    """Reset to original unprocessed audio."""
    if state.signal is not None:
        state.freq_processed = np.array(state.signal, copy=True)
        state.processed = np.array(state.signal, copy=True)
        state.last_band = None
        state.last_operation = None
    return get_full_state_payload()


@app.get("/api/audio/{track}")
def stream_audio(track: str):
    """
    Streams WAV audio to the browser for Web Audio API playback.
    track = 'original' or 'processed'
    """
    if track == "original":
        if state.signal is None:
            raise HTTPException(status_code=404, detail="Original audio not loaded")
        wav_bytes = signal_to_wav_bytes(state.signal, state.fs)
    elif track == "processed":
        if state.processed is None:
            raise HTTPException(status_code=404, detail="Processed audio not ready")
        wav_bytes = signal_to_wav_bytes(state.processed, state.fs)
    else:
        raise HTTPException(status_code=400, detail="Invalid track identifier")

    return Response(content=wav_bytes, media_type="audio/wav")


@app.get("/api/export/wav")
def export_wav():
    """Download the processed audio as a WAV file."""
    if state.processed is None:
        raise HTTPException(status_code=404, detail="No processed audio to export")
    wav_bytes = signal_to_wav_bytes(state.processed, state.fs)
    filename = f"processed_{state.source_name}"
    if not filename.lower().endswith(".wav"):
        filename += ".wav"
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/api/impulse-response")
def get_impulse_response(delay_ms: float = 250.0, feedback: float = 55.0, num_echoes: int = 3, wet_mix: float = 65.0):
    """
    Discrete impulse response h[n] of the echo system: y[n] = x[n] * h[n].
    """
    decay = max(0.05, min(0.92, feedback / 100.0))
    wet = max(0.05, min(1.0, wet_mix / 100.0))
    taps = max(1, min(6, int(num_echoes)))
    t_h, h = get_echo_impulse_response(state.fs, delay_ms=delay_ms, decay=decay, num_echoes=taps, wet_mix=wet)
    
    # Extract stem coordinates (time_ms, amplitude)
    stems = [{"t_ms": float(t * 1000), "amp": float(val)} for t, val in zip(t_h, h) if abs(val) > 1e-4]
    
    return {
        "delay_ms": delay_ms,
        "decay": decay,
        "num_echoes": taps,
        "wet_mix": wet,
        "sample_rate": state.fs,
        "stems": stems,
        "formula": "h[n] = δ[n] + wet·decay·δ[n - n₀] + wet·decay²·δ[n - 2n₀] + ...",
        "total_samples": len(h)
    }


@app.get("/api/theory")
def get_theory_manifest():
    """
    Provides structured course theory explanations, mathematical formulations,
    and direct Python file/function references for presenting to the instructor.
    """
    return {
        "course": "CSE 220 Signals and Systems / DSP",
        "title": "Signal Scissors — DSP Theory and Implementation Manifest",
        "concepts": [
            {
                "id": "fft_spectrum",
                "title": "Discrete Fourier Transform (DFT / FFT)",
                "formula": "X[k] = \\sum_{n=0}^{N-1} x[n] \\cdot e^{-j \\frac{2\\pi}{N} k n}",
                "description": "Converts discrete-time audio signals into frequency domain. Single-sided spectrum doubles interior positive bins to preserve energy conservation across mirrored negative frequencies.",
                "file": "fourier_filter.py",
                "function": "compute_spectrum(signal, fs)",
                "key_points": [
                    "Energy doubled for interior positive bins (1 to N/2 - 1)",
                    "DC component (0 Hz) and Nyquist bin (fs/2) remain unchanged (×1)",
                    "Handles both even and odd length sample sizes"
                ]
            },
            {
                "id": "frequency_filtering",
                "title": "Ideal Frequency-Domain Band Filtering",
                "formula": "Y[k] = X[k] \\cdot H[k], \\quad y[n] = \\text{IDFT}\\{Y[k]\\}",
                "description": "Applies Fourier-domain modification to cut, keep, attenuate, or amplify frequencies within [f_low, f_high] before taking the Inverse FFT.",
                "file": "fourier_filter.py",
                "function": "process_band(signal, fs, low_freq, high_freq, operation, strength)",
                "key_points": [
                    "Cut: Sets band components to 0 (ideal notch / bandstop)",
                    "Keep: Sets all frequencies outside band to 0 (ideal bandpass)",
                    "Attenuate / Amplify: Scales Fourier coefficients by linear factor"
                ]
            },
            {
                "id": "discrete_convolution",
                "title": "Discrete Linear Convolution & Echo System",
                "formula": "y[n] = (x * h)[n] = \\sum_{k=-\\infty}^{\\infty} x[k] \\cdot h[n - k]",
                "description": "Linear time-invariant (LTI) system modeling multi-path acoustic echo. The discrete impulse response h[n] consists of direct impulse followed by geometrically decaying reflections.",
                "file": "audio_effects.py",
                "function": "convolution_echo(signal, fs, delay_ms, decay, num_echoes)",
                "key_points": [
                    "Impulse response: h[n] = δ[n] + α·δ[n - n₀] + α²·δ[n - 2n₀] + ...",
                    "Delay samples: n₀ = round((delay_ms / 1000) * fs)",
                    "Output length is len(x) + len(h) - 1, capturing reverberant tail"
                ]
            },
            {
                "id": "amplitude_scaling",
                "title": "Amplitude Scaling",
                "formula": "y[n] = A \\cdot x[n]",
                "description": "Modifies volume / gain uniformly across all samples without clipping floating-point dynamic range during intermediate stages.",
                "file": "audio_effects.py",
                "function": "scale_amplitude(signal, factor)",
                "key_points": ["Pure linear scalar operation", "Normalized at final output / DAC boundary"]
            },
            {
                "id": "time_shifting",
                "title": "Discrete Time Shifting / Pure Delay",
                "formula": "y[n] = x[n - n_0]",
                "description": "Delays signal by n₀ samples by zero-padding at onset and preserving fixed window duration.",
                "file": "audio_effects.py",
                "function": "time_shift(signal, fs, delay_ms)",
                "key_points": ["Shifts samples forward in time by n₀ = round((delay_ms/1000) * fs)"]
            },
            {
                "id": "analytic_frequency_shift",
                "title": "Single-Sideband Frequency Translation (Hilbert Transform)",
                "formula": "x_a[n] = x[n] + j \\cdot \\hat{x}[n], \\quad y[n] = \\text{Re}\\{x_a[n] \\cdot e^{j 2\\pi \\Delta f \\cdot t}\\}",
                "description": "Shifts every spectral component by exact Δf Hz using single-sideband analytic signal modulation via the FFT, preventing spectral foldover distortion.",
                "file": "server.py & gui.py",
                "function": "frequency_shift_channel(data, sample_rate, shift_hz)",
                "key_points": ["Constructs analytic signal with zero negative frequencies", "Complex exponential rotation produces true pitch translation"]
            },
            {
                "id": "signal_metrics",
                "title": "Signal Statistics & Analysis",
                "formula": "\\text{RMS} = \\sqrt{\\frac{1}{N}\\sum x^2[n]}, \\quad \\text{Peak} = \\max |x[n]|, \\quad f_{dom} = \\arg\\max |X[k]|",
                "description": "Quantifies energy content, dynamic range, and dominant spectral harmonic.",
                "file": "signal_analysis.py",
                "function": "rms, peak_amplitude, dominant_frequency",
                "key_points": ["RMS measures average signal power", "Dominant frequency ignores DC (0 Hz) component"]
            }
        ]
    }


# Auto-load standard test signal on startup
load_test("tones")


@app.get("/api/presets/reallife")
def get_reallife_presets():
    """Returns metadata and recommended DSP parameters for real-life applications."""
    return {
        "presets": [
            {
                "id": "telephone",
                "name": "Vintage Telephone Bandwidth Filter",
                "category": "Telecommunications",
                "filter": {"enabled": True, "low_freq": 300, "high_freq": 3400, "operation": "keep"},
                "effects": {"gain": 1.1, "delay_ms": 0, "shift_hz": 0, "echo_enabled": False}
            },
            {
                "id": "mains-notch",
                "name": "Mains 60 Hz Powerline Hum Notch",
                "category": "Audio Engineering",
                "filter": {"enabled": True, "low_freq": 55, "high_freq": 65, "operation": "cut"},
                "effects": {"gain": 1.0, "delay_ms": 0, "shift_hz": 0, "echo_enabled": False}
            },
            {
                "id": "cathedral-reverb",
                "name": "Cathedral / Concert Hall Reverb",
                "category": "Acoustics",
                "filter": {"enabled": False},
                "effects": {"gain": 0.95, "delay_ms": 0, "shift_hz": 0, "echo_enabled": True, "echo_delay_ms": 280, "echo_feedback": 70, "echo_taps": 5, "echo_mix": 80}
            },
            {
                "id": "canyon-echo",
                "name": "Canyon / Mountain Ridge Echo",
                "category": "Acoustics",
                "filter": {"enabled": False},
                "effects": {"gain": 1.0, "delay_ms": 0, "shift_hz": 0, "echo_enabled": True, "echo_delay_ms": 450, "echo_feedback": 55, "echo_taps": 4, "echo_mix": 75}
            },
            {
                "id": "hearing-aid",
                "name": "Hearing Aid High-Frequency Compensation",
                "category": "Biomedical / Audiology",
                "filter": {"enabled": True, "low_freq": 2000, "high_freq": 4000, "operation": "amplify", "strength": 2.2},
                "effects": {"gain": 0.9, "delay_ms": 0, "shift_hz": 0, "echo_enabled": False}
            },
            {
                "id": "doppler-siren",
                "name": "Doppler Shift / Moving Vehicle Siren",
                "category": "Telecommunications",
                "filter": {"enabled": False},
                "effects": {"gain": 1.0, "delay_ms": 0, "shift_hz": 45.0, "echo_enabled": False}
            },
            {
                "id": "rumble-cutoff",
                "name": "Sub-bass Rumble & HVAC Filter",
                "category": "Audio Engineering",
                "filter": {"enabled": True, "low_freq": 0, "high_freq": 80, "operation": "cut"},
                "effects": {"gain": 1.05, "delay_ms": 0, "shift_hz": 0, "echo_enabled": False}
            }
        ]
    }


# Serve frontend if build exists
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.exception_handler(404)
    async def spa_404_handler(request, exc):
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file) and not request.url.path.startswith("/api/"):
            return FileResponse(index_file)
        return Response(content="Not Found", status_code=404)

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve static file if exists
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return Response(content="Frontend build index.html not found", status_code=404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
