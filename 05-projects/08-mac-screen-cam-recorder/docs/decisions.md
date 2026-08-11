# 关键产品决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 平台 | 仅 macOS | Prompt/场景锁定；先打磨成片质量 |
| 技术栈 | Electron + Vite + React | 最快打通桌面采集与多窗 |
| 合成 | Canvas → captureStream → MediaRecorder | 预览 = 成片 |
| 导出 | ffmpeg → H.264 MP4 | QuickTime 可播；禁止伪后缀 WebM |
| 摄像头 | 仅电脑摄像头 | 排除 Continuity 误开 |
| 录制 UI | 主壳 +（隐藏时）悬浮条 + PiP | 少窗；控件不进成片（contentProtection） |
| 小窗手势 | 单击切形、双击反转、拖动改位 | 教学操作可记 |
| 虚化 | MediaPipe 可选 | 失败降级，不阻塞开录 |
| 系统声 | 不做 | 控制 MVP 范围 |
