import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Star, GitFork, Users, CircleDot, Calendar, Scale, Radar, BrainCircuit, Layers, Boxes, Rocket, BarChart3, Target, Briefcase, Puzzle, FileText, Megaphone, HeartPulse, GitBranch, Lightbulb, CheckCircle2 } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { PROJECTS } from "@/data/projects";
import { projectBySlug as getProject, relatedProjects, projectScores } from "@/lib/store";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { generateReport } from "@/lib/reports";
import { CategoryChips, ScoreBar, ScorePills, Sparkline, Stars } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { SaveButtonBig } from "@/components/ClientBits";
import { LearningMode } from "@/components/learn/LearningMode";
import { ContentMode } from "@/components/learn/ContentMode";
import { PortfolioMode } from "@/components/learn/PortfolioMode";
import {
  buildProductDna, buildFiveLayers, buildPmVsUser, buildOpinionFrame,
  buildPmDeepAnalysis, buildWhyAi, buildAiNativeTest, buildBuildPlan,
} from "@/lib/learning";
import { buildMasterReport } from "@/lib/master";
import { FeaturePathDiagram, DirectorView } from "@/components/analysis/AnalysisView";
import { scenariosOf, timeStatusOf, TIME_STATUS_META, secondaryScenariosOf } from "@/lib/scenarios";
import { ReverseSection } from "@/components/ReverseSection";
import { buildReverseEngineering } from "@/lib/reverse";
import type { Project } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getProjectIds();
}

function getProjectIds() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "pm-learning", label: "AI PM 学习", icon: GraduationCap },
  { id: "deconstruct", label: "产品拆解", icon: Layers },
  { id: "content", label: "自媒体", icon: Megaphone },
  { id: "portfolio", label: "求职 Portfolio", icon: Briefcase },
  { id: "build", label: "如何搭建", icon: Hammer },
  { id: "reverse", label: "逆向工程", icon: Microscope },
  { id: "growth", label: "Growth", icon: TrendingUpIcon },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "ai-report", label: "AI Report", icon: BrainCircuit },
];

import { TrendingUp as TrendingUpIcon, GraduationCap, GitCommitHorizontal, Hammer, Microscope, UserRoundCheck } from "lucide-react";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const s = computeScores(project);
  const report = generateReport(project);
  const masterReport = buildMasterReport(project);
  const related = relatedProjects(project, 4);
  const r7 = growthRate(project, 7);
  const r30 = growthRate(project, 30);
  const r90 = growthRate(project, 90);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="panel p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
              {(() => {
                const ts = timeStatusOf(project);
                const meta = TIME_STATUS_META[ts];
                return <span className="chip" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "14" }}>{meta.label}</span>;
              })()}
              <span className="chip">{project.language}</span>
              <span className="chip">{project.license}</span>
              <span className="chip">{project.categories.map((c) => categoryOf(c).emoji).join(" ")} {project.categories.map(categoryOf).map((c) => c.name).join(" · ")}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {scenariosOf(project).map((sc) => (
                <span key={sc.id} className="chip chip-accent">{sc.emoji} {sc.group} · {sc.name}</span>
              ))}
              {secondaryScenariosOf(project).map((sc) => (
                <span key={sc.code} className="chip">{sc.code} · {sc.name}</span>
              ))}
            </div>
            <p className="mt-2 text-[14.5px] text-[#cfe0ff]">{project.tagline}</p>
            <p className="mt-1.5 text-[13px] text-[#8b98b3] max-w-3xl leading-relaxed">{project.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[#8b98b3] num">
              <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-300" /> {formatStars(project.stars)} Stars</span>
              <span className="flex items-center gap-1.5"><GitFork size={14} /> {formatStars(project.forks)} Forks</span>
              <span className="flex items-center gap-1.5"><Users size={14} /> {project.contributors.toLocaleString()} Contributors</span>
              <span className="flex items-center gap-1.5"><CircleDot size={14} /> {project.openIssues.toLocaleString()} Issues</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {project.createdAt}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] num">
              <span className="text-emerald-300">↗ 7D {formatSigned(project.growth7d)} ({formatPct(r7)})</span>
              <span className="text-emerald-300">↗ 30D {formatSigned(project.growth30d)} ({formatPct(r30)})</span>
              <span className="text-emerald-300/80">↗ 90D {formatSigned(project.growth90d)} ({formatPct(r90)})</span>
            </div>
          </div>
          <div className="shrink-0 grid grid-cols-2 gap-2.5 w-full md:w-[260px]">
            <ScoreCell label="Opportunity" value={s.opportunity} color="#7dd3fc" />
            <ScoreCell label="Commercial" value={s.commercial} color="#a78bfa" />
            <ScoreCell label="Technical" value={s.technical} color="#34d399" />
            <ScoreCell label="AI Project" value={s.aiScore} color="#fbbf24" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a href={`https://github.com/${project.fullName}`} target="_blank" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] font-semibold text-white hover:bg-[#1f3158]">
            <GithubIcon size={14} /> GitHub
          </a>
          {project.homepage && (
            <a href={project.homepage} target="_blank" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd] hover:text-white">
              <Globe size={14} /> Homepage
            </a>
          )}
          <Link href={`/compare?a=${project.slug}`} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd] hover:text-white">
            <Scale size={14} /> Compare
          </Link>
          <SaveButtonBig slug={project.slug} />
        </div>
      </section>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_290px] xl:gap-6">
      <div className="min-w-0 space-y-6">
      {/* Mode switcher */}
      <div className="panel px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[11.5px] text-[#5b6885]">模式：</span>
        {[
          { href: "#overview", label: "普通浏览模式" },
          { href: "#pm-learning", label: "🎓 AI PM 学习模式" },
          { href: "#deconstruct", label: "🧩 产品拆解模式" },
          { href: "#content", label: "📱 自媒体模式" },
          { href: "#portfolio", label: "💼 求职 Portfolio 模式" },
          { href: "#build", label: "🏗️ 如何搭建" },
          { href: "#reverse", label: "🔬 逆向工程" },
        ].map((m) => (
          <a key={m.href} href={m.href} className="chip hover:!text-[#7dd3fc] hover:!border-[#2c4370]">{m.label}</a>
        ))}
      </div>

      {/* Sticky sub-nav */}
      <nav className="sticky top-16 z-20 -mx-1 px-1 py-2 flex gap-1.5 overflow-x-auto bg-[#060a13]/85 backdrop-blur">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="chip hover:!text-white hover:!border-[#2c4370]">
            <t.icon size={12} /> {t.label}
          </a>
        ))}
      </nav>

      {/* Overview */}
      <Section id="overview" title="Overview · 项目概览" icon={BarChart3}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 panel p-5">
            <div className="text-[13px] font-semibold text-white mb-3">Star Growth · 近 90 天</div>
            <Sparkline points={project.growthHistory} width={640} height={120} stroke="#4f8cff" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <MetricBox label="7D" value={`${formatSigned(project.growth7d)}`} sub={formatPct(r7)} />
              <MetricBox label="30D" value={`${formatSigned(project.growth30d)}`} sub={formatPct(r30)} />
              <MetricBox label="90D" value={`${formatSigned(project.growth90d)}`} sub={formatPct(r90)} />
            </div>
          </div>
          <div className="panel p-5 space-y-3">
            <div className="text-[13px] font-semibold text-white mb-2">AI Project Score · {s.aiScore}/100</div>
            <ScoreBar label="GitHub Popularity" value={Math.round((Math.log10(project.stars + 1) / 5.3) * 100)} />
            <ScoreBar label="Growth" value={s.growth} color="#34d399" />
            <ScoreBar label="Technical Innovation" value={s.technical} color="#a78bfa" />
            <ScoreBar label="Product Value" value={s.product} color="#60a5fa" />
            <ScoreBar label="User Demand" value={Math.round(project.profile.userDemand * 10)} color="#fb923c" />
            <ScoreBar label="Commercial Potential" value={s.commercial} color="#f87171" />
            <ScoreBar label="Ecosystem" value={Math.round(project.profile.ecosystem * 10)} color="#2dd4bf" />
            <ScoreBar label="Personal Dev Value" value={Math.round(project.profile.personalDevValue * 10)} color="#fbbf24" />
          </div>
        </div>
        <div className="panel p-5 mt-4">
          <div className="text-[13px] font-semibold text-white mb-3">专项评分 · Specialized Scores</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniScore label="Side Hustle" value={s.sideHustle} icon={Briefcase} color="#fb923c" />
            <MiniScore label="Skill" value={s.skill} icon={Puzzle} color="#c084fc" />
            <MiniScore label="Resume" value={s.resume} icon={FileText} color="#60a5fa" />
            <MiniScore label="Content" value={s.content} icon={Megaphone} color="#f472b6" />
            <MiniScore label="Startup" value={s.startup} icon={Rocket} color="#2dd4bf" />
          </div>
        </div>
      </Section>

      {/* Architecture */}
      <Section id="architecture" title="Architecture · 架构拆解" icon={Layers}>
        <div className="panel p-5 text-[13.5px] text-[#aab6cd] leading-relaxed space-y-2">
          <p>{report.sections[7].body}</p>
          <p>{report.sections[1].body}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
              <div className="text-[12px] font-semibold text-[#7dd3fc] mb-2">项目 DNA</div>
              <div className="space-y-1.5">
                {report.dna.map((d) => (
                  <div key={d.label} className="flex justify-between text-[12px]"><span className="text-[#5b6885]">{d.label}</span><span className="text-[#cfe0ff] text-right max-w-[60%]">{d.value}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
              <div className="text-[12px] font-semibold text-[#34d399] mb-2">Open Source Health · {s.health}/100</div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-[#5b6885]">贡献者</span><span className="num">{project.contributors.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#5b6885]">Releases</span><span className="num">{project.releases}</span></div>
                <div className="flex justify-between"><span className="text-[#5b6885]">Open Issues</span><span className="num">{project.openIssues.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#5b6885]">最近更新</span><span>{project.updatedAt}</span></div>
                <div className="flex justify-between"><span className="text-[#5b6885]">生命周期</span><span>{stageText(project)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section id="features" title="Features · 功能拆解" icon={Boxes}>
        <div className="panel p-5 text-[13.5px] text-[#aab6cd] leading-relaxed space-y-3">
          <p><b className="text-white">核心功能：</b>{report.sections[8].body.split("核心功能：")[1]?.split("辅助功能")[0]}</p>
          <p><b className="text-white">辅助功能：</b>{report.sections[8].body.split("辅助功能：")[1]}</p>
          <p><b className="text-white">技术逻辑：</b>{report.sections[6].body}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.topics.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        </div>
      </Section>

      {/* Product */}
      <Section id="product" title="Product · 产品拆解" icon={Rocket}>
        <div className="grid gap-4 md:grid-cols-2">
          {[report.sections[2], report.sections[3], report.sections[4], report.sections[5], report.sections[9]].map((sec) => (
            <div key={sec.title} className="panel p-5">
              <div className="text-[12.5px] font-semibold text-[#7dd3fc] mb-1.5">{sec.title}</div>
              <p className="text-[13px] text-[#aab6cd] leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Business */}
      <Section id="business" title="Business · 商业分析" icon={Target}>
        <div className="grid gap-4 md:grid-cols-2">
          {[report.sections[10], report.sections[11], report.sections[12], report.sections[13], report.sections[14], report.sections[15]].map((sec) => (
            <div key={sec.title} className="panel p-5">
              <div className="text-[12.5px] font-semibold text-[#a78bfa] mb-1.5">{sec.title}</div>
              <p className="text-[13px] text-[#aab6cd] leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>
        <div className="panel p-5 mt-4">
          <div className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2"><GitBranch size={14} /> Copy Path · 复制路径</div>
          <div className="space-y-2.5">
            {report.copyPath.map((c, i) => (
              <div key={c.step} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-[11px] font-bold text-[#7dd3fc] num shrink-0">{i + 1}</div>
                <div><div className="text-[13px] font-semibold text-white">{c.step}</div><div className="text-[12.5px] text-[#8b98b3]">{c.detail}</div></div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Growth */}
      <Section id="growth" title="Growth · 增长分析" icon={TrendingUpIcon}>
        <div className="panel p-5">
          <div className="text-[13.5px] text-[#aab6cd] leading-relaxed">{report.sections[10].body}</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <MetricBox label="7 天" value={`${formatSigned(project.growth7d)}`} sub={formatPct(r7)} />
            <MetricBox label="30 天" value={`${formatSigned(project.growth30d)}`} sub={formatPct(r30)} />
            <MetricBox label="90 天" value={`${formatSigned(project.growth90d)}`} sub={formatPct(r90)} />
          </div>
          <div className="mt-4 text-[12px] text-[#5b6885]">星级展示：<Stars value={s.growth / 20} /> Growth Score {s.growth}/100</div>
        </div>
      </Section>

      {/* Opportunities */}
      <Section id="opportunities" title="Opportunities · 产品机会生成器" icon={Briefcase}>
        <div className="panel p-5">
          <div className="text-[13px] font-semibold text-white mb-1">What Can I Build From This?</div>
          <div className="text-[12px] text-[#5b6885] mb-4">基于「{project.name}」自动生成 5 个新产品方向</div>
          <div className="space-y-3">
            {report.opportunities.map((o, i) => (
              <div key={o.name} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-[11px] font-bold text-[#7dd3fc] num">0{i + 1}</span>
                  <span className="font-semibold text-[13.5px] text-white">{o.name}</span>
                  <span className="chip chip-accent ml-auto">潜力 {o.potential}/100</span>
                </div>
                <div className="mt-2 grid gap-x-4 gap-y-1.5 md:grid-cols-2 text-[12.5px]">
                  <Info k="目标用户" v={o.targetUsers} />
                  <Info k="痛点" v={o.painPoint} />
                  <Info k="核心功能" v={o.coreFeatures} />
                  <Info k="AI 能力" v={o.aiCapabilities} />
                  <Info k="MVP" v={o.mvp} />
                  <Info k="商业模式" v={o.businessModel} />
                  <Info k="竞争壁垒" v={o.moat} />
                  <Info k="开发" v={`${o.devDifficulty}难度 · ${o.devTime}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div className="panel p-5">
            <div className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2"><HeartPulse size={14} className="text-[#f87171]" /> One Person Startup · 一人创业分析</div>
            <div className="space-y-1.5 text-[12.5px]">
              <Info k="开发者要求" v={report.onePersonStartup.developerReq} />
              <Info k="AI 能力要求" v={report.onePersonStartup.aiReq} />
              <Info k="设计要求" v={report.onePersonStartup.designReq} />
              <Info k="运营要求" v={report.onePersonStartup.operationReq} />
              <Info k="MVP 周期" v={report.onePersonStartup.mvpTime} />
              <Info k="预估成本" v={report.onePersonStartup.cost} />
              <Info k="变现难度" v={report.onePersonStartup.monetization} />
            </div>
            <div className="mt-4 text-center">
              <div className="text-[11px] text-[#5b6885]">ONE PERSON STARTUP SCORE</div>
              <div className="text-4xl font-extrabold num glow-text">{report.onePersonStartup.score}<span className="text-lg text-[#5b6885]">/100</span></div>
            </div>
          </div>
          <div className="panel p-5">
            <div className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2"><Lightbulb size={14} className="text-[#fbbf24]" /> Recommended Actions · 行动建议</div>
            <div className="space-y-2.5">
              {report.recommendedActions.map((a, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[13px] text-[#cfe0ff]">{a.action} <span className="chip !text-[10px] ml-1">{a.effort}难度</span></div>
                    <div className="text-[12px] text-[#5b6885]">{a.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* AI Report */}
      <Section id="ai-report" title="AI Report · Project Intelligence Report" icon={BrainCircuit}>
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-1">
            <Radar size={15} className="text-[#7dd3fc]" />
            <span className="text-[12px] text-[#5b6885]">10-Agent Consensus · {report.generatedAt}</span>
          </div>
          <p className="text-[14px] text-[#cfe0ff] mb-4">💡 {report.oneLiner}</p>
          <div className="grid gap-3 md:grid-cols-5 mb-6">
            {report.verdict.map((v) => (
              <div key={v.key} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
                <div className="text-[11.5px] text-[#8b98b3]">{v.label}</div>
                <div className="mt-1"><Stars value={v.stars} /></div>
              </div>
            ))}
          </div>
          <div className="prose-report space-y-1">
            {masterReport.map((sec) => (
              <div key={sec.n}>
                <h2><span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#4f8cff] to-[#7c5cff] inline-block" /> {String(sec.n).padStart(2, "0")} · {sec.title}</h2>
                <p>{sec.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* AI PM 学习模式 */}
      <Section id="pm-learning" title="AI PM 学习模式 · Socratic Product Learning" icon={GraduationCap}>
        <LearningMode project={project} />
      </Section>

      {/* 产品拆解模式 */}
      <Section id="deconstruct" title="产品拆解模式 · Product DNA & 五层拆解" icon={Layers}>
        <DnaSection project={project} />
      </Section>

      {/* 自媒体模式 */}
      <Section id="content" title="自媒体模式 · Content Intelligence" icon={Megaphone}>
        <ContentMode project={project} />
      </Section>

      {/* 求职 Portfolio 模式 */}
      <Section id="portfolio" title="求职 Portfolio 模式 · AI PM Career" icon={Briefcase}>
        <PortfolioMode project={project} />
      </Section>

      {/* 逆向工程 */}
      <Section id="reverse" title="AI 产品逆向工程 · Reverse Engineering Lab" icon={Microscope}>
        <ReverseSection project={project} />
      </Section>

      {/* 产品底层逻辑架构分析 · 如何搭建 */}
      <Section id="build" title="产品底层逻辑架构分析 · 如何搭建这个产品" icon={Hammer}>
        <BuildSection project={project} />
      </Section>

      {/* Related */}
      <section>
        <div className="text-[15px] font-bold text-white mb-3">相关项目</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {related.map((p) => {
            const ps = projectScores(p);
            return (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="panel card-hover p-4">
                <div className="font-semibold text-white text-[14px] truncate">{p.name}</div>
                <div className="text-[12px] text-[#5b6885] truncate mt-0.5">{p.tagline}</div>
                <div className="mt-2 text-[11.5px] num text-[#8b98b3]">⭐ {formatStars(p.stars)} · Opp {ps.opportunity}</div>
              </Link>
            );
          })}
        </div>
      </section>
      </div>

      {/* Right rail · AI PM Insight */}
      <aside className="hidden xl:block">
        <AiPmInsightRail project={project} />
      </aside>
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={17} className="text-[#4f8cff]" />
        <h2 className="text-[16px] font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ScoreCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
      <div className="text-[10.5px] text-[#5b6885] uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold num mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
      <div className="text-[11px] text-[#5b6885]">{label}</div>
      <div className="text-lg font-bold num text-emerald-300">{value}</div>
      <div className="text-[11px] num text-[#5b6885]">{sub}</div>
    </div>
  );
}

function MiniScore({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
      <Icon size={15} className="mx-auto" style={{ color }} />
      <div className="text-[11px] text-[#8b98b3] mt-1">{label}</div>
      <div className="text-lg font-bold num" style={{ color }}>{value}</div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[#5b6885] shrink-0">{k}</span>
      <span className="text-[#cfe0ff]">{v}</span>
    </div>
  );
}

function stageText(p: { releases: number; growth30d: number; stars: number }): string {
  const rate = (p.growth30d / (p.stars - p.growth30d)) * 100;
  if (p.releases >= 100 && rate < 8) return "成熟期";
  if (rate > 15) return "爆发增长期";
  if (rate > 6) return "成长期";
  return "早期 / 稳定期";
}



function DnaSection({ project }: { project: Project }) {
  const dna = buildProductDna(project);
  const layers = buildFiveLayers(project);
  const pmVsUser = buildPmVsUser(project);
  const frame = buildOpinionFrame(project);
  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-[13px] font-semibold text-white mb-4">Project DNA · 产品底层逻辑图</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {dna.map((n, i) => (
            <div key={n.label} className="flex items-center gap-1.5">
              <div className="rounded-xl bg-[#0c1322] border border-[#2c4370] px-3 py-2 text-center min-w-[72px]">
                <div className="text-[10px] text-[#5b6885] uppercase">{n.label}</div>
                <div className="text-[11.5px] text-[#cfe0ff] leading-snug mt-0.5 max-w-[120px]">{n.value}</div>
              </div>
              {i < dna.length - 1 && <GitCommitHorizontal size={14} className="text-[#4f8cff] shrink-0" />}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5 space-y-2.5">
          <div className="text-[13px] font-semibold text-white">AI 产品五层拆解模型</div>
          {Object.values(layers).map((l, i) => (
            <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#aab6cd]">{l}</div>
          ))}
        </div>
        <div className="panel p-5 space-y-3">
          <div className="text-[13px] font-semibold text-white">PM 视角 vs 普通用户视角</div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#8b98b3]">{pmVsUser.userView}</div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#cfe0ff]">{pmVsUser.pmView}</div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#aab6cd]"><b className="text-[#fbbf24]">如果我是 PM：</b>{frame.ifPmSteps.join(" ")}</div>
        </div>
      </div>
    </div>
  );
}


function BuildSection({ project }: { project: Project }) {
  const dna = buildProductDna(project);
  const deep = buildPmDeepAnalysis(project);
  const why = buildWhyAi(project);
  const native = buildAiNativeTest(project);
  const plan = buildBuildPlan(project);
  const assets = [
    { n: 1, label: "Project Intelligence Report", target: "#ai-report", icon: "📄" },
    { n: 2, label: "PM Learning Case", target: "#pm-learning", icon: "🎓" },
    { n: 3, label: "Product Challenge", target: "#pm-learning", icon: "🧠" },
    { n: 4, label: "Personal Opinion", target: "#content", icon: "✍️" },
    { n: 5, label: "Social Media Content", target: "#content", icon: "📱" },
    { n: 6, label: "Portfolio Case", target: "#portfolio", icon: "💼" },
    { n: 7, label: "Interview Case", target: "#portfolio", icon: "🎤" },
  ];
  return (
    <div className="space-y-5">
      {/* 七种资产 */}
      <div className="panel p-5">
        <div className="text-[13px] font-semibold text-white mb-3">一项目 → 七种资产（一次研究，最大复利）</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {assets.map((a) => (
            <a key={a.n} href={a.target} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 hover:border-[#2c4370]">
              <div className="text-[11px] text-[#5b6885]">0{a.n}</div>
              <div className="text-[12.5px] font-semibold text-[#cfe0ff] mt-0.5">{a.icon} {a.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* DNA 14 nodes */}
      <div className="panel p-5">
        <div className="text-[13px] font-semibold text-white mb-4">Project DNA · 产品底层逻辑（14 节点）</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {dna.map((n, i) => (
            <div key={n.label} className="flex items-center gap-1.5">
              <div className="rounded-xl bg-[#0c1322] border border-[#2c4370] px-3 py-2 text-center min-w-[72px]">
                <div className="text-[10px] font-bold text-[#7dd3fc] uppercase">{n.label}</div>
                <div className="text-[11px] text-[#cfe0ff] leading-snug mt-0.5 max-w-[130px]">{n.value}</div>
              </div>
              {i < dna.length - 1 && <GitCommitHorizontal size={13} className="text-[#4f8cff] shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* PM Deep Analysis 15 dims */}
      <div className="panel p-5">
        <div className="text-[13px] font-semibold text-white mb-4">PM Deep Analysis · 15 维深度拆解</div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {deep.map((d) => (
            <div key={d.key} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[11px] font-bold text-[#7dd3fc] uppercase">{d.label}</div>
              <div className="text-[12px] text-[#aab6cd] mt-0.5 leading-relaxed">{d.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 如何搭建：Build Plan */}
      <div className="panel p-5">
        <div className="text-[13px] font-semibold text-white mb-1">如何搭建这个产品 · Build Plan</div>
        <div className="text-[12.5px] text-[#8b98b3] mb-4">{plan.summary}</div>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#7dd3fc] mb-2">五层架构</div>
            <div className="space-y-1.5">
              {plan.architectureLayers.map((l) => (
                <div key={l.layer} className="text-[12.5px] text-[#aab6cd]"><b className="text-[#cfe0ff]">{l.layer}</b> — {l.desc}</div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
              <div className="text-[12px] font-bold text-[#34d399] mb-2">技术栈</div>
              <div className="flex flex-wrap gap-1.5">{plan.techStack.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
              <div className="text-[12px] font-bold text-[#34d399] mb-2">数据流</div>
              <div className="space-y-1 text-[12.5px] text-[#aab6cd]">{plan.dataFlow.map((d, i) => <div key={i}>{i + 1}. {d}</div>)}</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#fbbf24] mb-2">模块划分</div>
            <div className="flex flex-wrap gap-1.5">{plan.modules.map((m) => <span key={m} className="chip chip-accent">{m}</span>)}</div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#60a5fa] mb-2">搭建路线（7 / 14 / 30 天）</div>
            <div className="space-y-2.5">
              {plan.steps.map((st) => (
                <div key={st.phase} className="flex gap-3">
                  <div className="w-40 shrink-0"><div className="text-[12px] font-semibold text-white">{st.phase}</div><div className="text-[10.5px] text-[#5b6885]">{st.days}</div></div>
                  <div className="text-[12.5px] text-[#aab6cd]">{st.tasks.join("；")}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[#0c1322] border border-emerald-400/25 p-4">
              <div className="text-[12px] font-bold text-emerald-300 mb-2">✅ 复制什么</div>
              <div className="space-y-1 text-[12.5px] text-[#aab6cd]">{plan.copy.map((c, i) => <div key={i}>· {c}</div>)}</div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-rose-400/25 p-4">
              <div className="text-[12px] font-bold text-rose-300 mb-2">⛔ 不要复制什么</div>
              <div className="space-y-1 text-[12.5px] text-[#aab6cd]">{plan.dontCopy.map((c, i) => <div key={i}>· {c}</div>)}</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#f472b6] mb-2">依赖与成本</div>
            <div className="text-[12.5px] text-[#aab6cd]">{plan.dependencies.join(" · ")}<div className="mt-1 text-[#f472b6]">{plan.cost}</div></div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#2dd4bf] mb-2">搭建自检清单</div>
            <div className="space-y-1 text-[12.5px] text-[#aab6cd]">{plan.checklist.map((c, i) => <div key={i}>{c}</div>)}</div>
          </div>
        </div>
      </div>

      {/* 功能实现路径框图 + 产品总监视角 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3"><Boxes size={16} className="text-[#7dd3fc]" /><span className="text-[14px] font-bold text-white">产品框图 · 功能实现路径</span></div>
          <FeaturePathDiagram project={project} />
        </div>
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3"><UserRoundCheck size={16} className="text-[#a78bfa]" /><span className="text-[14px] font-bold text-white">产品总监视角 · 边界 / 痛点 / 真实案例</span></div>
          <DirectorView project={project} />
        </div>
      </div>

      {/* Why AI + AI Native Test */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="text-[13px] font-semibold text-white mb-3">Why AI · 为什么需要 AI</div>
          <div className="space-y-2 text-[12.5px] text-[#aab6cd]">
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#7dd3fc]">为什么需要 AI：</b>{why.needAi}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#8b98b3]">如果没有 AI：</b>{why.withoutAi}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#34d399]">降低了什么成本：</b>{why.costReduced}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#34d399]">提高了什么效率：</b>{why.efficiencyGained}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#fbbf24]">创造了什么新体验：</b>{why.newExperience}</div>
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-[13px] font-semibold text-white mb-3">AI Native Test · 从 0 重新设计会怎么做</div>
          <div className="space-y-2 text-[12.5px] text-[#aab6cd]">
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#8b98b3]">Current：</b>{native.current}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#7dd3fc]">AI Enhanced：</b>{native.enhanced}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3"><b className="text-[#34d399]">AI Native：</b>{native.native}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiPmInsightRail({ project }: { project: Project }) {
  const s = computeScores(project);
  const r = buildReverseEngineering(project);
  const cat = categoryOf(project.categories[0] ?? "agent");
  return (
    <div className="sticky top-20 space-y-4">
      <div className="panel p-5">
        <div className="text-[12px] font-semibold text-[#7dd3fc] mb-3">AI PM INSIGHT</div>
        <div className="space-y-2">
          <div className="flex justify-between text-[12.5px]"><span className="text-[#8b98b3]">AI PM 学习价值</span><span className="num font-bold text-[#c084fc]">{r.valueScores[6].value}</span></div>
          <div className="flex justify-between text-[12.5px]"><span className="text-[#8b98b3]">职业价值</span><span className="num font-bold text-[#a78bfa]">{r.valueScores[7].value}</span></div>
          <div className="flex justify-between text-[12.5px]"><span className="text-[#8b98b3]">内容价值</span><span className="num font-bold text-[#f472b6]">{r.valueScores[8].value}</span></div>
          <div className="flex justify-between text-[12.5px]"><span className="text-[#8b98b3]">成长潜力</span><span className="num font-bold text-[#fb923c]">{r.valueScores[9].value}</span></div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#16213a] text-[12px] text-[#5b6885]">{cat.emoji} {cat.name} · 机会分 <b className="text-[#7dd3fc]">{s.opportunity}</b>/100 · 一句话：{r.productToTech.productRequirement}</div>
      </div>
      <div className="panel p-5">
        <div className="text-[12px] font-semibold text-[#7dd3fc] mb-3">AI PM 值得学什么</div>
        <div className="space-y-1.5">
          {r.learningValue.slice(0, 4).map((v, i) => (
            <div key={i} className="text-[12px] text-[#aab6cd] leading-snug">· {v}</div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#16213a] space-y-1.5">
          <Link href="#pm-learning" className="block text-[12px] text-[#7dd3fc] hover:underline">🎓 去 AI PM 学习模式挑战</Link>
          <Link href="#content" className="block text-[12px] text-[#f472b6] hover:underline">📱 生成自媒体内容</Link>
          <Link href="#portfolio" className="block text-[12px] text-[#a78bfa] hover:underline">💼 沉淀 Portfolio Case</Link>
          <Link href="#reverse" className="block text-[12px] text-[#34d399] hover:underline">🔬 查看逆向工程报告</Link>
        </div>
      </div>
    </div>
  );
}
