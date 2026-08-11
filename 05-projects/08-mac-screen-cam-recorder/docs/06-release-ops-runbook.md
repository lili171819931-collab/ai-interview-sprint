# 发布与运维手册

## 1. 本地开发发布

```bash
cd 05-projects/08-mac-screen-cam-recorder
npm install
brew install ffmpeg   # 导出 MP4 需要
npm run dev           # Vite :5177 + Electron
```

打包（目录）：

```bash
npm run package:mac
```

## 2. 权限运维

用户需在 **系统设置 → 隐私与安全性** 勾选本 App/Electron：

- 屏幕录制
- 摄像头
- 麦克风

变更权限后**完全退出再开**。

## 3. 导出目录

- 路径：`~/Desktop/Mac录屏`
- 产物：`YYYYMMDD-HHMMSS-screen-cam.mp4` + 同名 `.json`

## 4. 故障排查

| 现象 | 处理 |
|------|------|
| 源列表空 | 授权后重启；或用系统选择器 |
| 成片是网页视频感 | 确认 ffmpeg；看 sidecar `encode` |
| 计时不准 | 升级含墙钟操作条的版本；勿把倒计时算进成片 |
| 摄像头打不开 | 关 Continuity；看是否其它 App 独占；PiP 占用不影响成片主轨 |
| Electron 白屏 | 确认未设置 `ELECTRON_RUN_AS_NODE`；`npm run dev` 已 unset |

## 5. 快捷键

- `⌘⇧⌥R` 录制开关
- `⌘⇧⌥S` 截图
- `⌘⇧⌥.` 停止
