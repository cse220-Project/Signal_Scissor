# Feature-to-function integration

Prepared before implementation. Reference `../frontend template` remains read-only.

| Template page/control | Project function / data | Connection |
| --- | --- | --- |
| Sidebar, mobile navigation, seven pages | Existing `App.tsx` routes | Explicit TSX entry point; shared session/player provider |
| Upload, browse, drag/drop | `useAudioStore.uploadFile` → `uploadAudioFile` → `/api/signal/upload` | Existing WAV contract; navigate only after success |
| Microphone start/stop | `useAudioRecorder` → `uploadFile` | Decode real browser recording and encode PCM WAV; release microphone on completion/unmount |
| Presets and sine generator | `loadPreset`, `generateCustomTone`, existing WAV encoder | Existing project signals and calculations |
| Play/pause, stop, seek, skip, mute, volume, repeat, A/B | `useAudioPlayer` and playback setters | One engine shared across routed pages; track and processed-buffer refresh fixes |
| Waveform, FFT, analysis | `original_waveform`, `processed_waveform`, spectra and stats | Existing renderers and API data; common timeline aligned to payload duration |
| Frequency bands, mode, strength, bypass | `setFilter`, `applyFilterAction`, `applyFullPipeline` | Existing `/api/process/filter` and `/api/process/all` payloads |
| Gain, delay, frequency shift in Hz, echo delay/feedback/taps/mix | `setEffects`, `applyEffectsAction` | Existing `/api/process/effects`; Hz translation is not semitone pitch shifting |
| Effects presets/categories | `REAL_LIFE_PRESETS`, `applyRealLifePreset` | Existing project parameters; no template effect-chain mocks |
| Impulse response inspector | `updateImpulseResponse` → `/api/impulse-response` | Fetch current controls before opening |
| Comparison graphs, A/B, metric deltas | Existing visualizers/player, `get_signal_stats` | Expose original stats alongside processed stats; no processing changes |
| Download WAV, reset | `getExportWavUrl`, `resetToOriginal` | Existing 16-bit PCM export and reset |
| Theory tabs, simulations, quiz | Existing page handlers/calculations | Retain existing interactions |
| Settings and status | `/api/health`, real signal metadata | Disable settings without an implemented engine connection |
| Original workstation controls | Existing `App.jsx` and its handlers | Retained at `/workstation`, separate session; return via full reload to resync state |
| Spectrogram, trim, semitone pitch, independent time stretch, FFT-window/phase-lock controls, arbitrary effect chain, playback-rate menu, file history/delete | No matching project API/function | Hidden or explicitly disabled, no invented data or processing |
| Additional synthetic waveform families, amplitude/sample-rate/name controls from template | No corresponding existing generator parameters | Hidden; retain current sine frequency/duration and project presets |

Small backend connection: read-only `/api/signal/state`, plus `original_stats` from the existing `get_signal_stats`. No DSP algorithm edits.
