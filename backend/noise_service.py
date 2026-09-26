"""Validated, bounded local FFmpeg noise reduction; independent of SignalState."""

import json
import logging
import math
import re
import shutil
import subprocess
import tempfile
import threading
import time
from pathlib import Path

import numpy as np
from noise_config import (
    FORMATS,
    NOISE_FLOOR_MIN,
    NOISE_LEVELS,
    NOISE_PERCENTILE,
    NOISE_WINDOW_SECONDS,
)
from noise_storage import NoiseStorage
from spectral_gate import spectral_gate
from scipy.io import wavfile

logger = logging.getLogger(__name__)


class NoiseError(Exception):
    def __init__(self, status, detail):
        self.status = status
        self.detail = detail
        super().__init__(detail)


def safe_filename(filename):
    # Browser names are display metadata only, never filesystem paths.
    name = (filename or "audio").replace("\\", "/").rsplit("/", 1)[-1]
    name = re.sub(r"[^\w. ()-]", "_", name, flags=re.ASCII).strip(" .")
    return name[:120] or "audio"


def validate_upload(filename, content_type, level):
    if level not in NOISE_LEVELS:
        raise NoiseError(
            422, "Choose a noise-reduction level: light, balanced, or strong."
        )
    suffix = Path(filename or "").suffix.lower()
    if suffix not in FORMATS:
        raise NoiseError(415, "Choose a WAV, MP3, M4A, or AAC audio file.")
    mime = (content_type or "application/octet-stream").split(";", 1)[0].strip().lower()
    if mime != "application/octet-stream" and not mime.startswith("audio/"):
        raise NoiseError(
            415, "Choose an audio file."
        )
    return suffix


def validate_signature(header, suffix):
    valid = {
        ".wav": len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WAVE",
        ".mp3": header[:3] == b"ID3"
        or (len(header) >= 2 and header[0] == 255 and header[1] & 0xE0 == 0xE0),
        ".m4a": len(header) >= 12 and header[4:8] == b"ftyp",
        ".aac": len(header) >= 2 and header[0] == 255 and header[1] & 0xF6 == 0xF0,
    }
    if not valid.get(suffix):
        raise NoiseError(
            400,
            "The file signature is invalid. Choose a valid audio file matching its extension.",
        )


def estimate_noise_floor(samples, sample_rate):
    """Use quieter 50 ms windows without assuming the recording starts in silence.

    A low percentile and preset ceiling limit over-reduction for continuous speech.
    Stereo channels share the quieter estimate to protect a quieter voice channel.
    """
    window = max(1, int(sample_rate * NOISE_WINDOW_SECONDS))
    energies = []
    for start in range(0, len(samples), window):
        block = np.asarray(samples[start : start + window], dtype=np.float64)
        energies.append(np.mean(block * block, axis=0))
    floor_power = float(np.min(np.percentile(energies, NOISE_PERCENTILE, axis=0)))
    return max(NOISE_FLOOR_MIN, 10 * math.log10(max(floor_power, 1e-12)))


class NoiseService:
    def __init__(self, config):
        self.config = config
        self.storage = NoiseStorage(config)
        self.slots = threading.BoundedSemaphore(config.max_concurrent)

    def dependencies(self):
        ffmpeg = shutil.which(self.config.ffmpeg)
        ffprobe = shutil.which(self.config.ffprobe)
        if not ffmpeg or not ffprobe:
            raise NoiseError(
                503,
                "Noise removal is unavailable. The server requires FFmpeg and FFprobe.",
            )
        return ffmpeg, ffprobe

    def run(self, args, deadline, directory, invalid_input=False):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise NoiseError(504, "Audio processing timed out. Try a shorter file.")
        # File-backed output avoids unbounded RAM use on malformed media diagnostics.
        with (
            tempfile.TemporaryFile(dir=directory) as stdout,
            tempfile.TemporaryFile(dir=directory) as stderr,
        ):
            try:
                result = subprocess.run(
                    args,
                    stdin=subprocess.DEVNULL,
                    stdout=stdout,
                    stderr=stderr,
                    timeout=remaining,
                    check=False,
                )
            except subprocess.TimeoutExpired as exc:
                # subprocess.run kills and waits for the child before returning.
                raise NoiseError(
                    504, "Audio processing timed out. Try a shorter file."
                ) from exc
            except FileNotFoundError as exc:
                raise NoiseError(
                    503,
                    "Noise removal is unavailable. The server requires FFmpeg and FFprobe.",
                ) from exc
            if result.returncode:
                stderr.seek(0)
                diagnostic = stderr.read(2048).decode("utf-8", errors="replace")
                logger.warning(
                    "Noise processor failed (exit %s): %r",
                    result.returncode,
                    diagnostic,
                )
                if invalid_input:
                    raise NoiseError(
                        400,
                        "Could not decode this audio. It may be corrupted or use an unsupported codec.",
                    )
                raise NoiseError(
                    500,
                    "Noise removal failed. Please try again or choose another file.",
                )
            stdout.seek(0)
            return stdout.read(65536)

    def inspect(self, path, ffprobe, deadline, suffix):
        payload = self.run(
            [
                ffprobe,
                "-v",
                "error",
                "-protocol_whitelist",
                "file",
                "-show_entries",
                "format=format_name,duration:stream=codec_type,codec_name,sample_rate,channels",
                "-of",
                "json",
                str(path),
            ],
            deadline,
            path.parent,
            invalid_input=True,
        )
        try:
            data = json.loads(payload)
            streams = data["streams"]
            audio = [s for s in streams if s.get("codec_type") == "audio"]
            if len(audio) != 1 or any(s.get("codec_type") == "video" for s in streams):
                raise NoiseError(
                    415,
                    "Choose an audio-only file with one mono or stereo audio stream.",
                )
            stream = audio[0]
            if stream.get("codec_name") not in {
                "aac", "mp3", "pcm_f32le", "pcm_f64le", "pcm_s16le",
                "pcm_s24le", "pcm_s32le", "pcm_u8",
            }:
                raise NoiseError(415, "This audio codec is not supported.")
            rate = int(stream["sample_rate"])
            channels = int(stream["channels"])
            if not 8000 <= rate <= 96000 or channels not in (1, 2):
                raise NoiseError(
                    415,
                    "Use mono or stereo audio with a sample rate between 8 and 96 kHz.",
                )
            duration = float(data["format"].get("duration", 0))
            if not math.isfinite(duration) or duration < 0:
                raise ValueError
            if duration > self.config.max_duration:
                raise NoiseError(
                    413,
                    f"Audio must be no longer than {self.config.max_duration} seconds.",
                )
            return rate, channels
        except (ValueError, KeyError, TypeError) as exc:
            raise NoiseError(400, "Could not read valid audio metadata.") from exc

    def process(self, upload, level):
        suffix = validate_upload(upload.filename, upload.content_type, level)
        ffmpeg, ffprobe = self.dependencies()
        if not self.slots.acquire(blocking=False):
            raise NoiseError(503, "Noise removal is busy. Please try again shortly.")
        try:
            deadline = time.monotonic() + self.config.timeout
            with self.storage.workspace() as directory:
                source = directory / f"input{suffix}"
                size = 0
                upload.file.seek(0)
                with source.open("xb") as output:
                    while chunk := upload.file.read(1024 * 1024):
                        size += len(chunk)
                        if size > self.config.max_bytes:
                            raise NoiseError(
                                413,
                                f"Audio must be at most {self.config.max_bytes // (1024 * 1024)} MB.",
                            )
                        output.write(chunk)
                if size == 0:
                    raise NoiseError(400, "The uploaded file is empty.")
                with source.open("rb") as uploaded:
                    validate_signature(uploaded.read(16), suffix)
                rate, channels = self.inspect(source, ffprobe, deadline, suffix)
                decoded = directory / "decoded.wav"
                # Decode fully before filtering. A bounded extra second detects
                # files whose duration metadata understates their real duration.
                self.run(
                    [
                        ffmpeg,
                        "-nostdin",
                        "-hide_banner",
                        "-v",
                        "error",
                        "-xerror",
                        "-protocol_whitelist",
                        "file",
                        "-threads",
                        "1",
                        "-i",
                        str(source),
                        "-map",
                        "0:a:0",
                        "-vn",
                        "-sn",
                        "-dn",
                        "-map_metadata",
                        "-1",
                        "-t",
                        str(self.config.max_duration + 1),
                        "-ac",
                        str(channels),
                        "-ar",
                        str(rate),
                        "-c:a",
                        "pcm_f32le",
                        str(decoded),
                    ],
                    deadline,
                    directory,
                    invalid_input=True,
                )
                fs, samples = wavfile.read(decoded, mmap=True)
                try:
                    frame_count = len(samples)
                    duration = frame_count / fs
                    if duration <= 0:
                        raise NoiseError(400, "The file contains no audio samples.")
                    if duration > self.config.max_duration:
                        raise NoiseError(
                            413,
                            f"Audio must be no longer than {self.config.max_duration} seconds.",
                        )
                    for start in range(0, len(samples), 65536):
                        if not np.isfinite(samples[start : start + 65536]).all():
                            raise NoiseError(
                                400, "Audio contains invalid, non-finite samples."
                            )
                    measured_floor = estimate_noise_floor(samples, fs)
                finally:
                    if isinstance(samples, np.memmap):
                        samples._mmap.close()
                cleaned = directory / "cleaned.wav"
                if time.monotonic() >= deadline:
                    raise NoiseError(504, "Audio processing timed out. Try a shorter file.")
                _, decoded_samples = wavfile.read(decoded)
                denoised = spectral_gate(decoded_samples, fs, level)
                wavfile.write(cleaned, fs, np.rint(np.clip(denoised, -1, 1) * 32767).astype(np.int16))
                result_rate, result_samples = wavfile.read(cleaned, mmap=True)
                try:
                    result_channels = (
                        1 if result_samples.ndim == 1 else result_samples.shape[1]
                    )
                    if result_samples.dtype != np.int16 or result_channels != channels:
                        raise NoiseError(
                            500,
                            "Noise removal produced an invalid output. Please try again.",
                        )
                    result_duration = len(result_samples) / result_rate
                    if len(result_samples) != frame_count or result_rate != fs:
                        raise NoiseError(
                            500,
                            "Noise removal produced an incomplete output. Please try again.",
                        )
                finally:
                    if isinstance(result_samples, np.memmap):
                        result_samples._mmap.close()
                original_name = safe_filename(upload.filename)
                size = cleaned.stat().st_size
                token, _ = self.storage.publish(cleaned)
                output_name = f"cleaned-{token[:12]}.wav"
                return {
                    "status": "completed",
                    "id": token,
                    "level": level,
                    "original_filename": original_name,
                    "output_filename": output_name,
                    "output_format": "wav",
                    "file_size": size,
                    "duration": result_duration,
                    "sample_rate": rate,
                    "channels": channels,
                    "expires_at": int(time.time()) + self.config.retention,
                    "preview_url": f"/api/noise-removal/{token}/audio",
                    "download_url": f"/api/noise-removal/{token}/audio?download=true",
                }
        except NoiseError:
            raise
        except Exception as exc:
            logger.exception("Unexpected noise-removal failure")
            raise NoiseError(
                500, "Noise removal failed. Please try again later."
            ) from exc
        finally:
            self.slots.release()
    def process_bytes(self, content: bytes, filename: str, level: str):
        suffix = validate_upload(filename, "audio/wav", level)
        ffmpeg, ffprobe = self.dependencies()
        if not self.slots.acquire(blocking=False):
            raise NoiseError(503, "Noise removal is busy. Please try again shortly.")
        try:
            deadline = time.monotonic() + self.config.timeout
            with self.storage.workspace() as directory:
                source = directory / f"input{suffix}"
                with source.open("xb") as output:
                    output.write(content)
                if len(content) == 0:
                    raise NoiseError(400, "The audio content is empty.")
                validate_signature(content[:16], suffix)
                rate, channels = self.inspect(source, ffprobe, deadline, suffix)
                decoded = directory / "decoded.wav"
                self.run(
                    [
                        ffmpeg,
                        "-nostdin",
                        "-hide_banner",
                        "-v",
                        "error",
                        "-xerror",
                        "-protocol_whitelist",
                        "file",
                        "-format_whitelist",
                        "wav,mp3,aac,mov",
                        "-threads",
                        "1",
                        "-i",
                        str(source),
                        "-map",
                        "0:a:0",
                        "-vn",
                        "-sn",
                        "-dn",
                        "-map_metadata",
                        "-1",
                        "-t",
                        str(self.config.max_duration + 1),
                        "-ac",
                        str(channels),
                        "-ar",
                        str(rate),
                        "-c:a",
                        "pcm_f32le",
                        str(decoded),
                    ],
                    deadline,
                    directory,
                    invalid_input=True,
                )
                fs, samples = wavfile.read(decoded, mmap=True)
                try:
                    frame_count = len(samples)
                    duration = frame_count / fs
                    if duration <= 0:
                        raise NoiseError(400, "The file contains no audio samples.")
                    if duration > self.config.max_duration:
                        raise NoiseError(
                            413,
                            f"Audio must be no longer than {self.config.max_duration} seconds.",
                        )
                    for start in range(0, len(samples), 65536):
                        if not np.isfinite(samples[start : start + 65536]).all():
                            raise NoiseError(
                                400, "Audio contains invalid, non-finite samples."
                            )
                    measured_floor = estimate_noise_floor(samples, fs)
                finally:
                    if isinstance(samples, np.memmap):
                        samples._mmap.close()
                cleaned = directory / "cleaned.wav"
                if time.monotonic() >= deadline:
                    raise NoiseError(504, "Audio processing timed out. Try a shorter file.")
                _, decoded_samples = wavfile.read(decoded)
                denoised = spectral_gate(decoded_samples, fs, level)
                wavfile.write(cleaned, fs, np.rint(np.clip(denoised, -1, 1) * 32767).astype(np.int16))
                result_rate, result_samples = wavfile.read(cleaned, mmap=True)
                try:
                    result_channels = (
                        1 if result_samples.ndim == 1 else result_samples.shape[1]
                    )
                    if result_samples.dtype != np.int16 or result_channels != channels:
                        raise NoiseError(
                            500,
                            "Noise removal produced an invalid output. Please try again.",
                        )
                    result_duration = len(result_samples) / result_rate
                    if len(result_samples) != frame_count or result_rate != fs:
                        raise NoiseError(
                            500,
                            "Noise removal produced an incomplete output. Please try again.",
                        )
                finally:
                    if isinstance(result_samples, np.memmap):
                        result_samples._mmap.close()
                original_name = safe_filename(filename)
                size = cleaned.stat().st_size
                token, _ = self.storage.publish(cleaned)
                output_name = f"cleaned-{token[:12]}.wav"
                return {
                    "status": "completed",
                    "id": token,
                    "level": level,
                    "original_filename": original_name,
                    "output_filename": output_name,
                    "output_format": "wav",
                    "file_size": size,
                    "duration": result_duration,
                    "sample_rate": rate,
                    "channels": channels,
                    "expires_at": int(time.time()) + self.config.retention,
                    "preview_url": f"/api/noise-removal/{token}/audio",
                    "download_url": f"/api/noise-removal/{token}/audio?download=true",
                }
        except NoiseError:
            raise
        except Exception as exc:
            logger.exception("Unexpected noise-removal failure")
            raise NoiseError(
                500, "Noise removal failed. Please try again later."
            ) from exc
        finally:
            self.slots.release()
