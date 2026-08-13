"""国内三平台热点：微博 / 小红书 / 微信视频号（短视频侧）。

输出：
- 十大类热点话题（每类取代表性话题）
- 热度统计（排名 / 热度值 / 互动量）
- 信息来源 URL
- 下一步趋势判断（启发式，非模型幻觉榜）

抓取策略：
1. Scrapling 在线抓取（优先）
2. 失败时降级：TrendRadar 本地 SQLite（微博等）+ 本目录已有 JSON（小红书）
3. 微信视频号无公开官方热榜 API → 用「抖音热搜」作短视频侧公开代理，并标注 limitation

合规：仅公开页/公开聚合 API；频率克制；不做登录态破解。
"""

from __future__ import annotations

import json
import re
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

from scrapling.fetchers import Fetcher

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
TRENDRADAR_DB = REPO / "08-resources" / "TrendRadar" / "output" / "news"
OUT_JSON = ROOT / "cn_platforms_hot_topics.json"
OUT_MD = ROOT / "cn_platforms_hot_topics.md"

# 十大类（产品叙事用）
CATEGORIES: list[tuple[str, re.Pattern[str]]] = [
    ("社会民生", re.compile(r"暴雨|失联|去世|报警|警察|河南|深圳|女孩|海豚|民生|事故|救援|遗体|逃单", re.I)),
    ("娱乐明星", re.compile(r"易烊千玺|杨幂|百花奖|红毯|演员|明星|内娱|演唱会|粉丝", re.I)),
    ("科技数码", re.compile(r"AI|大疆|芯片|手机|苹果|华为|灵动岛|数码|科技|机器人|无人机", re.I)),
    ("财经商业", re.compile(r"创业|离职|融资|股价|财经|商业|种草|营销|电商|消费股", re.I)),
    ("体育赛事", re.compile(r"比赛|联赛|奥运|世界杯|NBA|足球|篮球|运动员|夺冠", re.I)),
    ("国际时政", re.compile(r"APEC|美国|特朗普|战争|外交|国际|峰会|制裁", re.I)),
    ("生活消费", re.compile(r"美食|旅游|穿搭|家居|探店|口红|护肤|外卖|餐厅|寿司", re.I)),
    ("影视综艺", re.compile(r"电影|剧集|综艺|闭幕式|票房|追剧|短剧", re.I)),
    ("游戏电竞", re.compile(r"游戏|电竞|Ning|Bin|LOL|王者|Steam|开黑", re.I)),
    ("健康教育", re.compile(r"健康|医院|教育|高考|考研|心理|疫苗|养生", re.I)),
]


def classify(title: str) -> str:
    for name, pat in CATEGORIES:
        if pat.search(title or ""):
            return name
    return "社会民生"  # 默认兜底大类


def _body_text(page: Any) -> str:
    body = page.body
    if isinstance(body, bytes):
        return body.decode("utf-8", errors="replace")
    return str(body or "")


def scrapling_get(url: str, **kwargs: Any) -> Any:
    return Fetcher.get(url, stealthy_headers=True, timeout=30, **kwargs)


# ---------- 微博 ----------
def fetch_weibo_live(limit: int = 30) -> tuple[list[dict], str]:
    url = "https://weibo.com/ajax/side/hotSearch"
    page = scrapling_get(url, headers={"Referer": "https://weibo.com/"})
    if page.status != 200:
        raise RuntimeError(f"weibo ajax status={page.status}")
    data = json.loads(_body_text(page))
    realtime = ((data.get("data") or {}).get("realtime")) or []
    items: list[dict] = []
    for i, row in enumerate(realtime[:limit], 1):
        word = (row.get("word") or row.get("note") or "").strip()
        if not word:
            continue
        heat = row.get("num") or row.get("raw_hot") or row.get("num_desc")
        items.append(
            {
                "rank": int(row.get("realpos") or i),
                "title": word,
                "heat": heat,
                "heat_label": str(heat) if heat is not None else None,
                "category": classify(word),
                "url": f"https://s.weibo.com/weibo?q={quote('#' + word + '#')}&Refer=top",
                "source": "weibo.com/ajax/side/hotSearch",
                "platform": "weibo",
                "flag": row.get("flag_desc") or row.get("category") or None,
            }
        )
    return items, "live:weibo-ajax"


def fetch_weibo_newsnow(limit: int = 30) -> tuple[list[dict], str]:
    url = "https://newsnow.busiyi.world/api/s?id=weibo&latest"
    page = scrapling_get(url)
    if page.status != 200:
        raise RuntimeError(f"newsnow weibo status={page.status}")
    data = json.loads(_body_text(page))
    items: list[dict] = []
    for i, row in enumerate((data.get("items") or [])[:limit], 1):
        title = (row.get("title") or "").strip()
        if not title:
            continue
        items.append(
            {
                "rank": i,
                "title": title,
                "heat": None,
                "heat_label": f"榜位#{i}",
                "category": classify(title),
                "url": row.get("url") or row.get("mobileUrl") or "",
                "source": "newsnow.busiyi.world?id=weibo",
                "platform": "weibo",
                "flag": None,
            }
        )
    return items, "live:newsnow-weibo"


def fetch_weibo_trendradar(limit: int = 30) -> tuple[list[dict], str]:
    dbs = sorted(TRENDRADAR_DB.glob("*.db"), reverse=True)
    if not dbs:
        raise RuntimeError("无 TrendRadar news db")
    db = dbs[0]
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT title, rank, url FROM news_items WHERE platform_id=? ORDER BY rank ASC LIMIT ?",
        ("weibo", limit),
    ).fetchall()
    conn.close()
    items = [
        {
            "rank": int(r["rank"]),
            "title": r["title"],
            "heat": None,
            "heat_label": f"榜位#{r['rank']}",
            "category": classify(r["title"]),
            "url": r["url"] or "",
            "source": f"TrendRadar/{db.name}",
            "platform": "weibo",
            "flag": None,
        }
        for r in rows
    ]
    return items, f"fallback:trendradar:{db.name}"


# ---------- 小红书 ----------
def parse_xhs_initial_state(page: Any) -> dict:
    for script in page.css("script::text").getall():
        if not script or "window.__INITIAL_STATE__" not in script:
            continue
        raw = script.split("window.__INITIAL_STATE__=", 1)[1].strip().rstrip(";")
        raw = raw.replace(":undefined", ":null")
        return json.loads(raw)
    raise RuntimeError("未找到 window.__INITIAL_STATE__")


def fetch_xhs_live(limit: int = 20) -> tuple[list[dict], str]:
    page = scrapling_get("https://www.xiaohongshu.com/explore")
    if page.status != 200:
        raise RuntimeError(f"xhs status={page.status}")
    state = parse_xhs_initial_state(page)
    feeds = (state.get("feed") or {}).get("feeds") or []
    items: list[dict] = []
    for item in feeds:
        card = item.get("noteCard") or {}
        title = (card.get("displayTitle") or card.get("title") or "").strip()
        if not title:
            continue
        interact = card.get("interactInfo") or {}
        liked = interact.get("likedCount")
        note_id = item.get("id")
        items.append(
            {
                "rank": len(items) + 1,
                "title": title,
                "heat": liked,
                "heat_label": f"点赞 {liked}" if liked is not None else None,
                "category": classify(title),
                "url": f"https://www.xiaohongshu.com/explore/{note_id}",
                "source": "xiaohongshu.com/explore SSR __INITIAL_STATE__",
                "platform": "xiaohongshu",
                "flag": (card.get("user") or {}).get("nickname"),
            }
        )
        if len(items) >= limit:
            break
    return items, "live:xhs-explore"


def fetch_xhs_cache(limit: int = 20) -> tuple[list[dict], str]:
    path = ROOT / "xhs_hot_notes.json"
    if not path.exists():
        raise RuntimeError("无 xhs_hot_notes.json 缓存")
    raw = json.loads(path.read_text(encoding="utf-8"))
    items = []
    for row in raw[:limit]:
        title = row.get("title") or ""
        items.append(
            {
                "rank": row.get("rank") or len(items) + 1,
                "title": title,
                "heat": row.get("liked"),
                "heat_label": f"点赞 {row.get('liked')}" if row.get("liked") is not None else None,
                "category": classify(title),
                "url": row.get("url") or "",
                "source": f"cache:{path.name}",
                "platform": "xiaohongshu",
                "flag": row.get("author"),
            }
        )
    return items, f"fallback:cache:{path.name}"


# ---------- 微信视频号（公开代理：抖音热搜 + 明示边界） ----------
def fetch_channels_proxy_live(limit: int = 20) -> tuple[list[dict], str, str]:
    """视频号无公开官方热榜；用抖音热搜作短视频侧公开对照。"""
    note = (
        "微信视频号无稳定公开官方热榜 API；本脚本用抖音热搜作短视频侧公开代理，"
        "并叠加「视频号」关键词弱相关话题（若有）。不可当作视频号官方榜。"
    )
    url = "https://newsnow.busiyi.world/api/s?id=douyin&latest"
    page = scrapling_get(url)
    if page.status != 200:
        raise RuntimeError(f"newsnow douyin status={page.status}")
    data = json.loads(_body_text(page))
    items: list[dict] = []
    for i, row in enumerate((data.get("items") or [])[:limit], 1):
        title = (row.get("title") or "").strip()
        if not title:
            continue
        items.append(
            {
                "rank": i,
                "title": title,
                "heat": None,
                "heat_label": f"短视频榜位#{i}",
                "category": classify(title),
                "url": row.get("url") or row.get("mobileUrl") or "",
                "source": "newsnow?id=douyin (微信视频号公开代理)",
                "platform": "weixin-channels-proxy-douyin",
                "flag": "proxy",
            }
        )
    return items, "live:douyin-proxy-for-channels", note


def fetch_channels_proxy_trendradar(limit: int = 20) -> tuple[list[dict], str, str]:
    note = (
        "微信视频号无官方公开热榜；降级使用 TrendRadar 本地 douyin 榜作短视频侧对照。"
    )
    dbs = sorted(TRENDRADAR_DB.glob("*.db"), reverse=True)
    if not dbs:
        raise RuntimeError("无 TrendRadar news db")
    db = dbs[0]
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT title, rank, url FROM news_items WHERE platform_id=? ORDER BY rank ASC LIMIT ?",
        ("douyin", limit),
    ).fetchall()
    conn.close()
    items = [
        {
            "rank": int(r["rank"]),
            "title": r["title"],
            "heat": None,
            "heat_label": f"短视频榜位#{r['rank']}",
            "category": classify(r["title"]),
            "url": r["url"] or "",
            "source": f"TrendRadar/{db.name}#douyin (微信视频号公开代理)",
            "platform": "weixin-channels-proxy-douyin",
            "flag": "proxy",
        }
        for r in rows
    ]
    return items, f"fallback:trendradar-douyin:{db.name}", note


def try_chain(fetchers: list) -> tuple[list[dict], str, list[str]]:
    errors: list[str] = []
    for fn in fetchers:
        try:
            result = fn()
            if len(result) == 2:
                items, mode = result
                return items, mode, errors
            items, mode, _extra = result
            return items, mode, errors
        except Exception as e:  # noqa: BLE001 — 演示脚本需吞掉单路失败
            errors.append(f"{fn.__name__}: {type(e).__name__}: {e}")
    return [], "failed", errors


def build_category_top(all_items: list[dict], per_cat: int = 3) -> list[dict]:
    by_cat: dict[str, list[dict]] = defaultdict(list)
    for it in all_items:
        by_cat[it["category"]].append(it)

    out: list[dict] = []
    for name, _ in CATEGORIES:
        pool = sorted(by_cat.get(name, []), key=lambda x: (x.get("rank") or 999))
        # 同题去重
        seen: set[str] = set()
        picked: list[dict] = []
        for it in pool:
            key = re.sub(r"\s+", "", it["title"])
            if key in seen:
                continue
            seen.add(key)
            picked.append(it)
            if len(picked) >= per_cat:
                break
        out.append(
            {
                "category": name,
                "count": len(by_cat.get(name, [])),
                "topics": picked,
            }
        )
    return out


def infer_trends(platforms: dict[str, list[dict]], category_top: list[dict]) -> list[dict]:
    """基于跨平台共现与类目分布做下一步趋势（可解释启发式）。"""
    title_counter: Counter[str] = Counter()
    cat_counter: Counter[str] = Counter()
    for items in platforms.values():
        for it in items[:15]:
            title_counter[it["title"]] += 1
            cat_counter[it["category"]] += 1

    cross = [t for t, c in title_counter.most_common(8) if c >= 2]
    hot_cats = [c for c, _ in cat_counter.most_common(3)]

    trends: list[dict] = []
    if hot_cats:
        trends.append(
            {
                "signal": "类目升温",
                "what": "、".join(hot_cats),
                "next": "内容侧优先做情绪/现场/解释型短内容；产品侧观察是否可沉淀为选题模板。",
                "evidence": f"类目计数 Top: {dict(cat_counter.most_common(5))}",
            }
        )
    if cross:
        trends.append(
            {
                "signal": "跨平台共振",
                "what": "；".join(cross[:5]),
                "next": "优先做二次解读与事实核对，避免纯搬运；可进入机会简报候选池。",
                "evidence": "同一标题在 ≥2 个数据源出现",
            }
        )
    # 平台差异：小红书偏生活方式 / 微博偏突发与娱乐
    xhs = platforms.get("xiaohongshu") or []
    weibo = platforms.get("weibo") or []
    if xhs and weibo:
        trends.append(
            {
                "signal": "平台分工",
                "what": "微博偏突发/娱乐热搜；小红书偏种草与生活方式笔记",
                "next": "同一话题做「微博追热 → 小红书种草拆解 → 视频号口播解释」三段式分发。",
                "evidence": f"样本 weibo={len(weibo)} xhs={len(xhs)}",
            }
        )
    trends.append(
        {
            "signal": "视频号能力边界",
            "what": "官方热榜不可稳定公开抓取",
            "next": "下阶段：账号矩阵手工采样 / 合作数据商 / 或用公开短视频榜作对照，不伪造视频号官方排名。",
            "evidence": "本报告短视频侧使用抖音公开代理",
        }
    )

    # 补充：空类目提醒
    empty = [c["category"] for c in category_top if not c["topics"]]
    if empty:
        trends.append(
            {
                "signal": "类目缺口",
                "what": "、".join(empty),
                "next": "扩大关键词映射或补充垂直源（体育/教育垂类榜）。",
                "evidence": "本轮十大类中无命中话题",
            }
        )
    return trends


def to_markdown(report: dict) -> str:
    lines = [
        f"# 国内三平台热点报告",
        f"",
        f"- 生成时间：{report['generatedAt']}",
        f"- 工具：Scrapling + 本地降级",
        f"",
        f"## 平台抓取状态",
        f"",
    ]
    for p, meta in report["platforms"].items():
        lines.append(
            f"- **{p}**：mode=`{meta['mode']}`，条目={len(meta['items'])}"
            + (f"；注：{meta['note']}" if meta.get("note") else "")
        )
        if meta.get("errors"):
            lines.append(f"  - errors: {'; '.join(meta['errors'][:3])}")
    lines += ["", "## 十大类热点（每类最多 3 条）", ""]
    for block in report["categoryTop"]:
        lines.append(f"### {block['category']}（命中 {block['count']}）")
        if not block["topics"]:
            lines.append("- （本轮无命中）")
            continue
        for t in block["topics"]:
            heat = t.get("heat_label") or "—"
            lines.append(
                f"- [{t['rank']}] {t['title']} · 热度:{heat} · 平台:{t['platform']} · [来源]({t['url']})"
            )
        lines.append("")
    lines += ["## 下一步趋势", ""]
    for i, tr in enumerate(report["trends"], 1):
        lines.append(f"{i}. **{tr['signal']}**：{tr['what']}")
        lines.append(f"   - 下一步：{tr['next']}")
        lines.append(f"   - 依据：{tr['evidence']}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    weibo_items, weibo_mode, weibo_err = try_chain(
        [fetch_weibo_live, fetch_weibo_newsnow, fetch_weibo_trendradar]
    )
    xhs_items, xhs_mode, xhs_err = try_chain([fetch_xhs_live, fetch_xhs_cache])

    channels_note = ""
    try:
        ch_items, ch_mode, channels_note = fetch_channels_proxy_live()
        ch_err: list[str] = []
    except Exception as e:  # noqa: BLE001
        ch_err = [f"fetch_channels_proxy_live: {type(e).__name__}: {e}"]
        try:
            ch_items, ch_mode, channels_note = fetch_channels_proxy_trendradar()
        except Exception as e2:  # noqa: BLE001
            ch_items, ch_mode = [], "failed"
            ch_err.append(f"fetch_channels_proxy_trendradar: {type(e2).__name__}: {e2}")

    platforms = {
        "weibo": {
            "label": "微博热搜",
            "mode": weibo_mode,
            "errors": weibo_err,
            "items": weibo_items,
            "note": None,
        },
        "xiaohongshu": {
            "label": "小红书探索热门",
            "mode": xhs_mode,
            "errors": xhs_err,
            "items": xhs_items,
            "note": "网页热榜常需登录；本脚本用探索页 SSR 公开笔记作热点近似。",
        },
        "weixin_channels": {
            "label": "微信视频号（公开短视频代理）",
            "mode": ch_mode,
            "errors": ch_err,
            "items": ch_items,
            "note": channels_note,
        },
    }

    all_items: list[dict] = []
    for meta in platforms.values():
        all_items.extend(meta["items"])

    category_top = build_category_top(all_items, per_cat=3)
    trends = infer_trends({k: v["items"] for k, v in platforms.items()}, category_top)

    # 热度统计摘要
    heat_stats = {
        "total_topics": len(all_items),
        "by_platform": {k: len(v["items"]) for k, v in platforms.items()},
        "by_category": {b["category"]: b["count"] for b in category_top},
        "top10_overall": sorted(all_items, key=lambda x: x.get("rank") or 999)[:10],
    }

    report = {
        "generatedAt": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "tool": "scrapling",
        "platforms": platforms,
        "heatStats": heat_stats,
        "categoryTop": category_top,
        "trends": trends,
        "methodNote": (
            "Scrapling 在线优先；失败降级 TrendRadar SQLite / 本地 JSON。"
            "微信视频号无官方公开热榜，短视频侧用抖音公开榜代理并标注。"
        ),
    }

    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_MD.write_text(to_markdown(report), encoding="utf-8")

    print(f"生成时间: {report['generatedAt']}")
    for k, meta in platforms.items():
        print(f"- {meta['label']}: {meta['mode']} / {len(meta['items'])} 条")
    print("\n十大类命中:")
    for b in category_top:
        sample = "；".join(t["title"] for t in b["topics"][:2]) or "—"
        print(f"  {b['category']}: {b['count']} | {sample}")
    print("\n下一步趋势:")
    for tr in trends:
        print(f"  · {tr['signal']}: {tr['what']}")
    print(f"\n已保存: {OUT_JSON}")
    print(f"已保存: {OUT_MD}")


if __name__ == "__main__":
    main()
