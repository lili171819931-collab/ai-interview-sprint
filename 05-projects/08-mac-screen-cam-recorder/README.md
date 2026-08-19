# 🎥 AI Teaching Recorder

> **录屏教学 + 实时摄像头小窗工作台** — 面向知识博主 / AI 教学 / 在线课程的轻量级 macOS 录课工具。
> A lightweight macOS screen recorder built for teaching: record your screen while a live **camera picture-in-picture** window floats on top, control everything from a tiny **always-on-top floating bar**, and get a playable **MP4** when you stop.

一个类似 **Loom + OBS + Screen Studio** 的轻量化版本，第一阶段聚焦：高质量教学录屏 + 人像小窗 + 极简操作。

```
              AI Teaching Recorder
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   ScreenCaptureKit  Camera(AVFoundation)  Mic + System Audio
        │              │              │
        └──────────────┼──────────────┘
                       ↓
              CoreImage Composition
              (Camera baked into video)
                       ↓
                   AVAssetWriter
                       ↓
                       MP4
              (H.264 + AAC, ~/Movies/AI Teaching Recorder)
```

---

## 📚 Documentation

| Doc | Content |
|---|---|
| [Product Definition](./docs/product/PRODUCT-DEFINITION.md) | 定位 / 用户 / 痛点 / 功能地图 / 商业模式 / 竞品对比 |
| [Architecture](./docs/architecture/ARCHITECTURE.md) | 分层架构 / 数据流 / 技术栈 / 设计规则 |
| [Workflow](./docs/workflow/WORKFLOW.md) | 录制 / 时间线 / CLI / 元数据 schema / 测试流程 |
| [Development](./docs/development/DEVELOPMENT.md) | 构建 / 签名 / 权限 / 添加功能 / 已知约束 |
| [Project Intelligence](./docs/PROJECT-INTELLIGENCE.md) | 一页纸总览 / 差距分析 / P0-P3 优先级 |
| [AI Teaching Studio Blueprint](./docs/AI-TEACHING-STUDIO-BLUEPRINT.md) | 开源竞品 Top 30 研究与 30 天开发蓝图 |
| [CHANGELOG](./CHANGELOG.md) · [ROADMAP](./ROADMAP.md) · [CONTRIBUTING](./CONTRIBUTING.md) · [SECURITY](./SECURITY.md) | 变更 / 路线 / 贡献 / 安全 |

## ✨ Features

### Screen recording (ScreenCaptureKit)
- 🖥️ **Entire Screen / Display / Window / Region** — 四种录制模式
- Retina / 多显示器坐标自动换算，硬件加速采集（Apple Silicon）
- 可录制 **系统声音**（`SCStream.capturesAudio`）+ 可选鼠标光标

### Camera PiP overlay（本产品最核心的差异化能力）
- 📷 **摄像头实时小窗**：拖动、缩放、**5 种形状（圆角矩形 / 圆形 / 椭圆 / 方形 / 菱形）**、**8 种布局（自由 / 四角 / 顶部 / 底部 / 圆形浮窗）**、镜像、边框、阴影
- **颜色滤镜**（原图 / 暖阳 / 冷调 / 黑白 / 复古）+ **美颜**（美白 / 红润 / 清晰度 / 磨皮，实时生效）
- 小窗**真正进入最终视频**：`Camera Frame → CoreImage Composition → Screen Frame + Camera → Encoder`，而不是只显示在 UI 上
- 录制前可在主页实时预览摄像头画面

### Floating control bar（悬浮控制条）
- ⏱ ● 计时器 + 🎙 麦克风 / 📷 摄像头 / ⏸ 暂停 / ■ 停止
- Always-on-top、毛玻璃、圆角、可拖动、可自动隐藏（鼠标移开收缩）
- **不进入最终录制画面**：通过 `SCContentFilter(display:excludingWindows:)` 将悬浮窗口从采集内容中排除

### Audio
- 🎙 麦克风（AVCaptureSession，独立开关、实时电平表、音量设置）
- 🔊 系统声音（随 ScreenCaptureKit 采集）
- 音视频时间戳对齐（每个输入独立以首帧为基准做 PTS 归零）

### Teaching annotations（教学标注，源自 12-ai-video-recorder 的标注引擎）
- ✏️ **画笔 / 箭头 / 矩形 / 椭圆 / 文字 / 橡皮**，8 种颜色 + 线宽调节 + 一键清空
- 全屏透明画布叠加在录课内容上，**标注实时烘焙进最终视频**
- 悬浮标注工具栏，控制条上的 ✏️ 按钮随时开关

### Countdown & click effects
- ⏱ 录制倒计时（0 / 3 / 5 / 10 秒），倒计时期间不录制，结束自动开始
- 🖱 可选 **鼠标点击特效**（系统级高亮圆环）与鼠标光标显示

### Teaching overlays (V0.2)
- ⌨️ **Keyboard OSD**：全局键盘监听（CGEventTap），录制时把 `⌘K` / `⇧⌘P` 等组合键实时烘焙进画面（需辅助功能权限，主页有引导）
- 🔦 **鼠标聚光灯**：光标周围径向光斑（CoreImage），可调半径/透明度，录制中可从悬浮控制条一键开关
- 📜 **提词器**：脚本编辑 + 半透明置顶滚窗 + 速度/字号调节 + 播放/暂停/复位；可选「入画」（进入视频）或「不入画」（从采集内容排除，画面干净）
- 🧾 **录制元数据旁录**：录制时把光标轨迹 / 点击 / 前台窗口切换 + 时间戳写入 `<视频>.metadata.json`，为 V1.0「AI 导演」（自动缩放/镜头）提供素材

### Timeline editing (V0.2)
- ✂️ **帧级最小时间线**：加载录制 → 裁剪头尾 → 检测静音段（一键删除）→ 以 AVMutableComposition 重新导出干净 MP4
- 时间线可视化（绿=保留 / 红=删除），每个静音段可单独恢复
- CLI：`aitr-cli timeline --input <视频> [--out <输出>] [--remove-silence] [--min-gap 1.0] [--threshold 0.02] [--trim-head N] [--trim-tail N]`

### Recording control & state machine
- Start / Pause / Resume / Stop / Record Again
- 明确状态机：`IDLE → PREPARING → RECORDING ⇄ PAUSED → STOPPING → PROCESSING → COMPLETED`，异常态 `ERROR / PERMISSION_DENIED / DEVICE_UNAVAILABLE / DISK_FULL`
- 快捷键：`⌘⇧R` 开始 / `⌘⇧P` 暂停 / `⌘⇧S` 停止 / `⌘⇧C` 摄像头 / `⌘⇧M` 麦克风

### Output & library
- 自动保存：`~/Movies/AI Teaching Recorder/2026/08/Recording_20260818_201530.mp4`
- 录制历史列表：预览 / 打开 / 显示在 Finder / 删除
- 录制完成页：Open Video / Show in Finder / Record Again

### Permissions
- 首次启动检测 Screen Recording / Camera / Microphone，一键打开系统设置
- 用户可理解的错误提示（不会出现 `Error Code 0x...`）

### Self Test
- 应用内 **Self Test**：录制 5 秒短片并验证 MP4（时长 / 视频轨 / 音频轨），一键定位问题
- 头less CLI：`AITRCLI selftest / devices / perms / record`

---

## 🏗 Architecture

```
App (SwiftUI + AppKit)
│
├── App/
│   ├── AITeachingRecorderApp.swift    # @main, 菜单/快捷键
│   ├── AppDelegate.swift              # 悬浮控制条 / 摄像头小窗 / 区域选择器 / 窗口排除
│   ├── CameraPanelContentView.swift   # 摄像头悬浮窗（拖动 + 缩放手柄）
│   └── RegionPickerController.swift   # 区域录制选择器（全屏遮罩拖拽）
│
├── UI/
│   ├── HomeView.swift                 # 主工作台：模式/来源/开始
│   ├── FloatingControlBarView.swift   # 悬浮控制条（自动隐藏）
│   ├── RecordingsView.swift           # 录制历史
│   ├── SettingsView.swift             # 设置（摄像头/视频/音频/快捷键/存储）
│   ├── SelfTestView.swift             # 自检
│   └── Components.swift
│
└── Core (AITeachingRecorderCore, 无 UI, 可被 CLI 复用)
    ├── ScreenCaptureEngine.swift      # ScreenCaptureKit 封装（屏幕+系统声音）
    ├── CameraEngine.swift             # AVCaptureSession 摄像头
    ├── MicEngine.swift                # AVCaptureSession 麦克风
    ├── CompositionRenderer.swift      # CoreImage 实时合成（摄像头烘焙进视频）
    ├── MP4Writer.swift                # AVAssetWriter (H.264 + AAC)
    ├── RecorderController.swift       # 录制编排 + ObservableObject 状态
    ├── RecorderState.swift            # 状态机 + 错误
    ├── PermissionsManager.swift       # TCC 权限
    ├── SettingsStore.swift            # UserDefaults 设置
    ├── FileOutputManager.swift        # 输出目录 / 历史 / 元数据
    ├── DeviceDiscovery.swift          # 显示器 / 窗口枚举
    ├── SelfTestRunner.swift           # 端到端自检
    └── Models.swift
```

### Key design decisions

1. **原生 macOS（SwiftUI + AppKit + ScreenCaptureKit + AVFoundation）**，不用 Web/Electron：
   - 录屏 / 摄像头 / 系统声音 / 硬件编码全部走系统原生能力，稳定且性能好
   - 悬浮窗口用 `NSPanel(.nonactivatingPanel)` 实现 always-on-top 且不影响操作
2. **UI Overlay 与 Video Composition 彻底解耦**：
   - 悬浮控制条只存在于 UI 层，并通过 `SCContentFilter` 从采集源中排除
   - 摄像头小窗既是 UI 预览，其几何信息（位置/大小/形状/镜像）被 `CompositionRenderer` 实时烘焙进每一帧视频 —— 因此最终视频包含摄像头，而不包含控制条
3. **实时合成而非后期合成**：`CIContext` 每帧把摄像头 CIImage 叠加到屏幕帧上，再交给 AVAssetWriter（VideoToolbox 硬件 H.264），避免二次编码与音画不同步
4. **无第三方依赖**：纯系统框架，`swift build` 即可构建（含 CLI，因此可以用 Command Line Tools 完成完整自检）

---

## 🧰 Tech Stack

| Area | Technology |
|---|---|
| Language | Swift 6 (Swift 5 mode) |
| UI | SwiftUI + AppKit |
| Screen capture | ScreenCaptureKit (SCStream / SCContentFilter) |
| Camera / Mic | AVFoundation (AVCaptureSession) |
| Composition | CoreImage (CIContext) + CoreGraphics |
| Encoding | AVAssetWriter + VideoToolbox (H.264/HEVC, AAC) |
| Build | Swift Package Manager + 自建 `.app` bundle 脚本 |

---

## 🛠 Installation & Build

Requirements: macOS 14+ (Apple Silicon 优先), Command Line Tools 或 Xcode, Swift 5.9+.

```bash
# 1) 构建 .app（release + 打包 + ad-hoc 签名）
./scripts/build-app.sh
# 产物: dist/AI Teaching Recorder.app

# 2) 直接打开
open "dist/AI Teaching Recorder.app"
```

> 没有 Xcode 也能构建：SwiftPM + 自建 bundle 脚本；`xcodebuild` 不是必需。

## 🧪 Testing

```bash
# 单元测试（状态机 / 设置持久化 / 文件管理 / 时间格式化）
./scripts/run-tests.sh

# 端到端自检：录制 5 秒屏幕+麦克风，验证 MP4（需要已授予 Screen Recording 等权限）
swift run AITRCLI selftest 5

# 其他 CLI 工具
swift run AITRCLI devices
swift run AITRCLI perms
swift run AITRCLI record --out /tmp/test.mp4 --seconds 5
```

应用内 **Self Test**（Home → Self Test → Run）执行同样的端到端检查，并展示逐项报告。

## 🔐 Permissions

首次使用需要授予：

- **Screen Recording**（系统设置 → 隐私与安全性 → 屏幕录制）
- **Camera**
- **Microphone**

应用主页会显示权限横幅并一键跳转系统设置。注意：**macOS 要求授予屏幕录制权限后重启应用**（TCC 机制），应用会提示你重启。

## ⚠️ Known Limitations

- 键盘 OSD 依赖 macOS「辅助功能」权限（全局键盘监听）；未授权时该功能自动禁用并在主页提示，不影响其他录制
- 静音检测基于音频 RMS 阈值（默认 0.02 / 最短间隔 1s），可在时间线页调节

- 系统声音采集依赖 macOS 的 ScreenCaptureKit（macOS 13+）；部分环境（如某些虚拟显示器/远程会话）可能无系统音频，应用会继续录屏并给出提示
- 音频输出为 AAC 双轨（麦克风 + 系统声音各一轨），播放器通常合并播放；如需单轨混音可在后续版本实现
- Window 模式按窗口的 2× 点尺寸采集（上限 3840×2160）
- 区域模式通过整屏采集 + 实时裁剪实现，区域越界部分会被裁剪
- 尚未实现：鼠标高亮/点击特效、AI 字幕、自动去停顿（Roadmap）

## 🗺 Roadmap

- **P0（已完成）**：屏幕录制、摄像头、摄像头合成、麦克风、悬浮控制条、开始/暂停/继续/停止、MP4 导出、权限处理、基础设置、系统声音、快捷键、录制历史、自检
- **P1（已完成）**：摄像头 5 形状 / 8 布局 / 滤镜 / 美颜、教学标注（画笔/箭头/矩形/椭圆/文字/橡皮）、录制倒计时、鼠标点击特效
- **P2**：单轨混音、AAC 单轨输出、录制恢复（crash recovery）、AI 字幕、自动去停顿、AI 剪辑、自动生成标题/章节、OCR、教学总结
- **V0.2（已完成）**：键盘显示 OSD、提词器、鼠标聚光灯、录制元数据旁录、帧级时间线（详见蓝图 PART 10）
- **V0.3（AI 剪辑）**：本地 ASR 字幕、去停顿/去口头禅、章节/摘要（详见蓝图 PART 8.2）
- **V1.0（AI 导演）**：自动镜头、短视频生成、多平台导出、云分享链接（详见蓝图 PART 8.3）


## 📘 研究蓝图与研究文档

完整的产品研究、竞品拆解（OBS / ScreenToGif / Screenity / Reframed / QuickRecorder / Cap / OpenScreen / Coherence 等 Top 30）、技术架构逆向、License / 商业模式 / AI 产品机会分析与 30 天开发蓝图，见：

> **📄 [docs/AI-TEACHING-STUDIO-BLUEPRINT.md](./docs/AI-TEACHING-STUDIO-BLUEPRINT.md)**

关键结论（详细见文档）：
- 技术路线：**Native macOS（Swift + ScreenCaptureKit）** 为 MVP 最优路线，后续补 Electron/Tauri 跨平台壳与 Web 轻量版
- AI 引擎：本地 **faster-whisper / whisperX**（字幕·去停顿·章节），导出走 **FFmpeg**（子进程）
- 教学层：**键盘显示 OSD / 提词器 / 聚光灯 / 帧级时间线** 已随 V0.2 落地
- 差异化：**AI 导演（光标轨迹→自动镜头）+ 教学语义化（课程→知识点短视频）** 是空白机会点

## 📄 License

Private / personal project. Feel free to adapt for your own teaching workflow.
