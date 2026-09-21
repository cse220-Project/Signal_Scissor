# Visual migration

## Baseline and scope

Reference: `../frontend template/` (read-only). All implementation changes are confined to `frontend/`.

The workspace already contained modified and untracked files. The baseline for this work is the working tree, not Git HEAD. Source copies and SHA-256 hashes were recorded in `/tmp/signal-scissors-baseline` before edits.

- `npm run build`: passed.
- `npm run lint`: passed with 22 existing warnings.
- `npx --no-install tsc --noEmit`: existing TS2882 error for the CSS import in `src/main.tsx`.
- No test script is configured.
- Started Vite and checked the browser before editing. `main.tsx` imports `./App`, which resolves to `App.jsx`. The routed `App.tsx` and its seven pages are unmounted. Changing that resolution would replace the live engine and is not a visual change.
- Initial browser requests returned 502 while the backend was stopped. The existing backend was then started for verification without source edits.

## Mapping prepared before implementation

| Existing component | Template reference | Presentation to migrate | Behavior to preserve | Files to edit |
| --- | --- | --- | --- | --- |
| Global theme, shared UI | `src/index.css`, `components/ui/*` | Outfit, warm neutrals, slim range thumbs, pastel cards, rounded buttons, focus and responsive spacing | Input values, bounds, disabled state, callbacks | `src/index.css`, `src/components/ui/Button.tsx` |
| Live `App.jsx`, Header | `layout/*`, Studio action header | Sidebar-like workstation tools, compact header, cream workspace, responsive stacking | Entry point, view modes, upload/export/reset/theory actions, all engine state | `src/App.jsx`, `src/components/Header.jsx`, `src/workstation.css` |
| Existing routed shell | `layout/AppShell`, `SideNav`, `TopBar` | Sidebar spacing, mobile navigation, top bar | Every existing route and navigation callback; remains unmounted unless separately authorized | `src/components/layout/*.tsx` |
| Dashboard | `pages/Dashboard`, `audio/UploadZone` | Compact heading, 8/4 upload/status grid, pastel launch cards | Drag/drop, file input, all four presets, existing navigation, real engine data | `src/pages/Dashboard.tsx` |
| Studio | `pages/Studio`, `studio/StudioVisualizers`, `StudioProcessingPanel`, `StudioAnalysisCards` | Player first, separate pastel plot cards, 7/5 processing/analysis layout | Initial preset effect, seek, reset/pipeline callbacks, all filter/effect/stat props | `src/pages/Studio.tsx`, `src/components/studio/{FilterControls,EffectsControls,SignalStatsBar}.tsx` |
| Live player, rack, plots | `audio/AudioPlayer`, `studio/*` | Soft player surface, pastel filter/effect panels, calm graph colors | Playback/stop/seek/A-B/mute, spectrum band dragging, overlay/difference switches, all DSP actions | `src/components/{TransportBar,EffectsRack,WaveformVisualizer,SpectrumVisualizer,SignalStatsBar}.jsx` |
| Upload/loading/modals | `audio/UploadZone`, `ui/LoadingSpinner`, theory cards | Soft surfaces and neutral ink, rounded panels | Existing file acceptance, processing cancellation, modal handlers and conditions | `src/components/{ProcessingOverlay,ImpulseResponseModal,TheoryModal}.jsx` |
| Compare | `pages/Compare`, `compare/ComparisonView` | Green playback panel, paired pastel graphs, cream metric table | Existing A/B callbacks, all numerical expressions and data sources | `src/pages/Compare.tsx` |
| Effects | `pages/Effects`, `StudioEffectsChain` | Green rack and cream preset presentation, compact category pills | Existing tabs, category filtering, preset application and manual controls | `src/pages/Effects.tsx` |
| Signals | `pages/Signals`, `generator/SignalGenerator` | 5/7 generator/preview layout, pastel plot containers | WAV encoding, sine generation, all presets, microphone recording | `src/pages/Signals.tsx` |
| Theory | `theory/TheoryHero`, `EquationCard`, questionnaire | Educational hero, equation panels, responsive tabs and quiz cards | All equations, canvas simulations, quiz questions, answers and scoring | `src/pages/Theory.tsx` |
| Settings | `pages/Settings` | Narrow layout, soft parameter rows and panels | Existing local preferences, encoding options, reset action | `src/pages/Settings.tsx` |

## Functional boundaries

The current frontend has no spectrogram data contract, phase-vocoder pitch/time-stretch controls, or trimming flow. The template's corresponding engine code and mock data must not be copied. Existing waveform, FFT, frequency translation, delay, echo, comparison and export behavior is retained. No unavailable processing features will be represented by placeholder plots or inert controls.

The active JSX workstation and the unmounted TypeScript pages use separate engines. Route integration is pending clarification; visual work does not change the entry point.


## Completed visual work

- Applied the reference's warm neutral palette, Outfit typography, 24px panels, dark buttons, slim slider thumbs, pastel card colors and visible keyboard focus.
- Styled the live workstation with its original view controls arranged as a desktop sidebar and a wrapping mobile toolbar. Moved existing plots above the processing/analysis columns; retained all view modes and original controls.
- Restyled existing player, filter/effects rack, waveform/spectrum containers, telemetry, loading/cancel overlay, and theory/impulse-response dialogs. Canvas changes are color literals only; drawing coordinates, loops, mathematical expressions and pointer handlers remain intact.
- Adapted all seven existing TypeScript page layouts, their shell, and shared controls. Signals uses the reference's generator/preview columns; Studio places the player first, plots in separate pastel cards and processing beside analysis. Compare retains its data table with local horizontal scrolling on small screens. Theory retains both simulations and the complete quiz.
- Kept all original data, labels, callbacks, conditional rendering, input bounds and API bindings. No template engine code or demo datasets were copied.

## Final verification

| Check | Result |
| --- | --- |
| Production build | Passed before edits, after every major page, and after final responsive changes |
| Lint | Passed; same 22 baseline warnings, no new warnings |
| TypeScript | Same pre-existing TS2882 missing declaration for `./index.css`; no additional errors |
| Existing test suite | No test script configured |
| Preservation audit | 311 original functions across 46 JS/TS source files; signatures, nonvisual bodies and existing nonpresentation JSX bindings preserved |
| Live browser interactions | 35 checks passed; 41 real API requests observed; no runtime exceptions |
| Live responsive layouts | 1440px, 768px, 390px and 320px; no page-level horizontal overflow |
| Seven page previews | All rendered at 1440px and 390px in a temporary isolated preview, with no console errors or page-level horizontal overflow |
| Git whitespace check | Passed |
| Protected files | SHA-256 comparison confirms template, backend, API client, stores, hooks, types, entry points, route definitions and dependency manifests unchanged from the working-tree baseline |

Browser interaction checks covered all four signal presets; play/pause/stop, seek, mute/unmute, original/processed tracks; waveform overlay/difference controls; all three views and spectrum band dragging; four filter presets, bypass and all four filter operations; seven acoustic sliders, effects and full-pipeline actions; theory topics and impulse-response dialogs; real WAV upload/download; reset; loading and cancellation. Physical microphone recording was not exercised. Existing control callbacks were also checked statically against the baseline.

Only presentation changed inside functions: JSX layout, class strings, inline styles and canvas paint colors. Function signatures (including defaults), processing and signal-generation calculations, endpoint URLs, request payloads, response handling and event behavior are preserved. No functional changes required reverting.

## Remaining boundary

The live entry point still resolves `App.jsx`. The seven styled TypeScript pages remain unmounted, exactly as in the baseline. A temporary preview was used to inspect them; it is not a production route change. Activating them requires a separate functional integration decision because `App.tsx` uses a different state/playback engine. No response to the clarification was received during this migration, so that integration was not performed.

Spectrogram, phase-vocoder pitch shifting, time stretching and trimming exist only in the reference's design/engine, not the current frontend's contracts. Adding those would require functional work and is outside this visual-only migration. All existing features were retained; full template navigation and those template-only panels were not introduced.

## Files changed in this session

These are changes relative to the saved working tree; many files were already modified or untracked before this task.

- `src/App.jsx`
- `src/components/EffectsRack.jsx`
- `src/components/Header.jsx`
- `src/components/ImpulseResponseModal.jsx`
- `src/components/ProcessingOverlay.jsx`
- `src/components/SignalStatsBar.jsx`
- `src/components/SpectrumVisualizer.jsx`
- `src/components/TheoryModal.jsx`
- `src/components/TransportBar.jsx`
- `src/components/WaveformVisualizer.jsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/SideNav.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/studio/EffectsControls.tsx`
- `src/components/studio/FilterControls.tsx`
- `src/components/studio/SignalStatsBar.tsx`
- `src/components/studio/TransportBar.tsx`
- `src/components/ui/Button.tsx`
- `src/components/visualization/SpectrumCanvas.tsx`
- `src/components/visualization/WaveformCanvas.tsx`
- `src/index.css`
- `src/pages/Compare.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Effects.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Signals.tsx`
- `src/pages/Studio.tsx`
- `src/pages/Theory.tsx`

## Files added

- `src/workstation.css` — visual styles for the live JSX workstation, including responsive layouts.
- `scripts/verify-visual-preservation.mjs` — AST comparison of existing signatures, nonvisual bodies and JSX bindings against a supplied working-tree snapshot. Uses the already-installed Rolldown parser.
- `VISUAL_MIGRATION.md` — baseline, mapping, verification, limitations and file inventory.

Dependencies added or upgraded: **none**. No files were renamed or deleted.

## Local verification artifacts

- Baseline source snapshot, hashes and initial browser screenshots: `/tmp/signal-scissors-baseline/`.
- Final screenshots, viewport checks, interaction results and session-only diff: `/tmp/signal-scissors-final/`.
- Repeat the preservation audit: `node scripts/verify-visual-preservation.mjs /tmp/signal-scissors-baseline/frontend` from `frontend/`.
- Main dev server: `http://127.0.0.1:5173/`.

The snapshot and temporary browser harness are local verification artifacts and are not application dependencies.
