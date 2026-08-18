import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Minus, Star, TrendingUp, Target, Coins, Briefcase, Puzzle, FileText, Megaphone, Sparkles, Flame } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { topBy } from "@/lib/store";
import { formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { Sparkline } from "@/components/ui";
import { ExpandableRankRow } from "@/components/ExpandableRankRow";
import type { Project, ProjectScores, RankKind } from "@/lib/types";

export const dynamic = "force-static";

const KINDS: { kind: RankKind; title: string; desc: string; icon: any; color: string; metric: (s: ProjectScores, p: Project) => string }[] = [
  { kind: "stars", title: "Star Top 50", desc: "按 GitHub Stars 总量排名 — 社区规模与影响力的基准。", icon: Star, color: "#fbbf24", metric: (_, p) => formatStars(p.stars) },
  { kind: "hot", title: "Hot 热点 TOP 100", desc: "按近 7 天 Star 增长排名 — 今天最热的项目。每个项目都可展开查看「产品功能实现路径 / 底层逻辑 / 技术架构 / 产品架构」。", icon: Flame, color: "#f87171", metric: (_, p) => `${formatSigned(p.growth7d)} ⭐` },
  { kind: "growth", title: "Fastest Growth TOP 100", desc: "按近 30 天 Star 绝对增长排名 — Growth Intelligence Engine 核心输出。每个项目都可展开查看「产品功能实现路径 / 底层逻辑 / 技术架构 / 产品架构」。", icon: TrendingUp, color: "#34d399", metric: (_, p) => `${formatSigned(p.growth30d)} ⭐` },
  { kind: "opportunity", title: "AI Opportunity Top 50", desc: "Growth×25% + Demand×20% + Commercial×20% + Innovation×15% + Ecosystem×10% + LowCompetition×10% — 平台最核心榜单。", icon: Target, color: "#7dd3fc", metric: (s) => `${s.opportunity}/100` },
  { kind: "money", title: "Money Making Top 50", desc: "赚钱潜力：SaaS / API / Subscription / Plugin / Service / Template 等变现路径的适配度。", icon: Coins, color: "#f87171", metric: (s) => `${s.money}/100` },
  { kind: "sidehustle", title: "Side Hustle Top 50", desc: "副业机会榜：二次开发难度、SaaS 化、服务化、个人开发者适配度综合评分。", icon: Briefcase, color: "#fb923c", metric: (s) => `${s.sideHustle}/100` },
  { kind: "skills", title: "Skill 项目 Top 50", desc: "最适合封装成 AI Skill 的项目：可复用程度、使用频率、商业价值。", icon: Puzzle, color: "#c084fc", metric: (s) => `${s.skill}/100` },
  { kind: "resume", title: "Resume / Portfolio Top 50", desc: "简历与作品集价值：技术含量、AI 深度、产品完整度、面试展示价值。", icon: FileText, color: "#60a5fa", metric: (s) => `${s.resume}/100` },
  { kind: "content", title: "Self Media Top 50", desc: "自媒体/内容潜力：是否容易出爆款、适合短视频/小红书/YouTube 选题。", icon: Megaphone, color: "#f472b6", metric: (s) => `${s.content}/100` },
  { kind: "new", title: "New Projects", desc: "最近发布的新项目 — 先发雷达，寻找早期机会。", icon: Sparkles, color: "#2dd4bf", metric: (_, p) => p.createdAt },
];

export function generateStaticParams() {
  return KINDS.map((k) => ({ kind: k.kind }));
}

export default async function RankingPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const meta = KINDS.find((k) => k.kind === kind);
  if (!meta) notFound();
  const limit = kind === "growth" || kind === "hot" ? 100 : 50;
  const items = topBy(meta.kind, limit);
  const Icon = meta.icon;

  return (
    <div className="space-y-5">
      <div className="panel p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}>
            <Icon size={19} style={{ color: meta.color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{meta.title}</h1>
            <p className="text-[12.5px] text-[#8b98b3] mt-0.5 max-w-2xl">{meta.desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {KINDS.map((k) => (
            <Link key={k.kind} href={`/rankings/${k.kind}`} className={`chip ${k.kind === kind ? "chip-accent" : ""}`}>
              <k.icon size={12} /> {k.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[860px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-2 py-3">项目</th>
                <th className="px-2 py-3 text-right num">Stars</th>
                <th className="px-2 py-3 text-right num">7D</th>
                <th className="px-2 py-3 text-right num">30D</th>
                <th className="px-2 py-3 text-right num">90D</th>
                <th className="px-2 py-3 text-right num">关键指标</th>
                <th className="px-2 py-3 text-right num">趋势</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ project, scores, rank, delta }) => {
                const r7 = growthRate(project, 7);
                const r30 = growthRate(project, 30);
                const r90 = growthRate(project, 90);
                const keyMetric = meta.metric(scores, project);
                if (kind === "growth" || kind === "hot") {
                  return (
                    <ExpandableRankRow
                      key={project.slug}
                      project={project}
                      rank={rank}
                      delta={delta}
                      metaColor={meta.color}
                      keyMetric={keyMetric}
                      showExtra
                    />
                  );
                }
                return (
                  <tr key={project.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold num" style={{ color: rank <= 3 ? meta.color : "#8b98b3" }}>{String(rank).padStart(2, "0")}</span>
                        {delta > 0 ? <ArrowUpRight size={13} className="text-emerald-400" /> : delta < 0 ? <ArrowDownRight size={13} className="text-rose-400" /> : <Minus size={13} className="text-[#33415e]" />}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/projects/${project.slug}`} className="block max-w-[280px]">
                        <div className="font-semibold text-white truncate hover:text-[#7dd3fc]">{project.name}</div>
                        <div className="text-[11.5px] text-[#5b6885] truncate">{project.tagline}</div>
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-right num text-[#cfe0ff]">{formatStars(project.stars)}</td>
                    <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(project.growth7d)}<div className="text-[10px] text-[#5b6885]">{formatPct(r7)}</div></td>
                    <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(project.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(r30)}</div></td>
                    <td className="px-2 py-3 text-right num text-emerald-300/80">{formatSigned(project.growth90d)}<div className="text-[10px] text-[#5b6885]">{formatPct(r90)}</div></td>
                    <td className="px-2 py-3 text-right num">
                      <span className="font-bold text-[15px]" style={{ color: meta.color }}>{keyMetric}</span>
                      {kind !== "stars" && kind !== "growth" && kind !== "new" && (
                        <div className="text-[10px] text-[#5b6885]">AI {scores.aiScore} · Opp {scores.opportunity}</div>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end"><Sparkline points={project.growthHistory} width={96} height={30} /></div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/projects/${project.slug}`} className="chip chip-accent !text-[11px]">分析</Link>
                        <a href={`https://github.com/${project.fullName}`} target="_blank" className="chip !text-[11px]"><GithubIcon size={11} /> GitHub</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-[#4d5a75]">共 {items.length} 个项目 · 数据快照：{new Date().toISOString().slice(0, 10)} · 运行 <code className="text-[#8fa6cf]">npm run github:sync</code> 可拉取实时数据</p>
    </div>
  );
}
