# 面试叙事：智衡 AI Radar

## 一句话

我做了一个 AI 工具日更看板：功能介绍结构化，优劣势对比可追溯，并补上「大众热点 + 雷达发现 → 今日构建建议」的行动层，避免「网上 Top10」不可审计。

## 为什么做

选型决策高频但信息噪声大。PM/工程师需要的是**同维度对照 + 来源**，不是情绪化排名。  
一人公司还需要更进一步：**全网在吵什么、今天做什么、为什么是现在**——所以融合 TrendRadar 热点，并增加机会简报（对齐 BuilderPulse 结构）。

## 怎么做

1. 冻结四品类与七维评分契约  
2. seed 人工维护，脚本 Zod 校验后写 bundle  
3. 页面读同一 `generatedAt`，stale 可降级  
4. 对比页只给场景建议，不颁总冠军  
5. 机会简报：`pulse:install` / `pulse:sync` → `/pulse`，失败 seed 降级，遵守 CC BY-NC 署名  
6. 热点融合：本地 TrendRadar → `trendradar:sync` → `/radar#trendradar-hot`，**不进七维分**

## 可追问点

- 分数主观怎么办？→ evidence + source level + 禁止 inferred 极端分  
- 如何日更？→ refresh 原子写，失败保留快照  
- 和爬虫站区别？→ 宁精勿滥，可演示可审计，不做军备  
- 为什么不 fork TrendRadar？→ 学习其产品结构，融合数据层即可；爬虫军备不是本仓目标  
- AI 功能该不该做？→ 先判断用户价值、模型能力、数据条件、链路适配、成本收益和迭代节奏  
- 效果差/幻觉多怎么办？→ 先定位检索、切片、Prompt、工具调用、上下文，再考虑模型升级  
- 机会简报会不会侵权/不可商用？→ 结构化展示 + 署名 + NC 边界；商用需自有源或授权；全流程见 `docs/14`  
- 热搜噪声怎么办？→ 热点是发现信号；AI 标签辅助；明确不改七维分；全流程见 `docs/15`

## AI 产品落地话术

完整 Q&A 见 [`08-ai-product-interview-qa.md`](08-ai-product-interview-qa.md)。
商业价值分析见 [`09-commercial-value-and-landing.md`](09-commercial-value-and-landing.md)，AI 产品经理视角方法论见 [`10-ai-pm-perspective.md`](10-ai-pm-perspective.md)，思维链与全量风险见 [`11-thinking-chain-and-risks.md`](11-thinking-chain-and-risks.md)。专家版 Prompt 见 [`极致Prompt-思维链与风险专家版.md`](极致Prompt-思维链与风险专家版.md)。
机会简报全流程见 [`14-opportunity-brief-full-loop.md`](14-opportunity-brief-full-loop.md)。  
TrendRadar 热点融合全流程见 [`15-trendradar-fusion-full-loop.md`](15-trendradar-fusion-full-loop.md)。

面试收束可以这样讲：

> 这个项目不是为了证明“AI 可以自动排名”，而是为了证明我知道 AI 功能怎么落地：先判断值不值得做，再把数据、模型、链路和评测拆开。智衡把工具事实、来源等级、评分证据、日更报告、大众热点和对比结论分层展示，所以每个判断都能追溯。机会简报补的是最后一公里：从信号到「今天做一个什么」。

商业价值可以这样补充：

> 它的商业价值不是导航流量，而是企业选型效率：把候选工具、对比维度、来源证据和风险提示沉淀成可复用流程。未来可以从个人调研工具升级为企业内部 AI 选型台，再延展到行业报告和 API 数据服务。机会层可演进为「内部 Builder Brief」，用自有源摆脱第三方许可约束。

风险与思维链可以这样补充：

> 我最怕三件事：脏数据覆盖昨日好快照、跨品类硬比误导结论、文档和实现不一致。分别用原子写入与校验失败保留、对比警告卡、验收清单和演示脚本兜住。加需求前先过用户任务、可信、可运维、可演示、商业五道闸门。机会简报额外守许可与降级；热搜融合守「发现信号不进七维分」。

## 挂钩

平台素养（`04-platform-literacy`）→ 本看板是「能力地图」的可运行表达。  
研究工具（`08-resources/scrapling-examples`）→ 机会源调研前置实验。
