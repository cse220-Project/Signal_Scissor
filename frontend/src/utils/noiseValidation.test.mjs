import { test } from "node:test";
import assert from "node:assert/strict";
import { noiseErrorMessage, validateNoiseFile } from "./noiseValidation.mjs";

const config = { formats: [".wav", ".mp3", ".m4a", ".aac"], max_bytes: 1024 };
test("accepts all supported file extensions, including uppercase", () => {
  for (const extension of ["WAV", "mp3", "m4a", "aac"]) {
    assert.equal(
      validateNoiseFile({ name: `audio.${extension}`, size: 1024 }, config),
      null,
    );
  }
});
test("rejects absent, empty, unsupported, and oversized files", () => {
  assert.match(validateNoiseFile(null, config), /Choose/);
  assert.match(
    validateNoiseFile({ name: "empty.wav", size: 0 }, config),
    /empty/,
  );
  assert.match(
    validateNoiseFile({ name: "video.mp4", size: 10 }, config),
    /Supported/,
  );
  assert.match(
    validateNoiseFile({ name: "big.wav", size: 1025 }, config),
    /no larger/,
  );
});
test("shows server errors safely and handles timeout or connection failures", () => {
  assert.equal(
    noiseErrorMessage({ response: { data: { detail: "File expired" } } }),
    "File expired",
  );
  assert.match(noiseErrorMessage({ code: "ECONNABORTED" }), /timed out/);
  assert.match(
    noiseErrorMessage({
      response: { data: { detail: [{ msg: "validation" }] } },
    }),
    /Check your connection/,
  );
  assert.match(noiseErrorMessage(null), /Check your connection/);
});
