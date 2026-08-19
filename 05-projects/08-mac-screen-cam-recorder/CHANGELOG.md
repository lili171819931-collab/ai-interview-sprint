# Changelog

All notable changes to **AI Teaching Recorder** are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.1] — 2026-08-19

### Fixed
- **Settings output-directory picker** could silently move recordings to `~/Documents`
  (or any default NSOpenPanel location) when the user pressed "Select" without
  navigating — the panel now defaults to the current output folder and only accepts
  an existing directory, so recordings can never silently scatter.
- **Floating windows (control bar / camera / annotation / toolbar) no longer restore
  on relaunch** — "during recording" windows are non-restorable and are hidden on
  a clean launch, eliminating the 100% CPU transparent-overlay redraw loop.
- **Annotation canvas** now caches its `CIContext` and only re-renders when strokes
  change (dirty-flag), instead of creating a Core Image context on every `draw()`.

## [0.2.0] — 2026-08-18

### Added (V0.2 teaching layer)
- ⌨️ **Keyboard OSD**: global `CGEventTap` key-combo tracker (`⌘K`, `⇧⌘P` …) baked
  into the video; graceful fallback when Accessibility permission is missing.
- 📜 **Teleprompter**: floating scroll window (script / speed / font), with
  "in video (入画)" / "excluded (不入画)" capture control.
- 🔦 **Mouse spotlight**: CoreImage radial glow baked per frame; toggle from the
  floating control bar.
- 🧾 **Recording metadata side-channel**: `<video>.metadata.json` with cursor,
  clicks and frontmost-window events + timestamps (input for the future AI director).
- ✂️ **Frame-level timeline**: load → trim head/tail → silence detection →
  `AVMutableComposition` export of a clean MP4.
- CLI: `record --no-camera/--no-mic`, `timeline --list-silence/--remove-silence/--trim-*`.
- Settings now opens as a standalone titled window (close / minimize / zoom).

### Fixed
- Teaching annotation **text tool did not render** (missing `NSGraphicsContext`).
- CLI `--out` was ignored (`start(outputURL:)` parameter was not forwarded).
- Idle CPU layout loop: `micLevel` was published at audio-callback rate,
  re-laying out the whole Home view every frame (~104% CPU) — now throttled and
  isolated to the level meter (idle ~27–38%).

## [0.1.0] — 2026-08-18

### Added (V0.1 MVP)
- ScreenCaptureKit recording: entire screen / display / window / region + system audio.
- Camera PiP overlay: 5 shapes, 8 layouts, filters, beauty — baked into the video.
- Floating control bar (timer / mic / camera / pause / stop / annotations),
  excluded from the capture.
- Teaching annotations: pen / arrow / rect / ellipse / text / eraser, 8 colors.
- Countdown, mouse click effects, visual window picker, permission auto-refresh,
  stable self-signed code signing, app icon + Desktop copy.
- Headless CLI (`AITRCLI`) and a 63-check unit test suite.

