# 思维链与风险清单

## 1. 产品思维链（面试可口述）

1. 用户要的是「能播的教学成片」，不是「又一个录屏按钮」。
2. 竞品在云与重工具两极，中间留有「本地轻量圆窗」空位。
3. 技术主路径选 Electron+Canvas，保证预览=成片。
4. 编码与设备是体验底线：MP4 诚实、摄像头诚实。
5. 录制中操作不能进片：contentProtection + 单壳/悬浮分工。
6. 用文档把判断沉淀成可检查的冻结项与验收句。

## 2. 全量风险

| 类别 | 风险 | 缓解 |
|------|------|------|
| 平台 | 仅 macOS | 文档明示；路线图再谈跨端 |
| 权限 | 屏幕录制授权诡异 | 引导重启、系统选择器兜底 |
| 设备 | Continuity | 过滤 + exact/ideal 策略 |
| 编码 | WebM 被当网页视频 | ffmpeg + ftyp 校验 |
| 性能 | 隐藏窗节流 | backgroundThrottling false；操作条自计时 |
| 隐私 | 录进自己的 UI | contentProtection |
| 依赖 | ffmpeg 未装 | 失败文案 |
| 分发 | 未公证 | 开发态说明；商业化再补 |
| 范围 | 做太重变 OBS | Won't 列表锁死 |

## 3. 决策记录入口

- `decisions.md` / `decisions-blur.md`
- `battle-log-teaching-recorder.md`
- 各 `极致Prompt-*.md`
