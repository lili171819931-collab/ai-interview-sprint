# Goal Compiler · 诉求拆解平台

> 把一段**模糊想法**，编译成一份「机器可直接执行、人类可直接验收、AI 可连续自主工作数小时」的专家级 **Goal Task Specification**。

![platform](docs/screenshots/gc-shot-result.png)

## 这是什么

一个**零依赖、本地运行**的网页平台，包含 4 大核心能力：

1. **诉求拆解**：输入一句话/一段描述 → ①-⑧ 结构化分析 + ⑨ 20 段 Machine-Executable Goal；
2. **完整思维链**：14 个推理节点结构化输出（输入/推理/结论/证据/决策），**可学习、可导出**；
3. **可人工编辑**：最终 Goal Prompt 支持编辑、复制、下载、存草稿、历史恢复；
4. **竞品分析**：爬取 GitHub / Hacker News / 精选库，**产品总监视角**输出定位矩阵、SWOT、差异化建议。

设计风格：**商务高效简约**（slate + 蓝、卡片化、高信息密度）。

## 快速开始

```bash
cd 05-projects/09-goal-compiler
node server/server.mjs 8910
# 浏览器打开 http://localhost:8910
```

> 无需 `npm install`（Node ≥ 18，零第三方依赖）。

## 测试

```bash
node --test tests/compile.test.mjs tests/api.test.mjs   # 单元 + API（9/9）
node tests/e2e-cdp.mjs                                   # 浏览器端到端（10/10，需本机 Chrome）
```

## 3 个测试用例

| 用例 | 类型 | 演示重点 |
|------|------|----------|
| AI 面试官工具 | 产品/构建 | 目标树、边界、验收标准 |
| 报销发票小程序 | 效率/自动化 | 自动补全你没考虑到的功能 |
| AI 英语口语提升 | 学习/成长 | 个人目标 → 里程碑与自测关卡 |

## 技术架构

```
server/  server.mjs（HTTP+API） · crawler.mjs（GitHub/HN/精选库爬虫）
public/  index.html · styles.css · app.mjs · competitive.mjs
         compiler/（analyzer → goal → chain → index）＝ 优化版 Goal Compiler Prompt 的规则化实现
data/    cases.json（3 用例） · competitors.db.json（16 精选竞品）
docs/    项目制文档 6 篇 + 截图
tests/   单测 · API 测试 · CDP 端到端
```

## 项目制文档

| 文档 | 内容 |
|------|------|
| [docs/01-product-analysis.md](docs/01-product-analysis.md) | 产品分析（PRD） |
| [docs/02-prompt-optimization.md](docs/02-prompt-optimization.md) | **优化后的 Goal Compiler Prompt 全案**（12 项缺口 + v2.0 全文） |
| [docs/03-project-management.md](docs/03-project-management.md) | 项目流程管理 |
| [docs/04-development-testing.md](docs/04-development-testing.md) | 开发与测试 |
| [docs/05-business-value.md](docs/05-business-value.md) | 商业价值分析 |
| [docs/06-user-guide.md](docs/06-user-guide.md) | 使用指南 |

## 参考

- 原始诉求：用户提供的「极致版 Goal Compiler」Prompt（930 行）
- 参考项目：[khazix-skills/leader/SKILL.md](https://github.com/KKKKhazix/khazix-skills/blob/main/leader/SKILL.md)（防作弊验收、≤4000 字符目标书）
- 竞品数据源：GitHub Search API、Hacker News Algolia、内置精选库（16 项）

## 免责说明

- 本平台编译引擎为**规则模板 + 领域知识库**（确定性、可离线），非 LLM 生成；P2 规划接入 LLM 增强模式。
- 竞品数据来自公开 API，仅供学习研究；GitHub 未认证限流 10 次/分。
