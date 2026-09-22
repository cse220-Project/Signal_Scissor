/** Browser integration checks. Requires local API/Vite servers and Playwright. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright"
);
const source = resolve(
  process.env.NOISE_TEST_FILE || "../audio/test_valid.wav",
);
const fixture = await readFile(source);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.env.NOISE_TEST_URL || "http://127.0.0.1:5173";
try {
  await page.goto(`${base}/noise-remover`, { waitUntil: "domcontentloaded" });
  const picker = page.getByLabel("Audio file", { exact: true });
  await picker.waitFor();
  await page.waitForFunction(
    () =>
      !document.querySelector("#noise-file")?.disabled &&
      !document.querySelector("#noise-file")?.closest("fieldset")?.disabled,
  );
  const remove = page.getByRole("button", {
    name: "Remove Noise",
    exact: true,
  });
  assert.equal(await remove.isDisabled(), true);
  await picker.setInputFiles({
    name: "wrong.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await page
    .getByRole("alert")
    .filter({ hasText: "Supported formats" })
    .waitFor();
  await picker.setInputFiles({
    name: "empty.wav",
    mimeType: "audio/wav",
    buffer: Buffer.alloc(0),
  });
  await page.getByRole("alert").filter({ hasText: "empty" }).waitFor();
  await picker.setInputFiles(source);
  await page.getByRole("radio", { name: /Strong/ }).check();
  assert.equal(
    await page.getByRole("radio", { name: /Strong/ }).isChecked(),
    true,
  );
  await page.getByRole("radio", { name: /Balanced/ }).check();
  let submits = 0;
  const delay = async (route) => {
    submits += 1;
    await new Promise((done) => setTimeout(done, 700));
    await route.continue();
  };
  await page.route("**/api/noise-removal", delay);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/noise-removal") &&
      response.request().method() === "POST",
  );
  await remove.click();
  assert.equal(await remove.isDisabled(), true);
  assert.equal(
    await page
      .getByRole("button", { name: "Reset / another file" })
      .isDisabled(),
    true,
  );
  await page.locator("form").dispatchEvent("submit");
  const response = await responsePromise;
  assert.equal(response.status(), 200, await response.text());
  const result = await response.json();
  await page
    .getByRole("status")
    .filter({ hasText: "Noise removal complete" })
    .waitFor();
  assert.equal(submits, 1, "Duplicate submission must be blocked");
  await page.waitForFunction(
    () =>
      document.querySelector('audio[aria-label="Cleaned audio"]')?.readyState >=
      2,
  );
  await page
    .locator('audio[aria-label="Cleaned audio"]')
    .evaluate(async (audio) => {
      await audio.play();
      audio.pause();
    });
  const audioURL = await page
    .locator('audio[aria-label="Cleaned audio"]')
    .getAttribute("src");
  const cleanedResponse = await page.request.get(new URL(audioURL, base).href);
  const cleaned = await cleanedResponse.body();
  assert.equal(cleaned.subarray(0, 4).toString(), "RIFF");
  assert.notEqual(
    hash(cleaned),
    hash(fixture),
    "Output must be processed, not copied",
  );
  assert.equal(
    hash(await readFile(source)),
    hash(fixture),
    "Original fixture remains unchanged",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download cleaned WAV" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), result.output_filename);
  assert.equal(await download.failure(), null);
  if (process.env.NOISE_TEST_OUTPUT)
    await writeFile(process.env.NOISE_TEST_OUTPUT, cleaned);
  if (process.env.NOISE_SCREENSHOT)
    await page.screenshot({
      path: process.env.NOISE_SCREENSHOT,
      fullPage: true,
    });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Overflow at ${width}px`,
    );
  }
  await page.getByRole("button", { name: "Reset / another file" }).click();
  assert.equal(await page.locator("audio").count(), 0);
  assert.equal(await remove.isDisabled(), true);
  await page.unroute("**/api/noise-removal", delay);
  await page.route("**/api/noise-removal", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Noise removal is busy. Please try again shortly.",
      }),
    }),
  );
  await page
    .getByText("Drop an audio file here, or browse your files.", {
      exact: true,
    })
    .locator("..")
    .evaluate((target, base64) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const transfer = new DataTransfer();
      transfer.items.add(
        new File([bytes], "dropped.wav", { type: "audio/wav" }),
      );
      target.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
    }, fixture.toString("base64"));
  await page.getByText(/Selected: dropped.wav/).waitFor();
  await remove.click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Noise removal is busy" })
    .waitFor();
  assert.equal(await remove.isEnabled(), true);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        status: "passed",
        checks: [
          "selection",
          "drag and drop",
          "validation",
          "level selection",
          "real processing",
          "duplicate prevention",
          "disabled states",
          "playback",
          "download",
          "original preservation",
          "reset",
          "backend error display",
          "responsive layout",
        ],
        result,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
