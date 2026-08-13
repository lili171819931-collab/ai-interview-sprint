# BuilderPulse 机会日报方法 → 智衡日更归档

> 对标：[BuilderPulse#chinese](https://github.com/BuilderPulse/BuilderPulse#chinese)（CC BY-NC 4.0，非商业）  
> 命令：`npm run opp:sync` · 页面：`/opportunities` · 归档：`data/opportunities/YYYY-MM-DD.json`

## 学到的分析方法

1. **一条主建议**：每天只给一个高置信构建方向（不是信息流）。
2. **Why now**：必须有「为什么是今天」的窗口理由（讨论量 / 同日交叉事件）。
3. **2 小时构建**：可执行 timebox（产品名 + 一句话范围）。
4. **Top 信号**：3 条带讨论量的公开证据，交叉 HN / GitHub / PH / Trends 等。
5. **机会题库题型**：每题固定四层——**信号 → 白话 → 关键判断 → 反向视角**。
6. **7 天命中记录**：信号 → 可做项目的短追踪，形成可信度。

## 智衡落盘

| 产物 | 路径 |
|------|------|
| 最新 | `data/opportunity-report-daily.json` |
| 日切存档 | `data/opportunities/YYYY-MM-DD.json` |
| 总归档 | `data/archive/YYYY-MM-DD/opportunity-report.json` |

本地增量：在 BP 题库之上叠加 **AI 热点榜 / 国内看板 / 海外看板** 三棱镜。

## 日更

```bash
npm run pulse:sync   # 拉取 BP 中文日报
npm run opp:sync     # 合成机会报告并归档（会先跑 pulse，可 OPP_SKIP_PULSE=1）
npm run daily:refresh # full 模式已含 opp:sync
```

查看：http://localhost:3010/opportunities · `?date=YYYY-MM-DD` 回看存档。

## 致谢

方法与日报结构学习自 [BuilderPulse](https://github.com/BuilderPulse/BuilderPulse#chinese)，作者 [刘小排（Liu Xiaopai）](https://github.com/liuxiaopai-ai)。内容许可 **CC BY-NC 4.0**，本仓仅非商业学习展示并署名。完整致谢表见 [`CREDITS.md`](CREDITS.md)。
