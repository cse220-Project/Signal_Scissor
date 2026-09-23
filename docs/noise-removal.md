# Noise Remover

Open **Noise Remover** in the sidebar or mobile navigation (`/noise-remover`). Select or drop one audio file, choose Light, Balanced (default), or Strong, and select **Remove Noise**. Compare the original and cleaned players, then download the WAV before its displayed expiration time. Reset clears the page and releases the browser's local file URL. Navigating away aborts the browser request; any server processing already started is bounded by its deadline and its result expires normally.

Processing runs locally on the FastAPI server. No recordings are sent to third-party APIs. The feature has its own storage and does not alter the workstation's in-memory original signal, processing settings, or output.

## Processing and supported media

- Inputs: `.wav` (PCM, including float), `.mp3` (MP3), `.m4a` (AAC/ALAC), `.aac` (ADTS AAC).
- Exactly one mono or stereo audio stream; sample rate 8–96 kHz. Video and embedded video/cover-art streams are rejected. This project has no video workflow.
- Defaults: 25 MiB upload, 300 seconds duration, 120-second total processing deadline, two simultaneous jobs **per backend process**.
- Output: 16-bit PCM WAV, preserving the input channel count and sample rate. User metadata is stripped.
- Browser original-preview codec support varies. Cleaned WAV remains playable even when the browser cannot preview the input format.

FFmpeg's [FFT denoiser (`afftdn`)](https://ffmpeg.org/ffmpeg-filters.html#afftdn) uses a noise floor estimated from the quieter 20th percentile of 50 ms windows across the recording. It does not assume the first moments are noise-only. The estimate is capped conservatively for recordings with continuous speech. A gentle high-pass filter reduces low-frequency rumble, and a limiter only attenuates peaks approaching clipping, with automatic gain disabled and latency compensation enabled. Padding and sample-accurate trimming compensate the FFT denoiser’s delay and flush the final audio window, preserving the exact decoded frame count. Presets are centralized in `backend/noise_config.py`:

| Level | High-pass | Noise reduction | Measured-floor adjustment | Gain smoothing |
| --- | --- | --- | --- | --- |
| Light | 40 Hz | 6 dB | −4 dB | 6 |
| Balanced | 65 Hz | 12 dB | 0 dB | 8 |
| Strong | 85 Hz | 20 dB | +3 dB | 10 |

The resulting noise-floor setting is clamped between −80 and −25 dB. These are filter settings, not guaranteed measured reductions. Best results are with steady fan/air-conditioner noise, low hum, or light static. Other speakers, music, sudden sounds, severe distortion, or changing environments may remain. Strong processing can alter speech or music. No automatic loudness normalization or speech-recognition model is used.

## Setup and development

Install an actively maintained FFmpeg build with `afftdn`, `highpass`, and `alimiter` (FFmpeg 6 or later recommended) and FFprobe:

```sh
# macOS
brew install ffmpeg
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install ffmpeg

ffmpeg -version
ffprobe -version
ffmpeg -hide_banner -h filter=afftdn
ffmpeg -hide_banner -h filter=alimiter
```

Windows: install a maintained Windows build linked from [FFmpeg Downloads](https://ffmpeg.org/download.html), add its `bin` directory to PATH, or configure the two executable paths below. Missing binaries produce a startup warning and a clear 503 response, without breaking existing DSP endpoints. A build missing filters produces a logged processing failure; install a full supported build.

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements-dev.txt
# Optional: copy and customize backend/.env.example as backend/.env
set -a
. backend/.env.example
set +a
.venv/bin/python -m uvicorn server:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Production needs only `backend/requirements.txt`; HTTPX and Ruff are development tools. The frontend adds no new package dependencies. The existing `VITE_API_BASE_URL` setting is unchanged; an empty value uses relative `/api` URLs. A separately hosted API can be configured with `VITE_API_BASE_URL=https://your-api.example` at build time.

## Environment settings

Backend configuration is read at import/startup. Restart the server after changing settings. `.env` is not loaded implicitly: export variables in the process manager or source the trusted file as above. `backend/.env.example` contains no credentials.

| Variable | Default | Meaning |
| --- | --- | --- |
| `NOISE_MAX_UPLOAD_MB` | `25` | Maximum file bytes in MiB (1–500) |
| `NOISE_MAX_DURATION_SECONDS` | `300` | Maximum decoded duration (1–3600 seconds) |
| `NOISE_PROCESS_TIMEOUT_SECONDS` | `120` | Shared deadline across inspection, decoding, filtering (1–900 seconds) |
| `NOISE_RETENTION_SECONDS` | `3600` | Generated-file lifetime (1–604800 seconds) |
| `NOISE_CLEANUP_INTERVAL_SECONDS` | `300` | Background cleanup frequency (1–3600 seconds) |
| `NOISE_MAX_CONCURRENT` | `2` | Simultaneous processor jobs per backend worker (1–16) |
| `NOISE_STORAGE_DIR` | System temp + `signal-scissors-noise` | Private storage parent; service owns only `noise-removal-v1` beneath it |
| `NOISE_FFMPEG_PATH` | `ffmpeg` | Trusted executable name or absolute path |
| `NOISE_FFPROBE_PATH` | `ffprobe` | Trusted executable name or absolute path |

## API

`GET /api/noise-removal/config` reports supported formats, levels, actual configured limits, retention, and binary availability. The UI uses this rather than duplicated upload limits.

`POST /api/noise-removal` accepts multipart `file` and `level` (`light`, `balanced`, `strong`; defaults to `balanced`). The request completes synchronously in FastAPI's thread pool. There is no job queue. The UI shows actual upload bytes, followed by an indeterminate processing state.

```sh
curl --fail-with-body \
  -F 'file=@recording.wav;type=audio/wav' \
  -F 'level=balanced' \
  http://127.0.0.1:8000/api/noise-removal
```

Example response (identifier and expiration vary):

```json
{
  "status": "completed",
  "id": "<64-character-random-hex-token>",
  "level": "balanced",
  "original_filename": "recording.wav",
  "output_filename": "cleaned-0123456789ab.wav",
  "output_format": "wav",
  "file_size": 96078,
  "duration": 3.0,
  "sample_rate": 16000,
  "channels": 1,
  "expires_at": 1790100000,
  "preview_url": "/api/noise-removal/<token>/audio",
  "download_url": "/api/noise-removal/<token>/audio?download=true"
}
```

`GET /api/noise-removal/{token}/audio` serves WAV with inline disposition and supports byte-range playback. Add `?download=true` for an attachment. Filenames are server-controlled; the original filename is sanitized display metadata. Expired, unknown, and malformed identifiers return JSON 404 errors.

Errors use the existing FastAPI `detail` convention: 400 empty/corrupt/invalid samples, 413 size/duration limits, 415 unsupported MIME/extension/container/codec/stream, 422 missing file or unsupported level, 503 unavailable binaries or busy workers, 504 processing deadline exceeded, 500 unexpected processing/storage failures. Framework validation errors may have an array in `detail`; the UI handles both shapes. Internal paths, commands, and diagnostic output stay in server logs.

## Storage, security, and production

Uploads are bounded before multipart parsing, including chunked bodies, with up to 64 KiB of multipart overhead. A second limit checks the actual file. Content type and extension are allowlisted, headers are checked, and FFprobe/FFmpeg inspect the real container, codec, duration, and decoded samples. Unknown/generic browser MIME types are accepted only as `application/octet-stream` and must pass the remaining checks. Commands use fixed executable argument arrays, no shell, restricted file protocols/demuxers, and server-owned filter strings.

Originals are never overwritten. Request-local uploads, decoded scratch audio, processor diagnostics, and failed partial output are removed when the request finishes. Successful outputs are atomically published as 256-bit random identifiers in a private directory (0700) with private files (0600). Results are not served by a static mount. URLs are bearer capabilities: anyone possessing one can access that result until it expires. The existing project has no login, authorization layer, or rate limiter, so none is bypassed or silently replaced here.

A lifespan task cleans expired outputs at startup and every configured cleanup interval, even when there are no new requests. Expired files are refused immediately on access. Abandoned `job-*` work directories from a crash are reaped after the processing timeout plus one hour. Cleanup only touches the service's generated naming patterns within its owned subdirectories. Files persist while the app is stopped; on restart the cleanup task resumes. An offline/manual cleanup can use the same configuration:

```sh
cd backend
../.venv/bin/python -c 'from noise_config import NoiseConfig; from noise_storage import NoiseStorage; NoiseStorage(NoiseConfig.from_env()).cleanup()'
```

Deploy with HTTPS, a current patched FFmpeg, an unprivileged service account, and a private writable storage volume. Set proxy body limits slightly above the application upload limit (e.g. `26m` for the default), request/upload timeouts, and proxy response timeout above the processing deadline plus upload time. Apply ingress rate/connection limits for public deployments; the processing semaphore bounds active FFmpeg jobs, not inbound connection count. Preserve the result URL path/query when proxying range requests. Avoid logging or sharing bearer result URLs.

Use one backend worker for this existing in-memory workstation. If running multiple workers/instances, the rest of the workstation already lacks shared session state; noise results additionally need a shared private volume or sticky routing. Job concurrency is per process. Provision scratch disk for decoded float WAV (up to roughly 230 MB per default-limit 96 kHz stereo input) plus uploads, results, and retention traffic. Monitor free space and processing failures; tune duration/concurrency/retention before exposing large uploads. Run scheduled cleanup with the same private-volume configuration if the application will stay stopped for extended periods.

## Tests and verification

```sh
# From repository root; FFmpeg must be installed for the real-media tests
.venv/bin/python -m unittest discover -s backend/tests -v
.venv/bin/ruff format --check backend/noise_*.py backend/tests/test_noise_removal.py
.venv/bin/ruff check backend/noise_*.py backend/tests/test_noise_removal.py
cd frontend
npm test
npm run lint
npm run build
```

Tests generate tiny fixtures in temporary directories; no large media is committed. Backend tests cover each real denoising level, measurable stationary-noise reduction and retained foreground, all four formats and stereo, validation, dependency failure, nonzero exits/timeouts, saturation limits, safe names, byte ranges, expiry and cleanup. Missing FFmpeg explicitly skips media tests: a production verification should have **zero skips**. Existing upload tests run alongside them. Frontend unit tests cover file validation and safe errors.

The browser script exercises actual backend processing (only its error-display scenario injects a 503), file selection, validation, level selection, disabled/loading states, duplicate prevention, preview playback, downloading, reset, errors, responsive layout, and preservation of the source fixture. With both servers running, install browser tooling separately:

```sh
npm install --prefix /tmp/noise-browser-tools playwright
/tmp/noise-browser-tools/node_modules/.bin/playwright install chromium
# Run from frontend/; optional NOISE_TEST_FILE points to speech plus background noise
PLAYWRIGHT_MODULE_PATH=/tmp/noise-browser-tools/node_modules/playwright/index.mjs \
  node scripts/verify-noise-removal.mjs
```

Optional browser-test environment: `NOISE_TEST_URL` (default `http://127.0.0.1:5173`), `NOISE_TEST_FILE` (default repository `audio/test_valid.wav`), `NOISE_TEST_OUTPUT` (save cleaned WAV), `NOISE_SCREENSHOT` (save page screenshot), and `CHROME_PATH` (use an existing Chrome executable). The default fixture is a tone; use a spoken recording with steady noise for speech-quality review. Automated energy measurements do not replace listening tests on representative recordings.

## Troubleshooting

- **503 unavailable:** check both binaries on the backend process PATH, or configure absolute paths. Restart after changing environment.
- **503 busy:** existing processing slots are occupied. Retry later or review server capacity before raising concurrency.
- **400 corrupt / 415 unsupported:** export a valid mono/stereo PCM WAV, MP3, AAC M4A, or ADTS AAC; remove embedded artwork/video streams if present. Renaming extensions does not convert audio.
- **413:** choose a smaller/shorter recording. UI limits come from the backend; also check proxy limits.
- **504:** use shorter audio, inspect server CPU/disk load, or adjust the configured deadline and proxy timeout together.
- **500:** check protected server logs for missing FFmpeg filters, permission problems, disk exhaustion, or unexpected processor errors. The UI deliberately does not expose internal diagnostics.
- **Preview/download expired:** select the original and process again. Outputs last one hour by default.
- **Voice sounds metallic or softened:** try Light. Very loud or nonstationary noise may not be removable cleanly.

## Implementation files

Created:

- `backend/noise_config.py` — environment limits, denoising presets, and filter construction.
- `backend/noise_service.py` — content validation, noise-floor estimation, bounded FFmpeg processing.
- `backend/noise_storage.py` — private temporary workspaces, atomic results, expiry cleanup.
- `backend/noise_routes.py` — API routes, multipart-body limit, lifecycle cleanup.
- `backend/.env.example` — safe environment defaults.
- `backend/requirements-dev.txt` — HTTPX integration-test support and Ruff formatting/linting.
- `backend/tests/test_noise_removal.py` — real-media, error, security, lifecycle, and DSP regression checks.
- `frontend/src/pages/NoiseRemover.tsx` — themed upload/options/preview/download workflow.
- `frontend/src/api/noiseRemoval.ts` — typed API calls and upload progress.
- `frontend/src/utils/noiseValidation.mjs` — client validation and error formatting.
- `frontend/src/utils/noiseValidation.test.mjs` — dependency-free Node unit tests.
- `frontend/scripts/verify-noise-removal.mjs` — repeatable browser integration checks.
- `docs/noise-removal.md` — this guide.

Modified:

- `backend/server.py` — registers the router and scoped upload middleware.
- `frontend/src/App.tsx` — adds `/noise-remover`.
- `frontend/src/components/layout/SideNav.tsx` — adds navigation entry.
- `frontend/src/components/layout/AppShell.tsx` — adds mobile entry and scrollable navigation to retain all destinations at narrow widths.
- `frontend/src/components/layout/TopBar.tsx` — readable title for the new route.
- `frontend/package.json` — adds the Node unit-test command.
- `README.md` — feature entry point and setup/test instructions.

The earlier UI-theme changes remain intact and are separate from this feature. No existing API route or DSP implementation was replaced.

## Verification record

Implementation verification passed 34 backend tests with no skips, three frontend unit tests, Ruff/Prettier checks on the new code, the production build, and the browser workflow using a 9.2-second synthesized speech recording mixed with static and 60 Hz hum. Balanced processing reduced the noise-only test segment by approximately 9.1 dB; source-file hashing confirmed the original was unchanged, decoded frame counts matched exactly, and no request scratch directories remained. This measurement describes that fixture, not a guarantee for every recording.

The existing frontend lint warnings remain. An additional TypeScript check still reports the pre-existing undefined `stats` reference in `frontend/src/pages/Compare.tsx:125`; that page's existing runtime failure is outside the noise-removal changes. Existing upload tests and health, test-signal, filter, effects, audio-preview, export, and reset API smoke checks pass. This does not assert that every unrelated application feature is defect-free.
