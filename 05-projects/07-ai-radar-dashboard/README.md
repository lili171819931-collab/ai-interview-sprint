# 智衡 AI Radar · AI 平台与工具看板（完整项目闭环）

日更数据、功能介绍、可追溯优劣势对比的 Web 看板。  
本目录已补齐从**需求 → 设计 → 项目管理 → 研发测试 → 上线运维 → 复盘闭环**的完整项目文档。

> 源码同步位置：[ai-projects/products/ai-radar-dashboard](https://github.com/lili171819931-collab/ai-projects/tree/main/products/ai-radar-dashboard)  
> 本仓亦可通过子模块访问：`05-projects/ai-projects/products/ai-radar-dashboard/`

## 一分钟上手

```bash
cd 05-projects/07-ai-radar-dashboard
npm install
npm run data:refresh   # 生成 data/daily-bundle.json
npm run dev            # http://localhost:3010
```

## 页面

| 路由 | 作用 |
|------|------|
| `/` | 总览：数据链、能力地图、品类柱状图、今日看点 |
| `/radar` | AI 动态雷达日报：5 监控池 + 信号看板 + 风险/机会/行动 |
| `/tools` | 目录：筛选 + 结果区（排序/视图/多选对比） |
| `/tools/[id]` | 功能介绍 + 优劣势 + 来源数据链 |
| `/compare` | 维度对比 + 决策流/树 + 柱状图 + 场景建议 |
| `/sources` | 数据来源报告：资产路径 + 5 监控池矩阵 + 公开源抓取 |
| `/methodology` | 评分口径与日更管道 |

## 完整项目文档地图

### 0) 立项与需求
- [`docs/00-project-charter.md`](docs/00-project-charter.md)
- [`docs/01-requirements-freeze.md`](docs/01-requirements-freeze.md)
- [`docs/prd.md`](docs/prd.md)

### 1) 产品设计
- [`docs/ia.md`](docs/ia.md)
- [`docs/02-product-design-spec.md`](docs/02-product-design-spec.md)
- [`docs/design-system.md`](docs/design-system.md)
- [`docs/data-contract.md`](docs/data-contract.md)

### 2) 项目管理与研发
- [`docs/03-project-management-plan.md`](docs/03-project-management-plan.md)
- [`docs/04-rd-implementation-plan.md`](docs/04-rd-implementation-plan.md)

### 3) 测试、发布与复盘
- [`docs/05-test-and-qa-report.md`](docs/05-test-and-qa-report.md)
- [`docs/06-release-ops-runbook.md`](docs/06-release-ops-runbook.md)
- [`docs/07-project-closure.md`](docs/07-project-closure.md)

### 4) 商业价值与 AI PM 视角
- [`docs/09-commercial-value-and-landing.md`](docs/09-commercial-value-and-landing.md)
- [`docs/10-ai-pm-perspective.md`](docs/10-ai-pm-perspective.md)
- [`docs/11-thinking-chain-and-risks.md`](docs/11-thinking-chain-and-risks.md)
- [`docs/12-ai-radar-research-system.md`](docs/12-ai-radar-research-system.md)

### 5) 演示与故事化包装
- [`docs/演示脚本.md`](docs/演示脚本.md)
- [`docs/验收清单.md`](docs/验收清单.md)
- [`docs/interview-story.md`](docs/interview-story.md)
- [`docs/08-ai-product-interview-qa.md`](docs/08-ai-product-interview-qa.md)
- [`docs/极致Prompt-AI雷达看板从0到1.md`](docs/极致Prompt-AI雷达看板从0到1.md)
- [`docs/极致Prompt-思维链与风险专家版.md`](docs/极致Prompt-思维链与风险专家版.md)
- [`docs/极致Prompt-AI动态雷达日更.md`](docs/极致Prompt-AI动态雷达日更.md)

## 日更（真实公开源 + 动态雷达日报）

1. 编辑 `src/data/seed.ts`（事实与评分，人工底座）
2. 维护 5 监控池：`src/data/research-sources.ts`
3. 需要时扩展 `scripts/live-sources.ts`（RSS / GitHub Atom / 公开 Changelog）
4. `npm run data:refresh` — 抓取公开源 + 生成 `data/radar-daily-report.json`  
   - 仅日报：`npm run radar:daily`  
   - 周报：`npm run radar:weekly`  
   - 无网：`npm run data:refresh:offline`
5. 校验失败**不会**覆盖昨日 `data/daily-bundle.json`
6. 看板看 `/radar`；抓取明细看 `/sources` 与 `data/live-fetch-report.json`

**不会**因 RSS / 雷达日报自动改七维分数。

## 文档

见 [`docs/`](docs/)（已覆盖完整项目生命周期）。

## 非目标

实时行情爬虫、账号社区、伪科学总榜、密钥进仓。
