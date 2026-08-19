# Workflow — AI Teaching Recorder

## Recording workflow (app)

```text
Home
 ├─ 选择录制模式：Entire Screen / Display / Window / Region
 ├─ Sources：Camera（预览+设备）/ Microphone（电平表）/ System Audio
 ├─ Teaching Tools：Keyboard OSD / Spotlight / Teleprompter / Metadata 开关
 └─ Start Recording（⌘⇧R）
      ├─ 悬浮控制条：计时 · 麦克风 · 摄像头 · 提词器 · 聚光灯 · 标注 · 暂停 · 停止
      ├─ 录制中：标注实时烘焙、点击特效、可选键盘 OSD/聚光灯
      └─ Stop（⌘⇧S / 控制条）→ MP4 + <video>.metadata.json
```

## Timeline workflow

```text
Timeline 页 → 选录制（或 Choose File…）
  → 可视时间条（绿=保留 / 红=删除）
  → 裁头尾（秒数 + Apply）
  → Detect & Remove Silence（min-gap / threshold 可调，逐段可恢复）
  → Export MP4… → 干净成片
```

## CLI workflows

```bash
# 端到端自检（录屏+麦克风+系统声音，可跳过摄像头）
swift run AITRCLI selftest 5

# 无头录制
swift run AITRCLI record --out /tmp/clip.mp4 --seconds 8 [--no-camera] [--no-mic]

# 时间线：查看静音段 / 去静音 / 裁头尾 / 导出
swift run AITRCLI timeline --input clip.mp4 --list-silence
swift run AITRCLI timeline --input clip.mp4 --remove-silence --min-gap 1.0 --out clean.mp4
swift run AITRCLI timeline --input clip.mp4 --trim-head 1 --trim-tail 1 --out trimmed.mp4
```

## Metadata side-channel (AI director input)

`<video>.metadata.json` schema:

```json
{
  "formatVersion": 1,
  "session": { "startedAt": "…", "duration": 6.4, "cursorSampleHz": 10 },
  "events": [
    { "t": 0.10, "type": "cursor", "x": 743.0, "y": 649.5 },
    { "t": 1.20, "type": "click",  "x": 500.0, "y": 400.0, "button": "left" },
    { "t": 2.00, "type": "window", "app": "Xcode", "title": "main.swift" }
  ]
}
```

Coordinates are global display points (top-left origin) — the same space as
ScreenCaptureKit frames, so V1.0 can map cursor/click events onto video pixels
for auto-zoom and highlight keyframes.

## Testing workflow

```bash
swift run AITRCoreUnitTests   # 88 checks: state machine, settings, composition, timeline, silence, metadata, labels
swift run AITRCLI selftest    # end-to-end record → file → stream audit
scripts/build-app.sh          # release .app + stable signing
```
