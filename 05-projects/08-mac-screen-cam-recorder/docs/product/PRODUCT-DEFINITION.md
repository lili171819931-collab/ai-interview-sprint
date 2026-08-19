# Product Definition — AI Teaching Recorder

## One-line positioning

> 面向知识博主 / AI 教学 / 在线课程的轻量级 macOS 录课工作台：
> 屏幕录制 + 真人出镜小窗 + 悬浮控制条 + 教学标注 + 提词器 + 时间线 + AI 剪辑前置数据。

English: *A lightweight macOS teaching studio — record your screen with a live
camera PiP, annotate and teleprompt as you teach, then trim and clean the result —
so course creators ship lessons without touching a heavy NLE.*

## Users

| Type | Who | Core need |
|---|---|---|
| Primary | 知识博主 / AI 教学创作者 | 边讲边录、出镜、标注，快速出片 |
| Secondary | 技术讲师 / 产品演示者 | 代码/PPT 讲解 + 鼠标聚焦 + 快捷键可视化 |
| Power | 课程制作团队 | 标准化录制 + 时间线清洗 + 批量导出 |
| Future | AI Agent / CI | headless 录制生成演示视频（OpenScreen 模式） |

## Core pain points

1. 录屏、出镜、标注、剪辑分散在多个工具（OBS + 相机 + 剪辑软件），流程割裂。
2. 专业工具（OBS/Camtasia）学习成本高；轻量工具（系统录屏）又没有教学能力。
3. 「录完还要剪」——静音、口头禅、多余片头片尾占用大量后期时间。
4. 真人出镜小窗要进最终视频，普通录屏工具做不到或很麻烦。
5. AI 剪辑需要「录制时的事件数据」——普通录屏只产出视频，没有光标/点击/窗口日志。

## Core value

- **Functional**: 一窗完成 屏幕+出镜+标注+悬浮控制 的录制闭环。
- **Efficiency**: 时间线一键去静音/裁头尾，后期从「小时级」降到「分钟级」。
- **AI/Data**: `.metadata.json`（光标/点击/窗口事件）为 V1.0「AI 导演」提供素材——
  这是与 Loom/OBS 的差异化数据资产。
- **Commercial**: Open Core 潜力——本地免费，AI 剪辑 / 云分享 / 团队功能订阅。

## User journey

```text
打开 App → 选录制模式（整屏/窗口/区域）
→ 打开摄像头/麦克风/系统声音
→ 开启教学工具（键盘OSD/聚光灯/提词器/标注）
→ 点「开始录制」→ 悬浮控制条出现
→ 边讲边标注，随时暂停/恢复
→ 停止 → 自动保存 MP4 + metadata.json
→ 时间线页：裁头尾/删静音 → 导出干净版
→ （V0.3）AI 字幕/章节 → （V1.0）AI 自动镜头/多版本
```

## Feature map

```text
Recording    Screen/Window/Region + Webcam PiP + Mic + System Audio + Countdown
Presentation 键盘OSD · 鼠标聚光灯 · 点击特效 · 标注(6工具) · 提词器(可入画/不入画)
Timeline     裁头尾 · 静音检测/删除 · 分段恢复 · MP4 导出（AVMutableComposition）
Metadata     光标轨迹 · 点击 · 前台窗口 · 时间戳 → .metadata.json（AI 导演输入）
Export       MP4(H.264+AAC) · 平台预设(V1.0) · 分享链接(V1.0)
```

## Business model (forward-looking)

| Tier | Price | Scope |
|---|---|---|
| Free | $0 | 录屏 + PiP + 标注 + 时间线 + 本地元数据 |
| Pro | ~$12/mo | 本地 AI 字幕/去停顿/章节（Whisper）+ 高级导出 |
| Team | ~$29/user/mo | 云分享链接 + 素材库 + 模板 |
| Enterprise | custom | 私有化 + SSO + headless 录制 API |

## Differentiation vs alternatives

| | AI Teaching Recorder | OBS | Loom/Cap | Screen Studio |
|---|---|---|---|---|
| 教学开箱即用 | ✅ | ❌ | ❌ | ⚠️ |
| 出镜 PiP 烘焙 | ✅ | ✅(复杂) | ❌ | ✅ |
| 事件级 AI 元数据 | ✅ | ❌ | ❌ | ⚠️(光标轨迹) |
| 本地优先/隐私 | ✅ | ✅ | ❌(云) | ✅ |
| 价格 | Free/低 | Free | 订阅 | 高价 |
