import { HotRankList } from "@/components/intel/HotRankList";
import { queryHotTopics } from "@/lib/intel/feed";
import { formatUpdatedAt } from "@/lib/intel/time";

export const dynamic = "force-dynamic";

export default function RankingPage() {
  const hot = queryHotTopics();

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">HOT RADAR</p>
        <h1 className="page-title">AI热点榜</h1>
        <p className="page-sub">
          过去 48 小时最热的 AI 事件，按精选报道与讨论热度实时排序。
        </p>
        <p className="text-xs text-[var(--muted)]">更新于 {formatUpdatedAt(hot.generatedAt)}</p>
      </header>
      <HotRankList items={hot.items} />
      <p className="text-[11px] text-[var(--muted)] leading-relaxed max-w-2xl">
        榜单热度 = 信源数 × 权重 + 讨论信号数，并按 24 小时半衰期衰减。标签：新（近 6 小时、信源较少）、发酵中（近 12
        小时信源仍在增加）、爆（短时间密集报道）。公开接口不返回内部热度值，此处为同口径估算。
      </p>
    </div>
  );
}
