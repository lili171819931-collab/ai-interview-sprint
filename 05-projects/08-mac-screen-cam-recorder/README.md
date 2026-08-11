# Mac Screen Cam Recorder

macOS-only 个人录制工具：实时录屏 + 圆形摄像头小窗 + 麦克风，本地合成导出。

## 圆形摄像头 + 背景虚化

- 圆窗嵌入屏幕并合成进成片（预览=导出）
- 可拖动（吸附四角）+ S/M/L / 滑杆调大小
- 背景虚化：MediaPipe 人像分割；可开关 + 强度；失败降级清晰出镜
- 右侧 Toggle：摄像头、麦克风、虚化、镜像、倒计时、最小化等

详见 `docs/decisions-blur.md` 与 `docs/极致Prompt-圆形摄像头嵌入虚化与开关.md`。

## Snapzy 风格能力（本机）

参考 [Snapzy](https://github.com/duongductrong/Snapzy)：

- 当前画面截图（PNG）+ 可选复制到剪贴板
- 录制中快拍截图
- Quick Access：打开 / Finder / 复制 / 删除
- 捕获历史：录屏+截图筛选、搜索、删除
- 全局快捷键：`⌘⇧⌥R` 录制开关 · `⌘⇧⌥S` 截图 · `⌘⇧⌥.` 停止
- 菜单栏托盘：截图 / 录制 / 停止

## Cap 风格体验（本机版）

参考 [Cap](https://github.com/CapSoftware/Cap) 的交互心智，但不做云分享/AI：

- 三步开录引导 + 首次提示
- 系统屏幕选择器
- 录制中悬浮控制条 + 菜单栏托盘停止
- 开始后可最小化窗口，避免录进本 App
- 完成后成功面板（Finder / 复制路径 / 再录一条）
- 最近录制列表（桌面 `Mac录屏`）
- 摄像头 S/M/L 预设 + 开停提示音

## 决策（Step 0 冻结）

| 项 | 选择 | 理由 |
|---|---|---|
| 平台 | 仅 macOS | 按产品 Prompt 锁定 |
| 技术栈 | Electron + Vite + React | 最快打通桌面采集与演示 |
| 合成 | Canvas 实时合成 → `captureStream` → MediaRecorder | 预览=成片构图，所见即所得 |
| 导出 | WebM (VP8/VP9 + Opus) | Chromium MediaRecorder 原生路径；后续可接 FFmpeg 转 H.264 MP4 |

## 运行

```bash
cd 05-projects/08-mac-screen-cam-recorder
npm install
# 若 Electron 不完整：手动解压缓存 zip 到 node_modules/electron/dist（见下方排障）
npm run dev
```

> Cursor/部分环境会注入 `ELECTRON_RUN_AS_NODE=1`，`npm run dev` 已用 `env -u ELECTRON_RUN_AS_NODE` 清掉，否则主进程拿不到 `electron.app`。

首次使用请在 **系统设置 → 隐私与安全性** 授权：

- 屏幕录制（列表里勾选 **Electron**）
- 摄像头
- 麦克风

授权后若源列表为空，点界面「刷新」。然后**重启一次 App**（macOS 对屏幕录制权限常需重启进程才生效）。

## 使用

1. 左侧选择显示器或窗口  
2. 右侧打开圆形摄像头与麦克风  
3. 预览中拖动圆形小窗（松手吸附四角）  
4. 开始录制 → 停止并保存 → Finder 中打开  

快捷键：`⌘R` 开始/停止 · `⌘M` 麦克风 · `⌘⇧C` 摄像头

## 说明

- 数据仅存本机，无账号、无上传。  
- 系统声音（loopback）本 MVP 不做。  
- 导出为 `.webm`；可用 VLC / Chrome / 较新 QuickTime 播放。若必须 MP4，下一步加 FFmpeg 转码。
