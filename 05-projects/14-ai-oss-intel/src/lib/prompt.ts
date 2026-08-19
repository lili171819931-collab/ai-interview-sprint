/**
 * Project Prompt generator — produces a self-contained Master Prompt for each
 * project, ready to paste into Codex / Claude Code / Cursor / any coding agent
 * to drive a complete reverse-engineering + director-level analysis.
 * Embeds the project facts + platform-generated analysis (chain, mainline,
 * panorama Q&A, director verdict) as ground truth for the agent to verify/deepen.
 */
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { buildCompleteChain, buildTechRouteMainline, buildPanoramaQA, answerQuestion, type MapNode } from "@/lib/master";
import { buildDirectorReport, buildDirectorQA } from "@/lib/director";
import { buildFactSheet, buildKillerFeature } from "@/lib/master";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { buildSourceMasterReport, buildSourcePanoramaQA, buildSourceTechRouteMainline, buildSourcePanorama } from "@/lib/sourceMaster";
import type { Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";

function roleBlock(): string {
  return `## ROLE
你现在是一支「AI 产品逆向工程专家团队」，同时扮演：
1. Principal AI Product Manager
2. Senior AI Product Architect
3. AI Agent Architect
4. Software Architect
5. Full-Stack Engineer
6. AI Engineer
7. UX / UI Designer
8. User Research Expert
9. Business Strategy Expert
10. Growth Strategy Expert
11. Open Source Ecosystem Analyst
12. Technical Due Diligence Expert

你的核心任务不是介绍项目，而是对一个 AI 产品进行【完整逆向工程】：
从「用户为什么需要它」一直分析到「开发者到底是怎么把它做出来的」，
并给出 Head of AI Product 级别的商业判断。`;
}

function evidenceBlock(): string {
  return `## EVIDENCE MODE（最重要的标准）
- 所有结论必须标记：[FACT] 源码/官方文档证实 · [INFERENCE] 根据源码与行为推导 · [HYPOTHESIS] 合理推测 · [UNKNOWN] 无法确认
- 绝对禁止把推测写成事实
- 分析对象优先级：Source Code > Official Documentation > README > Issue > PR > Release > Demo > Website > Community
- 禁止仅根据 README 推断完整技术架构`;
}

function standardBlock(): string {
  return `## 最高标准
- 不要描述产品，要解释产品
- 不要罗列功能，要解释功能为什么存在
- 不要罗列技术栈，要解释技术为什么这样组合
- 不要说「AI 实现」，要解释 AI 在系统中的具体位置
- 不要说「Agent 自动完成」，要解释 Agent 如何 Planning、调用 Tool、获取 Observation、Reasoning、Memory、Action
- 不要说「商业价值很高」，要解释谁付钱、为什么付、何时付、如何形成持续收入
- 不要只看现在，要判断未来
- TOP-DOWN（战略→市场→用户→问题→产品→功能）与 BOTTOM-UP（代码→架构→API→Workflow→AI→功能→产品→商业）两条路径必须汇合`;
}

export function buildProjectPrompt(p: Project): string {
  const s = computeScores(p);
  const r = buildReverseEngineering(p);
  const chain = buildCompleteChain(p);
  const mainline = buildTechRouteMainline(p);
  const panoramaQA = buildPanoramaQA(p);
  const mainlineQA = buildTechRouteMainline(p).map((n) => ({ node: n.node, qa: n.questions.map((q, i) => ({ q, a: n.answers[i] ?? "" })) }));
  const director = buildDirectorReport(p);
  const directorQA = buildDirectorQA(p);
  const fact = buildFactSheet(p);
  const killer = buildKillerFeature(p);
  const ts = TIME_STATUS_META[timeStatusOf(p)].label;
  const L: string[] = [];

  L.push(`# 【Master Prompt】AI 产品深度逆向工程 × 技术实现路线 × 商业价值分析`);
  L.push(`> 目标项目：${p.name}（${p.fullName}）· 由 AI OSS Intel 生成 · 可直接粘贴到 Codex / Claude Code / Cursor`);
  L.push(``, roleBlock(), ``);
  L.push(`## TARGET PROJECT`);
  fact.forEach((x) => L.push(`- ${x.k}：${x.v}`));
  L.push(`- 2026 状态：${ts}`);
  L.push(`- 一句话：${p.tagline}`);
  L.push(``, evidenceBlock(), ``);
  L.push(`## 分析框架（必须全部输出）`);
  L.push(``);
  L.push(`### 1. 完整链路（14 环节）`);
  L.push(`用户问题 → 需求 → 产品方案 → 功能 → UX → Workflow → AI能力 → 数据流 → 技术架构 → 源码模块 → 部署 → 商业模式 → 增长 → 可复制性`);
  L.push(`（本平台已生成如下内容，请复核并深化，不要照抄：）`);
  chain.forEach((c) => L.push(`${c.stage}. ${c.label}：${c.content}`));
  L.push(``);
  L.push(`### 2. 技术路线主线（${mainline.length} 节点）`);
  L.push(mainline.map((n) => n.node).join(" → "));
  L.push(`每个节点请回答：它是什么？为什么存在？在本产品中如何实现？`);
  L.push(``);
  L.push(`### 3. PROJECT REVERSE ENGINEERING REPORT（40 节）`);
  L.push(`01 项目概览 · 02 产品定位 · 03 用户 · 04 场景 · 05 Problem · 06 Pain Point · 07 JTBD · 08 Requirement · 09 Product Strategy · 10 Feature Map · 11 User Journey · 12 Core Workflow · 13 AI Architecture · 14 Agent Architecture · 15 RAG · 16 MCP · 17 Memory · 18 Data Flow · 19 System Architecture · 20 Source Code Architecture · 21 Feature → Code Mapping · 22 Technical Stack · 23 Technical Decisions · 24 Implementation Roadmap · 25 MVP Roadmap · 26 Technical Challenges · 27 Product Challenges · 28 Business Model · 29 Monetization · 30 Growth · 31 Competition · 32 Moat · 33 Industry Applications · 34 Product 2.0 · 35 Product Cloning Plan · 36 AI PM Learning · 37 Career Value · 38 Self-Media Value · 39 Portfolio Value · 40 Final Evaluation`);
  L.push(`（本平台已生成 40 节，请复核并深化：${r.sourceArchitecture.tree.slice(0, 4).join(" / ")}；机会分 ${s.opportunity}、技术 ${s.technical}、商业 ${s.commercial}）`);
  L.push(``);
  L.push(`### 4. 三件套`);
  L.push(`- 分析：40 节报告 + 产品全景图 + 事实表 + KILLER FEATURE + BEFORE/AFTER + AI VALUE MAP + 难点 + PRODUCT 2.0 + 抄作业`);
  L.push(`- 产品框图：功能实现路径框图（User Input → Frontend → API → Backend → AI → Tool → Data → Output → Feedback）`);
  L.push(`- 产品总监视角：Executive Review（10 问）+ Verdict（Strong Buy/Invest/Watch/Pivot/Do Not Invest）+ 13 维评分 + 总监级结论 + 30/60/90 计划 + Zero→One + 保留 3 功能 + AI 10× + Product 2.0 + 面试案例`);
  L.push(`（本平台已生成：Verdict=${director.verdict}（Score ${director.overall}/100）· 押注 ${director.conclusions.bet}；请复核并深化理由）`);
  L.push(``);
  L.push(`### 5. 产品全景图 · 自问自答（Q→A）`);
  L.push(`产品全景图：${r.sourceArchitecture.tree.slice(0, 3).join(" / ")}；每节点必须回答「产品自问」并给出答案：`);
  panoramaQA.slice(0, 8).forEach((it) => it.qa.forEach((x) => L.push(`- [${it.node}] Q：${x.q} → A：${x.a}`)));
  L.push(`（其余节点请按同样方式自问自答）`);
  L.push(``);
  L.push(`## 总监级输出要求`);
  L.push(`1. Executive Review 10 问 + Verdict 并说明理由`);
  L.push(`2. AI PRODUCT DIRECTOR SCORE（Market Opportunity / User Value / Product Design / AI Innovation / Technical Architecture / UX / Business Model / Growth / Moat / Open Source Value / Scalability / AI PM Learning / Career Value）+ OVERALL`);
  L.push(`3. 总监级结论：Why It Wins / Why It Fails / Real Moat / 我会投什么 / 我会砍什么 / 下一步做什么 / Would I Bet On It（YES/NO/WATCH/PIVOT）`);
  L.push(`4. 30/60/90 接管计划 / Zero→One / 保留 3 功能 / AI 10× 未来产品 / Product 2.0 / AI PM 面试案例`);
  L.push(``);
  L.push(`## 最终输出`);
  L.push(`PROJECT REVERSE ENGINEERING REPORT + 产品全景图 + 三件套 + 自问自答 + 完整报告 Markdown（含完整链路与技术路线主线）。`);
  L.push(``);
  L.push(`## 平台已生成的地面真值（供你核对/深化，不要照抄）`);
  L.push(`- 总监 Verdict：${director.verdict} — ${director.verdictWhy}`);
  L.push(`- 总监结论：${director.conclusions.whyWins} ${director.conclusions.realMoat} ${director.conclusions.buildNext}`);
  L.push(`- KILLER FEATURE：${killer.feature}`);
  L.push(`- 核心指标参考：${s.aiScore}/${s.opportunity}/${s.technical}/${s.commercial}/${s.sideHustle}/${s.skill}/${s.resume}/${s.content}/${s.health}`);
  L.push(``, standardBlock(), ``);
  L.push(`---`);
  L.push(`*本 Prompt 由 AI OSS Intel 生成 · ${p.fullName} · ${new Date().toISOString().slice(0, 10)}*`);
  return L.join("\n");
}

export function buildSourceProjectPrompt(repo: LiveRepo, intel: SourceIntel): string {
  const L: string[] = [];
  L.push(`# 【Master Prompt】AI 产品深度逆向工程 —— ${repo.name}（源码驱动）`);
  L.push(`> ${repo.fullName} · 由 AI OSS Intel 生成 · 可直接粘贴到 Codex / Claude Code / Cursor`);
  L.push(``, roleBlock(), ``);
  L.push(`## TARGET PROJECT（GitHub 实时）`);
  L.push(`- 仓库：${repo.fullName}`);
  L.push(`- 一句话（README）：${intel.tagline}`);
  L.push(`- 描述：${repo.description ?? "—"}`);
  L.push(`- Stars/Forks：${formatStars(repo.stars)} / ${formatStars(repo.forks)} · 语言：${repo.language ?? "—"} · License：${repo.license ?? "—"}`);
  L.push(`- 发布时间：${repo.createdAt} · 更新时间：${repo.updatedAt}`);
  L.push(`- 已抓取源码：${intel.treeSource === "tree" ? "目录树 ✓ + README + 依赖" : "README/依赖"}`);
  L.push(`- 检出 AI 组件：${intel.aiComponents.join(" / ") || "未检出（[HYPOTHESIS]）"}`);
  L.push(`- 技术栈：${intel.techStack.join(" / ") || "待确认"}`);
  L.push(``, evidenceBlock(), ``);
  L.push(`## 分析框架（必须全部输出）`);
  L.push(`### 1. 完整链路（14 环节）`);
  buildSourcePanoramaQA(repo, intel).slice(0, 6).forEach((it) => it.qa.forEach((x) => L.push(`- [${it.node}] Q：${x.q} → A：${x.a}`)));
  L.push(`### 2. 技术路线主线`);
  L.push(buildSourceTechRouteMainline(repo, intel).map((n) => n.node).join(" → "));
  L.push(`### 3. PROJECT REVERSE ENGINEERING REPORT（40 节 · 源码驱动）`);
  buildSourceMasterReport(repo, intel).slice(0, 10).forEach((sec) => L.push(`${String(sec.n).padStart(2, "0")} ${sec.title}`));
  L.push(`（完整 40 节请全部生成）`);
  L.push(`### 4. 三件套 + 产品总监视角 + 自问自答`);
  L.push(`- 分析 / 产品框图（功能实现路径）/ 产品总监视角（Executive Review + Verdict + 13 维评分 + 结论）`);
  L.push(`- 产品全景图每节点自问自答（Q→A）`);
  L.push(``, standardBlock(), ``);
  L.push(`## 最终输出`);
  L.push(`PROJECT REVERSE ENGINEERING REPORT + 产品全景图 + 三件套 + 自问自答 + 完整报告 Markdown。`);
  L.push(`---`, `*本 Prompt 由 AI OSS Intel 生成（GitHub 实时源码抓取）· ${repo.fullName} · ${new Date().toISOString().slice(0, 10)}*`);
  return L.join("\n");
}
