import type { Freshness } from "@/lib/data";

export function FreshnessBadge({
  freshness,
  lastUpdatedDate,
}: {
  freshness: Freshness;
  lastUpdatedDate: string;
}) {
  if (freshness === "fresh") {
    return (
      <span className="tag tag-signal">数据截至 {lastUpdatedDate} · 今日已更新</span>
    );
  }
  if (freshness === "stale") {
    return (
      <span className="tag tag-amber">数据截至 {lastUpdatedDate} · 待日更（仍可浏览快照）</span>
    );
  }
  return (
    <span className="tag tag-amber">未找到 daily-bundle · 已降级展示 seed · 请运行 npm run data:refresh</span>
  );
}
