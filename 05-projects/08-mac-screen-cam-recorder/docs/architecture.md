# Architecture

```text
desktopCapturer / getDisplayMedia
        │
        ▼
getUserMedia(desktop) ──► <video screen>
getUserMedia(Mac cam) ──► <video camera> ──► (optional) MediaPipe blur
getUserMedia(mic) ──► AudioContext gain/analyser

Compose loop (setInterval ~33ms, backgroundThrottling=false):
  draw screen (+ pointer zoom)
  draw camera PiP (circle|rect, mirror)
        │
        ▼
composeCanvas.captureStream(30) + mic tracks
        │
        ▼
MediaRecorder (often webm bytes)
        │
        ▼
main: sniff ftyp? → write MP4
      else ffmpeg → ~/Desktop/Mac录屏/*.mp4 + .json sidecar
```

## Windows

| Window | Role |
|--------|------|
| Main shell | Preview, device toggles, in-shell transport |
| Control bar | Shown when recording + main hidden; local wall-clock timer |
| Camera PiP | Always-on-top monitor; drag→layout; click shape; dblclick mirror; `setContentProtection(true)` |

## IPC (selected)

- `save-recording` / `set-control-bar` / `push-control-bar-state`
- `set-camera-pip` / `camera-pip-action` / `camera-pip-moved`
- `tray-action` ← control bar & pip & global shortcuts

Electron main also: privacy deep links, Dock REC badge, export dir helpers.
