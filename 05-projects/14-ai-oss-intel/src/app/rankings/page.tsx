import Link from "next/link";
import { Star, TrendingUp, Target, Coins, Briefcase, Puzzle, FileText, Megaphone, Sparkles, ArrowRight } from "lucide-react";
import { topBy } from "@/lib/store";
import { computeScores, formatSigned, formatStars } from "@/lib/engines";

export const dynamic = "force-static";

const RANKS = [
  { kind: "stars", title: "Star Top 50", desc: "Stars 总量排名", icon: Star, color: "#fbbf24", value: (p: any, s: any) => formatStars(p.stars) },
  { kind: "growth", title: "Star Growth Top 50", desc: "近 30 天增长排名", icon: TrendingUp, color: "#34d399", value: (p: any, s: any) => `+${formatSigned(p.growth30d)}` },
  { kind: "opportunity", title: "AI Opportunity Top 50", desc: "平台最核心机会榜", icon: Target, color: "#7dd3fc", value: (p: any, s: any) => s.opportunity },
  { kind: "money", title: "Money Top 50", desc: "赚钱潜力排名", icon: Coins, color: "#f87171", value: (p: any, s: any) => s.money },
  { kind: "sidehustle", title: "Side Hustle Top 50", desc: "副业机会榜", icon: Briefcase, color: "#fb923c", value: (p: any, s: any) => s.sideHustle },
  { kind: "skills", title: "Skill Top 50", desc: "最适合 Skill 化", icon: Puzzle, color: "#c084fc", value: (p: any, s: any) => s.skill },
  { kind: "resume", title: "Resume Top 50", desc: "简历与作品集价值", icon: FileText, color: "#60a5fa", value: (p: any, s: any) => s.resume },
  { kind: "content", title: "Self Media Top 50", desc: "自媒体内容潜力", icon: Megaphone, color: "#f472b6", value: (p: any, s: any) => s.content },
  { kind: "new", title: "New Projects", desc: "最近发布的新项目", icon: Sparkles, color: "#2dd4bf", value: (p: any, s: any) => p.createdAt },
] as const;

export default function RankingsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rankings · 排行榜体系</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1">不只做 Star 排名 — 9 大榜单覆盖增长、机会、赚钱、副业、Skill、简历、内容</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {RANKS.map((r) => {
          const items = topBy(r.kind, 3);
          const Icon = r.icon;
          return (
            <Link key={r.kind} href={`/rankings/${r.kind}`} className="panel card-hover p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${r.color}1a`, border: `1px solid ${r.color}40` }}>
                  <Icon size={16} style={{ color: r.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-[14.5px]">{r.title}</div>
                  <div className="text-[11.5px] text-[#5b6885]">{r.desc}</div>
                </div>
                <ArrowRight size={15} className="text-[#4d5a75]" />
              </div>
              <div className="mt-4 space-y-2">
                {items.map(({ project }, i) => {
                  const s = computeScores(project);
                  return (
                    <div key={project.slug} className="flex items-center gap-2.5 text-[12.5px]">
                      <span className="w-5 text-center font-bold num" style={{ color: r.color }}>{i + 1}</span>
                      <span className="flex-1 text-[#cfe0ff] truncate">{project.name}</span>
                      <span className="num text-[#8b98b3]">{r.value(project, s)}</span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
