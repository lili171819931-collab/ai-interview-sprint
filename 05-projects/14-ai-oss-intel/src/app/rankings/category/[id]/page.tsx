import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { allCategories } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { secondaryScenariosOf, timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { GithubIcon } from "@/components/icons";
import type { CategoryId, Project, TimeStatus } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return allCategories().map((c) => ({ id: c.id }));
}

type Tab = "opportunity" | "stars" | "growth";

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "opportunity", label: "机会 TOP 榜", desc: "按 AI Opportunity Score" },
  { id: "stars", label: "收藏榜", desc: "按 Stars（收藏数）· 2026" },
  { id: "growth", label: "收藏增长最快榜", desc: "按 2026 Star 增长 · 2026" },
];

export default async function CategoryRankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = (TABS.some((t) => t.id === sp.tab) ? sp.tab : "opportunity") as Tab;
  const cat = categoryOf(id as CategoryId);
  if (!cat) notFound();

  const inCat = PROJECTS.filter((p) => p.categories.includes(id as CategoryId));
  const opportunity = inCat.map((p) => ({ p, s: computeScores(p) })).sort((a, b) => b.s.opportunity - a.s.opportunity);
  const stars = [...inCat].sort((a, b) => b.stars - a.stars);
  const growth = [...inCat].sort((a, b) => b.growth90d - a.growth90d);
  const LIMIT = 100;

  return (
    <div className="space-y-5">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-xl">{cat.emoji}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{cat.name} · 分类榜单</h1>
            <p className="text-[12.5px] text-[#8b98b3] mt-0.5">{cat.nameZh} · 2026 时间窗 · 收录 {inCat.length} 个项目（榜单上限 {LIMIT}） · 每个项目提供发布时间</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <Link key={t.id} href={`/rankings/category/${id}?tab=${t.id}`} className={`chip ${tab === t.id ? "chip-accent" : ""}`} title={t.desc}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] text-[#5b6885]">2026 状态：</span>
          {(Object.keys(TIME_STATUS_META) as TimeStatus[]).map((t) => (
            <span key={t} className="chip" style={{ color: TIME_STATUS_META[t].color, borderColor: TIME_STATUS_META[t].color + "55", background: TIME_STATUS_META[t].color + "12" }}>
              {TIME_STATUS_META[t].label}
            </span>
          ))}
          <span className="text-[11.5px] text-[#5b6885] ml-1">二级场景：{secondaryScenariosOf(inCat[0] ?? PROJECTS[0]).map((x) => x.name).join(" / ")}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {allCategories().slice(0, 14).map((c) => (
            <Link key={c.id} href={`/rankings/category/${c.id}`} className={`chip ${c.id === id ? "chip-accent" : ""}`}>{c.emoji} {c.name}</Link>
          ))}
          <Link href="/rankings/categories" className="chip">全部分类 →</Link>
        </div>
      </div>

      {tab === "opportunity" && <OpportunityTable rows={opportunity} />}
      {tab === "stars" && <StarsTable rows={stars.slice(0, LIMIT)} />}
      {tab === "growth" && <GrowthTable rows={growth.slice(0, LIMIT)} />}
    </div>
  );
}

function ProjectCell({ p }: { p: Project }) {
  const ts = timeStatusOf(p);
  const meta = TIME_STATUS_META[ts];
  return (
    <div className="min-w-0">
      <Link href={`/projects/${p.slug}`} className="font-semibold text-white truncate hover:text-[#7dd3fc] block max-w-[260px]">{p.name}</Link>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="flex items-center gap-1 text-[10.5px] text-[#5b6885]"><Clock size={10} /> 发布于 {p.createdAt}</span>
        <span className="chip !text-[9.5px]" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>
      </div>
    </div>
  );
}

function ActionCell({ p }: { p: Project }) {
  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Link href={`/projects/${p.slug}`} className="chip chip-accent !text-[11px]">分析</Link>
      <a href={`https://github.com/${p.fullName}`} target="_blank" className="chip !text-[11px]"><GithubIcon size={11} /> GitHub</a>
    </div>
  );
}

function OpportunityTable({ rows }: { rows: { p: Project; s: ReturnType<typeof computeScores> }[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[820px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">项目（发布时间）</th>
              <th className="px-2 py-3 text-right num">Stars</th><th className="px-2 py-3 text-right num">30D</th>
              <th className="px-2 py-3 text-right num">Opp</th><th className="px-2 py-3 text-right num">Tech</th>
              <th className="px-2 py-3 text-right num">Money</th><th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, s }, i) => (
              <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#7dd3fc" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-3"><ProjectCell p={p} /></td>
                <td className="px-2 py-3 text-right num text-[#cfe0ff]">{formatStars(p.stars)}</td>
                <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 30))}</div></td>
                <td className="px-2 py-3 text-right num font-bold text-[#7dd3fc]">{s.opportunity}</td>
                <td className="px-2 py-3 text-right num text-[#34d399]">{s.technical}</td>
                <td className="px-2 py-3 text-right num text-[#f87171]">{s.money}</td>
                <td className="px-4 py-3 text-right"><ActionCell p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StarsTable({ rows }: { rows: Project[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 text-[12px] text-[#8b98b3] border-b border-[#16213a]">🔥 收藏榜 · 按 Stars（收藏数）排名 · 2026 · 共 {rows.length} 个项目 · 每项目显示发布时间</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[820px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">项目（发布时间）</th>
              <th className="px-2 py-3 text-right num">⭐ Stars</th><th className="px-2 py-3 text-right num">Forks</th>
              <th className="px-2 py-3 text-right num">30D 增长</th><th className="px-2 py-3 text-right num">90D 增长</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#fbbf24" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-3"><ProjectCell p={p} /></td>
                <td className="px-2 py-3 text-right num font-bold text-[#fbbf24]">{formatStars(p.stars)}</td>
                <td className="px-2 py-3 text-right num text-[#8b98b3]">{formatStars(p.forks)}</td>
                <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 30))}</div></td>
                <td className="px-2 py-3 text-right num text-emerald-300/80">{formatSigned(p.growth90d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 90))}</div></td>
                <td className="px-4 py-3 text-right"><ActionCell p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GrowthTable({ rows }: { rows: Project[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 text-[12px] text-[#8b98b3] border-b border-[#16213a]">⚡ 收藏增长最快榜 · 按 2026 Star 增长（近 90 天）排名 · 2026 · 共 {rows.length} 个项目 · 每项目显示发布时间</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[860px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">项目（发布时间）</th>
              <th className="px-2 py-3 text-right num">⭐ Stars</th>
              <th className="px-2 py-3 text-right num">7D</th><th className="px-2 py-3 text-right num">30D</th><th className="px-2 py-3 text-right num">90D(2026)</th>
              <th className="px-2 py-3 text-right num">增长率 90D</th><th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#34d399" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-3"><ProjectCell p={p} /></td>
                <td className="px-2 py-3 text-right num text-[#fbbf24]">{formatStars(p.stars)}</td>
                <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth7d)}</td>
                <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}</td>
                <td className="px-2 py-3 text-right num font-bold text-emerald-300">{formatSigned(p.growth90d)}</td>
                <td className="px-2 py-3 text-right num text-[#5b6885]">{formatPct(growthRate(p, 90))}</td>
                <td className="px-4 py-3 text-right"><ActionCell p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
