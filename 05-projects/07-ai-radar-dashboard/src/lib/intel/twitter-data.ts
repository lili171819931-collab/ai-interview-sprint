import { existsSync, readFileSync } from "fs";
import path from "path";
import type { FeedItem } from "./aihot-types";
import { mapToFeedCategory } from "./categories";
import { buildRecommendReason } from "./recommend";
import type { TwitterLiveItem, TwitterLiveSnapshot } from "./twitter-types";

const FILE = path.join(process.cwd(), "data", "twitter-live.json");

export function getTwitterLiveSnapshot(): TwitterLiveSnapshot | null {
  try {
    if (!existsSync(FILE)) return null;
    const snap = JSON.parse(readFileSync(FILE, "utf8")) as TwitterLiveSnapshot;
    if (!Array.isArray(snap.items)) return null;
    return snap;
  } catch (err) {
    console.warn("[twitter-data] parse failed", err);
    return null;
  }
}

export function twitterToFeed(it: TwitterLiveItem): FeedItem {
  const title = it.text.replace(/\s+/g, " ").trim();
  const handle = it.handle ? (it.handle.startsWith("@") ? it.handle : `@${it.handle}`) : "";
  const sourceName = handle ? `${handle} · Twitter/X` : it.author || "Twitter/X";
  const category = mapToFeedCategory("industry", title, title);
  return {
    id: it.id,
    title: title.slice(0, 180),
    summary: it.kind === "trend" ? "Twitter/X 正在讨论的话题" : title,
    sourceName,
    originalUrl: it.url,
    localHref: it.url || "/",
    publishedAt: it.publishedAt,
    discoveredAt: it.fetchedAt || it.publishedAt,
    category,
    selected: false,
    origin: "twitter",
    score: null,
    recommendReason:
      it.kind === "tweet"
        ? "Twitter 实时消息，进入 AI 动态时间轴。"
        : buildRecommendReason({ title, summary: title, category, selected: false }),
  };
}
