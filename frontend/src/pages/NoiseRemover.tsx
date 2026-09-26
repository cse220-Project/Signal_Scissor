import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAudioStore } from "../store/useAudioStore";
import {
  getNoiseConfig,
  noiseMediaUrl,
  removeNoiseCurrent,
  NoiseConfig,
  NoiseLevel,
  NoiseResult,
} from "../api/noiseRemoval";
import { noiseErrorMessage } from "../utils/noiseValidation.mjs";

const levels: { value: NoiseLevel; title: string; description: string }[] = [
  {
    value: "light",
    title: "Light",
    description: "Gentle reduction with the most voice detail preserved.",
  },
  {
    value: "balanced",
    title: "Balanced",
    description: "Moderate noise reduction for everyday recordings.",
  },
  {
    value: "strong",
    title: "Strong",
    description: "More reduction; may soften or distort voice detail.",
  },
];

export default function NoiseRemover() {
  const navigate = useNavigate();
  const { signalState, duration, setNoiseReducedState } = useAudioStore();

  // Denoiser deliberately uses the active workstation source only. Keeping this
  // fixed avoids presenting a second upload route beside Control Center.
  const [sourceMode] = useState<"current" | "upload">("current");
  const [targetTrack, setTargetTrack] = useState<"original" | "processed">("processed");
  const [config, setConfig] = useState<NoiseConfig | null>(null);
  const [configError, setConfigError] = useState("");
  const [retry, setRetry] = useState(0);
  const [level, setLevel] = useState<NoiseLevel>("balanced");
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing">("idle");
  const [progress] = useState<number | null>(0);
  const [result, setResult] = useState<NoiseResult | null>(null);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  const busy = phase !== "idle";

  useEffect(() => {
    const controller = new AbortController();
    getNoiseConfig(controller.signal)
      .then(setConfig)
      .catch(() => {
        if (!controller.signal.aborted)
          setConfigError(
            "Could not load the noise-removal service. Check the backend connection.",
          );
      });
    return () => controller.abort();
  }, [retry]);

  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  // The dormant upload markup is retained only for backwards-compatible route
  // code; there is no UI path to it. All user-facing denoising is current-audio.
  function clearFile() {
    setFile(null);
    setError("");
    if (input.current) input.current.value = "";
  }

  function chooseFile(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !config?.available) return;

    if (!signalState?.loaded) {
      setError("No active audio signal loaded in workstation.");
      return;
    }

    submitting.current = true;
    const controller = new AbortController();
    request.current = controller;
    setError("");
    setPreviewError("");
    setResult(null);
    setPhase("processing");

    try {
      const cleaned = await removeNoiseCurrent(level, config, controller.signal, targetTrack);
      if (!controller.signal.aborted) {
        if (cleaned.workstation_state) setNoiseReducedState(cleaned.workstation_state);
        setResult(cleaned);
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(noiseErrorMessage(failure));
    } finally {
      submitting.current = false;
      if (!controller.signal.aborted) setPhase("idle");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold tracking-tight">Noise Remover</h1>
        <p className="text-sm text-ink-secondary leading-relaxed max-w-2xl">
          Reduce background noise, fan hum, and room static with adaptive STFT spectral gating.
          Clean the recording currently loaded in Control Center or the Studio.
        </p>
      </header>

      {configError && (
        <div
          role="alert"
          className="bg-error-soft text-error p-4 rounded-ios-lg space-y-3"
        >
          <p>{configError}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setConfigError("");
              setRetry((value) => value + 1);
            }}
          >
            Retry connection
          </Button>
        </div>
      )}
      {!config && !configError && (
        <p role="status" className="text-sm text-ink-secondary">
          Connecting to noise removal…
        </p>
      )}
      {config && !config.available && (
        <p role="alert" className="bg-error-soft text-error p-4 rounded-ios-lg">
          {config.message}
        </p>
      )}

      <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
        <fieldset
          disabled={busy || !config?.available}
          className="space-y-5 min-w-0"
        >
          {/* Source 1: Active Workstation Audio */}
          {sourceMode === "current" ? (
            <Card variant="pastel-blue" className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="material-symbols-outlined text-[20px] text-foreground">
                  equalizer
                </span>
                <h2 className="text-[15px] font-semibold text-foreground">
                  Currently Loaded Workstation Audio
                </h2>
              </div>

              {signalState?.loaded ? (
                <div className="bg-card/90 text-card-foreground rounded-ios-lg p-4 space-y-3 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[14px] text-foreground">
                      {signalState.source_name || "Active Signal"}
                    </span>
                    <span className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                      Loaded
                    </span>
                  </div>

                  {/* Choose the audio version to clean. */}
                  <div className="flex items-center justify-between p-2.5 bg-secondary/80 rounded-ios-md border border-border">
                    <span className="text-xs font-medium text-foreground">Target Track:</span>
                    <div className="flex rounded-lg overflow-hidden border border-border">
                      <button
                        type="button"
                        onClick={() => setTargetTrack('original')}
                        className={`px-3 py-1 text-xs font-semibold transition-all ${
                          targetTrack === 'original'
                            ? 'bg-sky-500 text-white'
                            : 'bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetTrack('processed')}
                        className={`px-3 py-1 text-xs font-semibold transition-all ${
                          targetTrack === 'processed'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Processed
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Sample Rate: {signalState.sample_rate || 8000} Hz</span>
                    <span>Duration: {duration.toFixed(2)}s</span>
                  </div>
                </div>
              ) : (
                <div className="bg-accent text-accent-foreground p-4 rounded-ios-lg text-xs space-y-2 border border-border">
                  <p className="font-medium text-foreground">No audio currently loaded in the workstation.</p>
                  <p className="text-muted-foreground">Load a file, generate a signal, or record audio in Control Center first.</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon="mic"
                      onClick={() => navigate("/mic-capture")}
                    >
                      Record Mic
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon="show_chart"
                      onClick={() => navigate("/signals")}
                    >
                      Load Signal
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            /* Source 2: Local File Upload */
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-hairline">
                <span className="material-symbols-outlined text-[20px] text-ink-primary">
                  upload_file
                </span>
                <h2 className="text-[15px] font-semibold text-foreground">
                  Upload Audio File
                </h2>
              </div>
              <div
                className={`border-2 border-dashed rounded-ios-lg p-5 sm:p-8 text-center transition-colors ${
                  dragging ? "border-primary bg-accent/60" : "border-border bg-card/60 hover:bg-accent/40"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!busy && config?.available) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  if (busy || !config?.available) return;
                  if (event.dataTransfer.files.length !== 1) {
                    setError("Choose one audio file at a time.");
                    return;
                  }
                  chooseFile(event.dataTransfer.files[0]);
                }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-primary text-[30px]"
                >
                  audio_file
                </span>
                <p className="mt-2 mb-3 text-sm text-foreground">
                  Drop an audio file here, or browse your files.
                </p>
                <label htmlFor="noise-file" className="sr-only">
                  Audio file
                </label>
                <input
                  ref={input}
                  id="noise-file"
                  type="file"
                  className="block w-full max-w-sm mx-auto text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-2 file:text-secondary-foreground file:font-medium disabled:opacity-50"
                  accept="audio/*"
                  aria-describedby="noise-file-limits"
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
                <p
                  id="noise-file-limits"
                  className="text-xs text-muted-foreground mt-3"
                >
                  {config
                    ? `Any audio format · up to ${config.max_bytes / (1024 * 1024)} MB · ${config.max_duration_seconds} seconds`
                    : "Loading upload limits…"}
                </p>
              </div>
              {file && (
                <p className="text-sm break-words text-foreground">
                  <span className="font-semibold">Selected:</span> {file.name}{" "}
                  <span className="text-muted-foreground">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </p>
              )}
            </Card>
          )}

          {/* Level Selection */}
          <Card className="space-y-4">
            <fieldset>
              <div className="flex items-center gap-2 pb-2 border-b border-border mb-3">
                <span className="material-symbols-outlined text-[20px] text-foreground">
                  tune
                </span>
                <h3 className="text-[15px] font-semibold text-foreground">
                  Noise Reduction Level
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {levels.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 rounded-ios-lg border p-4 cursor-pointer transition-all ${
                      level === option.value
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="noise-level"
                      value={option.value}
                      checked={level === option.value}
                      onChange={() => setLevel(option.value)}
                      className="mt-1 shrink-0 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {option.title}
                        {option.value === "balanced" ? " (default)" : ""}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              aria-label="Remove Noise"
              icon="graphic_eq"
              loading={busy}
              disabled={
                !config?.available || !signalState?.loaded
              }
            >
              Remove Noise
            </Button>
            {sourceMode === "upload" && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => clearFile()}
                disabled={!file && !error}
              >
                Reset / another file
              </Button>
            )}
          </div>
        </fieldset>

        {busy && (
          <div
            role="status"
            aria-live="polite"
            className="border border-border rounded-ios-lg p-4 bg-card space-y-2"
          >
            <p className="text-sm font-semibold text-foreground">
              {phase === "uploading"
                ? `Uploading audio${progress !== null ? ` · ${progress}%` : "…"}`
                : "Removing background noise…"}
            </p>
            {phase === "processing" && (
              <p className="text-xs text-muted-foreground">
                Estimating the noise profile and applying spectral gating…
              </p>
            )}
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="p-4 rounded-ios-lg bg-error-soft text-error text-sm"
          >
            {error}
          </p>
        )}
      </form>

      {/* Result Section */}
      {result && (
        <Card className="space-y-4 border-2 border-emerald-500/40 bg-card">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <span className="material-symbols-outlined text-emerald-500">
                check_circle
              </span>
              Cleaned Audio Output
            </h2>
            <span className="text-xs font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
              Level: {result.level}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            The cleaned audio is now the workstation’s processed track. Your original track is unchanged.
          </p>

          <audio
            key={result.id}
            aria-label="Cleaned audio"
            controls
            preload="metadata"
            src={noiseMediaUrl(result.preview_url)}
            className="w-full"
            onError={() =>
              setPreviewError(
                "The preview is unavailable or has expired. Try downloading the file.",
              )
            }
          />
          {previewError && (
            <p role="alert" className="text-sm text-error">
              {previewError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-muted-foreground font-mono">
              WAV · {result.duration.toFixed(1)}s ·{" "}
              {(result.file_size / (1024 * 1024)).toFixed(2)} MB
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon="science"
                onClick={() => navigate("/studio")}
              >
                View in DSP Studio
              </Button>
              <a
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-ios-lg border border-primary bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
                href={noiseMediaUrl(result.download_url)}
                download={result.output_filename}
                referrerPolicy="no-referrer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>
                Download WAV
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
