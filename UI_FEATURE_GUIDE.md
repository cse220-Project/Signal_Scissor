# Signal Scissors: UI-to-Code-to-Theory Cheat Sheet

> A quick, practical reference guide for every button, slider, dropdown, and graph in the Signal Scissors Studio workstation. Look at any control on the screen, find it here, and instantly understand what it does, which function runs under the hood, and the core signal-processing concept behind it.

---

## Table of Contents
1. [Global Header & Workflow Controls](#1-global-header--workflow-controls)
2. [Audio Transport & Playback Bar](#2-audio-transport--playback-bar)
3. [Visualizers & Canvas Graphs](#3-visualizers--canvas-graphs)
4. [Fourier Frequency Filter Rack](#4-fourier-frequency-filter-rack)
5. [Acoustic & LTI Effects Rack](#5-acoustic--lti-effects-rack)
6. [Signal Metrics & Measurement Panel](#6-signal-metrics--measurement-panel)
7. [Signal Generator & Capture Lab](#7-signal-generator--capture-lab)
8. [A/B Comparison Lab](#8-ab-comparison-lab)
9. [Impulse Response Inspector Modal](#9-impulse-response-inspector-modal)
10. [Desktop Tkinter GUI Cross-Reference](#10-desktop-tkinter-gui-cross-reference)

---

## 1. Global Header & Workflow Controls

### 1.1 "Reset Signal" Button
* **What it does:** Reverts the active audio session back to the raw, unprocessed original sound. Discards all active filters and effects.
* **How it works:** Calls `resetToOriginal()` in `useAudioStore.ts` $\rightarrow$ sends `POST /api/reset` $\rightarrow$ `server.py:reset_signal()` restores `state.processed = state.signal.copy()`.
* **Theory behind it:** **Identity System / Zero State**. Restoring the baseline reference ensures you can make objective scientific comparisons between the dry input $x[n]$ and modified output $y[n]$.
* **What I should expect:** The processed waveform and spectrum instantly snap back to match the original; all frequency cuts and echo tails disappear; audio playback returns to the original recording.

### 1.2 "Process Pipeline" Button
* **What it does:** Executes the entire signal chain in a single unified pass: Filter $\rightarrow$ Gain $\rightarrow$ Delay $\rightarrow$ Frequency Shift $\rightarrow$ Convolution Echo.
* **How it works:** Calls `applyFullPipeline()` $\rightarrow$ sends `POST /api/process/all` $\rightarrow$ `server.py:apply_all()` executes `process_band()`, `scale_amplitude()`, `time_shift()`, `frequency_shift()`, and `convolution_echo()` sequentially.
* **Theory behind it:** **Cascaded Systems / System Interconnection**. In signal processing, passing a signal through multiple systems in series means the output of stage $k$ becomes the input to stage $k+1$:
  $$y[n] = \mathcal{T}_5\{\mathcal{T}_4\{\mathcal{T}_3\{\mathcal{T}_2\{\mathcal{T}_1\{x[n]\}\}\}\}$$
* **What I should expect:** The waveform, spectrum, and audio update in one step to reflect the combined result of all active rack settings.

---

## 2. Audio Transport & Playback Bar

### 2.1 "A · Original" vs. "B · Processed" Track Switcher
* **What it does:** Toggles playback between the raw audio (Track A) and the modified audio (Track B) on the fly without stopping playback.
* **How it works:** Calls `handleTrackChange()` in `useAudioPlayer.ts`, switching the HTML5 Audio source between `/api/audio/original` and `/api/audio/processed` while maintaining the current playhead position.
* **Theory behind it:** **A/B Perceptual Testing**. Psychoacoustic evaluation requires instant, seamless switching between an untreated reference and a processed signal to evaluate subtle acoustic changes without auditory memory decay.
* **What I should expect:** Immediate switch in what you hear through your headphones/speakers; the active button highlights with a dark pill indicator.

### 2.2 "Play Audio" / "Pause" Button
* **What it does:** Starts or pauses audio playback.
* **How it works:** Toggles `togglePlay()` in `useAudioPlayer.ts`, executing `audioRef.current.play()` or `.pause()`.
* **Theory behind it:** **Digital-to-Analog Conversion (DAC)**. Converts stored discrete floating-point numbers into a continuous electrical voltage that drives speaker cones via browser audio drivers.
* **What I should expect:** Button icon toggles between `play_arrow` and `pause`; the waveform playhead scrubber begins moving smoothly across the canvas.

### 2.3 Scrubber / Seek Bar (Timeline Slider)
* **What it does:** Jumps playback to any point in time within the track.
* **How it works:** `onChange` triggers `seekTo(seconds)` $\rightarrow$ sets `audioRef.current.currentTime = seconds`.
* **Theory behind it:** **Random Access Time Indexing**. Maps a percentage along the UI timeline slider to a continuous time $t$, corresponding to discrete sample index $n = \text{round}(t \cdot f_s)$.
* **What I should expect:** Playhead jumps to the selected time; audio resumes immediately from that position.

### 2.4 VU Meter Bar
* **What it does:** Displays real-time signal loudness and peak levels during playback.
* **How it works:** `useAudioPlayer.ts` reads dynamic audio levels via Web Audio `AnalyserNode` and maps the value to the meter bar's width.
* **Theory behind it:** **Signal Power & Headroom Monitoring**. Green indicates normal signal power; yellow/red indicates signals approaching $1.0$ (0 dBFS) where digital clipping occurs.
* **What I should expect:** Bounces dynamically to the audio rhythm; turns reddish if the signal is driven too loud.

### 2.5 "Export WAV" Button
* **What it does:** Downloads the processed signal as a standalone `.wav` file to your computer.
* **How it works:** Requests `GET /api/export/wav` $\rightarrow$ `server.py:signal_to_wav_bytes()` clamps samples to $[-1.0, 1.0]$, scales by $32767$, and encodes a standard 16-bit PCM WAV file.
* **Theory behind it:** **PCM Quantization**. Converts 32-bit floating-point samples in memory into standard 16-bit signed integer values on disk.
* **What I should expect:** Browser download prompt saves `processed_<filename>.wav`.

---

## 3. Visualizers & Canvas Graphs

### 3.1 Discrete-Time Waveform Canvas (`WaveformCanvas`)
* **What it does:** Displays the audio amplitude over time as an interactive graph.
* **How it works:** `server.py:downsample_envelope()` slices the signal into 600 buckets, extracts min/max pairs, and the HTML5 Canvas draws them as vertical bars at 60 FPS.
* **Theory behind it:** **Time-Domain Signal Representation & Peak Decimation**. Shows $x[n]$ vs. time. Decimating into min/max pairs prevents visual aliasing and browser lag while preserving transient spikes.
* **What I should expect:** Gray bars represent the original wave; dark overlay bars show the processed signal; clicking anywhere on the graph seeks playback to that point.

### 3.2 Magnitude Spectrum Canvas (`SpectrumCanvas`)
* **What it does:** Displays the frequency distribution (pitches) of the audio in decibels (dB).
* **How it works:** `fourier_filter.py:compute_spectrum()` computes the one-sided FFT, converts magnitude to dB ($20 \log_{10}|X|$), and plots frequency along the horizontal axis.
* **Theory behind it:** **Discrete Fourier Transform (DFT)**:
  $$X[k] = \sum_{n=0}^{N-1} x[n] e^{-j \frac{2\pi}{N} kn}$$
  Decomposes the time-domain waveform into pure harmonic frequencies up to the Nyquist limit ($f_s / 2$).
* **What I should expect:** Sharp vertical peaks correspond to pure musical pitches or noise hums; a purple line shows the original spectrum, and a dark line shows the filtered output.

### 3.3 Shaded Filter Band Overlay
* **What it does:** Highlights the frequency range selected by the filter sliders with a colored overlay box.
* **How it works:** `SpectrumCanvas.jsx` reads `filterBand = [low_freq, high_freq]` and paints a semi-transparent band across that exact frequency interval on the canvas.
* **Theory behind it:** **Ideal Filter Passband / Stopband Visualization**. Shows precisely which frequency bins are affected by the band filter.
* **What I should expect:** As you move the frequency sliders, the colored region expands, narrows, or shifts across the frequency spectrum.

---

## 4. Fourier Frequency Filter Rack

### 4.1 "Active / Bypassed" Toggle
* **What it does:** Turns the frequency filter on or off without losing your slider settings.
* **How it works:** Updates `filter.enabled` in Zustand store. When bypassed (`enabled: false`), the processing pipeline skips the Fourier filtering stage.
* **Theory behind it:** **Filter Bypass / Direct Throughput**. Represents a unity frequency response: $H(f) = 1$ across all frequencies.
* **What I should expect:** Controls enable or gray out; when bypassed, the filtered spectrum matches the original.

### 4.2 "Filtering Mode" Dropdown
* **What it does:** Selects how the chosen frequency band is modified.
* **Options & How they work:**
  * **Cut (Bandstop / Notch):** `fourier_filter.py:process_band(..., operation="cut")` sets Fourier coefficients inside the band to zero ($X[k] = 0$).
  * **Keep (Bandpass):** `fourier_filter.py:band_filter(..., mode="keep")` zeroes out all frequencies *outside* the band.
  * **Attenuate (Dampen):** Multiplies Fourier coefficients inside the band by `strength` $< 1.0$ (e.g., $0.3\times$).
  * **Amplify (Boost):** Multiplies Fourier coefficients inside the band by `strength` $> 1.0$ (e.g., $2.0\times$).
* **Theory behind it:** **Frequency-Domain Spectral Masking / Transfer Function $H[k]$**:
  $$Y[k] = X[k] \cdot H[k]$$
* **What I should expect:**
  * *Cut:* The spectral peaks in that band drop to the bottom of the graph ($-\infty\text{ dB}$); that pitch is completely silenced.
  * *Keep:* All other pitches disappear; only the selected band remains audible.
  * *Attenuate:* The selected tone gets quieter.
  * *Amplify:* The selected tone gets noticeably louder.

### 4.3 "Low Cutoff Frequency" Slider
* **What it does:** Sets the lower frequency boundary of the filter band in Hertz.
* **How it works:** Sets `filter.low_freq` $\rightarrow$ defines the lower threshold in `(abs_freqs >= low_freq)`.
* **Theory behind it:** **Corner / Cutoff Frequency ($f_{\text{low}}$)**. Bins with frequencies below this value remain untouched (in Cut mode) or are removed (in Keep mode).
* **What I should expect:** The left edge of the shaded highlight box moves across the spectrum graph.

### 4.4 "High Cutoff Frequency" Slider
* **What it does:** Sets the upper frequency boundary of the filter band in Hertz (capped at Nyquist, $f_s / 2$).
* **How it works:** Sets `filter.high_freq` $\rightarrow$ defines the upper threshold in `(abs_freqs <= high_freq)`.
* **Theory behind it:** **Nyquist-Bounded Bandwidth**. Ensures the filter never exceeds $f_s / 2$, which would violate sampling bounds.
* **What I should expect:** The right edge of the shaded highlight box moves across the spectrum graph.

### 4.5 "Filter Strength Factor" Slider (Appears for Attenuate / Amplify)
* **What it does:** Adjusts how much the selected band is dampened or boosted (from $0.05\times$ to $4.0\times$).
* **How it works:** Sets `filter.strength` $\rightarrow$ `processed_fft[in_band] *= strength`.
* **Theory behind it:** **Linear Coefficient Scaling**. Scales the magnitude of the complex Fourier bins while keeping the phase angle $\theta$ intact.
* **What I should expect:** The spectral peaks within the band rise or fall smoothly according to the multiplier.

### 4.6 Quick Preset Buttons
* **"Telephone (300–3.4k)":** Sets band to $300\text{ Hz} - 3400\text{ Hz}$ in **Keep** mode (simulates copper wire telecommunications bandwidth).
* **"60 Hz Hum Notch":** Sets band to $55\text{ Hz} - 65\text{ Hz}$ in **Cut** mode (removes electrical mains hum).
* **"Hearing Aid (2k–4k)":** Sets band to $2000\text{ Hz} - 4000\text{ Hz}$ in **Amplify** mode at $2.2\times$ (boosts speech clarity).
* **"Rumble Cut (<80Hz)":** Sets band to $0\text{ Hz} - 80\text{ Hz}$ in **Cut** mode (eliminates low-frequency mechanical rumble).
* **What I should expect:** Instantly populates the sliders and mode dropdown with standard real-world parameters.

### 4.7 "Apply Fourier Filter" Button
* **What it does:** Sends the current filter parameters to the backend to compute the FFT, apply the mask, run the inverse FFT (IFFT), and update the audio buffer.
* **How it works:** Calls `applyFilterAction()` $\rightarrow$ sends `POST /api/process/filter`.
* **What I should expect:** A brief loading spinner appears, then the graphs and audio update with the filtered result.

---

## 5. Acoustic & LTI Effects Rack

### 5.1 "Amplitude Gain (Volume Scaling)" Slider
* **What it does:** Uniformly increases or decreases the volume of the entire signal (from $0.1\times$ to $2.5\times$).
* **How it works:** `audio_effects.py:scale_amplitude(signal, factor)` computes $y[n] = A \cdot x[n]$.
* **Theory behind it:** **Scalar Multiplication in Signal Space**. Demonstrates the homogeneity property of linear systems: $\mathcal{T}\{a \cdot x[n]\} = a \cdot \mathcal{T}\{x[n]\}$.
* **What I should expect:** The waveform visually grows taller (amplified) or flatter (attenuated); playback loudness changes accordingly.

### 5.2 "Discrete Time Delay (Shifting)" Slider
* **What it does:** Shifts the entire sound forward in time, introducing leading silence (from $0\text{ ms}$ to $600\text{ ms}$).
* **How it works:** `audio_effects.py:time_shift(signal, fs, delay_ms)` calculates $n_0 = \text{round}((\text{delay}/1000) \cdot f_s)$, inserts $n_0$ zeros at the beginning, and trims the end to maintain buffer length.
* **Theory behind it:** **Time-Shifting Property of LTI Systems**:
  $$y[n] = x[n - n_0]$$
* **What I should expect:** The waveform visibly slides to the right; a flat line of silence appears at the start; playback start is delayed.

### 5.3 "Frequency Shift (Hilbert SSB)" Slider
* **What it does:** Shifts every frequency component up or down by an exact number of Hertz ($-150\text{ Hz}$ to $+150\text{ Hz}$), creating robotic, alien-like timbres.
* **How it works:** `server.py:frequency_shift_channel()` computes the analytic signal using an FFT Hilbert mask ($x_a[n] = x[n] + j\hat{x}[n]$) and multiplies it by $e^{j 2\pi \Delta f t}$.
* **Theory behind it:** **Single-Sideband (SSB) Frequency Translation**. Unlike musical pitch shifting (which multiplies frequencies), translation adds a constant $\Delta f$ to all components. This alters harmonic ratios ($f_2 / f_1$), producing an inharmonic, metallic timbre.
* **What I should expect:** The entire spectrum visibly slides left or right; voices sound robotic like a Dalek or ring modulator.

### 5.4 "Convolution Echo" Toggle
* **What it does:** Enables or disables the multi-tap acoustic echo reflection engine.
* **How it works:** Toggles `effects.echo_enabled` in store $\rightarrow$ controls whether `audio_effects.py:convolution_echo()` is included in the DSP chain.
* **What I should expect:** When enabled, four echo parameter sliders and the "Inspect Impulse Response" button appear.

### 5.5 "Reflection Delay Spacing ($n_0$)" Slider
* **What it does:** Sets the time interval between consecutive echo bounces (from $20\text{ ms}$ to $600\text{ ms}$).
* **How it works:** Sets `echo_delay_ms` $\rightarrow$ spacing sample offset $n_0 = \text{round}((\text{delay}/1000) \cdot f_s)$ in impulse response $h[n]$.
* **Theory behind it:** **Acoustic Multi-Path Propagation Delay**. Corresponds to sound traveling back and forth between reflective walls: $d = v_{\text{sound}} \cdot \Delta t$.
* **What I should expect:** Short delays ($<50\text{ ms}$) sound like metallic room resonance; long delays ($>250\text{ ms}$) produce distinct, repeating canyon-style echoes.

### 5.6 "Decay Factor (Feedback $\alpha$)" Slider
* **What it does:** Controls how quickly the echoes fade away (from $10\%$ to $85\%$).
* **How it works:** Sets `echo_feedback` $\rightarrow$ each $k$-th echo amplitude is scaled by $\alpha^k$.
* **Theory behind it:** **Geometric Energy Dissipation / Surface Absorption**. Each wall bounce absorbs a fraction of sound energy, leading to exponential acoustic decay:
  $$E_k = E_0 \cdot \alpha^k$$
* **What I should expect:** Higher values make echoes linger much longer; lower values make echoes die out almost immediately.

### 5.7 "Number of Echo Taps" Slider
* **What it does:** Sets the total number of distinct echo reflections generated (from 1 to 6).
* **How it works:** Sets `echo_taps` $\rightarrow$ determines how many impulse spikes are added to $h[n]$ at indices $k \cdot n_0$.
* **Theory behind it:** **FIR Filter Order & System Memory**. An $M$-tap echo system has an impulse response length of $M \cdot n_0$ samples.
* **What I should expect:** Increasing taps adds more visible echo reflections to the waveform tail.

### 5.8 "Wet / Dry Reflection Mix" Slider
* **What it does:** Sets the volume balance of the echoes relative to the direct sound ($10\%$ to $100\%$).
* **How it works:** Sets `wet_mix` $\rightarrow$ multiplies all reflection spikes in $h[n]$ by this factor while leaving direct sound $h[0] = 1.0$ untouched.
* **Theory behind it:** **Direct-to-Reverberant Ratio (DRR)**. In acoustics, DRR indicates the listener's distance from the sound source.
* **What I should expect:** Higher values make the echo reflections louder and more pronounced.

### 5.9 "Inspect Impulse Response $h[n]$" Button
* **What it does:** Opens an interactive modal window displaying the discrete stem plot of the echo system's impulse response.
* **How it works:** Opens `ImpulseResponseModal.tsx` $\rightarrow$ requests `GET /api/impulse-response`.
* **Theory behind it:** **The Unit Impulse Response $h[n]$**. Fully characterizes any Linear Time-Invariant system. If you know $h[n]$, the output for *any* input is simply $y[n] = x[n] * h[n]$.
* **What I should expect:** A stem plot appears showing the initial direct spike at $t=0$ followed by decaying reflection stems.

### 5.10 "Apply Acoustic Effects" Button
* **What it does:** Executes all active time-domain and convolution effects and updates the output.
* **How it works:** Calls `applyEffectsAction()` $\rightarrow$ sends `POST /api/process/effects`.
* **What I should expect:** Waveform and audio update to include gain changes, delays, and echo tails.

---

## 6. Signal Metrics & Measurement Panel

### 6.1 "Sampling Rate" & "Nyquist Limit" Displays
* **What they show:** The sampling frequency ($f_s$) and its theoretical maximum reproducible frequency ($f_s / 2$).
* **Theory:** **Nyquist-Shannon Sampling Criterion**. Frequencies above Nyquist will alias and distort.

### 6.2 "Duration" & "Samples ($N$)" Displays
* **What they show:** Total length in seconds and total discrete sample count ($N = f_s \cdot \text{duration}$).
* **What I should expect:** When convolution echo is enabled, the duration and sample count expand to include the reverberant tail.

### 6.3 "RMS Level" Meter
* **What it shows:** The Root-Mean-Square energy of the active audio buffer.
* **How it works:** `signal_analysis.py:rms()` computes:
  $$\text{RMS} = \sqrt{\frac{1}{N}\sum_{n=0}^{N-1} x^2[n]}$$
* **Theory:** **Effective Signal Power**. Represents the true continuous acoustic energy, corresponding directly to perceived human loudness.

### 6.4 "Peak Amplitude" Meter
* **What it shows:** The highest absolute sample value present: $\max |x[n]|$.
* **Theory:** **Headroom & Crest Factor**. Shows how close the signal is to digital clipping ($1.0$).

### 6.5 "Dominant Peak" Display
* **What it shows:** The physical frequency (in Hz) that has the highest magnitude in the spectrum (ignoring DC at $0\text{ Hz}$).
* **How it works:** `signal_analysis.py:dominant_frequency()` finds the peak index in `compute_spectrum` using `np.argmax()`.
* **What I should expect:** Shows the primary musical note or prominent tone in the sound.

---

## 7. Signal Generator & Capture Lab (`/signals` page)

### 7.1 "Carrier Frequency ($f_0$)" Slider
* **What it does:** Sets the pitch of the synthetic sine wave generator ($50\text{ Hz}$ to $3800\text{ Hz}$).
* **How it works:** Sets `customFreq` $\rightarrow$ evaluates $\sin(2\pi f_0 t)$ in the browser.
* **Theory:** **Pure Sinusoid Basis Function**. A single frequency tone produces an impulse spike in the frequency spectrum: $\mathcal{F}\{\sin(2\pi f_0 t)\} \rightarrow \delta(f - f_0)$.
* **What I should expect:** Higher values produce higher-pitched tones; the spectrum shows a single sharp spike at that frequency.

### 7.2 "Generate & Load Sine Wave" Button
* **What it does:** Synthesizes a clean sine wave in memory, encodes it into a 16-bit PCM WAV file, and loads it into the DSP engine.
* **How it works:** `generateCustomTone()` creates a `Float32Array`, packages a 44-byte WAV header via `encodeWav()`, and uploads it to the backend via `uploadFile()`.
* **What I should expect:** The new sine wave loads into the studio; the spectrum displays one clean spike at $f_0$.

### 7.3 CSE 220 Test Preset Buttons
* **"Multi-Tone (200, 1k, 2.5k)":** Loads three combined sine waves with added white noise. Ideal for practicing band filtering.
* **"Hann Pulse Burst (440Hz)":** Loads a short 180 ms pulse followed by silence. Ideal for demonstrating convolution echo reflections.
* **"Tone (300Hz) + Noise":** Loads a low-frequency tone immersed in Gaussian noise. Ideal for practicing noise removal.
* **"Harmonic Chord (4 Tones)":** Loads a multi-frequency chord ($150, 440, 1200, 3200\text{ Hz}$).
* **What I should expect:** Instantly loads the selected benchmark signal into the workstation.

### 7.4 Live Microphone Recording Button
* **What it does:** Records audio directly from your computer microphone for testing.
* **How it works:** `useAudioRecorder.ts` accesses browser `navigator.mediaDevices.getUserMedia()`, captures raw PCM audio, downmixes to mono, and uploads it via `POST /api/signal/upload`.
* **What I should expect:** Click "Start Recording" $\rightarrow$ speak or whistle $\rightarrow$ click "Stop & Load" $\rightarrow$ your voice immediately appears in the waveform and spectrum visualizers.

---

## 8. A/B Comparison Lab (`/compare` page)

### 8.1 Time-Domain Overlay Graph
* **What it does:** Renders the original waveform (light gray) and processed waveform (dark line) on the exact same axis.
* **Theory:** **Visual Difference & Temporal Alignment**. Makes it easy to see how gain scaling expands the signal height or how convolution adds a decaying tail.

### 8.2 Metric Delta Badges ($\Delta\text{RMS}\%$, $\Delta\text{Peak}\%$, $\Delta\text{Dominant Hz}$)
* **What they show:** The exact percentage change in signal power, peak headroom, and dominant pitch caused by your processing.
* **Formulas:**
  $$\Delta\text{RMS} = \frac{\text{RMS}_{\text{proc}} - \text{RMS}_{\text{orig}}}{\text{RMS}_{\text{orig}}} \times 100\%$$
* **What I should expect:** Green badge indicates amplified power; red/orange indicates attenuated energy.

---

## 9. Impulse Response Inspector Modal

### 9.1 Discrete Stem Plot Canvas
* **What it shows:** A stem-and-leaf plot showing the discrete impulses of $h[n]$ along a millisecond timeline.
* **How it works:** Fetches coordinate pairs `(t_ms, amplitude)` from `GET /api/impulse-response` and draws each tap as a vertical line ending in a circular marker.
* **Theory:** **Kronecker Delta Representation**:
  $$h[n] = \delta[n] + \alpha_1 \delta[n - n_0] + \alpha_2 \delta[n - 2n_0] + \dots$$
* **What I should expect:** A tall spike at $0\text{ ms}$ (direct arrival) followed by evenly spaced, progressively shorter spikes (the echoes).

---

## 10. Desktop Tkinter GUI Cross-Reference

If you launch the native desktop GUI using `python backend/main.py --legacy-gui`, the controls map to the identical DSP functions:

| Desktop Tkinter Control (`gui.py`) | React Studio Equivalent | Underlying Backend DSP Function |
| :--- | :--- | :--- |
| **"Load WAV File"** Button | File Upload Card | `signal_io.load_wav()` |
| **"Load Test Signal"** Button | "Multi-Tone" Preset Button | `signal_io.generate_test_signal()` |
| **Band Filter Checkbox** | "Active / Bypassed" Toggle | `fourier_filter.process_band()` |
| **Cut / Keep / Atten / Amp Radios** | "Filtering Mode" Dropdown | `process_band(operation=...)` |
| **Low Freq / High Freq Sliders** | Low / High Cutoff Sliders | `fourier_filter.py: [low_freq, high_freq]` |
| **Strength Factor Slider** | Strength Factor Slider | `process_band(strength=...)` |
| **Gain Slider** | Amplitude Gain Slider | `audio_effects.scale_amplitude()` |
| **Delay (ms) Slider** | Time Delay Slider | `audio_effects.time_shift()` |
| **Freq Shift (Hz) Slider** | Frequency Shift Slider | `server.py:frequency_shift_channel()` |
| **Echo Checkbox & Sliders** | Convolution Echo Controls | `audio_effects.convolution_echo()` |
| **"Apply Filter / Effects"** Button | "Process Pipeline" Button | `server.py:apply_all()` |
| **"Play Original / Processed"** | "A · Original / B · Processed" | `sounddevice.play()` / Web Audio stream |
| **"Reset" Button** | "Reset Signal" Button | `server.py:reset_signal()` |
| **"Save Processed WAV"** Button | "Export WAV" Button | `signal_io.save_wav()` |

---

*Keep this cheat sheet handy during demonstrations, lab evaluations, and code reviews to quickly bridge visual UI actions, backend Python algorithms, and signal-processing theory.*
