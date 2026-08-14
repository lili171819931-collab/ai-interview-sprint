# 🎥 AI Video Recorder

> 本地 AI 录屏 / 多摄像头合成 / 智能剪辑工作室 —— Screenity 同类型应用（Web 版，数据完全本地）

一款功能完整的 **AI 视频录制器**：录屏 + 双摄像头 + 多源合成 + 视频引擎（裁剪 / 缩放 / 字幕 /
模板 / BGM / AI 剪辑），一键导出并发布到 **TikTok / YouTube / 小红书 / 抖音**。全部在浏览器本地完成，
无需注册、无使用限制、不上传任何数据。

```
              AI Video Recorder
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Screen         Camera 1       Camera 2
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                Multi-source
                  Composition
                       ↓
              ┌────────┴────────┐
              ↓                 ↓
          Main Screen        PiP Camera
              │                 │
              └────────┬────────┘
                       ↓
                 Video Engine
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Crop           Zoom           Subtitle
        ↓              ↓              ↓
     Template        AI Edit        BGM
                       ↓
                  Final Video
                       ↓
              TikTok / YouTube
              小红书 / 抖音
```

## ✨ 功能清单

### 多源采集（Screen + Camera 1 + Camera 2）
- 🖥️ **屏幕 / 窗口 / 标签页**：调用系统屏幕选择器，支持 60fps，可捕获系统声音
- 🎥 **Camera 1 / Camera 2**：支持多摄像头设备选择、镜像、独立开关与实时预览
- 🎙️ **麦克风**：音量调节、回声消除 / 降噪
- 🔊 **系统声音**：随屏幕捕获，音量独立控制

### 多源合成（Main Screen + PiP Camera）
- 实时 Canvas 合成引擎：屏幕为主画面，双摄像头为画中画（PiP）
- 画中画**可拖动 / 可缩放**（录制前），圆角、边框、标签
- 支持自定义背景图片

### 视频引擎
- ✂️ **Crop 裁剪**：画布上直接拖拽裁剪框 + 手柄，支持 16:9 / 9:16 / 1:1 / 4:3 预设与数值微调
- 🔎 **Zoom 缩放**：1x–4x 平滑缩放，点击画布设定聚焦点，聚焦点预设
- 💬 **Subtitle 字幕**：多行字幕、字号 / 颜色 / 底色 / 位置自定义，**AI 语音识别实时字幕**（Chrome/Edge），可导出 SRT / WebVTT
- 🎨 **Template 模板**：YouTube 16:9 / 抖音·TikTok 9:16 / 小红书 3:4 / 网课 / 游戏 60fps / 播客 1:1
- 🎵 **BGM 背景乐**：内置 4 首 WebAudio 实时合成的背景音乐（Lo-Fi / 流行 / 钢琴 / 合成波），音量可调，**说话时自动闪避**
- ✨ **AI 剪辑**：能量分析 → 自动剪除静音 / 标记高光 → 生成剪辑方案 → 智能重渲染最终视频（可叠加字幕 + BGM）
- ✏️ **标注工具**（Screenity 招牌）：画笔 / 箭头 / 方框 / 圆圈 / 文字 / 敏感内容模糊，颜色线宽可调
- 网格辅助线、水印、时间戳、录制暂停 / 继续、快捷键（空格 / ⌘R）

### 导出与发布
- 📦 录制输出 MP4 / WebM（按浏览器能力自动选择），可下载
- 📋 **复制视频到剪贴板**，直接粘贴到平台上传框（Chrome/Edge）
- 🚀 一键打开 **TikTok / YouTube / 小红书 / 抖音** 上传页
- 💬 导出 SRT / WebVTT 字幕文件

## 🚀 快速开始

```bash
npm install
npm run dev
# 打开 http://127.0.0.1:3220
```

生产构建：

```bash
npm run build && npm run preview
```

## 🧪 功能测试

内置 Playwright 端到端测试（使用 Chrome 的假摄像头 / 假麦克风 + 注入假屏幕源），
完整验证「连接源 → 设置引擎 → 录制 → 导出 → AI 剪辑 → 发布入口」全流程：

```bash
# 先启动 dev server
npm run dev

# 另开终端（使用本机 Chrome 无头运行）
BASE_URL=http://127.0.0.1:3220 node tests/e2e.mjs
```

> 提示：测试默认使用系统已安装的 Google Chrome（`channel: "chrome"`），无需下载 Playwright 浏览器。

## 🏗️ 架构

```
src/
├── engine/
│   ├── Studio.ts          # 中枢：源管理 / 录制状态机 / 事件
│   ├── compositor.ts      # Canvas 合成引擎（屏幕+PiP+裁剪+缩放+字幕+标注）
│   ├── audioEngine.ts     # WebAudio 混音（麦克风+系统声+BGM+闪避+能量分析）
│   ├── bgm.ts             # WebAudio 合成背景音乐
│   ├── aiEdit.ts          # AI 剪辑（能量分析 → 剪辑方案 → 智能重渲染）
│   ├── templates.ts       # 六大平台模板
│   └── export.ts          # 下载 / SRT/VTT / 剪贴板 / 平台跳转
├── components/
│   ├── SourcePanel.tsx    # 音视频源面板
│   ├── CanvasStage.tsx    # 画布 + 标注 + 裁剪框 + PiP 拖动
│   ├── EnginePanel.tsx    # 裁剪/缩放/字幕/模板/BGM/AI 剪辑
│   └── ExportDialog.tsx   # 导出 & 发布
└── App.tsx                # 布局与快捷键
```

技术栈：**React 19 + TypeScript + Vite**，无后端、无第三方运行时依赖（除 React）。

## ⚠️ 说明
- 需在**本地/HTTPS**环境运行（浏览器媒体权限要求安全上下文，`http://127.0.0.1` 满足）
- 录音 / 录屏需用户授权；`getDisplayMedia` 会弹出系统选择器
- AI 语音识别字幕依赖浏览器 Web Speech API（Chrome / Edge 最佳）
- AI 剪辑完全本地计算，无需 API Key
