# Roadmap

> Derived from [docs/AI-TEACHING-STUDIO-BLUEPRINT.md](./docs/AI-TEACHING-STUDIO-BLUEPRINT.md).

## Status legend
- ✅ Done · 🚧 In progress · ⬜ Planned

## V0.1 — MVP (✅)
Screen recording + webcam PiP + floating control bar + MP4 export.

## V0.2 — Teaching layer (✅)
- ⌨️ Keyboard OSD · 📜 Teleprompter · 🔦 Mouse spotlight
- 🧾 Recording metadata side-channel · ✂️ Frame-level timeline (silence removal)

## V0.3 — AI editing (⬜)
- 🚧 Local ASR subtitles (faster-whisper / whisper.cpp, word-level timestamps)
- ⬜ Auto silence / filler-word removal (词级时间戳裁剪)
- ⬜ Chapters / summary / title / cover (local LLM or API)
- ⬜ Subtitle track (SRT + burned-in) and SRT export

## V1.0 — AI director (⬜)
- ⬜ Cursor/click/window events → auto zoom & camera keyframes (from `.metadata.json`)
- ⬜ One-click short-video / knowledge-point versions
- ⬜ Social export presets (YouTube / TikTok / Bilibili / Xiaohongshu)
- ⬜ Optional cloud share links (Open Core)

## Cross-platform (later)
- ⬜ Electron / Tauri shell reusing the Core engine
- ⬜ Web lite recorder (getDisplayMedia + ffmpeg.wasm) for the teaching workflow

## P0 hardening (short term)
- ✅ Settings output-directory picker can no longer silently move recordings
- ✅ Floating windows no longer restore on relaunch (kills 100% CPU loop)
- ⬜ Recording start-failure UX: surface `lastError` instead of showing
  "Recording" UI when start fails (`toggleRecordingShortcut` currently swallows errors)
- ⬜ Crash-safe finalize: keep partial recordings recoverable on unexpected exit

