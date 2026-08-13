"""网页版自媒体热点：国内外 Top10 话题。

国内自媒体平台热榜（网页/公开聚合）：
- 微博 / 抖音 / B站热搜 / 知乎 / 今日头条 / 小红书探索页 SSR

海外自媒体/社交与创作者相关（网页）：
- TechCrunch Social RSS
- Product Hunt（创作者产品热榜近似）
- Hacker News RSS（过滤社交/创作者关键词）

输出：
- selfmedia_hot_topics.json
- selfmedia_hot_topics.md
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any
from urllib.parse import quote

from scrapling.fetchers import Fetcher

ROOT = Path(__file__).resolve().parent
OUT_JSON = ROOT / "selfmedia_hot_topics.json"
OUT_MD = ROOT / "selfmedia_hot_topics.md"

NEWSNOW = "https://newsnow.busiyi.world/api/s?id={id}&latest"

# 国内自媒体/内容平台热榜
CN_SOURCES = [
    ("weibo", "微博热搜", "国内"),
    ("douyin", "抖音热榜", "国内"),
    ("bilibili-hot-search", "B站热搜", "国内"),
    ("zhihu", "知乎热榜", "国内"),
    ("toutiao", "今日头条热榜", "国内"),
]

INTL_RSS = [
    (
        "techcrunch-social",
        "TechCrunch Social",
        "https://techcrunch.com/category/social/feed/",
        "海外",
    ),
    ("hacker-news", "Hacker News", "https://news.ycombinator.com/rss", "海外"),
]

PRODUCTHUNT_API = "https://newsnow.busiyi.world/api/s?id=producthunt&latest"

# 行业向关键词：用于海外通用源加权 / 标注
CREATOR_INDUSTRY_RE = re.compile(
    r"自媒体|创作者|短视频|直播|带货|粉丝|博主|网红|种草|口播|矩阵|"
    r"influencer|creator|tiktok|youtube|instagram|shorts?|reels?|"
    r"monetiz|revenue sharing|newsletter|substack|social media|"
    r"content creator|ugc|kol|直播带货",
    re.I,
)


def scrapling_get(url: str, **kwargs: Any) -> Any:
    return Fetcher.get(url, stealthy_headers=True, timeout=30, **kwargs)


def _body_text(page: Any) -> str:
    body = page.body
    if isinstance(body, bytes):
        return body.decode("utf-8", errors="replace")
    return str(body or "")


def _clean(text: str) -> str:
    text = unescape(re.sub(r"<[^>]+>", "", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def topic_type(title: str, source_id: str) -> str:
    if CREATOR_INDUSTRY_RE.search(title or ""):
        return "自媒体行业动态"
    if source_id in {
        "weibo",
        "douyin",
        "bilibili-hot-search",
        "zhihu",
        "toutiao",
        "xiaohongshu",
        "producthunt",
    }:
        return "平台热点（自媒体选题源）"
    return "社交/创作者相关"


def next_action(title: str, ttype: str, region: str) -> str:
    if ttype == "自媒体行业动态":
        return "拆平台规则变化（分成/算法/裁员）→ 更新账号矩阵与变现路径。"
    if region == "国内":
        return "可做：微博追热口播 / 小红书图文拆解 / 视频号解释向二创；先核事实再追流量。"
    return "同步中文摘要，判断能否做成国内创作者选题或工具类内容。"


def fetch_newsnow(source_id: str, label: str, region: str, limit: int = 12) -> tuple[list[dict], str]:
    url = NEWSNOW.format(id=source_id)
    page = scrapling_get(url)
    if page.status != 200:
        raise RuntimeError(f"{source_id} status={page.status}")
    data = json.loads(_body_text(page))
    items: list[dict] = []
    for i, row in enumerate((data.get("items") or [])[:limit], 1):
        title = _clean(row.get("title") or "")
        if not title:
            continue
        link = row.get("url") or row.get("mobileUrl") or ""
        if not link:
            link = f"https://s.weibo.com/weibo?q={quote(title)}" if source_id == "weibo" else ""
        ttype = topic_type(title, source_id)
        heat = max(1, 50 - i)
        if CREATOR_INDUSTRY_RE.search(title):
            heat += 12
        items.append(
            {
                "title": title,
                "url": link,
                "source": label,
                "source_id": source_id,
                "region": region,
                "rank_in_source": i,
                "type": ttype,
                "next": next_action(title, ttype, region),
                "heat": heat,
            }
        )
    return items, f"live:newsnow:{source_id}"


def fetch_xhs(limit: int = 10) -> tuple[list[dict], str]:
    page = scrapling_get("https://www.xiaohongshu.com/explore")
    if page.status != 200:
        raise RuntimeError(f"xhs status={page.status}")
    state = None
    for script in page.css("script::text").getall():
        if script and "window.__INITIAL_STATE__" in script:
            raw = script.split("window.__INITIAL_STATE__=", 1)[1].strip().rstrip(";")
            raw = raw.replace(":undefined", ":null")
            state = json.loads(raw)
            break
    if not state:
        raise RuntimeError("xhs missing __INITIAL_STATE__")
    feeds = (state.get("feed") or {}).get("feeds") or []
    items: list[dict] = []
    for i, item in enumerate(feeds, 1):
        card = item.get("noteCard") or {}
        title = _clean(card.get("displayTitle") or card.get("title") or "")
        if not title:
            continue
        user = card.get("user") or {}
        interact = card.get("interactInfo") or {}
        note_id = item.get("id")
        ttype = topic_type(title, "xiaohongshu")
        items.append(
            {
                "title": title,
                "url": f"https://www.xiaohongshu.com/explore/{note_id}",
                "source": "小红书探索页",
                "source_id": "xiaohongshu",
                "region": "国内",
                "rank_in_source": i,
                "type": ttype,
                "author": user.get("nickname"),
                "liked": interact.get("likedCount"),
                "next": next_action(title, ttype, "国内"),
                "heat": max(1, 45 - i) + (5 if interact.get("likedCount") else 0),
            }
        )
        if len(items) >= limit:
            break
    return items, "live:xhs-explore"


def fetch_rss(source_id: str, label: str, url: str, region: str, require_creator: bool) -> tuple[list[dict], str]:
    page = scrapling_get(url)
    if page.status != 200:
        raise RuntimeError(f"{source_id} status={page.status}")
    body = _body_text(page)
    blocks = re.findall(r"<item>(.*?)</item>", body, flags=re.I | re.S)
    items: list[dict] = []
    for i, block in enumerate(blocks, 1):
        tm = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", block, re.I | re.S)
        lm = re.search(r"<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>", block, re.I | re.S)
        title = _clean(tm.group(1) if tm else "")
        link = _clean(lm.group(1) if lm else "")
        if not title:
            continue
        if require_creator and not CREATOR_INDUSTRY_RE.search(title):
            continue
        ttype = topic_type(title, source_id)
        heat = max(1, 40 - i)
        if CREATOR_INDUSTRY_RE.search(title):
            heat += 15
        items.append(
            {
                "title": title,
                "url": link,
                "source": label,
                "source_id": source_id,
                "region": region,
                "rank_in_source": i,
                "type": ttype,
                "next": next_action(title, ttype, region),
                "heat": heat,
            }
        )
    return items, f"live:rss:{source_id}"


def dedupe_balanced(items: list[dict], limit: int = 10, min_each_region: int = 3) -> list[dict]:
    """综合热度取 TopN，并尽量保证国内/海外各至少 min_each_region。"""
    sorted_items = sorted(
        items, key=lambda x: (-(x.get("heat") or 0), x.get("rank_in_source") or 999)
    )
    picked: list[dict] = []
    seen: set[str] = set()

    def key_of(title: str) -> str:
        return re.sub(r"\W+", "", (title or "").lower())[:40]

    def try_add(it: dict) -> bool:
        k = key_of(it.get("title") or "")
        if not k or k in seen:
            return False
        seen.add(k)
        row = dict(it)
        row["rank"] = len(picked) + 1
        picked.append(row)
        return True

    # 先保证区域覆盖
    for region in ("国内", "海外"):
        count = 0
        for it in sorted_items:
            if it.get("region") != region:
                continue
            if try_add(it):
                count += 1
            if count >= min_each_region or len(picked) >= limit:
                break

    for it in sorted_items:
        if len(picked) >= limit:
            break
        try_add(it)

    # 重排 rank：按 heat
    picked.sort(key=lambda x: (-(x.get("heat") or 0), x.get("rank_in_source") or 999))
    for i, row in enumerate(picked[:limit], 1):
        row["rank"] = i
    return picked[:limit]


def build_next_steps(top: list[dict], sources: dict[str, Any]) -> list[dict]:
    cn = [t for t in top if t.get("region") == "国内"]
    intl = [t for t in top if t.get("region") == "海外"]
    industry = [t for t in top if t.get("type") == "自媒体行业动态"]
    return [
        {
            "signal": "国内外选题池",
            "what": f"Top10 中 国内 {len(cn)} / 海外 {len(intl)}",
            "next": "国内平台热点做当日追更；海外行业动态做规则解读与工具向内容。",
            "evidence": f"有效源 {sum(1 for v in sources.values() if v.get('ok'))}/{len(sources)}",
        },
        {
            "signal": "行业规则变化",
            "what": ("；".join(t["title"] for t in industry[:3]) if industry else "本轮 Top10 行业动态较少"),
            "next": "重点跟踪分成/算法/裁员类新闻，更新账号变现 checklist。",
            "evidence": f"行业动态命中 {len(industry)}",
        },
        {
            "signal": "分发动作",
            "what": "同一热点按平台改写，避免原样搬运。",
            "next": "微博短讯 → 小红书清单图 → 视频号 60s 口播；海外新闻补中文信息差角度。",
            "evidence": "脚本标注了每条 next 动作",
        },
    ]


def to_markdown(report: dict) -> str:
    lines = [
        "# 网页版自媒体热点 Top10（国内 + 海外）",
        "",
        f"- 生成时间：{report['generatedAt']}",
        f"- 工具：Scrapling",
        f"- 方法：{report['methodNote']}",
        "",
        "## 数据源状态",
        "",
    ]
    for sid, meta in report["sources"].items():
        flag = "OK" if meta.get("ok") else "FAIL"
        lines.append(
            f"- **{meta.get('label', sid)}**（{meta.get('region')}）：{flag} · `{meta.get('mode')}` · 条目 {meta.get('hits', 0)}"
        )
        if meta.get("error"):
            lines.append(f"  - error: {meta['error']}")
    lines += ["", "## Top10 热点话题", ""]
    for t in report["topics"]:
        lines.append(f"### {t['rank']}. {t['title']}")
        lines.append(f"- 区域/来源：{t['region']} · {t['source']}")
        lines.append(f"- 类型：{t['type']}")
        if t.get("author"):
            lines.append(f"- 作者/互动：{t.get('author')} · 点赞 {t.get('liked')}")
        lines.append(f"- 下一步：{t['next']}")
        if t.get("url"):
            lines.append(f"- 链接：[{t['url']}]({t['url']})")
        lines.append("")
    lines += ["## 汇总下一步", ""]
    for i, tr in enumerate(report["nextSteps"], 1):
        lines.append(f"{i}. **{tr['signal']}**：{tr['what']}")
        lines.append(f"   - 下一步：{tr['next']}")
        lines.append(f"   - 依据：{tr['evidence']}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    all_items: list[dict] = []
    sources: dict[str, Any] = {}

    for sid, label, region in CN_SOURCES:
        try:
            items, mode = fetch_newsnow(sid, label, region)
            all_items.extend(items)
            sources[sid] = {
                "label": label,
                "region": region,
                "ok": True,
                "mode": mode,
                "hits": len(items),
            }
        except Exception as e:  # noqa: BLE001
            sources[sid] = {
                "label": label,
                "region": region,
                "ok": False,
                "mode": "failed",
                "hits": 0,
                "error": f"{type(e).__name__}: {e}",
            }

    try:
        items, mode = fetch_xhs(10)
        all_items.extend(items)
        sources["xiaohongshu"] = {
            "label": "小红书探索页",
            "region": "国内",
            "ok": True,
            "mode": mode,
            "hits": len(items),
        }
    except Exception as e:  # noqa: BLE001
        sources["xiaohongshu"] = {
            "label": "小红书探索页",
            "region": "国内",
            "ok": False,
            "mode": "failed",
            "hits": 0,
            "error": f"{type(e).__name__}: {e}",
        }

    try:
        items, mode = fetch_newsnow("producthunt", "Product Hunt", "海外", limit=15)
        all_items.extend(items)
        sources["producthunt"] = {
            "label": "Product Hunt",
            "region": "海外",
            "ok": True,
            "mode": mode,
            "hits": len(items),
        }
    except Exception as e:  # noqa: BLE001
        sources["producthunt"] = {
            "label": "Product Hunt",
            "region": "海外",
            "ok": False,
            "mode": "failed",
            "hits": 0,
            "error": f"{type(e).__name__}: {e}",
        }

    for sid, label, url, region in INTL_RSS:
        require = sid == "hacker-news"  # HN 需创作者/社交关键词过滤
        try:
            items, mode = fetch_rss(sid, label, url, region, require_creator=require)
            # TechCrunch social 频道本身相关，全收；若为空再放宽
            all_items.extend(items)
            sources[sid] = {
                "label": label,
                "region": region,
                "ok": True,
                "mode": mode,
                "hits": len(items),
            }
        except Exception as e:  # noqa: BLE001
            sources[sid] = {
                "label": label,
                "region": region,
                "ok": False,
                "mode": "failed",
                "hits": 0,
                "error": f"{type(e).__name__}: {e}",
            }

    topics = dedupe_balanced(all_items, limit=10, min_each_region=3)
    next_steps = build_next_steps(topics, sources)

    report = {
        "generatedAt": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "tool": "scrapling",
        "methodNote": (
            "Scrapling 抓取国内自媒体平台公开热榜（微博/抖音/B站/知乎/头条/小红书网页）"
            "与海外 TechCrunch Social、Product Hunt、Hacker News（创作者向过滤）；"
            "综合热度并平衡国内/海外各至少 3 条，得到 Top10。"
        ),
        "sources": sources,
        "topics": topics,
        "nextSteps": next_steps,
        "stats": {
            "candidates": len(all_items),
            "topN": len(topics),
            "by_region": {
                "国内": sum(1 for t in topics if t.get("region") == "国内"),
                "海外": sum(1 for t in topics if t.get("region") == "海外"),
            },
        },
    }

    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_MD.write_text(to_markdown(report), encoding="utf-8")

    print(f"生成时间: {report['generatedAt']}")
    print(f"候选: {report['stats']['candidates']} → Top{report['stats']['topN']} "
          f"(国内 {report['stats']['by_region']['国内']} / 海外 {report['stats']['by_region']['海外']})")
    for sid, meta in sources.items():
        print(f"- {meta['label']}: {'OK' if meta['ok'] else 'FAIL'} / {meta['hits']}")
    print("\nTop10:")
    for t in topics:
        print(f"  {t['rank']}. [{t['region']}/{t['source']}] {t['title'][:88]}")
        print(f"     类型: {t['type']} | 下一步: {t['next']}")
    print(f"\n已保存: {OUT_JSON}")
    print(f"已保存: {OUT_MD}")


if __name__ == "__main__":
    main()
