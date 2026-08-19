# Development — AI Teaching Recorder

## Requirements

- macOS 14+ (ScreenCaptureKit APIs; macOS 13 minimum at runtime)
- Xcode Command Line Tools (`xcode-select --install`)
- No third-party dependencies (SwiftPM, system frameworks only)

## Build & test

```bash
swift build                 # debug build
swift run AITRCoreUnitTests # run all unit tests
swift run AITRCLI perms     # inspect TCC permissions
swift run AITRCLI devices   # list cameras / mics / displays
bash scripts/build-app.sh   # assemble + sign dist/AI Teaching Recorder.app
```

## Code signing

`scripts/setup-signing.sh` creates a persistent self-signed identity
(`AI Teaching Recorder Dev`) in a dedicated keychain so TCC grants survive
rebuilds. For distribution, replace it with an Apple Developer ID certificate.

## Permissions (TCC)

The app needs: Screen Recording (+ system audio via SCStream), Camera,
Microphone; Keyboard OSD additionally needs Accessibility. Permission state is
polled every second and surfaced in the UI (`/tmp/aitr-perms.json` is a debug
dump). After granting Screen Recording, macOS requires an app restart.

## Adding a feature (workflow)

1. Engine changes in `Sources/AITeachingRecorderCore` (headless-testable).
2. UI changes in `Sources/AITeachingRecorder`.
3. Tests: add `testX()` in `Sources/AITRCoreUnitTests/main.swift` and call it at
   the bottom.
4. Update `CHANGELOG.md`, the relevant `docs/`, and this file if workflows change.

## Known constraints

- System audio capture depends on ScreenCaptureKit (macOS 13+); virtual displays /
  remote sessions may lack audio.
- Window mode captures at 2× points (capped 3840×2160); region mode crops the
  full-display stream.
- ScreenCaptureKit currently delivers at the display refresh rate (60 fps even
  when 30 fps is configured) — acceptable for teaching content.
- WAV fixtures are not readable by AVAssetReader in SwiftPM-built binaries
  (-12780); silence-detection tests use ffmpeg-generated MP4 fixtures and skip
  gracefully when ffmpeg is unavailable.

## CI

`.github/workflows/ci.yml` builds the package and runs the unit test runner on
macOS. Recording smoke tests need TCC permissions, so they are intentionally
not part of CI.
