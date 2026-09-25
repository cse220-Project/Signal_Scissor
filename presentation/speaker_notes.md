# Speaker Notes — Signal Scissors (CSE 220 Final Project)

**Team:** Al Arafat Alif (2305062) · Safwan Bin Ahmadul Hoque (2305087)
**Time budget:** 6 minutes presentation + live demo (combined), then 2 minutes Q&A. **9 slides, ~3.25 min of talking, ~2.25–2.75 min for the live demo.** Practice with a timer — this is tight. (Slides 5 and 6 grew slightly to properly cover the Real-Life Applications feature — if you're running long in practice, that's the first place to trim, not the demo.)

---

## Slide-by-slide

| # | Slide | Presenter | Target time |
|---|---|---|---|
| 1 | Title | Alif | 10s |
| 2 | Motivation & Approach | Alif | 25s |
| 3 | Theory in Action | Safwan | 30s |
| 4 | Architecture & Workflow | Safwan | 30s |
| 5 | Features | Alif | 25s |
| 6 | Key Implementation Decisions | Safwan | 35s |
| 7 | Results | Alif | 25s |
| 8 | Live Demo (setup) | both | 10s + live demo |
| 9 | Conclusion & Thank You | Safwan | 15s |

### Slide 1 — Title
*Alif:* "Good [morning/afternoon], we're presenting Signal Scissors, our CSE 220 final project — an interactive digital signal processing workstation."

### Slide 2 — Motivation & Approach
*Alif:* "Audio DSP is usually either a black-box knob or a dry equation on a board. We built Signal Scissors so you can load a signal, apply a real FFT or LTI operation, and immediately see and hear the result — closing that gap."

### Slide 3 — Theory in Action
*Safwan:* "Everything here is real signals theory, not a toy. Our band filter does FFT, masks the selected band, then inverse-FFTs back. Our echo effect is literal convolution, y[n] = x[n] * h[n], with h[n] built as decaying spaced impulses. Gain and delay are the textbook y[n]=A·x[n] and y[n]=x[n−n₀]. And frequency shifting uses an analytic-signal / Hilbert-style trick — zero out negative frequencies, multiply by a complex exponential."

### Slide 4 — Architecture & Workflow
*Safwan:* "Three input paths — file, mic, or synthesizer — all get normalized to mono float32 the same way, so one DSP core and one visualization layer serve all of them. The user flow is simple: load or generate a signal, set filter or effect parameters, apply, then compare original against processed."

### Slide 5 — Features
*Alif:* "Control Center handles input. Spectral Studio has the band filter and the effects rack — gain, delay, SSB shift, convolution echo. Real-Life Applications packages that same engine into 11 one-click real-world scenarios — telephone bandwidth, mains hum notch, cathedral reverb, hearing-aid boost, and more. Signal Inspector is our deep-analysis page: spectrum comparison, delta-dB, waveform overlay, the STFT spectrogram, and quantitative metrics."

### Slide 6 — Key Implementation Decisions
*Safwan:* "Why three input sources? The synthesizer gives us known ground-truth frequencies to verify the filter actually works. Files give real-world audio. The mic gives live input. All three funnel into the identical pipeline. That same 'one pipeline' idea extends to our Real-Life Application presets — the telephone filter, hum notch, and the rest all call the exact same filter and effects functions as Spectral Studio, just with curated real-world parameter values instead of manual sliders. Spectrum plots always run 0 to fs/2 — the Nyquist limit — because that's the only meaningful range for a real signal's one-sided FFT. Our convolution echo also soft-clips with tanh instead of hard-normalizing — a hard normalize would divide the whole signal down and flatten the decaying echo tail into near-silence, so tanh was the deliberate choice to keep the reflections audible and visible. One real challenge we hit: our spectrogram was rendering solid black. We traced it to a fixed −80-to-0 dB color scale that didn't match SciPy's actual power-spectral-density output, which sits far lower. We fixed it by scaling the color range relative to the data's own peak instead of a hardcoded constant."

### Slide 7 — Results
*Alif:* "Here's a multi-tone signal — 200, 1000, 2500 Hz — after a 0-to-1500 Hz keep filter: the 2500 Hz peak is gone, the other two are untouched. And here's a linear chirp sweeping 200 to 8000 Hz — you can see the frequency rising over time as a clean diagonal line in the spectrogram."

### Slide 8 — Live Demo
*Either presenter reads the steps, then switch to the actual running app:*
1. Load the **Standard Multi-Tone** preset from Control Center.
2. Open **Acoustic FX Engine** and apply the **"Vintage Telephone Bandwidth Filter"** Real-Life Application preset (one click — this is the feature the theory maps onto a real-world use case, not a manually-tuned filter).
3. Open **Signal Inspector**, point out the original-vs-processed spectrum (the sub-300 Hz component is gone; 1000 Hz and 2500 Hz, both inside the 300–3400 Hz telephone band, remain).
4. Scroll to the **STFT Spectrogram** section, point out it's no longer black and shows real structure.

**Backup plan if live demo fails (network/mic/browser issue):** Have `backend` + `frontend` dev servers already running in a terminal *before* your slot starts (don't start them live). The demo script below never uses the microphone at all — it only needs the synthesizer preset, so mic-permission issues can't affect it. If you still want a real-file fallback instead of the synthetic preset, `audio/test_valid.wav` is a real, playable WAV already in the repo (note: `audio/sample.wav` is present but is an empty 0-byte file — do **not** use it, it will fail to load). If the app itself fails to load, narrate over the Results slide screenshots instead of clicking anything.

### Slide 9 — Conclusion & Thank You
*Safwan:* "So — Signal Scissors makes FFT filtering and LTI systems visual and audible, with one shared pipeline no matter how you get your signal in. Future work: real-time streaming DSP and more filter families. Thank you — happy to take questions."

---

## Demo script (exact steps)

1. **Before your slot:** have `backend` (`uvicorn server:app`) and `frontend` (`npm run dev`) already running; browser tab open at `http://localhost:5173/` (or wherever `main.py` opened it), on the **Control Center** page.
2. Click **"Standard Multi-Tone"** under Quick-Load Synthetic Signals → lands in Spectral Studio.
3. Click **"Acoustic FX Engine"** in the sidebar (this is the Real-Life Applications page).
4. Find the **"Vintage Telephone Bandwidth Filter"** card (Telecommunications category) and click **"On Processed"**. Mention out loud: *"this card runs the exact same FFT band-filter function as Spectral Studio — 300 to 3400 Hz, keep mode — it's just a curated, real-world-labeled preset, not a different engine."*
5. Click **"SIGNAL Inspector"** in the sidebar.
6. Scroll to **section 1 (Frequency Spectrum Comparison)** — point out the sub-300 Hz component is gone in the processed (green) trace, while the 1000 Hz and 2500 Hz peaks (inside the telephone band) remain.
7. Scroll to **section 5 (STFT Spectrogram Comparison)** — point out both spectrograms are visible (not black), and briefly mention the dB-range selector.
8. Return to slides for Slide 9 (Conclusion).

**Backup plan:** If recording/mic fails, skip the mic entirely — the script above never needs it. If the dev server crashes mid-demo, fall back to narrating the Results slide (Slide 7) screenshots as "here's what that looks like."

---

## Likely Q&A questions and answers

1. **Why have a synthesizer if you can load or record real audio?**
   The synthesizer gives us signals with *known, exact* frequencies (e.g. exactly 200/1000/2500 Hz). That lets us verify a filter actually removed the right band — with a real recording you can't be sure what frequencies were even present to begin with. Files and mic input then prove it works on real-world, unpredictable audio.

2. **Why is the frequency axis always shown from 0 to fs/2?**
   That's the Nyquist limit — for a real-valued signal, the FFT is conjugate-symmetric, so all the unique information is in the one-sided spectrum from 0 to fs/2. Anything above that is a mirror image, not new information.

3. **How does the band filter actually work?**
   FFT the signal, zero out (or scale) the bins whose frequency falls in the selected band, then inverse-FFT back to the time domain. `cut` zeroes the band, `keep` zeroes everything else, `attenuate`/`amplify` multiply the band by a strength factor instead of zeroing it.

4. **How is the echo effect implemented — is it a real filter or a canned effect?**
   It's literal discrete convolution: we build an impulse response h[n] as a direct impulse plus decaying impulses spaced `delay_ms` apart (each scaled by `decay^k`), then convolve it with the signal via `np.convolve`. It's the same y[n] = x[n] * h[n] from the LTI systems part of the course, not a plugin.

5. **What is the frequency-shift effect doing mathematically?**
   It builds the analytic signal (an FFT-based Hilbert-transform-style trick: keep DC and Nyquist, double the positive frequencies, zero the negative ones, inverse-FFT), then multiplies by a complex exponential e^(j2πΔf·t). That's single-sideband frequency translation — shifting every component up (or down) by Δf without producing a mirrored image, unlike naive amplitude modulation.

6. **Why did the spectrogram render solid black, and how did you actually find the cause?**
   We didn't guess — we reproduced it three ways: recomputed the backend's exact `compute_spectrogram_payload()` function in isolation and printed the dB min/max, fetched the live API response from the running app and did the same, and screenshotted the broken display. All three showed the real dB values sitting around −60 to −120 dB, while the color-mapping code was hardcoded to a −80-to-0 dB range — so ~95%+ of cells clamped to the same near-black color. The fix was to compute the color range from the data's own peak instead of a fixed constant — a display-scale bug, not a problem with the STFT math itself.

7. **Why does the echo effect soft-clip with tanh instead of just normalizing the output?**
   A hard normalize (dividing the whole signal by its max) would shrink everything proportionally, including the decaying echo tail, until the reflections become nearly inaudible and invisible on the waveform. `tanh` compresses only the loudest peaks while leaving quieter parts — like the echo tail — mostly untouched, so the convolution result stays both bounded to [-1, 1] and audible.

8. **Why build curated "Real-Life Application" presets instead of just exposing the raw filter/effects controls?**
   Two reasons. First, pedagogy: a control labeled "Low Cutoff 300 Hz" is abstract, but a preset labeled "Vintage Telephone Bandwidth Filter" ties the exact same FFT band-keep operation to a use case everyone already understands. Second, it's zero extra engine work — each preset is just a stored filter/effects parameter set that gets sent to the identical `/api/process/all` endpoint Spectral Studio itself calls. It's a curated front door onto the same pipeline, not a second implementation.

9. **What's the difference between the Theory page's simulations and the actual processing pipeline?**
   The Theory/Academy page's interactive simulations (e.g., its spectral-subtraction demo) are small, self-contained visualizations meant to teach a concept in isolation, computed from made-up example values. The real signal-processing pipeline (filter, effects, spectrogram) runs server-side in Python against your actual loaded/recorded signal. They're not the same code path — the Theory page never touches your real audio data.

10. **How do you convert a stereo file down for processing?**
    We average the two channels (`raw_data.mean(axis=1)`) before anything else happens, in `signal_io.py`, so the entire DSP pipeline downstream only ever has to handle mono signals.

11. **What would you add with more time?**
    Real-time streaming DSP (currently we process a full loaded signal, not a live stream) and additional filter types like IIR/Butterworth filters, beyond the FFT-based band filter we have now.
