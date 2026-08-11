# Architecture

```text
desktopCapturer sources
        │
        ▼
getUserMedia(chromeMediaSource=desktop) ──► <video screen>
getUserMedia(camera) ─────────────────────► <video camera>
getUserMedia(mic) ──► AudioContext gain/analyser

Canvas 2D each frame:
  draw screen (cover)
  clip circle + draw camera (optional mirror)
  stroke circle

composeCanvas.captureStream(30) + mic audio tracks
        │
        ▼
MediaRecorder (webm) ──► save dialog ──► Movies/*.webm + optional .json sidecar
```

Electron main: sources IPC, privacy settings deep-links, save dialog, Dock REC badge.
