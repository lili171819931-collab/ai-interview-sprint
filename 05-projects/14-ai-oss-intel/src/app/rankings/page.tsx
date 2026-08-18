import Link from "next/link";
import { Star, TrendingUp, Flame, ArrowRight, FolderKanban } from "lucide-react";
import { topBy } from "@/lib/store";
import { computeScores, formatSigned, formatStars } from "@/lib/engines";

export const dynamic = "force-static";

const RANKS = [
  { kind: "stars", title: "Star Top 50", desc: "Stars 总量排名", icon: Star, color: "#fbbf24", value: (p: any, s: any) => formatStars(p.stars) },
  { kind: "growth", title: "Fastest Growth TOP 100", desc: "近 30 天增长排名 · 每项目含逆向拆解", icon: TrendingUp, color: "#34d399", value: (p: any, s: any) => `+${formatSigned(p.growth30d)}` },
  { kind: "hot", title: "Hot 热点 TOP 100", desc: "近 7 天热度排名 · 每项目含逆向拆解", icon: Flame, color: "#f87171", value: (p: any, s: any) => `+${formatSigned(p.growth7d)}` },
] as const;

export default function RankingsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rankings · 排行榜体系</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1">不只做 Star 排名 — 9 大榜单覆盖增长、机会、赚钱、副业、Skill、简历、内容</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/rankings/categories" className="panel card-hover p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#4f8cff1a", border: "1px solid #4f8cff40" }}>
              <FolderKanban size={16} style={{ color: "#4f8cff" }} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-[14.5px]">分类 TOP 榜</div>
              <div className="text-[11.5px] text-[#5b6885]">30 个一级分类独立榜单 + 二级场景</div>
            </div>
            <ArrowRight size={15} className="text-[#4d5a75]" />
          </div>
        </Link>
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
