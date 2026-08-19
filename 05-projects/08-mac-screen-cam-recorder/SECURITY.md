# Security

## Permissions & privacy model

AI Teaching Recorder is a **local-first** application:

- Recordings, metadata sidecars (`.metadata.json`) and configuration stay on your
  machine — nothing is uploaded by default.
- The app requires three macOS TCC permissions: **Screen Recording** (to capture
  the screen + system audio), **Camera**, and **Microphone**. Permissions are only
  used while you record; the app never records in the background on its own.
- **Keyboard OSD** requires the **Accessibility** permission (global key-event
  tap). It is listen-only, never intercepts input, and is disabled when the
  permission is missing.
- The teleprompter and other floating windows are excluded from the capture unless
  you explicitly choose "in video (入画)".

## Reporting a vulnerability

Please report security issues privately by opening a GitHub issue with the label
`security` or contacting the maintainer. Do **not** include recordings or
permission dumps in public reports.

## Hardening notes

- The app is code-signed with a persistent self-signed identity
  (`AI Teaching Recorder Dev`) so TCC grants survive rebuilds; replace it with an
  Apple Developer ID certificate for distribution.
- No API keys, tokens, or passwords are stored by the app; `.env.example` is not
  applicable to this native macOS project (configuration lives in
  `UserDefaults` under `com.liliyang.AITeachingRecorder`).
- Audio/video files are written with atomic finalize where possible; keep backups
  of important recordings.

