import { VendorIcon } from "@/components/intel/VendorIcon";
import { formatUsd, getModelLeaderboard } from "@/lib/intel/models-data";
import { getRadarStatus } from "@/lib/intel/status";
import { formatUpdatedAt } from "@/lib/intel/time";

export const dynamic = "force-dynamic";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function LeaderboardPage() {
  const board = getModelLeaderboard();
  const status = getRadarStatus();
  const items = board?.items || [];

  return (
    <div className="page-main">
      <header className="space-y-3 mb-8">
        <p className="kicker">MODEL CONSENSUS</p>
        <h1 className="page-title">大模型排行榜</h1>
        <p className="page-sub max-w-2xl">
          {board?.methodNote || "汇总多家公开模型榜，用统一口径计算共识分。"}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span>综合 {board?.listCount ?? 10} 家公开榜</span>
          <span>更新于 {formatUpdatedAt(status.fetchedAt)}</span>
        </div>
      </header>

      <section className="lb-card">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1 pb-4">
          <h2 className="display text-lg font-semibold">总榜 前 {items.length} 名</h2>
          <p className="text-xs text-[var(--muted)]">厂商官网价格 · Token 价为美元／百万</p>
        </div>
        <div className="table-scroll">
          <table className="lb-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>模型</th>
                <th>上线日期</th>
                <th>评测完整度</th>
                <th>输入／输出成本</th>
                <th>共识分</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={`${it.rank}-${it.name}`}>
                  <td className={it.rank <= 3 ? "lb-rank lb-rank-top" : "lb-rank"}>{pad(it.rank)}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <VendorIcon vendor={it.vendor} />
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-[var(--muted)]">{it.vendor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-[var(--muted)]">{it.releasedAt}</td>
                  <td>{it.coverage.toFixed(1)}%</td>
                  <td className="text-[var(--muted)]">
                    {it.priceLabel ? (
                      it.priceLabel
                    ) : it.inputUsd == null ? (
                      "待核验"
                    ) : (
                      <span className="lb-price">
                        <span>输入 {formatUsd(it.inputUsd)}</span>
                        <span>输出 {formatUsd(it.outputUsd)}</span>
                      </span>
                    )}
                  </td>
                  <td className="lb-score">{it.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
