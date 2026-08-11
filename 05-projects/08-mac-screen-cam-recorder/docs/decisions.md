# Decision log

## Electron over Tauri
1. `desktopCapturer` + Chromium media pipeline 最短路径。
2. Canvas/`MediaRecorder` 与 Web 知识同构，便于快速迭代。
3. 打包与权限文案有成熟先例。

## Canvas realtime over FFmpeg-only post
1. 必须所见即所得预览。
2. 单路合成轨，避免用户后期拼轨。
3. MVP 零外部二进制依赖；MP4 转码列为后续。
