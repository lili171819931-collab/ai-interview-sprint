# Architecture — AI Teaching Recorder

## High-level

```text
SwiftUI App (AITeachingRecorder)
   │  observable state (RecorderController)
   ▼
AITeachingRecorderCore (no UI)
 ├── ScreenCaptureEngine   ScreenCaptureKit (SCShareableContent/SCContentFilter/SCStream)
 ├── CameraEngine          AVCaptureSession → CMSampleBuffer
 ├── MicEngine             AVCaptureSession → LPCM + level meter
 ├── CompositionRenderer   CoreImage: crop → camera PiP → annotations → teaching overlays → BGRA
 ├── MP4Writer             AVAssetWriter (H.264 + AAC x2) with PTS normalization
 ├── KeyboardEventMonitor  CGEventTap (listen-only) → key-combo OSD
 ├── RecordingMetadataRecorder  cursor/click/window events → .metadata.json
 ├── TimelineModel         segments + silence detection + AVMutableComposition export
 └── SettingsStore         UserDefaults-backed preferences
```

## Data flow (recording)

```text
SCStream frame ─┐
AVCapture frame ─┤→ CompositionRenderer → CVPixelBuffer(BGRA) → MP4Writer → MP4
Mic/System audio─┘        (PiP + annotation + OSD + spotlight baked in)
CGEventTap/NSWorkspace ─→ RecordingMetadataRecorder → .metadata.json
```

- Each input's PTS is normalized to its own first frame (归零), then video/audio
  tracks are written with monotonic timestamps.
- Floating control-bar / camera / teleprompter windows are excluded from capture
  via `SCContentFilter(display:excludingWindows:)` (or intentionally included
  with the teleprompter's 入画 switch).

## Timeline pipeline

```text
load video (AVURLAsset) → trim head/tail → detect silence (AVAssetReaderAudioMixOutput RMS)
→ kept segments → AVMutableComposition → AVAssetExportSession → clean MP4
```

## Key design rules

1. **Core is UI-free and headless-testable** (CLI + unit tests share it).
2. **Capture callbacks never touch UI**; state publishes are throttled
   (e.g. `micLevel` ≤ ~8 Hz) to avoid full-view layout loops.
3. **Floating windows are non-restorable** and hidden on launch.
4. **Threading**: screen capture on `aitr.screencapture`, mic on `aitr.mic`,
   timeline export on a user-initiated queue; UI state on the main actor.

## Tech stack

| Layer | Choice |
|---|---|
| Language | Swift 5.9 |
| UI | SwiftUI + AppKit (NSPanel floating windows) |
| Capture | ScreenCaptureKit (macOS 13+), AVFoundation |
| Composition | CoreImage / CoreGraphics |
| Encoding | VideoToolbox (H.264) / AAC via AVAssetWriter |
| Timeline | AVMutableComposition + AVAssetExportSession |
| Build | Swift Package Manager |
| Tests | Custom executable runner (Command Line Tools compatible) |
| Signing | Self-signed identity (scripts/setup-signing.sh) |

## Repository layout

```text
Sources/AITeachingRecorderCore/   engine (capture/composition/timeline/metadata/settings)
Sources/AITeachingRecorder/       app UI (Home/Settings/Timeline/SelfTest + floating windows)
Sources/AITRCLI/                  headless CLI
Sources/AITRCoreUnitTests/        unit test runner
Resources/                        Info.plist + AppIcon
scripts/                          build-app.sh / run-tests.sh / setup-signing.sh
docs/                             blueprint + product/architecture/workflow/development
.github/workflows/ci.yml          CI
```
