"""Generate reproducible figures for Signal Scissors study_material.tex.

The examples use deterministic signals and reimplement the same processing
equations as the backend.  Run with: py -3 generate_figures.py
"""
from pathlib import Path
import sys

import matplotlib.pyplot as plt
import numpy as np
from scipy import signal as sp_signal
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "figures"
OUT.mkdir(parents=True, exist_ok=True)

FS = 8000
np.random.seed(220)
plt.rcParams.update({"font.size": 10, "axes.grid": True, "grid.alpha": .25,
                     "figure.dpi": 160, "savefig.bbox": "tight"})


def spectrum(x, fs=FS):
    f = np.fft.rfftfreq(len(x), 1 / fs)
    a = np.abs(np.fft.rfft(x)) / len(x)
    if len(a) > 2:
        a[1:-1] *= 2
    return f, 20 * np.log10(np.maximum(a, 1e-7))


def four_panel(name, x, y, fs=FS, duration=0.04, xmax=4000, note=""):
    fig, ax = plt.subplots(2, 2, figsize=(10.4, 5.6), constrained_layout=True)
    n = min(len(x), len(y), int(duration * fs))
    t = np.arange(n) / fs * 1000
    ax[0, 0].plot(t, x[:n], lw=1.2, color="#2563eb")
    ax[0, 0].set(title="Original waveform", xlabel="Time (ms)", ylabel="Amplitude")
    ax[0, 1].plot(t, y[:n], lw=1.2, color="#dc2626")
    ax[0, 1].set(title="Processed waveform", xlabel="Time (ms)", ylabel="Amplitude")
    f, X = spectrum(x, fs); g, Y = spectrum(y, fs)
    ax[1, 0].plot(f, X, lw=1.1, color="#2563eb")
    ax[1, 0].set(title="Original magnitude spectrum", xlabel="Frequency (Hz)", ylabel="Magnitude (dB)", xlim=(0, xmax), ylim=(-90, 5))
    ax[1, 1].plot(g, Y, lw=1.1, color="#dc2626")
    ax[1, 1].set(title="Processed magnitude spectrum", xlabel="Frequency (Hz)", ylabel="Magnitude (dB)", xlim=(0, xmax), ylim=(-90, 5))
    if note:
        fig.suptitle(note, fontsize=12, fontweight="bold")
    fig.savefig(OUT / name)
    plt.close(fig)


def fft_band(x, lo, hi, kind, strength=1):
    bins = np.fft.fft(x)
    f = np.fft.fftfreq(len(x), 1 / FS)
    inside = (np.abs(f) >= lo) & (np.abs(f) <= hi)
    if kind == "keep":
        bins[~inside] = 0
    elif kind == "cut":
        bins[inside] = 0
    else:
        bins[inside] *= strength
    return np.fft.ifft(bins).real


def frequency_shift(x, shift):
    n = len(x); X = np.fft.fft(x); m = np.zeros(n)
    m[0] = 1
    if n % 2 == 0:
        m[n // 2] = 1; m[1:n // 2] = 2
    else:
        m[1:(n + 1) // 2] = 2
    xa = np.fft.ifft(X * m)
    return np.real(xa * np.exp(2j * np.pi * shift * np.arange(n) / FS))


def spectral_gate(x, level="balanced"):
    decrease, threshold_std, smoothing = {"light": (.55, 1.35, .7), "balanced": (.76, 1.10, 1.0), "strong": (.91, .85, 1.35)}[level]
    f, t, Z = sp_signal.stft(x, fs=FS, nperseg=256, noverlap=192, boundary="zeros", padded=True)
    mag = np.abs(Z); energy = np.mean(mag * mag, axis=0)
    quiet = mag[:, np.argsort(energy)[:max(3, int(np.ceil(.2 * mag.shape[1])))]]
    threshold = np.mean(quiet, axis=1, keepdims=True) + threshold_std * np.std(quiet, axis=1, keepdims=True) + 1e-10
    mask = 1 / (1 + np.exp(-7 * (mag / threshold - 1)))
    mask = gaussian_filter(mask, sigma=(smoothing, smoothing), mode="nearest")
    _, y = sp_signal.istft(Z * ((1 - decrease) + decrease * mask), fs=FS, nperseg=256, noverlap=192, input_onesided=True, boundary=True)
    return y[:len(x)]


def main():
    t = np.arange(2 * FS) / FS
    multi = .34*np.sin(2*np.pi*200*t) + .34*np.sin(2*np.pi*1000*t) + .34*np.sin(2*np.pi*2500*t)
    multi += .035*np.random.randn(len(t))
    multi /= np.max(np.abs(multi))
    four_panel("01_band_cut.png", multi, fft_band(multi, 900, 1100, "cut"), note="FFT band cut: 900--1100 Hz removed")
    four_panel("02_band_keep.png", multi, fft_band(multi, 900, 1100, "keep"), note="FFT band keep: only 900--1100 Hz retained")
    four_panel("03_band_scale.png", multi, fft_band(multi, 900, 1100, "amplify", 2.2), note="FFT band amplification: 1000 Hz multiplied by 2.2")

    pure = .75*np.sin(2*np.pi*440*t)
    four_panel("04_gain.png", pure, 1.8*pure, duration=.012, xmax=1600, note="Amplitude scaling: gain A = 1.8")
    delay = int(.12*FS); shifted = np.r_[np.zeros(delay), pure[:-delay]]
    four_panel("05_delay.png", pure, shifted, duration=.16, xmax=1600, note="Pure delay: 120 ms zero-padded shift")
    trans = .5*np.sin(2*np.pi*440*t) + .3*np.sin(2*np.pi*900*t)
    four_panel("06_ssb_shift.png", trans, frequency_shift(trans, 180), duration=.025, xmax=1800, note="Analytic-signal SSB translation: +180 Hz")

    burst = np.zeros_like(t); a = int(.08*FS); L = int(.18*FS); tb = np.arange(L)/FS
    burst[a:a+L] = .8*np.sin(2*np.pi*440*tb)*np.hanning(L)
    n0 = int(.28*FS); h = np.zeros(5*n0+1); h[0] = 1
    for k in range(1, 6): h[k*n0] = .8*.7**k
    echo = np.convolve(burst, h)
    four_panel("07_echo.png", burst, echo, duration=1.7, xmax=1600, note="Convolution echo: 280 ms reflections, 5 taps")
    fig, ax = plt.subplots(figsize=(8.8, 3.1), constrained_layout=True)
    ax.stem(np.flatnonzero(h)/FS*1000, h[np.flatnonzero(h)], basefmt=" ", linefmt="#7c3aed", markerfmt="o")
    ax.set(title="Actual multi-tap echo impulse response h[n]", xlabel="Time (ms)", ylabel="Amplitude", xlim=(-10, 1450))
    fig.savefig(OUT / "08_echo_impulse_response.png"); plt.close(fig)

    noise = .45*np.sin(2*np.pi*300*t) + .34*np.random.randn(len(t))
    clean = spectral_gate(noise, "balanced")
    four_panel("09_spectral_gate.png", noise, clean, duration=.06, xmax=3000, note="STFT spectral gate: balanced noise reduction")

    voice = (.48*np.sin(2*np.pi*220*t) + .21*np.sin(2*np.pi*440*t) + .13*np.sin(2*np.pi*660*t))
    carrier = np.sin(2*np.pi*150*t); ring = voice*carrier
    d = int(.012*FS); comb = np.zeros_like(ring)
    for i in range(len(ring)): comb[i] = ring[i] + (.6*comb[i-d] if i >= d else 0)
    robotic = .4*voice + .6*comb; robotic /= np.max(np.abs(robotic))
    four_panel("10_robotic.png", voice, robotic, duration=.04, xmax=1800, note="Robotic voice: 150 Hz ring modulation plus 12 ms comb")

    sos = sp_signal.butter(4, [350, 3400], btype="bandpass", fs=FS, output="sos")
    mega = np.tanh(sp_signal.sosfiltfilt(sos, multi)*3)*.92
    four_panel("11_megaphone.png", multi, mega, duration=.04, xmax=4000, note="Megaphone: fourth-order speech band plus tanh saturation")
    sos = sp_signal.butter(5, 900, btype="lowpass", fs=FS, output="sos")
    water = sp_signal.sosfiltfilt(sos, multi) * (.82+.12*np.sin(2*np.pi*.55*t))
    four_panel("12_underwater.png", multi, water, duration=.04, xmax=4000, note="Underwater: fifth-order 900 Hz low-pass plus 0.55 Hz AM")

    fig, ax = plt.subplots(1, 2, figsize=(10, 3.3), constrained_layout=True)
    w, H = sp_signal.sosfreqz(sp_signal.butter(4, [350, 3400], btype="bandpass", fs=FS, output="sos"), fs=FS)
    ax[0].plot(w, 20*np.log10(np.maximum(abs(H), 1e-7)), color="#9333ea"); ax[0].set(title="Megaphone Butterworth response", xlabel="Frequency (Hz)", ylabel="Gain (dB)", xlim=(0,4000), ylim=(-70,5))
    w, H = sp_signal.sosfreqz(sp_signal.butter(5, 900, btype="lowpass", fs=FS, output="sos"), fs=FS)
    ax[1].plot(w, 20*np.log10(np.maximum(abs(H), 1e-7)), color="#0891b2"); ax[1].set(title="Underwater Butterworth response", xlabel="Frequency (Hz)", ylabel="Gain (dB)", xlim=(0,4000), ylim=(-70,5))
    fig.savefig(OUT / "13_iir_responses.png"); plt.close(fig)

    # A voiced-like harmonic signal and an idealised C-major target contour.
    # It illustrates the same f0-estimate -> nearest-scale-note intent of the
    # Auto-Tune function without depending on optional PSOLA bindings.
    short_t = np.arange(3 * FS) / FS
    f0 = 210 + 35 * short_t
    phase = 2*np.pi*np.cumsum(f0)/FS
    vocal = .55*np.sin(phase) + .20*np.sin(2*phase) + .08*np.sin(3*phase)
    c_major_midi = np.array([48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72])
    f_notes = 440 * 2**((c_major_midi-69)/12)
    target = f_notes[np.argmin(abs(f0[:, None]-f_notes[None, :]), axis=1)]
    tuned_phase = 2*np.pi*np.cumsum(target)/FS
    tuned = .55*np.sin(tuned_phase)+.20*np.sin(2*tuned_phase)+.08*np.sin(3*tuned_phase)
    fig, ax = plt.subplots(2, 1, figsize=(9.6, 5.5), constrained_layout=True, sharex=True)
    for axis, data, title in zip(ax, [vocal, tuned], ["Original rising vocal-like fundamental", "Simulated C-major quantised target"]):
        f, tt, z = sp_signal.spectrogram(data, fs=FS, nperseg=512, noverlap=384)
        mesh = axis.pcolormesh(tt, f, 20*np.log10(np.maximum(z, 1e-8)), shading="auto", cmap="magma", vmin=-100, vmax=-15)
        axis.set(title=title, ylabel="Frequency (Hz)", ylim=(100, 1200))
    ax[-1].set_xlabel("Time (s)")
    fig.colorbar(mesh, ax=ax, label="Magnitude (dB)")
    fig.savefig(OUT / "14_autotune_pitch.png"); plt.close(fig)

    r_up, r_down = 2**(7/12), 2**(-7/12)
    original = .58*np.sin(2*np.pi*220*t)+.22*np.sin(2*np.pi*440*t)+.1*np.sin(2*np.pi*660*t)
    baby = .58*np.sin(2*np.pi*220*r_up*t)+.22*np.sin(2*np.pi*440*r_up*t)+.1*np.sin(2*np.pi*660*r_up*t)
    monster = .58*np.sin(2*np.pi*220*r_down*t)+.22*np.sin(2*np.pi*440*r_down*t)+.1*np.sin(2*np.pi*660*r_down*t)
    fig, ax = plt.subplots(1, 3, figsize=(12, 3.2), constrained_layout=True)
    for axis, data, title in zip(ax, [original, baby, monster], ["Original: 220 Hz fundamental", "Baby target: +7 semitones", "Monster target: -7 semitones"]):
        f, db = spectrum(data); axis.plot(f, db, lw=1.2); axis.set(title=title, xlabel="Frequency (Hz)", ylabel="Magnitude (dB)", xlim=(0, 1800), ylim=(-90, 5))
    fig.savefig(OUT / "15_pitch_shift_targets.png"); plt.close(fig)


if __name__ == "__main__":
    main()
