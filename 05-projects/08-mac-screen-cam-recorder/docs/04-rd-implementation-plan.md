# 研发实现计划

## 1. 技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 壳 | Electron | 桌面采集 + 多窗 + 系统权限 |
| UI | Vite + React + TS | 快迭代、类型约束 |
| 合成 | Canvas 2D + captureStream | 预览=成片 |
| 虚化 | MediaPipe tasks-vision | 可降级 |
| 导出 | MediaRecorder → ffmpeg MP4 | 兼容 QuickTime |

## 2. 模块划分

```text
electron/main.cjs          窗口、IPC、ffmpeg、托盘、快捷键
electron/control-bar.html  录制悬浮条（本地计时）
electron/camera-pip.html   出镜监视窗（手势→IPC）
src/App.tsx                采集、合成循环、录制状态机
src/lib/compose.ts         绘制与 hitTest
src/lib/camera-blur.ts     分割虚化
src/lib/pointer-zoom.ts    光标归一化
```

## 3. 关键实现顺序（已完成回顾）

1. 屏幕 + 摄像头 + 麦 → Canvas 合成 → WebM
2. 权限引导、布局拖动、镜像
3. 虚化管线与开关
4. 控制条 / PiP / 托盘
5. MP4 转码与时长墙钟
6. Continuity 过滤、手势切形/反转

## 4. 质量门禁

- `tsc --noEmit`
- 实机：授权后选屏录 10s，QuickTime 播放
- 负例：无 ffmpeg、取消选屏、关摄像头录纯屏

## 5. 后续工程债

- 正式 notarized 安装包
- 系统声
- 自动回归（Playwright 对 Electron 成本高，优先手工脚本清单）
