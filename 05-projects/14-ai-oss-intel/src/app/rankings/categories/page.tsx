import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { allCategories } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatStars } from "@/lib/engines";
import { secondaryScenariosOf } from "@/lib/scenarios";

export const dynamic = "force-static";

export default function CategoriesIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FolderKanban size={22} className="text-[#7dd3fc]" /> 分类 TOP 榜 · 每个一级分类独立榜单</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1">不建总榜就结束——每个一级分类都有独立 TOP 榜与二级场景拆解。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allCategories().map((cat) => {
          const inCat = PROJECTS.filter((p) => p.categories.includes(cat.id))
            .map((p) => ({ p, s: computeScores(p) }))
            .sort((a, b) => b.s.opportunity - a.s.opportunity);
          const sec = secondaryScenariosOf(inCat[0]?.p ?? PROJECTS[0]);
          return (
            <Link key={cat.id} href={`/rankings/category/${cat.id}`} className="panel card-hover p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xl">{cat.emoji}</span>
                <div>
                  <div className="font-bold text-white text-[14.5px]">{cat.name}</div>
                  <div className="text-[11px] text-[#5b6885]">{cat.nameZh} · {inCat.length} 个项目</div>
                </div>
                <span className="chip chip-accent ml-auto">TOP 榜</span>
              </div>
              <div className="space-y-1.5">
                {inCat.slice(0, 3).map(({ p, s }, i) => (
                  <div key={p.slug} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-5 text-center font-bold num text-[#7dd3fc]">{i + 1}</span>
                    <span className="flex-1 text-[#cfe0ff] truncate">{p.name}</span>
                    <span className="num text-[#8b98b3]">Opp {s.opportunity}</span>
                    <span className="num text-[#5b6885]">⭐{formatStars(p.stars)}</span>
                  </div>
                ))}
              </div>
              {sec.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sec.map((x) => <span key={x.code} className="chip !text-[10.5px]">{x.name}</span>)}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
