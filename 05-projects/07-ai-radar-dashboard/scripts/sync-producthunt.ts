/**
 * 同步 Product Hunt 热点 → data/producthunt-hot.json
 *
 * 数据源：
 * 1) NewsNow 公开聚合（PH 官方 API v2 授权转推，个人非商业）→ 今日 Top 20（标题/简介/票数/PH 链接）
 * 2) 项目历史档案 data/archive/<date>/global-hot-topics.json 中的 PH 条目 → 回填近 7 天热门 App，凑足 30+
 *
 * 每个 App 维护票数历史（history），用于「增长最快」增量计算；
 * 并按本地分类器归入场景，尝试在爬取库中匹配同名开源仓库作为 GitHub 源码。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import { classifyProductHunt } from "../src/lib/intel/producthunt-classify";
import { getGithubSearchLibrary } from "../src/lib/intel/github-data";
import type { ProductHuntItem } from "../src/lib/intel/producthunt-types";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "producthunt-hot.json");
const NEWS = "https://newsnow.busiyi.world/api/s?id=producthunt&latest";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const RETAIN_DAYS = 14;

type RawItem = {
  title?: string;
  url?: string;
  extra?: { info?: string; hover?: string };
};

type LibraryEntry = ProductHuntItem & {
  firstSeenAt: string;
  lastSeenAt: string;
  firstVotes: number;
  history: { at: string; votes: number }[];
};

function parseVotes(info: string): number {
  const n = Number(String(info || "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function slugOf(url: string): string {
  const m = url.match(/producthunt\.com\/products\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : url.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function matchGithub(title: string) {
  const library = getGithubSearchLibrary();
  const nTitle = norm(title);
  if (nTitle.length < 4) return null;
  for (const it of library) {
    const nName = norm(it.name);
    if (nName === nTitle) return it;
  }
  for (const it of library) {
    const nName = norm(it.name);
    if (nName.length < 4) continue;
    if (nName.includes(nTitle) || nTitle.includes(nName)) return it;
  }
  return null;
}

function loadPrev(): Map<string, LibraryEntry> {
  try {
    if (!existsSync(OUT)) return new Map();
    const snap = JSON.parse(readFileSync(OUT, "utf8")) as { items?: Partial<LibraryEntry>[] };
    const map = new Map<string, LibraryEntry>();
    for (const it of snap.items || []) {
      if (!it?.title) continue;
      const entry: LibraryEntry = {
        slug: it.slug || slugOf(it.title),
        rank: it.rank || 0,
        title: it.title,
        tagline: it.tagline || "",
        votes: it.votes || 0,
        url: it.url || "",
        category: it.category || "other",
        github: it.github || null,
        githubSearchUrl: it.githubSearchUrl || "",
        firstSeenAt: it.firstSeenAt || new Date().toISOString(),
        lastSeenAt: it.lastSeenAt || new Date().toISOString(),
        firstVotes: it.firstVotes ?? it.votes ?? 0,
        history: Array.isArray(it.history) ? it.history : [],
        delta: it.delta,
      };
      map.set(entry.slug, entry);
    }
    return map;
  } catch {
    return new Map();
  }
}

/** 从每日档案回填近 7 天的 PH 热门条目 */
function loadArchiveEntries(): { title: string; url: string; day: string }[] {
  const out: { title: string; url: string; day: string }[] = [];
  const dir = path.join(ROOT, "data", "archive");
  if (!existsSync(dir)) return out;
  const subdirs = [];
  try {
    for (const f of readdirSync(dir)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(f)) subdirs.push(f);
    }
  } catch {
    // ignore
  }
  const now = Date.now();
  for (const day of subdirs.sort()) {
    const p = path.join(dir, day, "global-hot-topics.json");
    if (!existsSync(p)) continue;
    if (now - Date.parse(`${day}T00:00:00+08:00`) > RETAIN_DAYS * 86_400_000) continue;
    try {
      const snap = JSON.parse(readFileSync(p, "utf8")) as {
        platforms?: { name?: string; items?: { title?: string; url?: string }[] }[];
      };
      for (const plat of snap.platforms || []) {
        if (!/product/i.test(plat.name || "")) continue;
        for (const it of plat.items || []) {
          const title = (it.title || "").trim();
          if (title) out.push({ title, url: it.url || "", day });
        }
      }
    } catch {
      // skip bad archive
    }
  }
  return out;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const now = Date.now();
  const prev = loadPrev();

  // 1) 今日实时 Top 20
  const res = await fetch(NEWS, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`newsnow producthunt HTTP ${res.status}`);
  const data = (await res.json()) as { items?: RawItem[] };
  const live = (data.items || []).slice(0, 24);

  // 2) 历史档案回填
  const archive = loadArchiveEntries();

  const lib = new Map<string, LibraryEntry>();

  function upsert(title: string, url: string, tagline: string, votes: number, day: string) {
    if (!title) return;
    const slug = slugOf(url || title);
    const existing = lib.get(slug) || prev.get(slug);
    if (existing) {
      const current = { ...existing };
      current.title = title || existing.title;
      current.url = url || existing.url;
      if (tagline) current.tagline = tagline;
      if (votes > 0) {
        current.votes = votes;
        const last = current.history[current.history.length - 1];
        if (!last || now - Date.parse(last.at) > 30 * 60_000) {
          current.history.push({ at: day, votes });
          if (current.history.length > 60) current.history = current.history.slice(-60);
        }
      }
      current.lastSeenAt = now > Date.parse(current.lastSeenAt) ? fetchedAt : current.lastSeenAt;
      lib.set(slug, current);
      return;
    }
    const gh = matchGithub(title);
    const entry: LibraryEntry = {
      slug,
      rank: 0,
      title,
      tagline,
      votes,
      url,
      category: classifyProductHunt(title, tagline),
      github: gh
        ? { url: gh.url, name: gh.name, stars: gh.stars, homepage: gh.homepage || null }
        : null,
      githubSearchUrl: `https://github.com/search?q=${encodeURIComponent(title)}&type=repositories`,
      firstSeenAt: fetchedAt,
      lastSeenAt: fetchedAt,
      firstVotes: votes,
      history: votes > 0 ? [{ at: day, votes }] : [],
    };
    lib.set(slug, entry);
  }

  for (const it of live) {
    const title = (it.title || "").trim();
    upsert(title, it.url || "", (it.extra?.hover || "").trim(), parseVotes(it.extra?.info || ""), fetchedAt);
  }
  for (const a of archive) {
    upsert(a.title, a.url, "", 0, `${a.day}T00:00:00+08:00`);
  }

  // 保留近 RETAIN_DAYS 天见过的条目，并计算增量
  const items: ProductHuntItem[] = [...lib.values()]
    .filter((it) => now - Date.parse(it.lastSeenAt) <= RETAIN_DAYS * 86_400_000)
    .map((it, i) => {
      const history = it.history.length ? it.history : [];
      const first = history.length ? history[0].votes : it.firstVotes || 0;
      const last = history.length ? history[history.length - 1].votes : it.votes;
      const delta = Math.max(0, (last || 0) - (first || 0));
      return {
        slug: it.slug,
        rank: i + 1,
        title: it.title,
        tagline: it.tagline || "",
        votes: it.votes || last || 0,
        url: it.url,
        category: it.category,
        github: it.github,
        githubSearchUrl: it.githubSearchUrl,
        delta,
        firstSeenAt: it.firstSeenAt,
        lastSeenAt: it.lastSeenAt,
        history: history.slice(-30),
      };
    })
    .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        schemaVersion: 2,
        fetchedAt,
        source: "NewsNow · Product Hunt 官方 API v2 + 历史档案回填（个人非商业）",
        count: items.length,
        items,
      },
      null,
      2,
    ),
    "utf8",
  );
  const withGh = items.filter((it) => it.github).length;
  const withDelta = items.filter((it) => (it.delta || 0) > 0).length;
  console.log(`[ph:sync] wrote ${items.length} apps · github matched ${withGh} · delta>0 ${withDelta}`);
}

main().catch((err) => {
  console.error("[ph:sync] fatal", err);
  process.exit(1);
});
