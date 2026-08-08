# AI Radar 每日更新机制：5 监控池 + 结构化日报

> 目标：把“全球 AI 最新动态”从碎片浏览变成可复用的日更情报流程。  
> 边界：公开源监控、交叉验证、场景化判断；不做违规抓取、黑盒总榜、未经验证自动改分。

## 1. 一句话定位

智衡 AI Radar 的调研系统是面向 PM / 工程师 / 企业选型的**全球 AI 动态雷达**：持续追踪模型能力、工具新品、研究论文、官方发布与行业新闻，并输出可执行的日报、排行观察、风险提醒与机会洞察。

## 2. 五个监控池

| 监控池 | 用途 | 代表站点 |
|--------|------|----------|
| 模型榜单 | 能力/价格/代码/偏好对比 | Artificial Analysis、LMArena、HF Open LLM、SWE-bench、Papers with Code、Epoch AI、Stanford AI Index |
| 工具目录 | 新品发现与场景检索 | TAAFT、Futurepedia、Product Hunt AI、Toolify、TopAI.tools、G2 |
| 新闻快讯 | 每日/每周产业动态 | The Batch、Import AI、Ben's Bites、TLDR AI、MIT TR、VentureBeat、The Information |
| 论文研究 | 研究突破与开源信号 | arXiv、GitHub Trending、HN、r/LocalLLaMA |
| 官方发布 | 确认事实的最高优先级 | OpenAI、Anthropic、DeepMind、Meta、Microsoft、NVIDIA、Mistral、HF |

登记表：`src/data/research-sources.ts`  
展示：`/sources` · 日报看板：`/radar`

## 3. 看板字段设计

每条信号（`RadarSignal`）至少包含：

| 字段 | 含义 |
|------|------|
| name | 名称 |
| category | 类别：model/tool/paper/news/official/funding/ranking |
| pool | 所属监控池 |
| heat | 热度 1–5 |
| rank | 排名/口径说明 |
| confidence | high / medium / low |
| updatedAt | 更新时间（上海日） |
| sourceUrl | 来源链接 |
| pmOpportunity | PM 机会点 |
| factKind | confirmed / inferred / rumor / official |
| riskNote | 风险备注（可选） |

报告级输出（`RadarDailyReport`）还包含：

- 执行摘要（≤5 行）
- 排行榜观察 `rankingNotes`
- 风险提醒 `riskAlerts`
- 机会洞察 `opportunities`
- 行动建议 `actions`
- 日报 / 周报 `kind`

## 4. 每日自动更新机制

```
编辑 seed（工具事实/评分，人工）
  → npm run data:refresh
      1) 抓取 LIVE_SOURCES（RSS/Atom/Changelog）
      2) 写入 daily-bundle + live-fetch-report
      3) 生成 radar-daily-report（叠加公开源成功条目）
  → 人工用极致 Prompt 交叉验证 5 池
  → 必要时更新 seed 候选工具 / 证据
  → /radar 展示日报；/sources 审计来源
```

命令：

```bash
npm run data:refresh      # 抓取 + 雷达日报
npm run radar:daily       # 仅日报
npm run radar:weekly      # 周报模式
```

硬规则：

- 情报站点矩阵**不**全部自动抓取（多数无稳定公开 RSS）
- 自动抓取只更新 changelog / 看点 / 雷达信号，**不改七维分数**
- 校验失败不覆盖昨日 JSON

## 5. 输出格式

| 产物 | 用途 |
|------|------|
| 日报 | `/radar` + `data/radar-daily-report.json` |
| 周报 | `RADAR_REPORT_KIND=weekly` |
| 排行榜观察 | 报告 `rankingNotes` |
| 风险提醒 | 报告 `riskAlerts` |
| 机会洞察 | 报告 `opportunities` + 行动建议 |

## 6. 榜单使用原则

- 不用单一榜单决定“最强模型”。
- 模型能力按场景拆：推理、代码、数学、多模态、长上下文、速度、价格、企业可用性。
- 工具按用户任务拆：研究、写作、编程、设计、视频、办公、营销、销售、客服、教育。
- 社区热度 ≠ 产品价值；Benchmark ≠ 真实业务效果。

## 7. 极致 Prompt

见 [`极致Prompt-AI动态雷达日更.md`](./极致Prompt-AI动态雷达日更.md)（可整段复制执行）。

## 8. 验收标准

- 任意结论能追到来源链接
- 5 监控池在 `/sources` 可点击
- `/radar` 展示名称/类别/热度/排名/可信度/更新/来源/PM 机会点
- 日更失败不影响已有数据展示
- PM 能用日报在 10 分钟内形成候选、风险和下一步行动
