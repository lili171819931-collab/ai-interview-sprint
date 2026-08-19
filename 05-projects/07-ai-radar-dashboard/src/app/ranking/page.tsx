import { HotRankList } from "@/components/intel/HotRankList";
import { queryHotTopics } from "@/lib/intel/feed";
import { Tx } from "@/components/i18n/Tx";
import { UpdatedAt } from "@/components/i18n/UpdatedAt";

export const dynamic = "force-dynamic";

export default function RankingPage() {
  const hot = queryHotTopics();

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">
          <Tx k="ranking.kicker" />
        </p>
        <h1 className="page-title">
          <Tx k="ranking.title" />
        </h1>
        <p className="page-sub">
          <Tx k="ranking.sub" />
        </p>
        <p className="text-xs text-[var(--muted)]">
          <UpdatedAt iso={hot.generatedAt} />
        </p>
      </header>
      <HotRankList items={hot.items} />
      <p className="text-[11px] text-[var(--muted)] leading-relaxed max-w-3xl">
        榜单热度 = 信源数 × 10 + 信号数 × 4，并按 24 小时半衰期衰减。标签：新（近 6 小时、信源较少）、发酵中（近 12
        小时信源仍在增加）、爆（短时间密集报道）。点击任意热点进入<b className="text-[var(--text)]">本站故事线页</b>
        （不跳转外部 AIHOT 链接），可查看该事件的<b className="text-[var(--text)]">搜索逻辑、本地热度计算、推荐理由与报道故事线</b>；
        公开接口不返回内部热度值，此处为同口径估算。
      </p>
    </div>
  );
}
