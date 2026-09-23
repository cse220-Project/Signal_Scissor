export function validateNoiseFile(file, config) {
  if (!file) return "Choose an audio file first.";
  const extension = `.${file.name.split(".").pop().toLowerCase()}`;
  if (!config.formats.includes(extension)) {
    return `Supported formats: ${config.formats.join(", ")}.`;
  }
  if (!file.size) return "The selected file is empty.";
  if (file.size > config.max_bytes) {
    return `Choose a file no larger than ${config.max_bytes / (1024 * 1024)} MB.`;
  }
  return null;
}

export function noiseErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Try a shorter file and check the server connection.";
  }
  return "Could not process the audio. Check your connection and try again.";
}
