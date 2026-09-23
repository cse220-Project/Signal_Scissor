"""HTTP, safety, cleanup, and real FFmpeg regression tests; tiny generated audio."""

import io
import os
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient
from scipy.io import wavfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import noise_routes
import server
from noise_config import NOISE_LEVELS, NoiseConfig
from noise_service import NoiseError, NoiseService

HAS_FFMPEG = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))


def fixture():
    fs = 16000
    t = np.arange(fs * 3) / fs
    rng = np.random.default_rng(42)
    data = 0.02 * rng.normal(size=t.size) + 0.015 * np.sin(2 * np.pi * 60 * t)
    data[fs:] += 0.3 * np.sin(2 * np.pi * 440 * t[fs:])
    output = io.BytesIO()
    wavfile.write(output, fs, (data * 32767).astype(np.int16))
    return output.getvalue()


class NoiseTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.config = NoiseConfig(storage_dir=Path(self.directory.name), max_duration=5)
        self.service = NoiseService(self.config)
        self.patch = patch.object(noise_routes, "service", self.service)
        self.patch.start()
        self.client = TestClient(server.app)
        self.content = fixture()

    def tearDown(self):
        if self.service.storage.work.exists():
            self.assertEqual(list(self.service.storage.work.iterdir()), [])
        self.client.close()
        self.patch.stop()
        self.directory.cleanup()

    def post(self, content=None, name="sample.wav", mime="audio/wav", level="balanced"):
        return self.client.post(
            "/api/noise-removal",
            files={"file": (name, self.content if content is None else content, mime)},
            data={"level": level},
        )

    def assert_error(self, response, status):
        self.assertEqual(response.status_code, status, response.text)
        self.assertIn("detail", response.json())
        self.assertNotIn(self.directory.name, response.text)
        if self.service.storage.results.exists():
            self.assertEqual(list(self.service.storage.results.iterdir()), [])

    def test_config(self):
        result = self.client.get("/api/noise-removal/config").json()
        self.assertEqual(result["max_bytes"], self.config.max_bytes)
        self.assertEqual(result["levels"], list(NOISE_LEVELS))

    def test_missing_file(self):
        self.assert_error(
            self.client.post("/api/noise-removal", data={"level": "balanced"}), 422
        )

    def test_invalid_level(self):
        self.assert_error(self.post(level="danger; rm -rf /"), 422)

    def test_invalid_extension(self):
        self.assert_error(self.post(name="audio.exe"), 415)

    def test_invalid_mime(self):
        self.assert_error(self.post(mime="text/plain"), 415)

    def test_missing_dependency(self):
        with patch("noise_service.shutil.which", return_value=None):
            self.assert_error(self.post(), 503)
            self.assertFalse(
                self.client.get("/api/noise-removal/config").json()["available"]
            )

    def test_unknown_or_traversal_result(self):
        for token in ("a" * 64, "not-a-token", "..%2F..%2Fserver.py"):
            response = self.client.get(f"/api/noise-removal/{token}/audio")
            self.assertEqual(response.status_code, 404)

    def test_upload_body_limit_including_chunked(self):
        with patch.object(self.service, "config", replace(self.config, max_bytes=100)):
            self.assert_error(
                self.client.post("/api/noise-removal", content=b"x" * 66000), 413
            )
            self.assert_error(
                self.client.post(
                    "/api/noise-removal", content=iter([b"x" * 33000, b"y" * 33000])
                ),
                413,
            )

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg and FFprobe for real media tests")
    def test_real_processing_all_levels_and_original_preserved(self):
        original_stats = server.state.__dict__.copy()
        before = self.content
        fs, raw = wavfile.read(io.BytesIO(before))
        for level in NOISE_LEVELS:
            with self.subTest(level=level):
                result = self.post(level=level)
                self.assertEqual(result.status_code, 200, result.text)
                data = result.json()
                self.assertEqual(data["level"], level)
                self.assertEqual(data["duration"], 3)
                audio = self.client.get(data["preview_url"])
                rate, clean = wavfile.read(io.BytesIO(audio.content))
                self.assertEqual(rate, fs)
                self.assertEqual(len(clean), len(raw))
                self.assertEqual(len(audio.content), data["file_size"])
                # Stationary noise is reduced, without merely muting the signal.
                quiet = slice(fs // 2, fs)
                self.assertLess(
                    np.std(clean[quiet]),
                    np.std(raw[quiet])
                    * {"light": 0.8, "balanced": 0.65, "strong": 0.5}[level],
                )
                self.assertGreater(np.std(clean[fs:]), np.std(raw[fs:]) * 0.65)
                self.assertLessEqual(np.max(np.abs(clean.astype(float))), 32767)
                download = self.client.get(data["download_url"])
                self.assertIn("attachment", download.headers["content-disposition"])
                self.assertIn(
                    data["output_filename"], download.headers["content-disposition"]
                )
                self.assertEqual(download.content, audio.content)
                ranged = self.client.get(
                    data["preview_url"], headers={"Range": "bytes=0-31"}
                )
                self.assertEqual(ranged.status_code, 206)
                self.assertEqual(ranged.content, audio.content[:32])
        self.assertEqual(before, self.content)
        self.assertEqual(server.state.__dict__, original_stats)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_empty_corrupt_and_signature_mismatch(self):
        for content in (b"", b"not wav", b"RIFF\x00\x00\x00\x00WAVEbroken"):
            self.assert_error(self.post(content=content), 400)
        self.assert_error(self.post(name="sample.mp3", mime="audio/mpeg"), 400)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_file_size_and_duration_limits(self):
        with patch.object(self.service, "config", replace(self.config, max_bytes=100)):
            self.assert_error(self.post(content=self.content[:1000]), 413)
        with patch.object(self.service, "config", replace(self.config, max_duration=1)):
            self.assert_error(self.post(), 413)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_nonfinite_samples(self):
        output = io.BytesIO()
        wavfile.write(output, 16000, np.array([0, np.nan, 0], dtype=np.float32))
        self.assert_error(self.post(content=output.getvalue()), 400)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_failure_removes_partial_files(self):
        run = self.service.run

        def fail(args, *rest, **kwargs):
            if "-af" in args:
                Path(args[-1]).write_bytes(b"partial")
                raise NoiseError(500, "Noise removal failed.")
            return run(args, *rest, **kwargs)

        with patch.object(self.service, "run", side_effect=fail):
            self.assert_error(self.post(), 500)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_process_timeout_and_exit_status(self):
        with patch(
            "noise_service.subprocess.run",
            side_effect=subprocess.TimeoutExpired("ffmpeg", 1),
        ):
            self.assert_error(self.post(), 504)
        with patch(
            "noise_service.subprocess.run",
            return_value=subprocess.CompletedProcess([], 1),
        ):
            self.assert_error(self.post(), 400)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_safe_filename_and_expiration(self):
        result = self.post(name="../../secrets/evil;$(touch pwned).wav").json()
        self.assertNotIn("/", result["original_filename"])
        self.assertNotIn("$", result["original_filename"])
        target = self.service.storage.resolve(result["id"])
        self.assertEqual(target.parent, self.service.storage.results)
        unrelated = self.service.storage.results / "keep.txt"
        unrelated.write_text("unrelated")
        old = time.time() - self.config.retention - 1
        os.utime(target, (old, old))
        response = self.client.get(result["preview_url"])
        self.assertEqual(response.status_code, 404)
        self.assertIn("expired", response.json()["detail"])
        self.service.storage.cleanup()
        self.assertFalse(target.exists())
        self.assertTrue(unrelated.exists())

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_busy(self):
        for _ in range(self.config.max_concurrent):
            self.service.slots.acquire()
        try:
            self.assert_error(self.post(), 503)
        finally:
            for _ in range(self.config.max_concurrent):
                self.service.slots.release()

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_supported_compressed_formats_and_stereo(self):
        source = Path(self.directory.name) / "source.wav"
        source.write_bytes(self.content)
        for extension, mime, codec in [
            ("mp3", "audio/mpeg", "libmp3lame"),
            ("m4a", "audio/mp4", "aac"),
            ("aac", "audio/aac", "aac"),
        ]:
            with self.subTest(extension=extension):
                target = source.with_suffix(f".{extension}")
                subprocess.run(
                    [
                        "ffmpeg",
                        "-v",
                        "error",
                        "-i",
                        str(source),
                        "-ac",
                        "2",
                        "-c:a",
                        codec,
                        str(target),
                    ],
                    check=True,
                )
                response = self.post(
                    content=target.read_bytes(), name=target.name, mime=mime
                )
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()["channels"], 2)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_latency_tail_and_sample_counts_at_supported_rates(self):
        for fs in (8000, 44100, 96000):
            with self.subTest(sample_rate=fs):
                samples = np.zeros(fs // 4, dtype=np.int16)
                samples[0] = 16000
                samples[-1] = 16000
                buf = io.BytesIO()
                wavfile.write(buf, fs, samples)
                response = self.post(content=buf.getvalue(), level="light")
                self.assertEqual(response.status_code, 200, response.text)
                audio = self.client.get(response.json()["preview_url"]).content
                rate, cleaned = wavfile.read(io.BytesIO(audio))
                self.assertEqual(rate, fs)
                self.assertEqual(len(cleaned), len(samples))
                self.assertGreater(abs(int(cleaned[0])), 8000)
                self.assertGreater(abs(int(cleaned[-1])), 8000)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_short_silent_recording(self):
        buf = io.BytesIO()
        wavfile.write(buf, 16000, np.zeros(80, dtype=np.int16))
        response = self.post(content=buf.getvalue())
        self.assertEqual(response.status_code, 200, response.text)
        _, samples = wavfile.read(
            io.BytesIO(self.client.get(response.json()["preview_url"]).content)
        )
        self.assertEqual(len(samples), 80)
        self.assertFalse(np.any(samples))

    def test_body_storage_failure_is_json_without_internal_details(self):
        with (
            patch(
                "noise_routes.tempfile.SpooledTemporaryFile",
                side_effect=OSError("private path"),
            ),
            self.assertLogs("noise_routes", level="ERROR"),
        ):
            response = self.post()
        self.assert_error(response, 500)
        self.assertNotIn("private path", response.text)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_workspace_storage_failure(self):
        with (
            patch.object(
                self.service.storage, "prepare", side_effect=OSError("private path")
            ),
            self.assertLogs("noise_service", level="ERROR"),
        ):
            response = self.post()
        self.assert_error(response, 500)
        self.assertNotIn("private path", response.text)

    @unittest.skipUnless(HAS_FFMPEG, "Install FFmpeg")
    def test_codec_and_video_validation(self):
        source = Path(self.directory.name) / "source.wav"
        source.write_bytes(self.content)
        encoded = source.with_name("encoded.wav")
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-i",
                str(source),
                "-c:a",
                "adpcm_ima_wav",
                str(encoded),
            ],
            check=True,
        )
        self.assert_error(self.post(content=encoded.read_bytes()), 415)
        video = source.with_name("video.m4a")
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-f",
                "lavfi",
                "-i",
                "color=size=16x16:duration=1",
                "-i",
                str(source),
                "-shortest",
                "-c:v",
                "mpeg4",
                "-c:a",
                "aac",
                "-f",
                "mp4",
                str(video),
            ],
            check=True,
        )
        self.assert_error(
            self.post(content=video.read_bytes(), name="video.m4a", mime="audio/mp4"),
            415,
        )

    def test_existing_dsp_endpoints_still_work(self):
        previous = server.state
        server.state = server.SignalState()
        try:
            self.assertEqual(self.client.get("/api/health").status_code, 200)
            self.assertTrue(
                self.client.get("/api/signal/test?preset=tones").json()["loaded"]
            )
            self.assertEqual(
                self.client.post(
                    "/api/process/filter",
                    json={
                        "enabled": True,
                        "low_freq": 900,
                        "high_freq": 1100,
                        "operation": "cut",
                    },
                ).status_code,
                200,
            )
            self.assertEqual(
                self.client.post(
                    "/api/process/effects", json={"gain": 0.9}
                ).status_code,
                200,
            )
            self.assertEqual(self.client.get("/api/export/wav").content[:4], b"RIFF")
            self.assertEqual(self.client.get("/api/audio/original").status_code, 200)
            self.assertEqual(self.client.get("/api/audio/processed").status_code, 200)
            self.assertEqual(self.client.post("/api/reset").status_code, 200)
        finally:
            server.state = previous

    def test_lifespan_cleans_expired_outputs_without_new_requests(self):
        self.service.storage.prepare()
        target = self.service.storage.results / ("a" * 64 + ".wav")
        target.write_bytes(b"expired")
        old = time.time() - self.config.retention - 1
        os.utime(target, (old, old))
        with TestClient(server.app):
            deadline = time.monotonic() + 3
            while target.exists() and time.monotonic() < deadline:
                time.sleep(0.01)
            self.assertFalse(target.exists())

    def test_crash_cleanup_does_not_remove_active_or_unrelated_files(self):
        self.service.storage.prepare()
        abandoned = self.service.storage.work / "job-abandoned"
        abandoned.mkdir()
        (abandoned / "input.wav").write_bytes(b"partial")
        active = self.service.storage.work / "job-active"
        active.mkdir()
        unrelated = self.service.storage.work / "user-data"
        unrelated.mkdir()
        old = time.time() - self.config.timeout - 3601
        os.utime(abandoned, (old, old))
        os.utime(unrelated, (old, old))
        self.service.storage.cleanup()
        self.assertFalse(abandoned.exists())
        self.assertTrue(active.exists())
        self.assertTrue(unrelated.exists())
        active.rmdir()
        unrelated.rmdir()


if __name__ == "__main__":
    unittest.main()
