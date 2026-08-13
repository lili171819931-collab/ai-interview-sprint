import type { HotRankItem, HotStatus } from "./aihot-types";
import { hoursAgo } from "./time";

type HotRankInput = Omit<HotRankItem, "heat" | "status" | "signalCount"> & {
  signalCount?: number;
};

/** 展示热度：信源数 + 信号数，按 24 小时半衰期衰减。公开 API 不返回内部热度值。 */
export function displayHeat(sourceCount: number, signalCount: number, latestAt: string, now = Date.now()): number {
  const raw = sourceCount * 10 + signalCount * 4;
  const decay = Math.pow(0.5, hoursAgo(latestAt, now) / 24);
  return Math.max(1, Math.round(raw * decay));
}

export function hotStatus(sourceCount: number, signalCount: number, latestAt: string, now = Date.now()): HotStatus {
  const age = hoursAgo(latestAt, now);
  if (age <= 6 && sourceCount <= 2) return "new";
  if (age <= 4 && signalCount >= 12 && sourceCount >= 4) return "hot";
  if (age <= 12 && (signalCount >= 2 || sourceCount >= 3)) return "fermenting";
  return null;
}

export function enrichHotRank(item: HotRankInput, now = Date.now()): HotRankItem {
  const signalCount = item.signalCount ?? 0;
  return {
    ...item,
    signalCount,
    heat: displayHeat(item.sourceCount, signalCount, item.latestAt, now),
    status: hotStatus(item.sourceCount, signalCount, item.latestAt, now),
  };
}

export const HOT_STATUS_LABEL: Record<Exclude<HotStatus, null>, string> = {
  new: "新",
  fermenting: "发酵中",
  hot: "爆",
};
