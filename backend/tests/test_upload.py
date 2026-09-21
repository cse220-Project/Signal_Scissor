import asyncio
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from scipy.io import wavfile
from fastapi import HTTPException, UploadFile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class UploadTests(unittest.TestCase):
    def setUp(self):
        self.previous_state = server.state
        server.state = server.SignalState()
        self.directory = tempfile.TemporaryDirectory()
        self.tempfile = tempfile.NamedTemporaryFile
        self.temp_patch = patch.object(
            server.tempfile, "NamedTemporaryFile",
            side_effect=lambda **kwargs: self.tempfile(dir=self.directory.name, **kwargs),
        )
        self.temp_patch.start()

    def tearDown(self):
        self.temp_patch.stop()
        server.state = self.previous_state
        self.assertEqual(list(Path(self.directory.name).iterdir()), [])
        self.directory.cleanup()

    def upload(self, content):
        return asyncio.run(server.upload_audio(UploadFile(filename="audio.wav", file=io.BytesIO(content))))

    def wav(self, data):
        stream = io.BytesIO()
        wavfile.write(stream, 8000, data)
        return stream.getvalue()

    def reject(self, content):
        with self.assertRaises(HTTPException) as caught:
            self.upload(content)
        self.assertEqual(caught.exception.status_code, 400)
        self.assertIsNone(server.state.signal)
        return caught.exception.detail

    def test_real_wav_metadata_waveform_and_serialization(self):
        content = (Path(__file__).resolve().parents[2] / "audio/test_valid.wav").read_bytes()
        response = self.upload(content)
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.body)
        fs, raw = wavfile.read(io.BytesIO(content))
        self.assertEqual(payload["sample_rate"], fs)
        self.assertEqual(payload["samples"], len(raw))
        self.assertEqual(payload["duration"], len(raw) / fs)
        self.assertEqual(payload["original_waveform"]["count"], 1200)
        self.assertTrue(any(payload["original_waveform"]["peaks"]))
        self.assertEqual(payload["original_waveform"], payload["processed_waveform"])
        np.testing.assert_allclose(server.state.signal, raw.astype(np.float32) / 32768)

    def test_empty_file(self):
        self.assertIn("empty", self.reject(b""))

    def test_corrupt_file_logs_traceback(self):
        with self.assertLogs(server.logger, level="WARNING") as logs:
            self.assertIn("Could not decode", self.reject(b"not a WAV"))
        self.assertIsNotNone(logs.records[0].exc_info)

    def test_unsupported_encoding(self):
        content = bytearray(self.wav(np.zeros(100, dtype=np.int16)))
        content[20:22] = (7).to_bytes(2, "little")  # mu-law, unsupported by scipy
        with self.assertLogs(server.logger, level="WARNING"):
            self.reject(bytes(content))

    def test_empty_pcm(self):
        self.reject(self.wav(np.zeros(0, dtype=np.int16)))

    def test_nonfinite_samples(self):
        self.reject(self.wav(np.array([0.0, np.nan], dtype=np.float32)))

    def test_supported_widths_and_channels(self):
        for dtype in (np.uint8, np.int16, np.int32, np.float32):
            for channels in (1, 2):
                with self.subTest(dtype=dtype, channels=channels):
                    shape = (800,) if channels == 1 else (800, channels)
                    response = self.upload(self.wav(np.zeros(shape, dtype=dtype)))
                    self.assertEqual(json.loads(response.body)["num_channels"], channels)

    def test_storage_failure_is_logged_without_leaking_details(self):
        with patch.object(server.tempfile, "NamedTemporaryFile", side_effect=OSError("private path")):
            with self.assertLogs(server.logger, level="ERROR") as logs:
                with self.assertRaises(HTTPException) as caught:
                    self.upload(b"RIFF")
        self.assertEqual(caught.exception.status_code, 500)
        self.assertIn("creating temporary file", caught.exception.detail)
        self.assertNotIn("private path", caught.exception.detail)
        self.assertIsNotNone(logs.records[0].exc_info)

    def test_serialization_failure_is_logged(self):
        with patch.object(server, "get_full_state_payload", return_value={"bad": np.int64(1)}):
            with self.assertLogs(server.logger, level="ERROR"):
                with self.assertRaises(HTTPException) as caught:
                    self.upload(self.wav(np.zeros(800, dtype=np.int16)))
        self.assertEqual(caught.exception.status_code, 500)
        self.assertIn("serializing upload response", caught.exception.detail)


if __name__ == "__main__":
    unittest.main()
