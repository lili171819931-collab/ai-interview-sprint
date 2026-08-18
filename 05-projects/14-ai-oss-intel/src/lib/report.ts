/**
 * Full-project report generators — assemble the complete reverse-engineering
 * report (完整链路 + 技术路线主线 + 三结论 + 产品全景图 + 事实表 + 40 节报告
 * + 产品总监视角) into a single Markdown document for every project.
 */
import { computeScores, formatPct, formatSigned, formatStars } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import {
  buildMasterReport, buildFactSheet, buildKillerFeature, buildBeforeAfter, buildAiValueMap,
  buildFeatureDependency, buildTechChallenges, buildProductChallenges, buildProduct2,
  buildCloningPlan, buildThreeConclusions, buildPanorama, buildDirectorView,
  buildCompleteChain, buildTechRouteMainline,
} from "@/lib/master";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import type { Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";
import { buildSourceMasterReport, buildSourcePanorama, buildSourceDirectorView, buildSourceCompleteChain, buildSourceFactSheet, buildSourcePanoramaQA } from "@/lib/sourceMaster";
import { buildDirectorReport, buildSourceDirectorReport, buildDirectorQA } from "@/lib/director";
import { buildPanoramaQA, buildMainlineQA } from "@/lib/master";

export function buildProjectReportMarkdown(p: Project): string {
  const s = computeScores(p);
  const r = buildReverseEngineering(p);
  const chain = buildCompleteChain(p);
  const mainline = buildTechRouteMainline(p);
  const report = buildMasterReport(p);
  const fact = buildFactSheet(p);
  const three = buildThreeConclusions(p);
  const panorama = buildPanorama(p);
  const killer = buildKillerFeature(p);
  const ba = buildBeforeAfter(p);
  const aiMap = buildAiValueMap(p);
  const deps = buildFeatureDependency(p);
  const dv = buildDirectorView(p);
  const ts = TIME_STATUS_META[timeStatusOf(p)].label;

  const L: string[] = [];
  L.push(`# ${p.name} · AI 产品深度逆向工程报告`);
  L.push(`> ${p.tagline}\n`);
  L.push(`**仓库** ${p.fullName} · **License** ${p.license ?? "—"} · **⭐ ${formatStars(p.stars)}** · **发布时间** ${p.createdAt} · **2026 状态** ${ts}\n`);
  L.push(`## 🔗 完整链路`);
  chain.forEach((c) => L.push(`${c.stage}. **${c.label}**：${c.content}`));
  L.push(`\n## 🗺️ 技术路线主线`);
  L.push(mainline.map((n) => n.node).join(" → "));
  L.push(`\n## 📌 三结论`);
  L.push(`- **WHY IT WORKS**：${three.why}`);
  L.push(`- **HOW IT WORKS**：${three.how}`);
  L.push(`- **WHERE IT GOES**：${three.where}`);
  L.push(`\n## 🖼️ 产品全景图`);
  L.push(panorama.map((n) => n.node).join(" → "));
  L.push(`\n## 📋 PROJECT FACT SHEET`);
  fact.forEach((x) => L.push(`- ${x.k}：${x.v}`));
  L.push(`\n## 🎯 KILLER FEATURE`);
  L.push(`**${killer.feature}** — ${killer.why}`);
  L.push(`- 留存：${killer.retention}`);
  L.push(`- 壁垒：${killer.moat}`);
  L.push(`- 商业化：${killer.commercial}`);
  L.push(`- 可复制性：${killer.copyable}`);
  L.push(`\n## 🔀 BEFORE VS AFTER`);
  L.push(`- **Before**：${ba.before}`);
  L.push(`- **After**：${ba.after}`);
  L.push(`- 减少：${ba.reduce}`);
  L.push(`- 自动化：${ba.automate}`);
  L.push(`- 增强：${ba.enhance}`);
  L.push(`- 创造：${ba.create}`);
  L.push(`\n## 🤖 AI VALUE MAP`);
  aiMap.forEach((t) => L.push(`- **${t.tier}**：${t.desc}`));
  L.push(`\n## 🔗 FEATURE DEPENDENCY GRAPH`);
  deps.forEach((d) => L.push(`- **${d.path}**：${d.items.join(" → ")}`));
  L.push(`\n## ⚙️ 技术难点`);
  buildTechChallenges(p).forEach((c) => L.push(`- ${c}`));
  L.push(`\n## 🧩 产品难点`);
  buildProductChallenges(p).forEach((c) => L.push(`- ${c}`));
  const p2 = buildProduct2(p);
  L.push(`\n## 🚀 PRODUCT 2.0`);
  L.push(`- Current：${p2.current}`);
  L.push(`- Problems：${p2.problems.join("；")}`);
  L.push(`- Opportunity：${p2.opportunity}`);
  L.push(`- New Product：${p2.newProduct}`);
  L.push(`- New UX：${p2.newUx}`);
  L.push(`- New AI：${p2.newAi}`);
  L.push(`- New Business：${p2.newBusiness}`);
  const clone = buildCloningPlan(p);
  L.push(`\n## 📝 PRODUCT CLONING PLAN`);
  L.push(`- MVP：${clone.mvp}`);
  L.push(`- 核心架构：${clone.coreArchitecture}`);
  L.push(`- AI 栈：${clone.aiStack}`);
  L.push(`- 数据：${clone.data}`);
  L.push(`- Workflow：${clone.workflow}`);
  L.push(`- 团队：${clone.team}`);
  L.push(`- 周期：${clone.timeline}`);
  L.push(`- 成本：${clone.cost}`);
  L.push(`- 风险：${clone.risk}`);
  L.push(`\n## 📄 PROJECT REVERSE ENGINEERING REPORT（40 节）`);
  report.forEach((sec) => L.push(`\n### ${String(sec.n).padStart(2, "0")} ${sec.title}\n${sec.body}`));
  L.push(`\n## 👔 产品总监视角`);
  L.push(`### 边界考虑`);
  L.push(`- ✅ 范围内：${dv.boundary.inScope.join("；")}`);
  L.push(`- ⛔ 范围外：${dv.boundary.outScope.join("；")}`);
  L.push(`- ⚠️ 约束：${dv.boundary.constraints.join("；")}`);
  L.push(`- 边界结论：${dv.boundary.verdict}`);
  L.push(`\n### 痛点分析`);
  L.push(`- 深层痛点：${dv.pain.deep}`);
  L.push(`- 路径摩擦：${dv.pain.journeyFriction}`);
  L.push(`- 未被满足：${dv.pain.unmet}`);
  L.push(`\n### 真实案例预测`);
  dv.cases.forEach((c) => L.push(`- **${c.name}**：用户=${c.user}；场景=${c.scenario}；之前=${c.before}；之后=${c.after}；预期=${c.outcome}；指标=${c.metric}`));
  const dr = buildDirectorReport(p);
  L.push(`\n## 👔 AI 产品总监视角（HEAD OF AI PRODUCT）`);
  L.push(`### Executive Review + Verdict：**${dr.verdict}**`);
  dr.execReview.forEach((x) => L.push(`- ${x.q}：${x.a}`));
  L.push(`\n### 总监级结论`);
  L.push(`- Why It Wins：${dr.conclusions.whyWins}`);
  L.push(`- Why It Fails：${dr.conclusions.whyFails}`);
  L.push(`- Real Moat：${dr.conclusions.realMoat}`);
  L.push(`- 我会投：${dr.conclusions.invest}`);
  L.push(`- 我会砍：${dr.conclusions.kill}`);
  L.push(`- 下一步：${dr.conclusions.buildNext}`);
  L.push(`- Would I Bet On It：${dr.conclusions.bet} — ${dr.conclusions.betWhy}`);
  L.push(`\n### AI PRODUCT DIRECTOR SCORE：${dr.overall}/100`);
  dr.scores.forEach((x) => L.push(`- ${x.label}：${x.value}`));
  L.push(`\n### 市场 / 用户 / 飞轮 / 路线图`);
  L.push(`- TAM/SAM/SOM：${dr.market.tam}；${dr.market.sam}；${dr.market.som}`);
  L.push(`- Why Now：${dr.market.whyNow}`);
  L.push(`- 用户：${dr.segments.map((x) => `${x.name}(${x.who})`).join("；")}`);
  L.push(`- 飞轮：${dr.flywheel.cycle.join(" → ")}；${dr.flywheel.judge}`);
  L.push(`- 路线图 Now/Next/Later：${dr.roadmap.now.join("·")} → ${dr.roadmap.next.join("·")} → ${dr.roadmap.later.join("·")}；不做：${dr.roadmap.dont.join("·")}`);
  L.push(`- 30/60/90：${dr.plan90.d30.join("·")} / ${dr.plan90.d60.join("·")} / ${dr.plan90.d90.join("·")}`);
  L.push(`- Zero→One：${dr.zeroOne.join(" → ")}；保留 3 功能：${dr.threeFeatures.keep.join("·")}`);
  L.push(`- AI 10×：${dr.ai10x}`);
  L.push(`\n## 💬 产品全景图 · 自问自答`);
  buildPanoramaQA(p).forEach((it) => {
    L.push(`\n### ${it.node}`);
    it.qa.forEach((x) => L.push(`- **Q：${x.q}**\n  A：${x.a}`));
  });
  L.push(`\n## 🗺️ 技术路线主线 · 自问自答`);
  buildMainlineQA(p).forEach((it) => {
    L.push(`\n### ${it.node}`);
    it.qa.forEach((x) => L.push(`- **Q：${x.q}**\n  A：${x.a}`));
  });
  L.push(`\n## 👔 产品总监全景图 · 自问自答`);
  buildDirectorQA(p).forEach((it) => {
    L.push(`\n### ${it.node}`);
    it.qa.forEach((x) => L.push(`- **Q：${x.q}**\n  A：${x.a}`));
  });
  L.push(`\n---\n*由 AI OSS Intel 自动生成 · ${p.fullName} · ${new Date().toISOString().slice(0, 10)}*`);
  return L.join("\n");
}

export function buildSourceReportMarkdown(repo: LiveRepo, intel: SourceIntel): string {
  const chain = buildSourceCompleteChain(repo, intel);
  const report = buildSourceMasterReport(repo, intel);
  const panorama = buildSourcePanorama(repo, intel);
  const fact = buildSourceFactSheet(repo, intel);
  const dv = buildSourceDirectorView(repo, intel);

  const L: string[] = [];
  L.push(`# ${repo.name} · AI 产品深度逆向工程报告（源码驱动）`);
  L.push(`> ${intel.tagline}\n`);
  L.push(`**仓库** ${repo.fullName} · **License** ${repo.license ?? "—"} · **⭐ ${formatStars(repo.stars)}** · **发布时间** ${repo.createdAt}\n`);
  L.push(`## 🔗 完整链路`);
  chain.forEach((c) => L.push(`${c.stage}. **${c.label}**：${c.content}`));
  L.push(`\n## 🖼️ 产品全景图（源码驱动）`);
  L.push(panorama.map((n) => n.node).join(" → "));
  L.push(`\n## 📋 PROJECT FACT SHEET（源码实抓）`);
  fact.forEach((x) => L.push(`- ${x.k}：${x.v}`));
  L.push(`\n## 📄 PROJECT REVERSE ENGINEERING REPORT（40 节 · 源码驱动）`);
  report.forEach((sec) => L.push(`\n### ${String(sec.n).padStart(2, "0")} ${sec.title}\n${sec.body}`));
  L.push(`\n## 👔 产品总监视角`);
  L.push(`- 边界：${dv.boundary.verdict}`);
  L.push(`- 痛点：${dv.pain.deep}`);
  L.push(`- 案例：${dv.cases.map((c) => `${c.name}(${c.scenario})`).join("；")}`);
  const dr = buildSourceDirectorReport(repo, intel);
  L.push(`\n## 👔 AI 产品总监视角（源码驱动）`);
  L.push(`### Verdict：**${dr.verdict}** — ${dr.verdictWhy}`);
  dr.execReview.slice(0, 6).forEach((x) => L.push(`- ${x.q}：${x.a}`));
  L.push(`- Would I Bet On It：${dr.conclusions.bet} — ${dr.conclusions.betWhy}`);
  L.push(`### AI PRODUCT DIRECTOR SCORE：${dr.overall}/100`);
  dr.scores.forEach((x) => L.push(`- ${x.label}：${x.value}`));
  L.push(`\n## 💬 产品全景图 · 自问自答（源码驱动）`);
  buildSourcePanoramaQA(repo, intel).forEach((it) => {
    L.push(`\n### ${it.node}`);
    it.qa.forEach((x) => L.push(`- **Q：${x.q}**\n  A：${x.a}`));
  });
  L.push(`\n---\n*由 AI OSS Intel 自动生成（GitHub 实时源码抓取）· ${repo.fullName} · ${new Date().toISOString().slice(0, 10)}*`);
  return L.join("\n");
}
