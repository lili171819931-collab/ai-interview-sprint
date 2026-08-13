import Link from "next/link";
import { HotTopicsBoard } from "@/components/HotTopicsBoard";
import { PageLiveRefresh } from "@/components/PageLiveRefresh";
import { getGlobalHotTopicsView } from "@/lib/global-hot-data";
import { analyzeFailedSources, mergeRegionalHotTopics } from "@/lib/global-hot-merge";
import { formatUpdatedAt } from "@/lib/intel/time";

export const dynamic = "force-dynamic";

export default function HotTopicsPage() {
  const { snapshot, fromFile } = getGlobalHotTopicsView();
  const { stats } = snapshot;
  const byRegion = {
    国内: mergeRegionalHotTopics(snapshot.platforms, "国内"),
    海外: mergeRegionalHotTopics(snapshot.platforms, "海外"),
  };
  const failed = analyzeFailedSources(snapshot.sources);
  const focusApps = failed.filter((f) => /Reddit|Twitter|X 趋势/i.test(f.label));

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">REGION RADAR</p>
        <h1 className="page-title">热点分析</h1>
        <p className="page-sub max-w-2xl">
          国内 / 海外分版：同话题跨平台合并后按热度值排序；标题可跳转原文（无原文则搜索）。信息条每小时自动同步。
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span>更新于 {formatUpdatedAt(snapshot.generatedAt)}</span>
          <span>{fromFile ? "已同步" : "seed 降级"}</span>
          <span>
            源 {stats.sourcesOk}/{stats.sourcesTotal}
          </span>
          <span>
            合并 · 国内 {byRegion.国内.length} · 海外 {byRegion.海外.length}
          </span>
          <PageLiveRefresh
            intervalMs={60 * 60 * 1000}
            syncMode="hot"
            syncEveryCycles={1}
            fetchedAt={snapshot.generatedAt}
            label="热点分析"
          />
          <Link href="/opportunities" className="text-[var(--signal)] hover:underline">
            查看 AI 机会报告 →
          </Link>
        </div>
      </header>

      {focusApps.length ? (
        <section className="surface rounded-xl border border-[var(--line)] p-4 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-lg font-semibold">海外应用源站分析</h2>
            <p className="text-xs text-[var(--muted)]">本轮失败 · 不计入合并榜</p>
          </div>
          <ul className="space-y-3">
            {focusApps.map((f) => (
              <li key={f.label} className="text-sm leading-relaxed">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-[11px] text-[var(--muted)]">{f.region}</span>
                  <span className="text-[11px] text-[var(--amber)]">failed</span>
                </div>
                <p className="mt-1 text-[var(--muted)]">{f.diagnosis}</p>
                {f.error ? (
                  <p className="mt-1 text-[11px] text-[var(--amber)] break-all font-mono">{f.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            海外合并榜当前主要依赖 Hacker News、TechCrunch、Product Hunt、Exa 等可用源；Reddit / Twitter/X
            恢复后会自动参与同话题合并与来源标注。
          </p>
        </section>
      ) : null}

      <HotTopicsBoard byRegion={byRegion} />

      <section className="space-y-3">
        <h2 className="display text-lg font-semibold">数据源状态</h2>
        <div className="table-scroll surface rounded-xl overflow-hidden">
          <table className="lb-table text-sm">
            <thead>
              <tr>
                <th>来源</th>
                <th>区域</th>
                <th>模式</th>
                <th>条目</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.sources.map((s) => (
                <tr key={s.id}>
                  <td>{s.label}</td>
                  <td className="text-[var(--muted)]">{s.region}</td>
                  <td className="text-[var(--muted)]">{s.mode}</td>
                  <td>{s.hits}</td>
                  <td className={s.ok ? "text-[var(--signal)]" : "text-[var(--amber)]"}>
                    {s.ok ? "正常" : s.error || "失败"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          刷新：<code className="text-[var(--text)]">npm run hot:sync</code> · 方法：{snapshot.methodNote}
        </p>
      </section>
    </div>
  );
}
