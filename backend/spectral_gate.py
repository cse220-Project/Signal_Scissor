"""Template-inspired STFT spectral gating for the noise-removal API.

The gate estimates a frequency-specific noise profile from the quietest STFT
frames, smoothly attenuates bins beneath that profile, then reconstructs the
signal with overlap-add.  This makes broadband noise reduction measurable in
both the audio and the inspector visualizations.
"""

import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.signal import istft, stft


_PRESETS = {
    "light": (0.55, 1.35, 0.7),
    "balanced": (0.76, 1.10, 1.0),
    "strong": (0.91, 0.85, 1.35),
}


def _window_size(sample_rate: int) -> int:
    # 46 ms is a good compromise for speech, music, and fan/static noise.
    target = max(256, min(2048, 1 << int(np.log2(sample_rate * 0.046))))
    return int(target)


def spectral_gate(samples: np.ndarray, sample_rate: int, level: str) -> np.ndarray:
    """Return denoised float32 PCM with the exact input frame/channel shape."""
    if level not in _PRESETS:
        raise ValueError("Unknown noise reduction level")

    source = np.asarray(samples, dtype=np.float32)
    mono = source.ndim == 1
    channels = source[:, None] if mono else source
    frames = len(channels)
    if frames < 32:
        return source.copy()

    decrease, threshold_std, smoothing = _PRESETS[level]
    nperseg = min(_window_size(sample_rate), frames)
    noverlap = max(0, min(nperseg - 1, (nperseg * 3) // 4))
    output = np.empty_like(channels, dtype=np.float32)

    for channel_index in range(channels.shape[1]):
        channel = channels[:, channel_index]
        _, _, spectrum = stft(
            channel, fs=sample_rate, nperseg=nperseg, noverlap=noverlap,
            boundary="zeros", padded=True,
        )
        magnitude = np.abs(spectrum)
        frame_energy = np.mean(magnitude * magnitude, axis=0)
        quiet_count = max(3, int(np.ceil(magnitude.shape[1] * 0.20)))
        quiet = magnitude[:, np.argsort(frame_energy)[:quiet_count]]
        noise_mean = np.mean(quiet, axis=1, keepdims=True)
        noise_std = np.std(quiet, axis=1, keepdims=True)
        threshold = noise_mean + threshold_std * noise_std + 1e-10

        # A soft mask avoids musical-noise artifacts; smoothing is the same
        # principle used by the supplied noisereduce spectral-gating template.
        ratio = magnitude / threshold
        mask = 1.0 / (1.0 + np.exp(-7.0 * (ratio - 1.0)))
        mask = gaussian_filter(mask, sigma=(smoothing, smoothing), mode="nearest")
        mask = (1.0 - decrease) + decrease * mask
        _, restored = istft(
            spectrum * mask, fs=sample_rate, nperseg=nperseg,
            noverlap=noverlap, input_onesided=True, boundary=True,
        )
        output[:, channel_index] = restored[:frames] if len(restored) >= frames else np.pad(restored, (0, frames - len(restored)))

    # Preserve safe headroom and the existing PCM output contract.
    peak = float(np.max(np.abs(output)))
    if peak > 0.98:
        output *= 0.98 / peak
    return output[:, 0] if mono else output
