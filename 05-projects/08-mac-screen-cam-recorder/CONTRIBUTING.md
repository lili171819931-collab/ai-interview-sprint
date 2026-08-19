# Contributing

Thanks for helping improve **AI Teaching Recorder**!

## Getting started

```bash
# Build (debug)
swift build

# Run unit tests (no XCTest needed — works with Command Line Tools)
swift run AITRCoreUnitTests

# Headless self test (needs Screen Recording + Mic; camera optional)
swift run AITRCLI selftest 5

# Build the signed .app bundle
bash scripts/build-app.sh
```

## Project layout

```text
Sources/AITeachingRecorderCore/   Pure engine (no UI): capture, composition, timeline, metadata
Sources/AITeachingRecorder/       macOS app (SwiftUI + AppKit floating windows)
Sources/AITRCLI/                  Headless CLI for testing / debugging
Sources/AITRCoreUnitTests/        Self-contained unit test runner
scripts/                          build-app / run-tests / setup-signing
docs/                             Blueprint + product / architecture / workflow / development docs
```

## Guidelines

1. **Core stays UI-free.** Anything that must be testable headlessly goes into
   `AITeachingRecorderCore`; the app target only hosts UI and window management.
2. **Never touch the UI from capture callbacks.** Screen/audio callbacks run on
   capture queues — publish throttled state to the main actor instead.
3. **Add tests with every feature.** The test target is a plain executable runner;
   add a `testX()` function and invoke it at the bottom of `main.swift`.
4. **Keep the floating windows non-restorable** (`isRestorable = false`) and hide
   them on launch — restored "during recording" windows cause layout/CPU regressions.
5. **Update CHANGELOG.md** and the relevant `docs/` file with each change.

## Pull requests

- Branch from `codex/mac-screen-cam-recorder` (or `main` when it exists).
- Run `swift build` + `swift run AITRCoreUnitTests` and keep all checks green.
- Describe the user-facing impact and how it was tested in the PR description.

