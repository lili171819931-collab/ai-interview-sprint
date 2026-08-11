# 作战记录 — 教学录屏持续采集（2026-08-11）

## 静止根因（P0）
1. 主窗口 `minimize` / 后台时 Chromium 节流 `requestAnimationFrame`，`canvas.captureStream` 不再收到新帧 → 成片静帧。
2. 合成循环曾依赖 React state 重建，加剧丢帧。

## 修复
- `backgroundThrottling: false` + 禁用 renderer backgrounding 开关。
- 录制时 `hide()` 替代 `minimize()`。
- 合成改为 **33ms setInterval** 主驱动（不依赖前台 RAF）。
- 录制中锁定 compose canvas 尺寸；屏幕 video 挂 DOM + `applyConstraints(frameRate)`。
- MediaRecorder `timeslice=250ms`。

## 本轮交付
- P2：圆/方小窗、镜像、成片无字、虚化保人像清晰。
- P3：独立悬浮操作条（contentProtection）。
- P1：指针放大镜 / 拉伸，跟随系统光标。
- MP4 → 桌面 `Mac录屏`；退出释放摄像头。
