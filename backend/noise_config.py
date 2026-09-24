"""Limits and processing presets for the independent noise-removal service."""

import os
import tempfile
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class NoisePreset:
    highpass: int
    reduction: int
    floor_offset: int
    smoothing: int


NOISE_LEVELS = {
    "light": NoisePreset(40, 6, -4, 6),
    "balanced": NoisePreset(65, 12, 0, 8),
    "strong": NoisePreset(85, 20, 3, 10),
}
NOISE_WINDOW_SECONDS = 0.05
NOISE_PERCENTILE = 20
NOISE_FLOOR_MIN = -80
NOISE_FLOOR_MAX = -25  # conservative ceiling when speech fills the recording
# afftdn uses a 3-hop window and introduces 2 hops of delay (12.5 ms each).
# https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/af_afftdn.c
AFFTDN_HOP_DIVISOR = 80
LIMITER = "alimiter=limit=0.98:level=false:latency=true"


def filter_chain(level, measured_floor, sample_rate, frame_count):
    preset = NOISE_LEVELS[level]
    floor = min(
        NOISE_FLOOR_MAX, max(NOISE_FLOOR_MIN, measured_floor + preset.floor_offset)
    )
    delay = 2 * (sample_rate // AFFTDN_HOP_DIVISOR)
    # Padding flushes the last FFT window; trim only processing latency, not audio.
    # Every interpolated value is server-owned or calculated from validated PCM.
    return (
        f"apad=pad_len={delay},highpass=f={preset.highpass},"
        f"afftdn=nr={preset.reduction}:nf={floor:.2f}:tn=0:gs={preset.smoothing},"
        f"atrim=start_sample={delay}:end_sample={delay + frame_count},"
        f"asetpts=PTS-STARTPTS,{LIMITER}"
    )


FORMATS = {
    ".wav": {"audio/wav", "audio/wave", "audio/x-wav", "audio/vnd.wave"},
    ".mp3": {"audio/mpeg", "audio/mp3"},
    ".m4a": {"audio/mp4", "audio/x-m4a", "audio/m4a"},
    ".aac": {"audio/aac", "audio/x-aac", "audio/aacp"},
}


def positive_int(name, default, maximum):
    try:
        value = int(os.environ.get(name, default))
        if not 0 < value <= maximum:
            raise ValueError
        return value
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer between 1 and {maximum}") from exc


@dataclass(frozen=True)
class NoiseConfig:
    max_bytes: int = 60 * 1024 * 1024
    max_duration: int = 300
    timeout: int = 120
    retention: int = 3600
    cleanup_interval: int = 300
    max_concurrent: int = 2
    storage_dir: Path = Path(tempfile.gettempdir()) / "signal-scissors-noise"
    ffmpeg: str = "ffmpeg"
    ffprobe: str = "ffprobe"

    @classmethod
    def from_env(cls):
        return cls(
            max_bytes=positive_int("NOISE_MAX_UPLOAD_MB", 60, 500) * 1024 * 1024,
            max_duration=positive_int("NOISE_MAX_DURATION_SECONDS", 300, 3600),
            timeout=positive_int("NOISE_PROCESS_TIMEOUT_SECONDS", 120, 900),
            retention=positive_int("NOISE_RETENTION_SECONDS", 3600, 604800),
            cleanup_interval=positive_int("NOISE_CLEANUP_INTERVAL_SECONDS", 300, 3600),
            max_concurrent=positive_int("NOISE_MAX_CONCURRENT", 2, 16),
            storage_dir=Path(
                os.environ.get("NOISE_STORAGE_DIR", str(cls.storage_dir))
            ).absolute(),
            ffmpeg=os.environ.get("NOISE_FFMPEG_PATH", "ffmpeg"),
            ffprobe=os.environ.get("NOISE_FFPROBE_PATH", "ffprobe"),
        )
