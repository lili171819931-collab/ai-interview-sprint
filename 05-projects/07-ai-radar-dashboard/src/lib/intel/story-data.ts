import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { AihotStory, AihotStorySnapshot, StoryView } from "./story-types";
import { buildStoryView } from "./story";
import { getAihotHotSnapshot, getAihotItemsSnapshot } from "./aihot-data";
import type { AihotHotTopic } from "./aihot-types";

const DIR = path.join(process.cwd(), "data", "aihot", "stories");
const STORY_API = "https://aihot.virxact.com/api/v1/stories";
const UA =
  "ai-radar-dashboard/0.2 (+https://github.com/lili171819931-collab/ai-interview-sprint; personal-noncommercial)";

export function storiesDir(): string {
  return DIR;
}

export function getStoryByPublicId(publicId: string): AihotStory | null {
  const p = path.join(DIR, `${publicId}.json`);
  try {
    if (!existsSync(p)) return null;
    const snap = JSON.parse(readFileSync(p, "utf8")) as AihotStorySnapshot;
    return snap?.story || null;
  } catch (err) {
    console.warn(`[story-data] failed to parse ${publicId}.json`, err);
    return null;
  }
}

export function getStoryFetchedAt(publicId: string): string | null {
  const p = path.join(DIR, `${publicId}.json`);
  try {
    if (!existsSync(p)) return null;
    const snap = JSON.parse(readFileSync(p, "utf8")) as AihotStorySnapshot;
    return snap?.fetchedAt || null;
  } catch {
    return null;
  }
}

export function cacheStory(story: AihotStory, fetchedAt = new Date().toISOString()): void {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(
      path.join(DIR, `${story.publicId}.json`),
      JSON.stringify({ schemaVersion: 1, fetchedAt, story }, null, 2),
      "utf8",
    );
  } catch (err) {
    console.warn("[story-data] cache story failed", err);
  }
}

export async function fetchStoryByPublicId(publicId: string): Promise<AihotStory | null> {
  try {
    const res = await fetch(`${STORY_API}/${publicId}`, {
      headers: { Accept: "application/json", "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { story?: AihotStory };
    if (!json.story || json.story.publicId !== publicId) return null;
    return json.story;
  } catch (err) {
    console.warn("[story-data] fetch story failed", publicId, err);
    return null;
  }
}

function hotTopicByItemId(itemId: string | null): AihotHotTopic | null {
  if (!itemId) return null;
  const snap = getAihotHotSnapshot();
  if (!snap?.items?.length) return null;
  return snap.items.find((it) => it.id === itemId) || null;
}

/** 读取（或按需抓取并缓存）故事视图：本地计算搜索逻辑 / 热度 / 推荐理由 */
export async function getStoryView(publicId: string): Promise<StoryView | null> {
  let story = getStoryByPublicId(publicId);
  let fetchedAt = getStoryFetchedAt(publicId);
  if (!story) {
    story = await fetchStoryByPublicId(publicId);
    if (!story) return null;
    fetchedAt = new Date().toISOString();
    cacheStory(story, fetchedAt);
  }

  const itemsSnap = getAihotItemsSnapshot();
  const itemsById = new Map((itemsSnap?.items || []).map((it) => [it.id, it]));
  const topic = hotTopicByItemId(story.reports.find((r) => itemsById.has(r.id))?.id || null);
  // 若故事本身是热点榜主条目，直接关联该热点
  const primaryTopic = topic || hotTopicByItemId(story.reports[0]?.id || null);

  return buildStoryView({
    story,
    topic: primaryTopic
      ? {
          rank: primaryTopic.rank,
          itemId: primaryTopic.id,
          title: primaryTopic.title,
          sourceName: primaryTopic.source?.name || "AIHOT",
          sourceCount: primaryTopic.sourceCount,
          signalCount: primaryTopic.signalCount || 0,
          sourceNames: primaryTopic.sourceNames || [],
          latestAt: primaryTopic.latestAt,
        }
      : null,
    itemsById,
    fetchedAt: fetchedAt || new Date().toISOString(),
  });
}
