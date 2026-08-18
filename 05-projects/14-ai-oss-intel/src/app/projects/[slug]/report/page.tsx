import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { projectBySlug } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import {
  buildMasterReport, buildFactSheet, buildKillerFeature, buildBeforeAfter, buildAiValueMap,
  buildFeatureDependency, buildTechChallenges, buildProductChallenges, buildProduct2,
  buildCloningPlan, buildThreeConclusions, buildPanorama, buildDirectorView,
  buildCompleteChain, buildTechRouteMainline,
} from "@/lib/master";
import { buildProjectReportMarkdown } from "@/lib/report";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { ReportActions } from "@/components/ReportActions";
import { InteractiveMap } from "@/components/InteractiveMap";
import type { Project } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function ProjectReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  const md = buildProjectReportMarkdown(p);
  const s = computeScores(p);
  const ts = TIME_STATUS_META[timeStatusOf(p)];
  const chain = buildCompleteChain(p);
  const mainline = buildTechRouteMainline(p);
  const three = buildThreeConclusions(p);
  const panorama = buildPanorama(p);
  const fact = buildFactSheet(p);
  const killer = buildKillerFeature(p);
  const ba = buildBeforeAfter(p);
  const aiMap = buildAiValueMap(p);
  const deps = buildFeatureDependency(p);
  const p2 = buildProduct2(p);
  const clone = buildCloningPlan(p);
  const dv = buildDirectorView(p);
  const report = buildMasterReport(p);

  return (
    <div className="max-w-[900px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href={`/projects/${p.slug}`} className="chip hover:!text-[#7dd3fc]"><ArrowLeft size={12} /> 返回项目页</Link>
        <div className="ml-auto"><ReportActions markdown={md} /></div>
      </div>

      {/* 报告头 */}
      <div className="panel p-6 print:bg-white print:text-black">
        <div className="chip chip-accent mb-3">AI PRODUCT REVERSE ENGINEERING REPORT</div>
        <h1 className="text-2xl font-extrabold text-white print:text-black">{p.name} · 深度逆向工程报告</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1.5">{p.fullName} · {p.license} · ⭐{formatStars(p.stars)} · 🕐 发布于 {p.createdAt} · <span style={{ color: ts.color }}>{ts.label}</span></p>
        <p className="text-[14px] text-[#cfe0ff] mt-2">💡 {p.tagline}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {[["AI Project", s.aiScore], ["Opportunity", s.opportunity], ["Technical", s.technical], ["Commercial", s.commercial]].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
              <div className="text-[10px] text-[#5b6885] uppercase">{k}</div>
              <div className="text-xl font-extrabold num text-[#7dd3fc]">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 完整链路 */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">🔗 完整链路 · 用户问题 → 可复制性</h2>
        <div className="space-y-1">
          {chain.map((st) => (
            <div key={st.key} className="flex items-start gap-2">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2f6bff] to-[#7c5cff] flex items-center justify-center text-[11px] font-bold num text-white">{st.stage}</span>
                {st.stage < chain.length && <span className="w-px flex-1 min-h-[14px] bg-[#2c4370]" />}
              </div>
              <div className="flex-1 rounded-lg bg-[#0c1322] border border-[#16213a] p-3 mb-1">
                <div className="text-[11px] font-bold text-[#7dd3fc]">{st.label}</div>
                <div className="text-[12.5px] text-[#aab6cd] leading-relaxed mt-0.5">{st.content}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 技术路线主线 */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">🗺️ 技术路线主线（点击节点查看详细分析）</h2>
        <InteractiveMap nodes={mainline} />
      </section>

      {/* 三结论 + 全景图 */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">📌 三结论 · 🖼️ 产品全景图</h2>
        <div className="grid gap-2 md:grid-cols-3 mb-4">
          {[["WHY IT WORKS", three.why, "#34d399"], ["HOW IT WORKS", three.how, "#7dd3fc"], ["WHERE IT GOES", three.where, "#fbbf24"]].map(([k, v, c]) => (
            <div key={k as string} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[11px] font-bold mb-1" style={{ color: c as string }}>{k}</div>
              <div className="text-[12px] text-[#aab6cd] leading-relaxed">{v}</div>
            </div>
          ))}
        </div>
        <InteractiveMap title="产品全景图（点击节点查看详细分析）" nodes={panorama} />
      </section>

      {/* Fact + Killer + Before/After + AI Map */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">📋 事实层 / 🎯 杀手级功能 / 🔀 Before-After / 🤖 AI 价值</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-[12px] font-bold text-[#34d399] mb-2">PROJECT FACT SHEET</div>
            <div className="space-y-1">
              {fact.map((x) => <div key={x.k} className="flex gap-2 text-[11.5px]"><span className="w-24 shrink-0 text-[#5b6885]">{x.k}</span><span className="text-[#cfe0ff] break-all">{x.v}</span></div>)}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[12px] font-bold text-[#fbbf24] mb-1">KILLER FEATURE：{killer.feature}</div>
              <div className="text-[11.5px] text-[#aab6cd]">{killer.why} 留存：{killer.retention} 壁垒：{killer.moat} 可复制性：{killer.copyable}</div>
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#60a5fa] mb-1">BEFORE VS AFTER</div>
              <div className="text-[11.5px] text-[#aab6cd] space-y-0.5">
                <div>Before：{ba.before}</div>
                <div>After：{ba.after}</div>
                <div>减少/自动化/增强/创造：{ba.reduce}；{ba.automate}；{ba.enhance}；{ba.create}</div>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#a78bfa] mb-1">AI VALUE MAP</div>
              <div className="text-[11.5px] text-[#aab6cd]">{aiMap.map((t) => `${t.tier}:${t.desc}`).join("；")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 依赖 + 难点 */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">🔗 功能依赖 / ⚙️ 难点地图</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            {deps.map((d) => <div key={d.path} className="text-[11.5px] text-[#aab6cd]"><b className="text-[#7dd3fc]">{d.path}：</b>{d.items.join(" → ")}</div>)}
          </div>
          <div className="text-[11.5px] text-[#aab6cd] space-y-0.5">
            <div><b className="text-[#f87171]">技术难点：</b>{buildTechChallenges(p).slice(0, 4).join("；")}</div>
            <div><b className="text-[#fbbf24]">产品难点：</b>{buildProductChallenges(p).slice(0, 4).join("；")}</div>
          </div>
        </div>
      </section>

      {/* Product 2.0 + Cloning */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">🚀 PRODUCT 2.0 / 📝 CLONING PLAN</h2>
        <div className="grid gap-3 md:grid-cols-2 text-[12px] text-[#aab6cd]">
          <div className="space-y-0.5">
            <div><b className="text-[#7dd3fc]">Product 2.0：</b>{p2.newProduct}</div>
            <div><b>机会：</b>{p2.opportunity}</div>
            <div><b>新 UX：</b>{p2.newUx} · <b>新 AI：</b>{p2.newAi}</div>
            <div><b>新商业：</b>{p2.newBusiness}</div>
          </div>
          <div className="space-y-0.5">
            <div><b className="text-[#34d399]">抄作业：</b>MVP={clone.mvp}</div>
            <div>架构={clone.coreArchitecture} · AI={clone.aiStack}</div>
            <div>团队={clone.team} · 周期={clone.timeline} · 成本={clone.cost}</div>
            <div>风险={clone.risk}</div>
          </div>
        </div>
      </section>

      {/* 40 节报告 */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">📄 PROJECT REVERSE ENGINEERING REPORT（40 节）</h2>
        <div className="space-y-3">
          {report.map((sec) => (
            <div key={sec.n} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[12px] font-bold text-[#7dd3fc]">{String(sec.n).padStart(2, "0")} · {sec.title}</div>
              <div className="text-[12.5px] text-[#aab6cd] leading-relaxed mt-1">{sec.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 产品总监视角 */}
      <section className="panel p-6">
        <h2 className="text-[16px] font-bold text-white mb-4">👔 产品总监视角</h2>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
            <div className="text-[12px] font-bold text-[#a78bfa] mb-1">边界考虑</div>
            <div className="text-[12px] text-[#aab6cd]">✅ {dv.boundary.inScope.join("；")} ⛔ {dv.boundary.outScope.join("；")} ⚠️ {dv.boundary.constraints.join("；")}</div>
            <div className="text-[12px] text-[#cfe0ff] mt-1">边界结论：{dv.boundary.verdict}</div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
            <div className="text-[12px] font-bold text-[#f87171] mb-1">痛点分析</div>
            <div className="text-[12px] text-[#aab6cd]">{dv.pain.deep} {dv.pain.journeyFriction} {dv.pain.unmet}</div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {dv.cases.map((c) => (
              <div key={c.name} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
                <div className="text-[11.5px] font-bold text-[#34d399]">{c.name}</div>
                <div className="text-[11px] text-[#aab6cd] mt-0.5">用户：{c.user} · 场景：{c.scenario}</div>
                <div className="text-[11px] text-[#8b98b3]">之前：{c.before}；之后：{c.after}；预期：{c.outcome}；指标：{c.metric}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="text-center text-[11px] text-[#4d5a75] pb-4">AI OSS Intel · {p.fullName} · {new Date().toISOString().slice(0, 10)}</div>
    </div>
  );
}
