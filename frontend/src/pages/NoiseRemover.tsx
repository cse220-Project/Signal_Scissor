import { useEffect, useRef, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import {
  getNoiseConfig,
  noiseMediaUrl,
  removeNoise,
  NoiseConfig,
  NoiseLevel,
  NoiseResult,
} from "../api/noiseRemoval";
import {
  noiseErrorMessage,
  validateNoiseFile,
} from "../utils/noiseValidation.mjs";

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
  const [config, setConfig] = useState<NoiseConfig | null>(null);
  const [configError, setConfigError] = useState("");
  const [retry, setRetry] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [level, setLevel] = useState<NoiseLevel>("balanced");
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing">(
    "idle",
  );
  const [progress, setProgress] = useState<number | null>(0);
  const [result, setResult] = useState<NoiseResult | null>(null);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [originalError, setOriginalError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const objectUrl = useRef("");
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
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function clearFile(resetInput = true) {
    if (submitting.current) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    setFile(null);
    setOriginalUrl("");
    setResult(null);
    setError("");
    setOriginalError("");
    setPreviewError("");
    setProgress(0);
    if (resetInput && input.current) input.current.value = "";
  }

  function chooseFile(selected: File | undefined) {
    if (submitting.current || !config || !selected) return;
    clearFile(false);
    const validation = validateNoiseFile(selected, config);
    if (validation) {
      setError(validation);
      return;
    }
    objectUrl.current = URL.createObjectURL(selected);
    setFile(selected);
    setOriginalUrl(objectUrl.current);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !config?.available) return;
    const validation = validateNoiseFile(file, config);
    if (validation || !file) {
      setError(validation || "Choose an audio file first.");
      return;
    }
    submitting.current = true;
    const controller = new AbortController();
    request.current = controller;
    setError("");
    setPreviewError("");
    setResult(null);
    setProgress(0);
    setPhase("uploading");
    try {
      const cleaned = await removeNoise(
        file,
        level,
        config,
        controller.signal,
        (percent) => {
          if (controller.signal.aborted) return;
          setProgress(percent);
          if (percent === 100) setPhase("processing");
        },
      );
      if (!controller.signal.aborted) setResult(cleaned);
    } catch (failure) {
      if (!controller.signal.aborted) setError(noiseErrorMessage(failure));
    } finally {
      submitting.current = false;
      if (!controller.signal.aborted) setPhase("idle");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold">Noise Remover</h1>
        <p className="text-sm text-ink-secondary leading-relaxed max-w-2xl">
          Reduce steady fan noise, air-conditioner noise, electrical hum, and
          light static. Processing runs on the server and keeps your original
          file unchanged.
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
          <Card className="space-y-4">
            <h2 className="text-xl">1. Choose your recording</h2>
            <div
              className={`border-2 border-dashed rounded-ios-lg p-5 sm:p-8 text-center transition-colors ${dragging ? "border-navy bg-lavender-soft" : "border-hairline bg-cream"}`}
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
                className="material-symbols-outlined text-navy text-[30px]"
              >
                audio_file
              </span>
              <p className="mt-2 mb-3 text-sm">
                Drop an audio file here, or browse your files.
              </p>
              <label htmlFor="noise-file" className="sr-only">
                Audio file
              </label>
              <input
                ref={input}
                id="noise-file"
                type="file"
                className="block w-full max-w-sm mx-auto text-sm file:mr-3 file:rounded-md file:border file:border-navy file:bg-white file:px-3 file:py-2 file:text-navy file:font-medium disabled:opacity-50"
                accept={config?.formats.join(",") || ".wav,.mp3,.m4a,.aac"}
                aria-describedby="noise-file-limits"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <p
                id="noise-file-limits"
                className="text-xs text-ink-secondary mt-3"
              >
                {config
                  ? `${config.formats.map((format) => format.slice(1).toUpperCase()).join(", ")} · Up to ${config.max_bytes / (1024 * 1024)} MB · ${config.max_duration_seconds} seconds · Mono or stereo`
                  : "Loading supported formats and limits…"}
              </p>
            </div>
            {file && (
              <p className="text-sm break-words">
                <span className="font-medium">Selected:</span> {file.name}{" "}
                <span className="text-ink-secondary">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </p>
            )}
          </Card>

          <Card className="space-y-4">
            <fieldset>
              <legend className="font-serif text-xl text-navy mb-4">
                2. Choose noise reduction
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {levels.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 rounded-ios-lg border p-4 cursor-pointer ${level === option.value ? "border-navy bg-lavender-soft" : "border-hairline bg-white"}`}
                  >
                    <input
                      type="radio"
                      name="noise-level"
                      value={option.value}
                      checked={level === option.value}
                      onChange={() => setLevel(option.value)}
                      className="mt-1 shrink-0"
                    />
                    <span>
                      <span className="block text-sm font-medium text-navy">
                        {option.title}
                        {option.value === "balanced" ? " (default)" : ""}
                      </span>
                      <span className="block text-xs text-ink-secondary mt-1 leading-relaxed">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-xs text-ink-secondary">
              Best for continuous background noise. Other voices, music, and
              sudden sounds may remain. Start with Balanced and compare the
              previews.
            </p>
          </Card>
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              aria-label="Remove Noise"
              icon="graphic_eq"
              loading={busy}
              disabled={!file || !config?.available}
            >
              Remove Noise
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => clearFile()}
              disabled={!file && !error}
            >
              Reset / another file
            </Button>
          </div>
        </fieldset>

        {busy && (
          <div
            role="status"
            aria-live="polite"
            className="border border-hairline rounded-ios-lg p-4 bg-white space-y-2"
          >
            <p className="text-sm font-medium text-navy">
              {phase === "uploading"
                ? `Uploading audio${progress !== null ? ` · ${progress}%` : "…"}`
                : "Removing background noise…"}
            </p>
            {phase === "uploading" && (
              <progress
                aria-label="Upload progress"
                value={progress ?? undefined}
                max={100}
                className="w-full accent-navy"
              />
            )}
            {phase === "processing" && (
              <p className="text-xs text-ink-secondary">
                Upload complete. Processing time depends on the length of your
                recording; no progress estimate is available.
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

      {file && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-3">
            <h2 className="text-xl">Original recording</h2>
            <audio
              key={originalUrl}
              aria-label="Original audio"
              controls
              preload="metadata"
              src={originalUrl}
              className="w-full"
              onError={() =>
                setOriginalError(
                  "Your browser cannot preview this original format. You can still process it and preview the cleaned WAV.",
                )
              }
            />
            {originalError && (
              <p className="text-xs text-ink-secondary">{originalError}</p>
            )}
            <p className="text-xs text-ink-secondary">
              Your local original is unchanged.
            </p>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-xl">Cleaned recording</h2>
            {result ? (
              <>
                <p role="status" className="text-sm text-success">
                  Noise removal complete · {result.level}
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
                      "The preview is unavailable or has expired. Try the download, or process your file again.",
                    )
                  }
                />
                {previewError && (
                  <p role="alert" className="text-sm text-error">
                    {previewError}
                  </p>
                )}
                <p className="text-xs text-ink-secondary">
                  WAV · {result.duration.toFixed(1)} seconds ·{" "}
                  {(result.file_size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <a
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-navy bg-navy text-white text-sm font-medium hover:bg-navy-hover hover:shadow-sm active:translate-y-px"
                  href={noiseMediaUrl(result.download_url)}
                  download={result.output_filename}
                  referrerPolicy="no-referrer"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    download
                  </span>
                  Download cleaned WAV
                </a>
                <p className="text-xs text-ink-secondary">
                  Download before{" "}
                  {new Date(result.expires_at * 1000).toLocaleString()}. The
                  server automatically deletes expired results.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-secondary">
                Your cleaned audio preview and download will appear here.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
