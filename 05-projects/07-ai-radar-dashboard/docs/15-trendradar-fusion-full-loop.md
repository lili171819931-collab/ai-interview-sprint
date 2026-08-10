# 15 · TrendRadar 热点融合：项目制全流程包装

> 迭代代号：TrendRadar Fusion / 多平台热点进雷达  
> 归属项目：`05-projects/07-ai-radar-dashboard`  
> 日期：2026-08-10  
> 对标上游：[sansan0/TrendRadar](https://github.com/sansan0/TrendRadar)  
> 本地安装：`08-resources/TrendRadar/`（gitignore，不进仓）

---

## 0. 为什么做这一轮（问题定义）

智衡已有：

| 层 | 能力 |
|----|------|
| 选型层 | 工具目录 + 七维评分 |
| 情报层 | 5 监控池雷达日报 |
| 行动层 | BuilderPulse 机会简报（`/pulse`） |

仍缺一层**大众舆情热搜**：

| 已有 | 缺口 |
|------|------|
| 官方 RSS / Changelog | 缺少微博/抖音/头条/知乎等热搜实时感 |
| 英文科技源偏多 | 缺少中文消费侧热点对照 |
| 机会简报偏 Builder 叙事 | 缺少「今天全网在吵什么」入口 |

学习 TrendRadar 的产品结构（多平台热榜 + 本地 SQLite + HTML 报告），以**数据同步 + 看板融合**方式接入 `/radar`，而不是 fork 重写整套爬虫。

---

## 1. 立项与范围（Project Charter 增量）

### 1.1 目标

- `/radar` 增加「TrendRadar · 多平台热点融合」区块：平台状态、AI 相关速览、Top 榜表。
- 建立 `trendradar:sync`：读取本地 TrendRadar `output/news/*.db` → `data/trendradar-hot.json`。
- 失败可 seed 降级；**不自动改七维评分**。
- 用项目制文档证明：研究→需求→设计→研发→验收→发布可追溯。

### 1.2 In / Out

| In Scope | Out of Scope |
|----------|--------------|
| 同步本地 TrendRadar SQLite 热点 | 把 TrendRadar 源码/venv 提交进本仓 |
| `/radar` 融合展示 + 外链 HTML 报告 | 重写 TrendRadar 爬虫 / newsnow 自建 |
| Zod 契约 + npm scripts | 强制推送渠道（飞书等）配置进本仓 |
| 全流程文档与验收项 | Docker 部署 TrendRadar（本机无 Docker 时用 uv） |

### 1.3 成功标准

- [x] `npm run trendradar:sync` 产出 `data/trendradar-hot.json`
- [x] `/radar#trendradar-hot` 可见平台卡、热点表、AI 速览
- [x] 无 DB 时 seed 降级不白屏
- [x] 七维评分不被热点同步改写
- [x] 文档 15 + IA / 验收 / 演示 / 面试叙事同步

---

## 2. 需求冻结（Requirements）

### 2.1 用户故事

1. **作为** AI PM，**我希望**在同一雷达页看到技术源 + 大众热搜，**以便**判断话题是否「出圈」。  
2. **作为**一人公司 Builder，**我希望**快速筛 AI 相关热点，**以便**发现内容/产品切口。  
3. **作为**面试演示者，**我希望**讲清「学习开源 → 融合而非重造」的工程判断。

### 2.2 MoSCoW

| 优先级 | 功能 |
|--------|------|
| Must | 同步 JSON、平台状态、Top 榜、AI 标签、外链报告 |
| Should | `/radar` 锚点跳转、sync 接入 `data:refresh` |
| Could | RSS 条目一并同步（下阶段） |
| Won't（本轮） | 在智衡内嵌完整 TrendRadar UI、自动定时爬取 |

### 2.3 非功能

- 边界清晰：热点是**发现信号**，不是评分输入。  
- 可运维：TrendRadar 安装与智衡 sync 解耦。  
- 体积控制：`08-resources/TrendRadar/` gitignore。

---

## 3. 产品设计（IA / 交互）

### 3.1 信息架构增量

```
/radar
  ├─ BuilderPulse 摘要卡
  ├─ TrendRadar 热点融合（#trendradar-hot）  ← 本轮
  ├─ 执行摘要 / 5 池 / 信号表
  └─ 风险 / 机会 / 行动
```

### 3.2 页面结构（热点融合区）

1. 标题 + 上游仓库链接  
2. 平台成功/失败指标卡  
3. AI 相关热点速览  
4. Top 榜表（排名 / 标题 / 平台 / 标签 / 链接）  
5. 打开 TrendRadar HTML 报告（默认 `http://127.0.0.1:8080/...`）

### 3.3 数据契约

见 `src/lib/trendradar-types.ts` + `trendradar-schema.ts`：

- `platforms[]`：id / name / status / itemCount  
- `items[]`：title / rank / url / aiRelated  
- `source`：`trendradar-local` | `seed`

---

## 4. 项目管理（里程碑）

| 里程碑 | 交付 | 状态 |
|--------|------|------|
| M1 研究安装 | uv 安装 TrendRadar，跑通抓取 + HTML | ✅ |
| M2 数据管线 | `sync-trendradar.ts` + JSON | ✅ |
| M3 产品融合 | `/radar` 热点区块 | ✅ |
| M4 运维脚本 | `trendradar:sync` 并入 `data:refresh` | ✅ |
| M5 文档发布 | docs/15 + 验收 + GitHub 同步 | ✅ |

风险与对策：

| 风险 | 对策 |
|------|------|
| 本地未跑 TrendRadar | seed 降级 + USAGE 文档 |
| 8080 HTML 服务挂掉 | 外链失败不影响雷达主功能 |
| 热搜噪声污染选型 | 明确「不进七维分」；AI 标签仅辅助 |

---

## 5. 研发实现（Engineering）

| 文件 | 作用 |
|------|------|
| `scripts/sync-trendradar.ts` | SQLite → JSON |
| `src/lib/trendradar-*.ts` | 类型 / Zod / 读取 |
| `src/data/trendradar-seed.ts` | 离线基线 |
| `data/trendradar-hot.json` | 日更产物 |
| `src/app/radar/page.tsx` | 融合 UI |
| `08-resources/TrendRadar-USAGE.md` | 本地安装速查 |

命令：

```bash
# 1) 更新热点源（TrendRadar）
export PATH="$HOME/.local/bin:$PATH"
cd 08-resources/TrendRadar
uv run python -m trendradar

# 2) 同步进智衡
cd 05-projects/07-ai-radar-dashboard
npm run trendradar:sync
npm run dev   # http://localhost:3010/radar#trendradar-hot
```

可选：`cd output && python3 -m http.server 8080` 查看原生 HTML 报告。

---

## 6. 测试与验收（QA）

见 [`验收清单.md`](验收清单.md)「TrendRadar 热点融合」小节。

最小回归：

1. 有 `2026-*-*.db` 时 sync → `source=trendradar-local`  
2. `/radar#trendradar-hot` 显示平台卡与表格  
3. 删除 JSON 后 seed 仍可渲染  
4. `npm run build` 通过  
5. 七维分文件不被 sync 改写  

---

## 7. 发布与运维（Release）

1. 代码与文档进入 `ai-interview-sprint` 的 `05-projects/07-*`  
2. TrendRadar 克隆保持本地（gitignore）  
3. 演示路径：动态雷达 → 热点融合 →（可选）TrendRadar HTML → 机会简报  

---

## 8. 商业与 AI PM 视角

### 价值主张

```
TrendRadar 热点 = 看见「全网在吵什么」
Radar 5 池      = 看见「技术/官方在变什么」
Pulse 机会简报  = 决定「今天做什么」
```

三层合在一起，形成选型 + 舆情 + 行动的完整叙事，适合一人公司与 AI PM 面试作品。

### 下阶段

1. 把 AI 相关热点自动建议进 `/pulse` 候选  
2. RSS 源一并同步  
3. 可选自建轻量热搜 API，降低对本地 DB 路径依赖  

---

## 9. 面试一分钟讲法

> 这一轮我学习 TrendRadar，但没有 fork 重造爬虫，而是做「安装上游工具 → 同步结构化数据 → 融合进自家雷达」的产品判断：热搜是发现信号，不能自动改七维分。演示时从 `/radar#trendradar-hot` 讲平台覆盖与 AI 热点，再连到机会简报，说明情报到行动的闭环。

---

## 10. 关联文档

- [`14-opportunity-brief-full-loop.md`](14-opportunity-brief-full-loop.md)  
- [`ia.md`](ia.md) · [`验收清单.md`](验收清单.md) · [`演示脚本.md`](演示脚本.md) · [`interview-story.md`](interview-story.md)  
- 本地用法：[`../../../08-resources/TrendRadar-USAGE.md`](../../../08-resources/TrendRadar-USAGE.md)  
- 上游：https://github.com/sansan0/TrendRadar  
