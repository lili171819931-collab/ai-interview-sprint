"""用 Scrapling 抓取小红书探索页前 10 条热门笔记标题。

说明：
- 网页版「搜索热榜 / 热点话题」通常要登录后才会加载。
- 探索页 SSR 的 __INITIAL_STATE__ 里已有推荐笔记，适合做 Scrapling 入门示例。
"""

from __future__ import annotations

import json
from pathlib import Path

from scrapling.fetchers import Fetcher


def parse_initial_state(page) -> dict:
    for script in page.css("script::text").getall():
        if not script or "window.__INITIAL_STATE__" not in script:
            continue
        raw = script.split("window.__INITIAL_STATE__=", 1)[1].strip().rstrip(";")
        # 小红书 JSON 里偶发 undefined，先替换再解析
        raw = raw.replace(":undefined", ":null")
        return json.loads(raw)
    raise RuntimeError("未找到 window.__INITIAL_STATE__")


def fetch_hot_notes(limit: int = 10) -> list[dict]:
    page = Fetcher.get(
        "https://www.xiaohongshu.com/explore",
        stealthy_headers=True,
        timeout=30,
    )
    if page.status != 200:
        raise RuntimeError(f"请求失败，status={page.status}")

    state = parse_initial_state(page)
    feeds = (state.get("feed") or {}).get("feeds") or []

    notes: list[dict] = []
    for item in feeds:
        card = item.get("noteCard") or {}
        title = (card.get("displayTitle") or card.get("title") or "").strip()
        if not title:
            continue

        user = card.get("user") or {}
        interact = card.get("interactInfo") or {}
        notes.append(
            {
                "rank": len(notes) + 1,
                "title": title,
                "author": user.get("nickname"),
                "liked": interact.get("likedCount"),
                "note_id": item.get("id"),
                "url": f"https://www.xiaohongshu.com/explore/{item.get('id')}",
            }
        )
        if len(notes) >= limit:
            break
    return notes


def main() -> None:
    notes = fetch_hot_notes(10)
    if not notes:
        print("没有解析到笔记，页面结构可能已变化。")
        return

    print(f"小红书探索页热门笔记 Top {len(notes)}:\n")
    for n in notes:
        print(f"{n['rank']:2d}. {n['title']}")
        print(f"    作者: {n['author']} | 点赞: {n['liked']}")
        print(f"    链接: {n['url']}\n")

    out = Path(__file__).with_name("xhs_hot_notes.json")
    out.write_text(json.dumps(notes, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已保存: {out}")


if __name__ == "__main__":
    main()
