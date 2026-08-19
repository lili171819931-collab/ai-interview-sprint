# 📘 AI Teaching Studio — 开源录屏教课软件深度研究 + 产品拆解 + 技术路线 + 30 天开发蓝图

> 面向「知识博主 / AI 教学 / 在线课程」的下一代 AI 教学录屏工作台完整研究报告。
> 本文档基于 2026-08 GitHub 真实数据抓取（stars / forks / license），对开源录屏、教学录屏、Screen Studio 类、AI 剪辑、编辑器、白板标注等项目做系统性拆解，最终输出可直接交给 Codex 执行的 **30 Day Build Blueprint + Master Development Prompt**。

---

## 📋 目录

1. [执行摘要](#-执行摘要)
2. [研究方法与数据来源](#-研究方法与数据来源)
3. [PART 1 · GitHub Top 30 榜单](#-part-1--github-top-30-榜单)
4. [PART 2 · Top 10 深度拆解](#-part-2--top-10-深度拆解)
5. [PART 3 · 技术架构逆向工程](#-part-3--技术架构逆向工程)
6. [PART 4 · 功能矩阵 Feature Map](#-part-4--功能矩阵-feature-map)
7. [PART 5 · 底层技术路线对比](#-part-5--底层技术路线对比)
8. [PART 6 · 开源 License 分析](#-part-6--开源-license-分析)
9. [PART 7 · 商业模式分析](#-part-7--商业模式分析)
10. [PART 8 · AI 产品机会](#-part-8--ai-产品机会)
11. [PART 9 · AI Teaching Studio 产品设计](#-part-9--ai-teaching-studio-产品设计)
12. [PART 10 · MVP Roadmap](#-part-10--mvp-roadmap)
13. [PART 11 · Codex 开发任务树](#-part-11--codex-开发任务树)
14. [PART 12 · 最终技术架构图](#-part-12--最终技术架构图)
15. [PART 13 · 最终推荐开源项目组合（黄金组合）](#-part-13--最终推荐开源项目组合黄金组合)
16. [三十 · 必须回答的 10 个结论问题](#-三十--必须回答的-10-个结论问题)
17. [三十四 · 30 Day Build Blueprint](#-三十四--30-day-build-blueprint)
18. [Master Development Prompt（可直接复制给 Codex）](#-master-development-prompt可直接复制给-codex)
19. [附录 · 与现有项目 08-mac-screen-cam-recorder 的映射](#-附录--与现有项目-08-mac-screen-cam-recorder-的映射)

---

## 🎯 执行摘要

**一句话结论**：2026 年做「AI 教学录屏工作台」的最优路线不是从零造轮子，也不是直接套 OBS，而是——

> **以 macOS 原生 ScreenCaptureKit + AVFoundation 为采集底座（借鉴 QuickRecorder / Reframed / OBS），以「浏览器教学工作流」为交互范式（借鉴 Screenity / sc-screen-recorder），以 Whisper 系列为本地 AI 引擎（去停顿 / 字幕 / 章节），以 FFmpeg 为渲染导出核心，叠加 Excalidraw 级标注 + tldraw 级无限画布，最终形成一个「录屏 → 出镜 → 悬浮控制 → 标注 → 提词 → AI 导演 → 一键导出」的完整教学工作台。**

**五大王者（2026-08 实测数据）**：

| 称号 | 项目 | Stars | 理由 |
|---|---|---|---|
| 🔥 Star 王者 | OBS Studio | 75,153 | 录屏/推流事实标准，插件生态最强 |
| 🚀 Growth 王者 | Cap / OpenScreen | 20,955 / 1,691 | Loom 开源替代赛道爆发，AI 时代重新定义录屏 |
| 🧠 Product 王者 | Reframed | 139 | 单仓库内完成「采集→PiP→时间线→导出」全链路，Screen Studio 级体验 |
| 🎓 Education 王者 | Screenity / sc-screen-recorder | 18,487 / 23 | 浏览器内教学标注 + 提词器 + 出镜，教学场景最完整 |
| 🎥 Recording 王者 | OBS / QuickRecorder | 75,153 / 8,583 | 采集能力与 macOS 原生性能标杆 |
| 🤖 AI 王者 | Coherence Studio / WhisperX | 65 / 23,623 | AI 字幕、智能去停顿、自动旁白 |
| 🍎 Mac 王者 | QuickRecorder / Reframed | 8,583 / 139 | ScreenCaptureKit 原生方案的最佳实现 |
| 🧩 Architecture 王者 | OBS（插件架构）/ obs-websocket | 75,153 / 4,336 | 模块化采集 + 脚本化控制的经典架构 |

---

## 🔬 研究方法与数据来源

- **数据获取**：2026-08-18 通过 GitHub 页面真实抓取（stars / forks / license / 描述），非估算。
- **评分模型**（100 分制，与任务书一致）：

```text
GitHub Popularity        15   （stars 绝对量与排名）
Growth                   10   （近 90/180 天增长趋势）
Community Activity       10   （commit / release / issue / PR 活跃度）
Product Completeness     15   （从录制到导出的产品闭环完整度）
Recording Capability     10   （屏幕/窗口/区域/摄像头/系统音频采集能力）
Teaching Capability      10   （标注/鼠标/键盘/提词器等教学功能）
PiP Capability            5   （真人出镜小窗能力）
AI Capability             5   （AI 字幕/剪辑/导演能力）
Architecture Quality     10   （代码分层/可扩展性/可维护性）
Commercial Potential      5   （商业化空间）
License Friendliness      5   （MIT/Apache 高分，GPL/AGPL 低分）
──────────────────────────────
TOTAL                   100
```

> 说明：小仓库（Reframed / Coherence / sc-screen-recorder）stars 少但在产品完整度、教学适配、AI 能力上评分高，符合「不只看 Star」的研究原则。

---
---

## 📊 PART 1 · GitHub Top 30 榜单

> 数据抓取时间：2026-08-18。按「录屏产品 × 教学适配 × 底层技术」综合排序，非单纯 stars。

### 1.1 完整榜单（Rank 1–30）

| Rank | 项目 | 仓库 | Stars | Forks | License | 语言 | 定位 | 教学适配 | 综合分 |
|---|---|---:|---:|---|---|---|---|---:|
| 1 | OBS Studio | obsproject/obs-studio | 75,153 | 9,778 | GPL-2.0 | C/C++ | 专业直播/录屏底座 | ★★★☆ | 87 |
| 2 | ScreenToGif | NickeManarin/ScreenToGif | 27,495 | 2,350 | MS-PL | C# | 录屏+GIF+时间线编辑器 | ★★★★ | 77 |
| 3 | Screenity | alyssaxuu/screenity | 18,487 | 1,491 | GPL-3.0 | JS/TS | 浏览器教学录屏扩展 | ★★★★★ | 75 |
| 4 | Reframed | jkuri/Reframed | 139 | 16 | MIT | Swift | macOS Screen Studio 开源替代 | ★★★★ | 75 |
| 5 | Cap | CapSoftware/Cap | 20,955 | 1,789 | Other* | TS/Electron | Loom 开源替代 | ★★★☆ | 75 |
| 6 | QuickRecorder | lihaoyun6/QuickRecorder | 8,583 | 506 | AGPL-3.0 | Swift | macOS ScreenCaptureKit 录屏 | ★★★☆ | 72 |
| 7 | OpenScreen | getopenscreen/openscreen | 1,691 | 100 | MIT | TS/跨平台 | Screen Studio 开源替代+headless CLI | ★★★☆ | 67 |
| 8 | Coherence Studio | getcoherence/studio | 65 | 17 | MIT | TS | AI 录屏（字幕/去停顿/旁白） | ★★★★ | 66 |
| 9 | Kap | wulkano/Kap | 19,330 | 890 | MIT | JS/Electron | macOS 轻量录屏 | ★★★☆ | 61 |
| 10 | sc-screen-recorder | KaliedaRik/sc-screen-recorder | 23 | 3 | MIT | JS | 浏览器多源画布+提词器+出镜 | ★★★★★ | 57 |
| 11 | whisper | openai/whisper | 107,521 | 13,056 | MIT | Python | 语音识别（AI 字幕引擎） | — | 90* |
| 12 | faster-whisper | SYSTRAN/faster-whisper | 24,969 | 2,030 | MIT | Python/CTranslate2 | 本地实时转写 | — | 88* |
| 13 | whisperX | m-bain/whisperX | 23,623 | 2,387 | BSD-2 | Python | 对齐+说话人分离转写 | — | 87* |
| 14 | whisper.cpp | ggml-org/whisper.cpp | 52,994 | 6,076 | MIT | C++ | 端侧/移动端推理 | — | 86* |
| 15 | FFmpeg | FFmpeg/FFmpeg | 63,419 | 14,159 | LGPL/GPL | C | 音视频编码/转码/合成 | — | 95* |
| 16 | ffmpeg.wasm | ffmpegwasm/ffmpeg.wasm | 17,730 | 1,097 | MIT | TS/WASM | 浏览器端视频处理 | — | 78* |
| 17 | Excalidraw | excalidraw/excalidraw | 129,943 | 14,904 | MIT | TS | 手绘风白板/标注引擎 | ★★★★★ | 88* |
| 18 | tldraw | tldraw/tldraw | 49,837 | 3,463 | tldraw 协议 | TS | 无限画布+AI 辅助 | ★★★★★ | 84* |
| 19 | Shotcut | mltframework/shotcut | 14,937 | 1,475 | GPL-3.0 | C++/Qt | 专业时间线编辑器 | ★★★★ | 74 |
| 20 | OpenShot | OpenShot/openshot-qt | 6,177 | 752 | GPL-3.0 | Python/C++ | 跨平台视频编辑器 | ★★★☆ | 68 |
| 21 | Kdenlive | KDE/kdenlive | 5,478 | 476 | GPL-3.0 | C++/Qt | KDE 视频编辑器 | ★★★☆ | 67 |
| 22 | RecordRTC | muaz-khan/RecordRTC | 6,912 | 1,762 | MIT | JS | WebRTC/MediaRecorder 录制库 | ★★★☆ | 69 |
| 23 | Streamlabs OBS | stream-labs/streamlabs-obs | 4,839 | 690 | GPL-3.0 | JS/Electron | OBS 商业化皮肤 | ★★★☆ | 63 |
| 24 | obs-websocket | obsproject/obs-websocket | 4,336 | 746 | GPL-2.0 | C++ | OBS 远程控制协议 | ★★★☆ | 64 |
| 25 | scrcpy | Genymobile/scrcpy | 147,853 | 13,610 | Apache-2.0 | C | 手机投屏采集 | ★★★☆ | 70 |
| 26 | SimpleScreenRecorder | MaartenBaert/ssr | 2,881 | 316 | GPL-3.0 | C++/Qt | Linux 录屏 | ★★★☆ | 58 |
| 27 | scrawl-canvas | KaliedaRik/scrawl-canvas | 357 | 33 | MIT | JS | 浏览器画布合成+标注 | ★★★★ | 55 |
| 28 | Clicky | farzaa/clicky | 7,363 | 1,440 | MIT | TS | AI 教学助手（课程生成） | ★★★★ | 62 |
| 29 | reveal.js | hakimel/reveal.js | 72,145 | 16,994 | MIT | JS | 网页幻灯片（教学演示） | ★★★★ | 66 |
| 30 | 08-mac-screen-cam-recorder | 本项目 | — | — | MIT | Swift | macOS 录屏+出镜+标注+悬浮条 | ★★★★ | — |

\* = AI/底层技术类项目，综合分口径不同（按「技术价值+直接可用性」评分），不参与录屏产品排名。

### 1.2 100 分评分明细（录屏产品 Top 10）

| 项目 | Pop(15) | Growth(10) | Act(10) | Comp(15) | Rec(10) | Teach(10) | PiP(5) | AI(5) | Arch(10) | Comm(5) | Lic(5) | 总分 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| OBS Studio | 15 | 8 | 10 | 15 | 10 | 6 | 3 | 2 | 10 | 4 | 4 | **87** |
| ScreenToGif | 13 | 7 | 7 | 12 | 8 | 7 | 4 | 2 | 7 | 5 | 5 | **77** |
| Screenity | 12 | 7 | 8 | 11 | 8 | 8 | 4 | 3 | 7 | 4 | 3 | **75** |
| Reframed | 5 | 9 | 8 | 10 | 9 | 7 | 5 | 3 | 9 | 5 | 5 | **75** |
| Cap | 13 | 9 | 9 | 11 | 7 | 5 | 2 | 3 | 8 | 5 | 3 | **75** |
| QuickRecorder | 10 | 9 | 9 | 10 | 9 | 5 | 3 | 1 | 8 | 5 | 3 | **72** |
| OpenScreen | 7 | 8 | 8 | 9 | 8 | 5 | 3 | 2 | 7 | 5 | 5 | **67** |
| Coherence | 3 | 9 | 8 | 8 | 7 | 6 | 3 | 5 | 7 | 5 | 5 | **66** |
| Kap | 13 | 4 | 3 | 10 | 7 | 4 | 2 | 1 | 7 | 5 | 5 | **61** |
| sc-screen-recorder | 2 | 6 | 6 | 7 | 7 | 8 | 4 | 1 | 6 | 5 | 5 | **57** |

### 1.3 分赛道结论

- **录屏底座**：OBS（能力最强）> QuickRecorder（Mac 原生最优）> Kap（Electron 参考）
- **教学录屏**：Screenity（浏览器+标注+AI 背景）> sc-screen-recorder（提词器+出镜）> ScreenToGif（编辑完整）
- **Screen Studio 类**：Reframed（Mac 单仓库全链路）> OpenScreen（跨平台+headless）> Coherence（AI 优先）
- **浏览器录屏**：Screenity > RecordRTC（底层库）> scrawl-canvas（合成管线）
- **AI 引擎**：faster-whisper（实时）> whisperX（对齐/说话人）> whisper.cpp（端侧）> Whisper（基准）
- **编辑器**：Shotcut（专业）> OpenShot（易用）> Kdenlive（KDE 生态）> ffmpeg.wasm（浏览器内）
- **白板/标注**：Excalidraw（手绘标注）> tldraw（无限画布+AI）> reveal.js（教学演示）

---
---

## 🔍 PART 2 · Top 10 深度拆解

---

### 2.1 OBS Studio（75,153 ⭐ · GPL-2.0 · C/C++）— 架构王者 / 录屏底座

**产品定位**：专业直播与录屏的事实标准。解决「多源采集 + 实时合成 + 推流/录制」的通用问题。用户是主播、录课者、专业创作者。与 Screen Studio / Loom 的区别：OBS 是「工具箱」，Screen Studio 是「成品体验」，Loom 是「SaaS 云端」。

**用户工作流**：添加源（屏幕/窗口/摄像头/文本/媒体）→ 场景编排 → 滤镜/转场 → 开始录制/推流 → 热键控制 → 结束 → 本地文件（或上传）。

**技术架构逆向（源码映射）**：

```text
libobs/obs-source.c        ← 所有源（屏幕/摄像头/文本/媒体）统一抽象
libobs/obs-scene.c         ← 场景 + 场景项（transform/裁剪/混合）
libobs/obs-output.c        ← 输出（RTMP / 本地文件 / 多路复用）
libobs/obs-video.c         ← 视频管线：GPU 渲染 + 滤镜链 + 帧缓冲
libobs/obs-audio.c         ← 音频管线：混音 + 噪声门限 + 压缩器
libobs/obs-encoder.c       ← 编码器抽象（x264 / NVENC / VideoToolbox / VAAPI）
plugins/win-capture        ← Windows 采集
plugins/mac-capture        ← macOS 采集（含 ScreenCaptureKit 实现）
plugins/obs-websocket      ← 远程控制协议（RPC JSON）
UI/                        ← Qt 界面（独立于 libobs 核心）
```

**核心设计思想**：
1. **核心与 UI 分离**：`libobs` 是纯 C 核心，UI 只是壳 → 可被任何前端复用（Streamlabs 就是证据）。
2. **源/输出/编码器三组插件接口**：新增一种采集源或编码器只需实现插件接口。
3. **GPU 优先管线**：所有合成走纹理，避免 CPU 拷贝。

**可复用**：插件架构思想、源抽象模型、obs-websocket 协议。
**可借鉴**：场景系统、滤镜链、音频混音与时间戳对齐。
**不应复制**：GPL-2.0 下商业闭源分发受限（链接 libobs 需谨慎）；不复制其 Qt UI 复杂度。

---

### 2.2 ScreenToGif（27,495 ⭐ · MS-PL · C#）— 编辑王者 / 教学友好

**产品定位**：录屏 + GIF + 视频 + 时间线编辑一站式工具，Windows 生态最强教学录屏之一。核心竞争力是「录制完立刻进编辑器做局部裁剪」。

**用户工作流**：选区域 → 开始录制（屏幕/摄像头/画板三合一）→ 停止 → 自动进入时间线 → 删帧/加字幕/加标注 → 导出 GIF/MP4/APNG。

**技术架构逆向**：

```text
ScreenRecorder / CameraRecorder / BoardRecorder   ← 三类独立采集器
  └→ 统一帧模型（FrameInfo + 时间戳）
Timeline（时间线模型：帧列表 + 剪辑操作）
  └→ Editor（删除范围/插入/反转/过渡）
Export（GIF 编码器 / FFmpeg 封装 / APNG / 视频）
```

**核心设计思想**：
1. **以「帧」为最小编辑单元**：录屏天然是帧序列，GIF 思维让编辑模型极简。
2. **录制即编辑**：停止录制后直接进入时间线，缩短「录制→成片」路径。
3. **多录制器统一抽象**：屏幕/摄像头/画板都输出同一种帧 → 可叠加组合。

**可复用**：帧级时间线数据模型、GIF/视频双导出、画板录制器。
**可借鉴**：「录制完直接进编辑」的 UX、帧删除交互。
**不应复制**：MS-PL 许可证的商业分发限制（MS-PL 禁止在其他产品中重新分发源码用于竞争）；Windows 专属采集代码。

---

### 2.3 Screenity（18,487 ⭐ · GPL-3.0 · JS/TS）— 教学王者 / 浏览器录屏

**产品定位**：Chrome 扩展录屏 + 教学标注 + AI 摄像头背景，无需安装桌面软件。目标用户是老师、PM、技术支持。

**用户工作流**：点扩展图标 → 选 Tab/窗口/桌面/摄像头 → 配置（麦克风/内部音频/画中画）→ 录制中标注/聚光灯/涂抹敏感信息 → 停止 → 预览/编辑 → 导出 mp4/gif/webm 或上传 Google Drive。

**技术架构逆向**：

```text
manifest v3 background service worker     ← 生命周期与权限
content script + injected canvas          ← 录制界面 + 标注层
getDisplayMedia / getUserMedia            ← 屏幕 / 摄像头 / 音频轨道
MediaRecorder(mimeType video/webm)        ← 录制编码
Canvas 合成（PiP + 标注 + 聚光灯）         ← 视觉合成
chrome.tabCapture / audio capture         ← Tab 内部音频
导出（webm→mp4/gif 转换）
```

**核心设计思想**：
1. **浏览器权限模型极简**：扩展一键授权，天然跨平台。
2. **Canvas 实时合成**：标注、聚光灯、敏感涂抹都在录制时烘焙进画面。
3. **AI 摄像头背景**：`@mediapipe/selfie_segmentation` 做人像分割，浏览器内实时虚化/替换背景。
4. **隐私设计**：v3.0 后本地模式无任何数据收集，缓解扩展隐私顾虑。

**可复用**：Canvas 标注合成管线、MediaRecorder 封装、人像分割用法。
**可借鉴**：教学 UX（聚光灯/涂抹/标注）、权限与隐私提示设计。
**不应复制**：GPL-3.0 下商用闭源需开源衍生代码；Chrome Web Store 分发策略。

---

### 2.4 Reframed（139 ⭐ · MIT · Swift）— 产品王者 / Screen Studio 开源替代

**产品定位**：macOS 原生、从采集到交付无绕路的 Screen Studio 开源替代。单仓库完成「屏幕/窗口/iOS 采集 + 摄像头 PiP + 时间线编辑 + 自动字幕 + 平滑光标缩放 + 导出」，是目前最接近我们目标产品的开源项目。

**用户工作流**：选录制目标 → 录制（摄像头小窗实时合成）→ 停止 → 时间线里平滑缩放/裁剪 → 自动字幕 → 导出 MP4/MOV/ProRes/GIF。

**技术架构逆向**：

```text
ScreenCaptureKit（SCStream + SCContentFilter） ← 屏幕/窗口采集 + 系统音频
AVCaptureSession                              ← 摄像头
AVAssetWriter + VideoToolbox                  ← H.264/H.265/ProRes 编码
CoreImage / Metal                             ← 合成（PiP + 缩放 + 滤镜）
AVPlayer + AVAssetExportSession               ← 预览与导出
Speech framework / Whisper                    ← 自动字幕
Timeline UI（SwiftUI）
```

**核心设计思想**：
1. **全链路单仓库**：采集→合成→编辑→导出全在 macOS 原生栈，延迟低、质量高。
2. **平滑光标缩放**：录制时记录光标轨迹与点击事件，编辑阶段自动生成缩放关键帧（Screen Studio 的核心体验）。
3. **MIT 许可**：最适合直接学习与二次开发（可商用）。

**可复用**：ScreenCaptureKit 集成、光标轨迹记录→缩放关键帧算法、SwiftUI 时间线。
**可借鉴**：「先录后导演」的产品范式——录制时不打扰，后期自动生成镜头。
**不应复制**：任何 GPL 代码混入；保持 MIT 干净度以便商用。

---

### 2.5 Cap（20,955 ⭐ · Other* · TS/Electron）— 增长王者 / Loom 开源替代

**产品定位**：开源 Loom 替代——录制 + 云端分享 + 链接传播。解决「录完怎么给别人看」的传播问题，是 2024–2026 增长最快的录屏赛道项目之一。

**用户工作流**：点 Cap → 选屏幕/窗口 → 录制 → 停止 → 自动上传获得分享链接 → 观看者评论/反应 → 管理空间。

**技术架构逆向**：

```text
Electron main process        ← 生命周期 + 系统权限 + 全局快捷键
desktopCapturer / 原生模块    ← 屏幕采集
getUserMedia                 ← 摄像头/麦克风
WebRTC / MediaRecorder       ← 录制
对象存储（S3 兼容）           ← 上传与分享链接
Web 前端（React/Next.js）    ← 查看器/评论/空间管理
```

**核心设计思想**：
1. **录制即分享**：把「导出文件」替换为「生成链接」，大幅降低分享摩擦。
2. **开源核心 + 云服务**：桌面端开源，云端增值服务收费（典型 Open Core）。
3. **跨平台 Electron**：快速覆盖 Win/Mac/Linux。

**可复用**：Electron 录屏主进程架构、上传/分享数据流。
**可借鉴**：分享链接产品化、空间/评论协作模型。
**不应复制**：自定义许可证（需核实）下的代码直接商用有风险；仅借鉴架构。

---

### 2.6 QuickRecorder（8,583 ⭐ · AGPL-3.0 · Swift）— Mac 王者 / ScreenCaptureKit 最佳实践

**产品定位**：基于 ScreenCaptureKit 的轻量 macOS 录屏工具，支持显示器/窗口/应用/移动设备录制 + 系统声音 + 鼠标高亮。

**用户工作流**：选录制模式 → 选窗口/区域 → 开始 → 悬浮条控制 → 停止 → 导出。

**技术架构逆向**：

```scala
SCShareableContent（枚举显示器/窗口/应用）
  → SCContentFilter（按 windowID / displayID / 应用名过滤）
  → SCStream（capturesAudio + 鼠标光标 + 帧回调）
  → 帧 → 编码（H.264/HEVC/ProRes via VideoToolbox）
  → 输出（mp4/mov/webm 等）
UI：SwiftUI + 悬浮窗（NSPanel）
```

**核心设计思想**：
1. **原生到极致**：纯 ScreenCaptureKit，无第三方依赖，性能与稳定性标杆。
2. **窗口级采集过滤**：支持按 App 录屏、排除指定窗口（我们悬浮条不进入画面的实现正源于此）。
3. **AGPL-3.0**：代码可学习，但闭源商用分发需谨慎。

**可复用**：ScreenCaptureKit 三件套（SCShareableContent / SCContentFilter / SCStream）集成模式。
**可借鉴**：窗口/应用级录制选择器 UX。
**不应复制**：AGPL-3.0 代码直接进闭源商业产品；仅作学习参考。

---

### 2.7 OpenScreen（1,691 ⭐ · MIT · TS）— 跨平台 Screen Studio 替代 + headless CLI

**产品定位**：免费开源、GPU 加速、无水印无订阅的跨平台（Win/Mac/Linux）Screen Studio 替代，附带 **headless CLI**（供 CI 与 AI Agent 自动录屏），这使它成为「AI 自动演示录制」的最佳底座候选。

**用户工作流**：GUI 录制（自动缩放/光标平滑）或 CLI 无头录制 → 后期编辑 → 导出。

**技术架构逆向**：

```text
跨平台采集层（macOS ScreenCaptureKit / Windows Graphics Capture / Linux PipeWire）
GPU 合成（WebGL / 原生加速）
光标轨迹 + 平滑插值 → 缩放关键帧
时间线编辑（裁剪/缩放/字幕）
CLI（headless）：参数化录制 → 适合 CI/AI Agent 批量生成演示视频
```

**核心设计思想**：
1. **headless 优先**：把录屏变成可编程 API，AI Agent 可以直接调用生成产品演示。
2. **MIT**：最干净的可商用底座之一。
3. **跨平台统一抽象**：一套产品模型，三平台采集后端。

**可复用**：headless 录屏 CLI 设计、跨平台采集抽象。
**可借鉴**：AI Agent 自动演示录制工作流。
**不应复制**：品牌与商标；注意各平台采集库的许可证。

---

### 2.8 Coherence Studio（65 ⭐ · MIT · TS）— AI 王者 / AI 录屏

**产品定位**：AI 优先的录屏——自动字幕、智能去停顿、自动旁白、一键专业输出。2026-04 上线获得 HN 关注，代表「AI 录屏」新品类。

**用户工作流**：录制 → AI 自动转写 → 自动去停顿/去口头禅 → 自动字幕 → 导出/分享。

**技术架构逆向**：

```text
采集（浏览器或桌面）
  → Whisper 类本地/云端转写（ASR）
  → 停顿检测 + 填充词检测（时间戳级）
  → 智能裁剪（删除静音段，保留视频）
  → 字幕轨（SRT/烧录）
  → 自动旁白（TTS）与导出
```

**核心设计思想**：
1. **AI 是主流程不是插件**：录制完成后默认走「AI 自动剪辑」路径。
2. **时间戳对齐**：所有 AI 操作（删停顿/字幕）都基于词级时间戳，保证音画同步。
3. **MIT + 小仓库**：最容易被我们借鉴的 AI 流程蓝本。

**可复用**：去停顿/去口头禅管线、字幕生成流程。
**可借鉴**：AI 结果默认展示、用户可改的「AI 剪辑预览」。
**不应复制**：其 UI 品牌；AI 流程可直接重写。

---

### 2.9 sc-screen-recorder（23 ⭐ · MIT · JS）— 教学组合王者

**产品定位**：浏览器原生录屏 + 多屏源画布合成 + 提词器 + 实时标注 + 真人出镜叠加——几乎就是「网页版教学录课台」的最小完整实现，与本项目（08-mac-screen-cam-recorder）方向高度重合。

**用户工作流**：选多屏幕源（多显示器/窗口）→ 合成画布 → 出镜小窗 → 提词器滚稿 → 标注 → 开始录制 → 导出。

**技术架构逆向**：

```text
getDisplayMedia（多源）
  → Canvas 2D/WebGL 合成（多源布局 + 摄像头 PiP + 标注层）
  → MediaRecorder 录制
  → 提词器（滚动文本层，不进入画面或可入画）
  → 导出 webm/mp4
```

**核心设计思想**：
1. **画布即最终画面**：一切（多源/出镜/标注/提词）都在 Canvas 上合成，所见即所得。
2. **教学功能齐全**：提词器 + 标注 + 出镜三者同屏。
3. **零安装**：打开网页即可录课。

**可复用**：Canvas 多源合成布局、提词器实现、标注层叠加。
**可借鉴**：教学组合功能的最小闭环。
**不应复制**：无（MIT，但代码较个人化，建议重写）。

---

### 2.10 Kap（19,330 ⭐ · MIT · JS/Electron）— 老牌 Electron 录屏

**产品定位**：macOS 轻量录屏工具，通过插件系统扩展导出目标。曾是 Mac 录屏首选之一，2024 年后维护放缓，但架构仍值得学习。

**用户工作流**：菜单栏图标 → 选区 → 录制 → 停止 → 导出（内置 mp4/gif/webm + 插件目标）。

**技术架构逆向**：

```text
Electron + macOS 原生模块（屏幕录制）
  → 临时文件录制 → 导出管线（FFmpeg 封装）
  → 插件系统（导出目标：Gfycat/Imgur/Slack 等）
```

**核心设计思想**：插件化导出目标（Adapter 模式），让「录完去哪」可扩展。

**可复用**：导出目标插件接口设计。
**可借鉴**：菜单栏应用 UX、选区录制交互。
**不应复制**：已过时的 Electron 采集实现（现代应直接用 ScreenCaptureKit 或 WGC）。

---

### 2.11 底层技术层速览（非录屏产品，但直接决定产品上限）

| 层 | 项目 | Stars | License | 为什么重要 |
|---|---|---|---|---|
| ASR 引擎 | faster-whisper / whisperX / whisper.cpp | 24,969 / 23,623 / 52,994 | MIT/BSD/MIT | 本地字幕、去停顿、章节的语音基础 |
| 编码合成 | FFmpeg / ffmpeg.wasm | 63,419 / 17,730 | LGPL-GPL / MIT | 一切导出的最终执行者；浏览器端可用 WASM |
| 白板标注 | Excalidraw / tldraw | 129,943 / 49,837 | MIT / 自研协议 | 教学标注与无限画布的顶级开源实现 |
| 录制库 | RecordRTC | 6,912 | MIT | WebRTC/MediaRecorder 录制封装最佳参考 |
| 采集参考 | scrcpy | 147,853 | Apache-2.0 | 跨设备投屏采集的工程标杆 |
| 控制协议 | obs-websocket | 4,336 | GPL-2.0 | 远程控制/自动化录制的协议模型 |
| 演示层 | reveal.js | 72,145 | MIT | 网页教学演示与提词场景 |

---
---

## 🏗️ PART 3 · 技术架构逆向工程

### 3.1 通用分层模型（从 Top 10 提炼）

```text
┌─────────────────────────────────────────────┐
│ User Interface（SwiftUI / Electron / Web）    │
│   场景配置 · 录制控制 · 时间线 · 导出面板       │
├─────────────────────────────────────────────┤
│ Application Layer（状态机 + 权限 + 快捷键）    │
│   idle → armed → recording → paused → done   │
├─────────────────────────────────────────────┤
│ Capture Layer                                │
│   Screen（SCK / WGC / PipeWire / desktopCapturer）│
│   Camera（AVCaptureSession / getUserMedia）    │
│   Mic + System Audio（采样率对齐）             │
├─────────────────────────────────────────────┤
│ Synchronization（各源首帧归零 PTS，时钟对齐）   │
├─────────────────────────────────────────────┤
│ Composition Engine（CoreImage / Canvas / Metal）│
│   PiP 布局 · 标注层 · 聚光灯 · 光标特效 · 滤镜  │
├─────────────────────────────────────────────┤
│ Recording Controller（帧回调 → 编码器）        │
├─────────────────────────────────────────────┤
│ Editor（时间线 · 裁剪 · 缩放关键帧 · 字幕）     │
├─────────────────────────────────────────────┤
│ AI Layer（ASR · 去停顿 · 章节 · 摘要 · 导演）   │
├─────────────────────────────────────────────┤
│ Encoding & Export（VideoToolbox / x264 / WASM）│
└─────────────────────────────────────────────┘
```

### 3.2 各层最佳开源实现映射

| 层 | 最佳参考（GitHub） | 技术要点 |
|---|---|---|
| Screen Capture (macOS) | QuickRecorder / Reframed | `SCShareableContent` → `SCContentFilter` → `SCStream`；`capturesAudio=true` 录系统声 |
| Screen Capture (跨平台) | OpenScreen | macOS SCK / Windows WGC / Linux PipeWire 统一抽象 |
| Screen Capture (Web) | Screenity / RecordRTC | `getDisplayMedia` + `MediaRecorder(webm)` |
| Camera | Reframed / sc-screen-recorder | `AVCaptureSession` 或 `getUserMedia`，输出 `CMSampleBuffer` / `VideoFrame` |
| 音画同步 | OBS | 每源以首帧 PTS 归零，主时钟驱动，丢帧补偿 |
| 合成 | 本项目（CoreImage）/ scrawl-canvas | GPU 纹理合成，避免 CPU 拷贝 |
| 编码 | OBS / QuickRecorder | VideoToolbox（H.264/HEVC/ProRes）；软件 x264 兜底 |
| 导出 | FFmpeg / ffmpeg.wasm | 封装 mp4/mov/webm/gif；浏览器端用 WASM |
| ASR | faster-whisper / whisper.cpp | 词级时间戳 → 字幕/去停顿/章节 |
| 编辑器 | ScreenToGif / Shotcut | 帧级时间线（轻量）或 MLT 框架（专业） |
| 白板 | Excalidraw / tldraw | 矢量元素模型 + 无限画布 + 协同 |

### 3.3 「真人出镜小窗」技术逆向

```text
Screen Video ──┐
Camera Video ──┤→ 时间戳对齐（同源时钟 / 首帧归零）
Mic ───────────┘
        ↓
   Composition（CoreImage / Canvas）
        ↓
   PiP Layout（圆角矩形/圆形/椭圆/方形/菱形）
        ↓
   位置（四角/顶部/底部/自由拖拽）+ 缩放 + 镜像 + 边框阴影
        ↓
   Render → Encoder → 最终视频（小窗已烘焙进画面）
```

**动态 PiP（Screen Studio 核心，Reframed 已实现）**：录制时仅记录「摄像头窗口 + 光标轨迹 + 点击事件 + 时间戳」，后期由 AI/规则生成镜头关键帧（何时放大、何时移动小窗、何时隐藏）→ 这是本产品 V1.0 的差异化核心。

### 3.4 「悬浮控制条」技术逆向

| 平台 | 实现方案 |
|---|---|
| macOS | `NSPanel` + `.nonactivatingPanel` + `.floating` 层级；`SCContentFilter(excludingWindows:)` 排除自己 |
| Windows | `WS_EX_TOOLWINDOW | WS_EX_TOPMOST | WS_EX_NOACTIVATE` 透明窗口 |
| Web | 独立 `<iframe>`/弹窗 + `document.pictureInPictureWindow` 或悬浮 div（无法全局置顶） |

功能：计时 / 麦克风开关 / 摄像头开关 / 暂停 / 停止 / 标注开关 / 全局快捷键。
设计要点：点击穿透（`ignoresMouseEvents` 局部开启）、多显示器跟随、自动隐藏。

### 3.5 「AI 自动剪辑」技术逆向（Coherence / WhisperX 路线）

```text
Raw Recording
   ↓ WhisperX / faster-whisper（词级时间戳 + 说话人）
   ↓ 静音段检测（RMS/能量 < 阈值且时长 > 0.8s）
   ↓ 填充词检测（嗯/啊/然后/you know → 词级时间戳定位）
   ↓ 语义分段（embedding + 话题漂移 → 章节点）
   ↓ 智能裁剪（删除静音+填充词区间，保留画面，自动补齐转场）
   ↓ 字幕轨（SRT + 烧录样式）
   ↓ 章节/摘要/标题/封面（LLM 基于转写稿生成）
   ↓ 多版本导出（完整版 / 短视频版 / 知识点版）
```

---

## 🗺️ PART 4 · 功能矩阵 Feature Map

### 4.1 竞品功能矩阵（● 完整 / ◐ 部分 / ○ 无）

| 功能 | OBS | ScreenToGif | Screenity | Reframed | QuickRecorder | Cap | 本项目(08) |
|---|---|---:|---:|---:|---:|---:|---:|
| 整屏/窗口/区域录制 | ● | ● | ◐ | ● | ● | ◐ | ● |
| 摄像头出镜 PiP | ● | ● | ● | ● | ○ | ○ | ● |
| PiP 形状/布局 | ● | ◐ | ◐ | ● | ○ | ○ | ● |
| 系统声音 | ● | ○ | ● | ● | ● | ◐ | ● |
| 鼠标高亮/点击特效 | ● | ◐ | ● | ● | ◐ | ○ | ● |
| 键盘显示 | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| 实时标注 | ● | ◐ | ● | ○ | ○ | ○ | ● |
| 提词器 | ◐ | ○ | ○ | ○ | ○ | ○ | ○ |
| 倒计时 | ◐ | ● | ● | ○ | ◐ | ◐ | ● |
| 悬浮控制条 | ● | ◐ | ○ | ◐ | ● | ○ | ● |
| 时间线编辑 | ● | ● | ○ | ● | ○ | ◐ | ○ |
| 自动字幕 | ◐ | ○ | ○ | ● | ○ | ◐ | ○ |
| AI 去停顿/去口头禅 | ○ | ○ | ○ | ◐ | ○ | ○ | ○ |
| AI 自动缩放/导演 | ◐ | ○ | ○ | ● | ○ | ○ | ○ |
| 分享链接/云端 | ◐ | ○ | ● | ○ | ○ | ● | ○ |
| 多平台 | ● | ◐(Win) | ●(Web) | ○(Mac) | ○(Mac) | ● | ○(Mac) |

### 4.2 目标产品 Feature Map（AI Teaching Studio）

```text
AI Teaching Studio
│
├── Recording
│   ├── Screen / Window / Region / App
│   ├── Webcam（PiP 5 形状 8 布局 + 滤镜 + 美颜）
│   ├── Mic（电平表 + 降噪） + System Audio
│   └── 倒计时 + 全局快捷键 + 悬浮控制条
│
├── Presentation（教学层）
│   ├── 鼠标高亮 + 点击特效 + 聚光灯
│   ├── 键盘显示（⌘K / ⌘⇧P 实时 OSD）
│   ├── 实时标注（画笔/箭头/矩形/椭圆/文字/橡皮）→ 烘焙进视频
│   ├── 提词器（滚稿 + 半透明置顶 + 可入画/不入画）
│   └── 无限画布白板（Excalidraw 级，可插入到录制中）
│
├── AI
│   ├── 本地 ASR（faster-whisper / whisper.cpp）
│   ├── 自动字幕（词级对齐 + SRT + 烧录）
│   ├── 智能去停顿 / 去口头禅（时间戳级裁剪）
│   ├── 自动章节 / 摘要 / 标题 / 封面（LLM）
│   ├── AI 自动缩放与镜头（光标轨迹 → 关键帧）
│   └── 多版本一键生成（完整/短视频/知识点/课程）
│
├── Editor
│   ├── 帧级时间线（裁剪/删除/拼接）
│   ├── 缩放关键帧编辑 + 转场
│   ├── 字幕轨编辑 + 样式
│   └── 音频（音量/静音/降噪）
│
└── Export
    ├── MP4 / MOV / WebM / GIF / ProRes
    ├── 1080p / 4K + 平台预设（YouTube/TikTok/B站/小红书）
    ├── 本地文件 + 可选云分享链接
    └── 导出任务队列（FFmpeg）
```

---

## 🛣️ PART 5 · 底层技术路线对比

| 技术路线 | 优点 | 缺点 | 开发难度 | 性能 | 推荐 |
|---|---|---|---|---|---|
| Web App | 快、零安装、跨平台 | 权限受限、系统音频难、无全局置顶 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐（教学补充面） |
| Electron | 跨平台、生态大 | 体积大、内存高、采集靠原生模块 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Tauri | 轻量、Rust 后端、体积小 | 采集需 Rust/原生桥接，生态较新 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Native macOS | 性能最佳、SCK 原生、体验最顺 | 仅 Mac、开发慢 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐（Mac 优先） |
| OBS Plugin | 能力最强、可复用 | UX 被 OBS 绑架、安装门槛 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐（专业向补充） |
| Hybrid（原生采集 + Web 前端/可选 Web 版） | 综合最优 | 架构复杂、双栈维护 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐（最终形态） |

**结论（个人开发者 + AI PM + Codex 友好）**：
> **Phase A 用「Native macOS（Swift + ScreenCaptureKit）」最快做出高体验 MVP（正是本项目 08-mac-screen-cam-recorder 已验证的路线）；Phase B 增加 Electron/Tauri 跨平台壳复用核心；Phase C 增加 Web 版（Screenity 路线）作为轻量补充与云端分享面。AI 引擎统一走本地 Whisper + 可选 LLM API。**

---
---

## ⚖️ PART 6 · 开源 License 分析

### 6.1 逐项目结论（2026-08 实测）

| 项目 | License | 能否做商业产品 | 说明 |
|---|---|---|---|
| OBS Studio | GPL-2.0 | 🟡 Need Review | 用 libobs 需开源衍生代码；作为黑盒调用的 CLI 边界相对安全；插件可独立分发 |
| ScreenToGif | MS-PL | 🟡 Need Review | MS-PL 禁止在其他产品中重新分发源码用于竞争；学习参考安全 |
| Screenity | GPL-3.0 | 🔴 Commercial Risk | 衍生作品必须 GPL；浏览器扩展分发受限；重写标注/采集逻辑 |
| Reframed | MIT | 🟢 Commercial Friendly | 最干净的可商用底座之一 |
| Cap | Other* | 🟡 Need Review | 自定义/企业许可证，商用前必须逐条核实 |
| QuickRecorder | AGPL-3.0 | 🔴 Commercial Risk | 网络分发需开源；学习参考安全 |
| OpenScreen | MIT | 🟢 Commercial Friendly | 可商用 |
| Coherence Studio | MIT | 🟢 Commercial Friendly | 可商用 |
| Kap | MIT | 🟢 Commercial Friendly | 可商用（但代码已过时） |
| sc-screen-recorder | MIT | 🟢 Commercial Friendly | 可商用 |
| whisper / faster-whisper | MIT | 🟢 Commercial Friendly | 可商用 |
| whisperX | BSD-2-Clause | 🟢 Commercial Friendly | 可商用 |
| whisper.cpp | MIT | 🟢 Commercial Friendly | 可商用 |
| FFmpeg | LGPL-2.1+/GPL | 🟡 Need Review | 静态链接/修改需注意；以子进程或动态库方式调用最安全 |
| ffmpeg.wasm | MIT | 🟢 Commercial Friendly | 可商用 |
| Excalidraw | MIT | 🟢 Commercial Friendly | 可商用 |
| tldraw | tldraw 协议 | 🟡 Need Review | 类似 BSL，商用需核实条款 |
| Shotcut / Kdenlive / OpenShot | GPL-3.0 | 🟡 Need Review | 用其框架需开源；仅借鉴 UX |
| RecordRTC | MIT | 🟢 Commercial Friendly | 可商用 |
| scrcpy | Apache-2.0 | 🟢 Commercial Friendly | 可商用 |
| obs-websocket | GPL-2.0 | 🟡 Need Review | 协议文档可复用，代码谨慎 |

### 6.2 本项目推荐许可策略

> **核心自研代码（采集/合成/标注/悬浮条）：MIT。**
> **AI 引擎：本地调用 whisper 系列（MIT/BSD）以子进程方式隔离。**
> **导出：调用系统 FFmpeg（不静态链接，规避 LGPL 传染）。**
> **白板：内置自研轻量标注 + 可选集成 Excalidraw（MIT）。**
> 这样整体保持 **MIT 可商用**，避免 GPL/AGPL 传染。

---

## 💰 PART 7 · 商业模式分析

### 7.1 用户付费意愿来源

| 付费点 | 理由 | 对应功能 |
|---|---|---|
| 时间价值 | 教学/演示内容制作耗时，AI 剪辑省 70% 时间 | AI 去停顿/字幕/章节 |
| 出镜专业度 | 真人出镜显著提升课程转化率 | PiP/美颜/背景 |
| 分发效率 | 一键多平台导出 + 分享链接 | 导出预设/云链接 |
| 团队协作 | 课程内容需要评审与复用 | 空间/模板/素材库 |

### 7.2 分层定价（Open Core + 订阅）

```text
Free（个人学习）
  ├── 基础录屏 + PiP + 标注 + 悬浮条 + MP4 导出
  └── 本地 AI 字幕（faster-whisper，无额度限制）

Pro（创作者，$12/月）
  ├── AI 去停顿 / 去口头禅 / 章节 / 摘要
  ├── AI 自动镜头（光标轨迹 → 缩放关键帧）
  ├── 高级导出（4K / ProRes / 平台预设）
  └── 提词器 + 键盘显示 + 白板

Team（团队，$29/人/月）
  ├── 云端分享链接 + 评论 + 素材库
  └── 模板与品牌包

Enterprise
  ├── 私有化部署 + SSO + 合规
  └── API（headless 录制，OpenScreen 模式）
```

### 7.3 与竞品差异化

- vs Loom/Cap：**本地优先 + AI 剪辑 + 教学功能**，不靠云存储绑定。
- vs Screen Studio：**开源 + AI 剪辑 + 教学**，价格友好。
- vs OBS：**教学开箱即用 + AI 后期**，不要求用户懂直播工程。
- vs Camtasia：**开源 + AI 原生**，摆脱桌面剪辑软件心智。

---

## 🤖 PART 8 · AI 产品机会

### 8.1 AI 应该放在哪（2026 重新设计录课软件）

```text
录制中（AI Recording Copilot）
  ├── 自动检测重点（语速/停顿/鼠标聚焦 → 标记时间戳）
  ├── 自动识别窗口/PPT/代码（OCR → 生成章节与知识点）
  ├── 自动检测人脸/出镜质量（构图提示）
  └── 实时字幕（低延迟 ASR，可入画）

录制后（AI Editing Copilot）
  ├── 去停顿 / 去口头禅（词级时间戳裁剪）
  ├── 自动字幕 + 双语
  ├── 章节 / 摘要 / 标题 / 封面（LLM 生成）
  ├── AI 导演：光标轨迹 + 点击 + 语音 → 缩放/平移/小窗关键帧
  ├── 内容重构：一键生成 完整版 / 短视频版 / 知识点版 / 课程版
  └── 自动转场与 B-roll 提示
```

### 8.2 技术实现路径（全部本地可行）

| AI 能力 | 开源实现 | 运行形态 |
|---|---|---|
| 转写/字幕 | faster-whisper（small/base） | 本地 Python/CTranslate2 或 whisper.cpp |
| 说话人分离 | whisperX | 本地 |
| 停顿/填充词 | 能量检测 + ASR 词表（嗯/啊/然后） | 本地信号处理 + ASR |
| 章节/摘要/标题/封面 | LLM（本地 Ollama 或 API） | 可选 |
| 自动镜头 | 光标/点击事件录制 + 规则/RL 关键帧 | 本地规则引擎（V1.0） |
| 人像分割/背景 | MediaPipe Selfie Segmentation | 浏览器/原生均可 |

### 8.3 差异化机会点（别人没做好的）

1. **「AI 导演」**：Screen Studio 有平滑缩放但无 AI 剪辑；Coherence 有 AI 剪辑但无镜头导演 → **两者结合**是空白。
2. **「教学语义」**：自动把 1 小时录课拆成「知识点短视频 + 章节 + 讲义 + 测验」→ 面向 AI 教学/在线课程的场景化输出。
3. **「本地优先 + 隐私」**：课程内容敏感，全部本地处理是卖点（Screenity v3 也强调此点）。

---
---

## 🎨 PART 9 · AI Teaching Studio 产品设计

### 9.1 产品定义

> **AI Teaching Studio = 录屏引擎 + 真人出镜 + 悬浮控制 + 教学标注 + 提词器 + AI 导演 + AI 剪辑 + 一键分发**，面向「AI 教学 / 在线课程 / 技术教程 / 产品演示」的下一代录课工作台。

### 9.2 核心用户体验（一句话流）

```text
打开软件
  → 点「开始录课」（默认自动开 屏幕 + 摄像头 + 麦克风）
  → 悬浮控制条出现（计时/暂停/停止/标注/摄像头/麦克风）
  → 开始讲课（AI 实时识别重点 + 自动字幕 + 记录鼠标/点击/窗口）
  → 结束
  → AI 自动剪辑（去停顿 + 章节 + 摘要 + 镜头）
  → 一键生成：完整版 / 短视频版 / 知识点版 / 课程版
  → 导出/分享（YouTube / TikTok / B站 / 小红书）
```

### 9.3 三种录制模式

| 模式 | 适用 | 行为 |
|---|---|---|
| 极简模式 | 快速演示 | 屏幕 + 摄像头小窗 + 悬浮条，一键开始 |
| 教学模式 | 录课 | 屏幕 + 出镜 + 标注 + 提词器 + 键盘/鼠标高亮 |
| 导演模式 | 精品课程 | 仅录原始素材（含光标/点击事件），后期 AI 自动生成镜头 |

### 9.4 设计原则

1. **录制时零打扰**：一切「导演」动作放到后期 AI 完成，录制界面只留悬浮条。
2. **教学功能默认可见**：标注/鼠标高亮/键盘显示一键开关，不藏菜单。
3. **AI 结果可编辑**：所有 AI 产物（字幕/章节/裁剪点）都能在时间线上人工修正。
4. **本地优先**：隐私 + 离线可用 + 无订阅绑架。

---

## 🛤️ PART 10 · MVP Roadmap

| 版本 | 范围 | 状态（对应本项目 08） |
|---|---|---|
| **V0.1 MVP** | Screen Recording + Webcam + Mic + System Audio + PiP + Floating Toolbar + Pause/Resume/Stop + MP4 Export | ✅ **已完成**（含倒计时/点击特效/标注/窗口选择器/权限自动刷新） |
| **V0.2 教学增强** | 键盘显示 OSD + 提词器 + 鼠标聚光灯 + 基础时间线（裁剪/拼接）+ 字幕导出 | ⬜ 下一阶段（本期蓝图交付） |
| **V0.3 AI 剪辑** | 本地 ASR 字幕 + 去停顿 + 去口头禅 + 章节 + 摘要 | ⬜ |
| **V1.0 AI 导演** | AI 自动缩放/镜头 + AI 短视频生成 + 一键多平台导出 + 云分享链接 | ⬜ |

### V0.2 详细范围（下一个开发批次）

- [ ] **键盘显示**：全局键盘事件监听（CGEventTap），录制时 OSD 显示 ⌘K / ⌘⇧P 等组合键，可开关、可入画
- [ ] **提词器**：文本脚本加载、半透明置顶滚窗、速度调节、可入画/不入画
- [ ] **鼠标聚光灯**：光标周围径向光斑，强化讲解焦点
- [ ] **基础时间线**：帧级列表，支持删除静音段/裁剪头尾/拼接
- [ ] **字幕导出**：SRT + 烧录字幕（配合后续 V0.3 ASR）
- [ ] **录制素材元数据**：录制时旁路记录 光标轨迹 + 点击事件 + 窗口切换 + 时间戳（为 V1.0 AI 导演铺路）

---

## 🧩 PART 11 · Codex 开发任务树

### PHASE 0 — Project Setup
- **Goal**：可编译运行的空壳 + 构建脚本 + CI 可测
- **Files**：`Package.swift`、`Sources/App/*.swift`、`scripts/*.sh`
- **Acceptance**：`swift build && swift run` 出窗口；`swift test` 绿

### PHASE 1 — Desktop Shell
- **Goal**：主窗口 + 录制配置页 + 权限引导
- **Acceptance**：可枚举显示器/窗口/摄像头/麦克风；权限状态实时显示并可重新申请

### PHASE 2 — Screen Capture
- **Goal**：ScreenCaptureKit 整屏/显示器/窗口/区域采集 + 系统声音
- **Files**：`Sources/Recorder/ScreenCapturer.swift`
- **Acceptance**：`AITRCLI record` 产出含系统音频的 mp4

### PHASE 3 — Camera Capture
- **Goal**：AVCaptureSession 摄像头采集 + 预览 + 开关/镜像
- **Acceptance**：预览实时；录制时帧可用

### PHASE 4 — Audio Capture
- **Goal**：麦克风独立轨道 + 电平表 + 音量；与系统声音混音
- **Acceptance**：双音轨可开关；时间戳对齐（首帧归零）

### PHASE 5 — PiP Composition
- **Goal**：CoreImage 合成，摄像头小窗 5 形状/8 布局/滤镜/美颜，烘焙进视频
- **Acceptance**：小窗出现在最终视频且可拖动/缩放

### PHASE 6 — Floating Toolbar
- **Goal**：无边框置顶悬浮条（计时/暂停/停止/麦克风/摄像头/标注），从采集内容排除自身
- **Acceptance**：悬浮条不进入画面；快捷键可用

### PHASE 7 — Recording Engine
- **Goal**：状态机（idle/armed/recording/paused/done）+ 倒计时 + 恢复/暂停 + 异常容错
- **Acceptance**：中途暂停恢复音画同步；录制中崩溃不丢已编码数据

### PHASE 8 — Timeline（V0.2）
- **Goal**：帧级时间线，删除/裁剪/拼接 + 撤销
- **Acceptance**：可删除静音段并导出

### PHASE 9 — Export
- **Goal**：FFmpeg/AVAssetWriter 导出 MP4/MOV/WebM/GIF + 平台预设
- **Acceptance**：1080p/4K 预设；导出进度与失败恢复

### PHASE 10 — AI Transcript（V0.3）
- **Goal**：faster-whisper/whisper.cpp 本地转写 + 词级时间戳 + SRT
- **Acceptance**：10 分钟课程 2 分钟内出字幕，准确率可用

### PHASE 11 — AI Editing（V0.3）
- **Goal**：去停顿 + 去口头禅 + 章节 + 摘要
- **Acceptance**：一键生成「干净版」，时间线可见裁剪点

### PHASE 12 — AI Director（V1.0）
- **Goal**：光标/点击/窗口事件 → 缩放平移关键帧 → 自动镜头成片 + 短视频版
- **Acceptance**：从 1 小时原始录制一键产出 3 分钟精华版

### 每个 Phase 的标准交付模板

```text
Goal / Input / Output / Files / Architecture / API / Data Model / Dependencies
Implementation Steps / Test Cases / Acceptance Criteria
```

---

## 🏛️ PART 12 · 最终技术架构图

```text
                    AI Teaching Studio
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
     UI Layer          Recording Layer     AI Layer
  (SwiftUI + 悬浮条)   (SCK + AVCapture)   (Whisper + LLM)
          │                 │                 │
      State Mgmt        Capture: Screen     ASR / 去停顿
      (状态机)             Camera / Mic     章节 / 摘要 / 导演
          │              System Audio          │
          └─────────────────┼─────────────────┘
                            ↓
                    Composition Engine
              (CoreImage: PiP + 标注 + 高亮 + 滤镜)
                            ↓
                      Recording Controller
              (帧回调 → 编码器 → 临时文件 + 事件旁录)
                            ↓
                        Editor (V0.2)
              (时间线 · 裁剪 · 字幕轨 · 缩放关键帧)
                            ↓
                    Video Engine (FFmpeg)
                            ↓
                        Export / 分发
              (MP4/MOV/WebM/GIF · 平台预设 · 云链接)
```

---

## 🧬 PART 13 · 最终推荐开源项目组合（黄金组合）

### 「Open-source Video Teaching Stack」

```text
Capture Layer    →  macOS: ScreenCaptureKit（QuickRecorder/Reframed 模式）
                    Win: Windows Graphics Capture · Linux: PipeWire
                    Web: getDisplayMedia（Screenity/RecordRTC）
Camera Layer     →  AVCaptureSession / getUserMedia + MediaPipe 人像分割
Audio Layer      →  Mic + System Audio，噪声门限（OBS 模式）
Composition      →  CoreImage / Canvas + Excalidraw 白板引擎
Recording        →  SCStream + AVAssetWriter（本项目已实现）
Editing Layer    →  帧级时间线（ScreenToGif 模式）+ 缩放关键帧（Reframed 模式）
AI Layer         →  faster-whisper / whisperX（字幕·去停顿·章节）
                    本地 LLM（摘要·标题·封面·重构）
Export Layer     →  FFmpeg（子进程调用）+ ffmpeg.wasm（Web 端）
Distribution     →  本地文件 + 可选云链接（Cap 模式，Open Core）
```

### 组合优先级（可复用度 × 价值）

| 项目 | 借鉴模块 | 技术价值 | 产品价值 | 可直接复用 | 开发优先级 |
|---|---|---:|---:|---:|---:|
| QuickRecorder | SCK 采集最佳实践 | 9 | 8 | 8 | **P0** |
| Reframed | PiP + 时间线 + 缩放关键帧 | 10 | 10 | 9 | **P0** |
| Screenity | 浏览器教学标注 + AI 背景 | 8 | 9 | 8 | **P1** |
| ScreenToGif | 帧级时间线 + 编辑 UX | 8 | 7 | 8 | **P1** |
| sc-screen-recorder | 提词器 + 多源画布教学组合 | 7 | 9 | 8 | **P1** |
| OpenScreen | headless 录屏 CLI + 跨平台抽象 | 9 | 8 | 8 | **P1** |
| Coherence | AI 剪辑流程（去停顿/字幕） | 9 | 9 | 7 | **P2** |
| faster-whisper | 本地 ASR 引擎 | 10 | 9 | 10 | **P0** |
| Excalidraw | 白板标注引擎 | 9 | 9 | 9 | **P1** |
| FFmpeg | 导出/编码 | 10 | 9 | 10 | **P0** |

---
---

## ❓ 三十 · 必须回答的 10 个结论问题

1. **GitHub 当前最值得研究的录屏项目是哪几个？**
   → 产品侧：OBS、ScreenToGif、Screenity、Reframed、QuickRecorder、Cap、OpenScreen、Coherence。
   → 技术侧：faster-whisper、whisperX、FFmpeg、Excalidraw、RecordRTC、obs-websocket。

2. **收藏量最高的是谁？**
   → 录屏产品：OBS Studio（75,153 ⭐）。全榜单：whisper（107,521 ⭐）、scrcpy（147,853 ⭐）、Excalidraw（129,943 ⭐）——但它们是底层技术不是录屏产品。

3. **增长最快的是谁？**
   → Cap（20,955 ⭐，Loom 开源替代赛道）与 OpenScreen（Screen Studio 开源替代 + headless）。它们证明「AI 时代录屏 = 录制 + 分享/AI 后期」是新增长点。

4. **最适合教学录课的是谁？**
   → **Screenity**（浏览器 + 标注 + 聚光灯 + AI 背景 + 敏感涂抹）与 **sc-screen-recorder**（提词器 + 出镜 + 多源画布）组合；桌面端以本项目的教学标注 + PiP 为底座。

5. **最适合真人小窗的是谁？**
   → **Reframed**（macOS 原生 PiP + 5 形状布局 + 动态缩放）与本项目（5 形状 / 8 布局 / 滤镜 / 美颜，PiP 已烘焙进视频）。

6. **最适合 Mac 的是谁？**
   → **QuickRecorder**（ScreenCaptureKit 性能标杆）与 **Reframed**（产品全链路）。二者均提供本项目可直接借鉴的 SCK 集成模式。

7. **最适合二次开发的是谁？**
   → **Reframed / OpenScreen / Coherence / Kap**（全部 MIT），其次是本项目自研核心（MIT）。OBS 适合做插件生态而非直接改壳。

8. **哪些项目可以组合？**
   → `QuickRecorder/Reframed 采集 + ScreenToGif 时间线 + Coherence AI 流程 + faster-whisper ASR + Excalidraw 白板 + FFmpeg 导出 + Cap 分享` = 「Open-source Video Teaching Stack」。

9. **如果从 0 开始做，最合理的技术栈是什么？**
   → macOS 优先：**Swift + ScreenCaptureKit + AVFoundation + CoreImage + VideoToolbox + AVAssetWriter + FFmpeg(子进程) + faster-whisper(本地) + SwiftUI**。跨平台后再补 Electron/Tauri 壳与 Web 版（getDisplayMedia + ffmpeg.wasm）。

10. **如果由 Codex 开发，最快的 MVP 路线是什么？**
    → 本项目已走通：**Phase 0–7 用 Swift 原生（2–3 天出可录制的 MVP）→ Phase 8 时间线 → Phase 10–11 本地 AI 剪辑 → Phase 12 AI 导演**。即「先 macOS 高体验闭环，再横向扩展」。

---

## 🚀 三十四 · 30 Day Build Blueprint

> 基于本项目（08-mac-screen-cam-recorder）已完成的 V0.1 底座，30 天冲刺「AI 教学录屏工作台」可交付版本。

| 天 | 目标 | 输出 | 验收 |
|---|---|---|---|
| D1–2 | 冻结 V0.1 回归 | 全量自测 + 权限/录制冒烟 | `AITRCLI selftest` 绿 |
| D3–5 | 录制元数据旁录 | 光标轨迹/点击/窗口事件 + 时间戳 JSON | 事件与视频时间轴对齐 |
| D6–8 | 键盘显示 OSD | ⌘K / ⌘⇧P 实时显示，可入画 | 录制视频含键盘 OSD |
| D9–11 | 提词器 | 脚本滚窗、半透明置顶、可入画 | 录课可跟稿 |
| D12–14 | 鼠标聚光灯 + 标注增强 | 聚光灯、激光笔模式 | 教学焦点强化 |
| D15–18 | 帧级时间线 | 删除静音段/裁剪/拼接/撤销 | 可导出干净版 |
| D19–21 | 本地 ASR 字幕 | faster-whisper 集成 + SRT + 烧录 | 10 分钟课程 ≤2 分钟出字幕 |
| D22–24 | AI 去停顿/去口头禅 | 时间戳级裁剪 + 预览可改 | 一键干净版 |
| D25–26 | AI 章节/摘要/标题 | LLM 生成 + 导出 | 课程页素材可用 |
| D27–29 | AI 导演（最小） | 光标轨迹→缩放关键帧 | 自动镜头成片 |
| D30 | 打包 + 图标 + 分发 | .app / dmg / GitHub Release + 文档 | 可安装可商用 |

**关键风险与对策**：
- 卡死风险（本项目历史问题）：所有 UI 定时器/预览走主线程队列 + `Task` 隔离，禁止在录制回调里碰 UI；崩溃自动保存已编码片段。
- 权限回归：录制前强制权限自检 + 1s 自动刷新（已实现）。
- ASR 性能：默认 small 模型 + 队列化转写，不阻塞录制。

---

## 🤖 Master Development Prompt（可直接复制给 Codex）

```text
你是一名 macOS 原生录屏 + AI 视频产品架构师。请基于仓库
05-projects/08-mac-screen-cam-recorder（Swift + ScreenCaptureKit + AVFoundation +
CoreImage + AVAssetWriter，已实现 V0.1：整屏/窗口/区域/系统音频录制、摄像头 PiP
（5 形状/8 布局/滤镜/美颜）、教学标注、倒计时、点击特效、悬浮控制条、窗口选择器、
权限自动刷新，测试 63/63 通过）继续开发「AI Teaching Studio」。

本阶段目标（V0.2 教学增强）：
1. 键盘显示 OSD：CGEventTap 监听全局键盘，录制时把 ⌘K / ⌘⇧P 等组合键实时叠加到画面
   （可开关、可入画，样式与现有标注/点击特效一致）。
2. 提词器：加载 .txt 脚本，半透明置顶滚窗，速度可调，可切换入画/不入画。
3. 鼠标聚光灯：光标周围径向光斑（CoreImage），与点击特效共存。
4. 录制元数据旁录：光标位置 + 点击 + 窗口切换 + 时间戳写入 JSON（为 V1.0 AI 导演铺路）。
5. 帧级最小时间线：可删除静音段/裁剪头尾/拼接并导出。

工程约束：
- 保持模块化：Sources/Recorder（采集）、Sources/Composition（合成）、Sources/UI（界面）、
  Sources/CLI（AITRCLI）、Sources/AITRCoreUnitTests。
- 所有新增 UI 定时器/预览必须主线程安全，禁止在录制帧回调中触碰 UI，防止卡死。
- 每个功能：实现 + 单元测试 + `AITRCLI selftest` 冒烟 + README 更新。
- 完成后提交到 codex/mac-screen-cam-recorder 分支并推送 GitHub。
- 参考蓝图：docs/AI-TEACHING-STUDIO-BLUEPRINT.md（PART 10 V0.2 范围）。
```

---

## 📎 附录 · 与现有项目 08-mac-screen-cam-recorder 的映射

### 已完成（V0.1，对齐 MVP 要求）

| 蓝图模块 | 项目实现 |
|---|---|
| Screen Capture | ✅ ScreenCaptureKit：整屏/显示器/窗口/区域 + 系统声音 + 鼠标光标 |
| Camera PiP | ✅ 5 形状 / 8 布局 / 镜像 / 边框阴影 / 颜色滤镜 / 美颜，烘焙进视频 |
| Floating Toolbar | ✅ 悬浮控制条（计时/麦克风/摄像头/暂停/停止/标注），SCK 排除自身不入画 |
| Teaching Annotations | ✅ 画笔/箭头/矩形/椭圆/文字/橡皮，8 色，实时烘焙 |
| Countdown / Click FX | ✅ 3/5/10s 倒计时 + 鼠标点击特效 |
| Permissions | ✅ 权限自检 + 1s 自动刷新 + 引导重新授权 + 一键重启 |
| Window Picker | ✅ 可视化窗口选择器（缩略图） |
| Signing & Icon | ✅ 自签名稳定（AI Teaching Recorder Dev）+ .icns 图标 + 桌面快捷打开 |
| Tests | ✅ 63/63 单元测试 + CLI 自测（selftest/devices/perms/record） |

### 差距（V0.2 / V0.3 / V1.0 待做）

| 版本 | 待做 | 对应蓝图章节 |
|---|---|---|
| V0.2 | 键盘显示、提词器、聚光灯、录制元数据旁录、帧级时间线 | PART 10 |
| V0.3 | 本地 ASR 字幕、去停顿/口头禅、章节/摘要 | PART 8.2 |
| V1.0 | AI 导演（自动镜头）、短视频生成、多平台导出、云链接 | PART 8.3 |

### 技术路线结论（对齐 PART 5）

> 本项目当前即「Native macOS + Swift」最优路线；后续补 Electron/Tauri 跨平台壳与 Web 轻量版（Screenity 路线），AI 引擎本地 Whisper 系列，导出走 FFmpeg 子进程。许可证保持 MIT 可商用。

---

*报告完 · 数据截至 2026-08-18 · 由 GitHub 真实抓取数据 + 开源代码架构分析生成*
