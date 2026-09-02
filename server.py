"""
server.py - High-Performance FastAPI Backend for Signal Scissors
Wraps authentic CSE 220 signal processing algorithms:
- fourier_filter.py
- audio_effects.py
- signal_analysis.py
- signal_io.py
"""

import io
import os
import tempfile
import numpy as np
from scipy.io import wavfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

from signal_io import generate_test_signal, load_wav, save_wav
from fourier_filter import compute_spectrum, band_filter, process_band
from audio_effects import scale_amplitude, time_shift, convolution_echo, get_echo_impulse_response
from signal_analysis import rms, peak_amplitude, dominant_frequency

app = FastAPI(title="Signal Scissors DSP Engine", version="2.0.0")

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


def pad_to_length(data, length):
    data = np.asarray(data)
    if data.shape[0] >= length:
        return data[:length]
    return np.pad(data, [(0, length - data.shape[0])] + [(0, 0)] * (data.ndim - 1), mode="constant")


def blend_echo(dry, wet, mix):
    length = max(np.asarray(dry).shape[0], np.asarray(wet).shape[0])
    return pad_to_length(dry, length) * (1.0 - mix) + pad_to_length(wet, length) * mix


def downsample_envelope(signal, max_points=1200):
    """
    Downsamples a 1D signal into min/max peak envelope pairs for ultra-fast,
    aliasing-free 60 FPS Canvas rendering.
    """
    n = len(signal)
    if n <= max_points:
        return {
            "peaks": signal.tolist(),
            "min_val": float(np.min(signal)),
            "max_val": float(np.max(signal)),
            "count": n
        }
    
    bucket_size = n / (max_points / 2)
    peaks = []
    for i in range(int(max_points / 2)):
        start = int(i * bucket_size)
        end = int(min((i + 1) * bucket_size, n))
        if start >= end:
            continue
        chunk = signal[start:end]
        peaks.append(float(np.min(chunk)))
        peaks.append(float(np.max(chunk)))
    
    return {
        "peaks": peaks,
        "min_val": float(np.min(signal)),
        "max_val": float(np.max(signal)),
        "count": len(peaks)
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
        step = max(1, n // max_points)
        freqs = freqs[::step]
        mag_db = mag_db[::step]
    
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
    """Helper to assemble full waveform, spectrum, and metadata."""
    if state.signal is None:
        return {"loaded": False}

    orig_env = downsample_envelope(state.signal)
    proc_env = downsample_envelope(state.processed) if state.processed is not None else orig_env

    orig_spec = compute_spectrum_payload(state.signal, state.fs)
    proc_spec = compute_spectrum_payload(state.processed, state.fs) if state.processed is not None else orig_spec

    stats = get_signal_stats(state.processed if state.processed is not None else state.signal, state.fs, state.num_channels)

    return {
        "loaded": True,
        "source_name": state.source_name,
        "sample_rate": state.fs,
        "duration": float(len(state.signal) / state.fs),
        "num_channels": state.num_channels,
        "samples": len(state.signal),
        "original_waveform": orig_env,
        "processed_waveform": proc_env,
        "original_spectrum": orig_spec,
        "processed_spectrum": proc_spec,
        "stats": stats,
        "last_band": state.last_band,
        "last_operation": state.last_operation
    }


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Signal Scissors DSP API"}


@app.get("/api/signal/test")
def load_test(preset: str = "tones"):
    """
    Generate synthetic test signal using signal_io.generate_test_signal.
    Supports preset frequencies for course lab demonstrations.
    """
    if preset == "noise":
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
    """
    Upload and load a custom WAV audio file using signal_io.load_wav.
    """
    suffix = os.path.splitext(file.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        t, data, fs, num_channels = load_wav(tmp_path)
        state.t = t
        state.signal = data
        state.freq_processed = np.array(data, copy=True)
        state.processed = np.array(data, copy=True)
        state.fs = fs
        state.num_channels = num_channels
        state.source_name = file.filename
        state.last_band = None
        state.last_operation = None
        return get_full_state_payload()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


class FilterRequest(BaseModel):
    enabled: bool = True
    low_freq: float = 900.0
    high_freq: float = 1100.0
    operation: str = "cut"  # "cut", "keep", "attenuate", "amplify"
    strength: Optional[float] = None


@app.post("/api/process/filter")
def apply_filter(req: FilterRequest):
    """
    Apply frequency-domain band filtering using fourier_filter.py.
    """
    if state.signal is None:
        raise HTTPException(status_code=400, detail="No audio loaded")

    if not req.enabled:
        state.freq_processed = np.array(state.signal, copy=True)
        state.processed = np.array(state.signal, copy=True)
        state.last_band = None
        return get_full_state_payload()

    nyquist = state.fs / 2.0
    if req.low_freq < 0 or req.high_freq <= req.low_freq:
        raise HTTPException(status_code=400, detail="High frequency must be greater than low frequency.")
    if req.high_freq > nyquist:
        raise HTTPException(status_code=400, detail=f"High frequency cannot exceed Nyquist ({nyquist} Hz).")

    op = req.operation.lower()
    if op == "keep":
        state.freq_processed = band_filter(state.signal, state.fs, req.low_freq, req.high_freq, mode="keep")
    else:
        strength = req.strength
        if strength is None:
            strength = 0.30 if op == "attenuate" else (1.50 if op == "amplify" else 1.0)
        state.freq_processed = process_band(state.signal, state.fs, req.low_freq, req.high_freq, operation=op, strength=strength)

    state.processed = np.array(state.freq_processed, copy=True)
    state.last_band = [req.low_freq, req.high_freq]
    state.last_operation = op
    return get_full_state_payload()


class EffectsRequest(BaseModel):
    gain: float = 1.0               # Amplitude scaling
    delay_ms: float = 0.0           # Time shifting
    shift_hz: float = 0.0           # Frequency translation
    echo_enabled: bool = False      # Convolution echo
    echo_feedback: float = 32.0     # Feedback percentage (0-95%)
    echo_mix: float = 45.0          # Wet/dry mix percentage (0-100%)


@app.post("/api/process/effects")
def apply_effects(req: EffectsRequest):
    """
    Apply time-domain and convolution effects using audio_effects.py.
    """
    if state.freq_processed is None:
        raise HTTPException(status_code=400, detail="No signal loaded")

    result = np.array(state.freq_processed, copy=True)

    # 1. Amplitude scaling: y[n] = A * x[n]
    if req.gain != 1.0:
        result = scale_amplitude(result, req.gain)

    # 2. Time shifting: y[n] = x[n - n0]
    if req.delay_ms > 0:
        result = time_shift(result, state.fs, req.delay_ms)

    # 3. Frequency translation (single sideband / analytic signal)
    if abs(req.shift_hz) > 1e-9:
        result = frequency_shift(result, state.fs, req.shift_hz)

    # 4. Convolution echo: y[n] = x[n] * h[n]
    if req.echo_enabled:
        feedback = max(0.0, min(0.95, req.echo_feedback / 100.0))
        wet_mix = max(0.0, min(1.0, req.echo_mix / 100.0))
        delay_val = max(1.0, req.delay_ms if req.delay_ms > 0 else 250.0)
        echoed = convolution_echo(result, state.fs, delay_ms=delay_val, decay=feedback, num_echoes=3)
        result = blend_echo(result, echoed, wet_mix)

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
    echo_feedback: float = 32.0
    echo_mix: float = 45.0


@app.post("/api/process/all")
def apply_all(req: FullProcessRequest):
    """
    Applies the full DSP pipeline:
    Fourier Band Filter -> Amplitude Scale -> Time Shift -> Freq Shift -> Convolution Echo
    """
    if state.signal is None:
        raise HTTPException(status_code=400, detail="No signal loaded")

    # Step A: Frequency filtering
    if req.filter_enabled:
        op = req.operation.lower()
        if op == "keep":
            state.freq_processed = band_filter(state.signal, state.fs, req.low_freq, req.high_freq, mode="keep")
        else:
            strength = req.strength
            if strength is None:
                strength = 0.30 if op == "attenuate" else (1.50 if op == "amplify" else 1.0)
            state.freq_processed = process_band(state.signal, state.fs, req.low_freq, req.high_freq, operation=op, strength=strength)
        state.last_band = [req.low_freq, req.high_freq]
        state.last_operation = op
    else:
        state.freq_processed = np.array(state.signal, copy=True)
        state.last_band = None

    # Step B: Audio effects
    result = np.array(state.freq_processed, copy=True)
    if req.gain != 1.0:
        result = scale_amplitude(result, req.gain)

    if req.delay_ms > 0:
        result = time_shift(result, state.fs, req.delay_ms)

    if abs(req.shift_hz) > 1e-9:
        result = frequency_shift(result, state.fs, req.shift_hz)

    if req.echo_enabled:
        feedback = max(0.0, min(0.95, req.echo_feedback / 100.0))
        wet_mix = max(0.0, min(1.0, req.echo_mix / 100.0))
        delay_val = max(1.0, req.delay_ms if req.delay_ms > 0 else 250.0)
        echoed = convolution_echo(result, state.fs, delay_ms=delay_val, decay=feedback, num_echoes=3)
        result = blend_echo(result, echoed, wet_mix)

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
def get_impulse_response(delay_ms: float = 250.0, feedback: float = 50.0, num_echoes: int = 3):
    """
    Discrete impulse response h[n] of the echo system: y[n] = x[n] * h[n].
    """
    decay = max(0.0, min(0.95, feedback / 100.0))
    t_h, h = get_echo_impulse_response(state.fs, delay_ms=delay_ms, decay=decay, num_echoes=num_echoes)
    
    # Extract stem coordinates (time_ms, amplitude)
    stems = [{"t_ms": float(t * 1000), "amp": float(val)} for t, val in zip(t_h, h) if abs(val) > 1e-4]
    
    return {
        "delay_ms": delay_ms,
        "decay": decay,
        "num_echoes": num_echoes,
        "sample_rate": state.fs,
        "stems": stems,
        "formula": "h[n] = δ[n] + decay · δ[n - n₀] + decay² · δ[n - 2n₀] + decay³ · δ[n - 3n₀]",
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


# Serve frontend if build exists
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
