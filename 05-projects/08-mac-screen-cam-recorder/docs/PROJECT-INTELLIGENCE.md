# Project Intelligence Report — AI Teaching Recorder

> 生成日期：2026-08-19 · 基于真实录制验证与 88/88 单测

## One-page overview

| 维度 | 结论 |
|---|---|
| 项目名称 | AI Teaching Recorder（AI 教学录屏工作台） |
| 产品定位 | 录屏 + 真人出镜 + 教学标注 + 提词器 + 时间线 + AI 元数据的轻量 macOS 录课台 |
| 目标用户 | 知识博主 / AI 教学 / 在线课程 / 产品演示 |
| 核心痛点 | 录屏-出镜-标注-剪辑割裂；AI 剪辑缺事件数据 |
| 核心功能 | 屏幕/窗口/区域录制 · PiP 出镜 · 悬浮控制条 · 标注 · 键盘OSD · 聚光灯 · 提词器 · 时间线 · 元数据旁录 |
| 核心 AI 能力 | 当前：事件级元数据采集；规划：本地 ASR 字幕 / 去停顿 / AI 导演 |
| Agent | CLI 无头录制（AITRCLI），可被 CI/AI Agent 调用 |
| Workflow | 录制 → 悬浮控制 → 停止 → 时间线清洗 → 导出；旁录事件 JSON 供 AI 使用 |
| 技术栈 | Swift 5.9 · ScreenCaptureKit · AVFoundation · CoreImage · AVAssetWriter · SwiftPM |
| 架构 | Core（无 UI 引擎）+ App（SwiftUI/AppKit）+ CLI + 测试 四层 |
| 当前阶段 | V0.2 完成（教学层）；V0.3（AI 剪辑）待开发 |
| 完成度 | 单测 88/88 · CLI 自检 PASSED · 真实录制验证通过（H.264 + 双 AAC + 元数据） |
| 技术风险 | ScreenCaptureKit 60fps 不按配置降帧；WAV 读取在 SwiftPM 构建下的 -12780 限制；TCC 权限依赖 |
| 产品风险 | 无云同步/分享；AI 剪辑尚未落地；竞品（Cap/Screen Studio）增长快 |
| 商业价值 | Open Core：本地免费 + AI/云增值订阅 |
| 开源价值 | MIT 可商用；教学组合（OSD/提词/标注/元数据）差异化 |
| GitHub 状态 | 分支 `codex/mac-screen-cam-recorder` 已推送；仓库 ai-interview-sprint/05-projects/08 |
| 当前版本 | 0.2.1 |
| 下一步 | 录制失败 UX（P0）→ V0.3 本地 ASR 字幕（P1） |
| 未来 3 个月 | V0.3 AI 剪辑闭环 + 平台导出预设 |
| 未来 1 年 | V1.0 AI 导演（自动镜头/短视频）+ 云分享 + 跨平台壳 |

## WHAT WE HAVE

- 完整 V0.1 MVP + V0.2 教学层（键盘OSD/提词器/聚光灯/元数据/时间线）
- 88/88 单元测试 + CLI 自检 + 真实录制验证（本轮完成：H.264 1080p + 双 AAC + 元数据 JSON）
- 产品蓝图（docs/AI-TEACHING-STUDIO-BLUEPRINT.md）+ 完整文档体系（本轮新增）
- 稳定自签名 + 图标 + 桌面可打开 .app
- 已修复：100% CPU 布局循环、标注文字不渲染、输出目录误设、悬浮窗状态恢复

## WHAT IS MISSING

- 录制启动失败的可见性（`toggleRecordingShortcut` 用 `try?` 吞错，失败仍显示录制 UI）
- V0.3：本地 ASR 字幕 / 去停顿 / 章节 / 摘要
- V1.0：AI 导演（用 .metadata.json 生成自动镜头）、短视频多版本、平台导出
- 跨平台壳（Electron/Tauri）与 Web 轻量版
- 崩溃恢复（录制中断时保留已编码片段）

## WHAT SHOULD BE CHANGED

- 录制启动/停止的显式错误反馈（P0）
- 时间线页加入「已保存的录制」下拉即选（当前需手选文件或进 Recordings 页）
- Settings 中展示当前输出目录（防止再次误设）

## WHAT SHOULD NOT BE CHANGED

- Core 无 UI 的分层设计（可无头测试）
- 采集回调不碰 UI、状态限频的原则（防卡死）
- MIT 许可证与本地优先定位

## WHAT SHOULD BE PRODUCTIZED / OPEN-SOURCED / COMMERCIALIZED

- 开源：核心录屏 + 教学层（保持 MIT）
- 产品化：AI 剪辑（V0.3）与 AI 导演（V1.0）
- 商业化：云分享链接、团队素材库、headless 录制 API（Open Core）

## 下一步行动优先级

| Priority | Action | Reason | Expected Impact |
|---|---|---|---|
| P0 | 录制启动失败不再吞错：`startWith` 失败时隐藏控制条/摄像头并显示 lastError | 当前失败仍显示「录制中」，用户会以为在录 | 消除最迷惑的 UX 缺陷 |
| P0 | 时间线/录制列表按真实输出目录刷新 | 输出目录可变，列表需跟随 | 数据不「丢失」 |
| P1 | V0.3 本地 ASR（faster-whisper）+ 去停顿 + 字幕 SRT | 蓝图核心 AI 价值 | 后期从分钟级→秒级 |
| P1 | 平台导出预设（B站/YouTube/TikTok/小红书） | 分发效率 | 直接可发布 |
| P2 | 崩溃恢复（分段落盘） | 长课录制风险 | 数据安全 |
| P2 | 录制页加「仅事件模式」（导演模式，不合成仅录事件） | AI 导演素材 | 差异化数据 |
| P3 | 跨平台壳 + Web 轻量版 | 触达更多用户 | 增长 |
