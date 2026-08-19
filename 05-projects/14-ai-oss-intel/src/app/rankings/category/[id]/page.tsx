import Link from "next/link";
import { notFound } from "next/navigation";
import { allCategories } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { secondaryScenariosOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { CategoryBoard } from "@/components/category/CategoryBoard";
import type { CategoryId, TimeStatus } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return allCategories().map((c) => ({ id: c.id }));
}

export default async function CategoryRankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = categoryOf(id as CategoryId);
  if (!cat) notFound();
  const inCat = PROJECTS.filter((p) => p.categories.includes(id as CategoryId));

  return (
    <div className="space-y-5">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-xl">{cat.emoji}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{cat.name} · 分类榜单</h1>
            <p className="text-[12.5px] text-[#8b98b3] mt-0.5">{cat.nameZh} · 2026 年发布 · 三榜只展示本分类相关开源项目（仅 2026 年发布、前 30 名、从高到低） · 每项目显示发布时间</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {allCategories().slice(0, 14).map((c) => (
              <Link key={c.id} href={`/rankings/category/${c.id}`} className={`chip ${c.id === id ? "chip-accent" : ""}`}>{c.emoji} {c.name}</Link>
            ))}
            <Link href="/rankings/categories" className="chip">全部分类 →</Link>
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
      </div>

      <CategoryBoard id={id as CategoryId} />
    </div>
  );
}
