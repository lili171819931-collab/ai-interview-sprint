# Mac Screen Cam Recorder · 教学录屏完整项目闭环

macOS 本地录屏工具：**屏幕 + 圆形/方形摄像头出镜 + 麦克风**，实时 Canvas 合成，停止即得到桌面 `Mac录屏` 下的 **H.264 MP4**。

本目录已补齐从**市场调研 → 竞品 → 立项需求 → 设计 → 项目管理 → 研发测试 → 发布复盘 → 面试包装**的完整项目文档。

> 仓库路径：[05-projects/08-mac-screen-cam-recorder](https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/08-mac-screen-cam-recorder)  
> 全流程导航：[docs/12-full-project-loop.md](docs/12-full-project-loop.md)

## 一分钟上手

```bash
cd 05-projects/08-mac-screen-cam-recorder
npm install
brew install ffmpeg          # 导出 MP4 需要
npm run dev                  # Vite :5177 + Electron
```

首次请在 **系统设置 → 隐私与安全性** 授权屏幕录制 / 摄像头 / 麦克风，然后**完全退出再开** App。

## 产品能力（当前）

- 所见即所得合成：预览 = 成片构图
- 摄像头圆/方：拖动改位；**单击切形**；**双击反转**；录制中悬浮 PiP 可操作（不进成片）
- 壳内操作条 + 录制隐藏主窗时的悬浮条（墙钟计时）
- 背景虚化（MediaPipe，可关/可降级）、指针/捏合缩放
- 仅电脑摄像头（排除 Continuity）；导出 MP4 + JSON sidecar
- 截图、历史、托盘、全局快捷键 `⌘⇧⌥R/S/.`

## 完整项目文档地图

### 0) 调研 · 竞品 · 立项 · 需求
- [docs/market-research.md](docs/market-research.md)
- [docs/competitive-analysis.md](docs/competitive-analysis.md)
- [docs/00-project-charter.md](docs/00-project-charter.md)
- [docs/01-requirements-freeze.md](docs/01-requirements-freeze.md)
- [docs/prd.md](docs/prd.md)

### 1) 产品设计
- [docs/ia.md](docs/ia.md)
- [docs/user-journey.md](docs/user-journey.md)
- [docs/02-product-design-spec.md](docs/02-product-design-spec.md)
- [docs/metrics.md](docs/metrics.md)

### 2) 项目管理与研发
- [docs/03-project-management-plan.md](docs/03-project-management-plan.md)
- [docs/04-rd-implementation-plan.md](docs/04-rd-implementation-plan.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/decisions.md](docs/decisions.md) · [docs/decisions-blur.md](docs/decisions-blur.md)

### 3) 测试 · 发布 · 收口
- [docs/05-test-and-qa-report.md](docs/05-test-and-qa-report.md)
- [docs/验收清单.md](docs/验收清单.md)
- [docs/06-release-ops-runbook.md](docs/06-release-ops-runbook.md)
- [docs/07-project-closure.md](docs/07-project-closure.md)
- [docs/12-full-project-loop.md](docs/12-full-project-loop.md)

### 4) 商业 · AI PM · 面试
- [docs/09-commercial-value-and-landing.md](docs/09-commercial-value-and-landing.md)
- [docs/10-ai-pm-perspective.md](docs/10-ai-pm-perspective.md)
- [docs/11-thinking-chain-and-risks.md](docs/11-thinking-chain-and-risks.md)
- [docs/08-ai-product-interview-qa.md](docs/08-ai-product-interview-qa.md)
- [docs/interview-story.md](docs/interview-story.md)
- [docs/演示脚本.md](docs/演示脚本.md)

### 5) 迭代 Prompt（研发过程资产）
- [docs/极致Prompt-圆形摄像头嵌入虚化与开关.md](docs/极致Prompt-圆形摄像头嵌入虚化与开关.md)
- [docs/极致Prompt-教学录屏持续采集与操作条.md](docs/极致Prompt-教学录屏持续采集与操作条.md)
- [docs/极致Prompt-精简操作条双指缩放与启动小窗壳.md](docs/极致Prompt-精简操作条双指缩放与启动小窗壳.md)
- [docs/battle-log-teaching-recorder.md](docs/battle-log-teaching-recorder.md)

## 使用摘要

1. 选择屏幕/窗口 → 打开摄像头/麦  
2. 调整小窗（拖动 / 单击切形 / 双击反转）  
3. 启动录像 → 停止 → 到桌面「Mac录屏」用 QuickTime 打开  

## 说明

- 数据仅存本机，无账号、无上传。  
- 系统声音 loopback 本版不做。  
- 导出依赖本机 ffmpeg；失败会明确报错，不会假装成 MP4 的 WebM。
