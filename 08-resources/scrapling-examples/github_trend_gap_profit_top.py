"""抓取 GitHub 上「热点抓取 / 信息差 / 盈利点发现」类项目，按 Star 取前 5。"""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlencode

from scrapling.fetchers import Fetcher

API_URL = "https://api.github.com/search/repositories"

# GitHub Search 最多 5 个 OR；覆盖热点抓取 / 舆情 / 选题变现 / 机会发现
SEARCH_Q = '"热点抓取" OR "热点监控" OR "爆款选题" OR TrendRadar OR AIWriteX OR BuilderPulse'

# 用于去掉明显跑题仓库（标题/简介都不沾边）
RELEVANCE = re.compile(
    r"热点|热搜|舆情|趋势|信息差|选题|机会|trend|radar|scrape|监控|聚合|intelligence|gap",
    re.I,
)


def fetch_top(limit: int = 5) -> tuple[list[dict], int]:
    params = {
        "q": SEARCH_Q,
        "sort": "stars",
        "order": "desc",
        "per_page": "30",
    }
    page = Fetcher.get(
        f"{API_URL}?{urlencode(params)}",
        stealthy_headers=True,
        headers={
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=30,
    )
    if page.status != 200:
        body = page.body.decode("utf-8", errors="replace") if isinstance(page.body, bytes) else page.body
        raise RuntimeError(f"GitHub API 失败 status={page.status}: {body[:300]}")

    data = json.loads(page.body.decode("utf-8") if isinstance(page.body, bytes) else page.body)
    results: list[dict] = []
    seen_names: set[str] = set()

    for repo in data.get("items") or []:
        full_name = repo.get("full_name") or ""
        # 过滤同名 fork 噪音：同名 TrendRadar 只保留 star 最高的
        base = full_name.split("/")[-1].lower()
        if base in seen_names and base in {"trendradar"}:
            continue

        blob = " ".join(
            [
                full_name,
                repo.get("description") or "",
                " ".join(repo.get("topics") or []),
            ]
        )
        if not RELEVANCE.search(blob):
            continue

        owner = repo.get("owner") or {}
        results.append(
            {
                "rank": len(results) + 1,
                "name": full_name,
                "author": owner.get("login"),
                "author_url": owner.get("html_url"),
                "stars": repo.get("stargazers_count"),
                "created_at": repo.get("created_at"),
                "updated_at": repo.get("updated_at"),
                "pushed_at": repo.get("pushed_at"),
                "url": repo.get("html_url"),
                "homepage": repo.get("homepage") or None,
                "description": repo.get("description"),
            }
        )
        seen_names.add(base)
        if len(results) >= limit:
            break

    return results, data.get("total_count", 0)


def main() -> None:
    repos, total = fetch_top(5)
    print(f"热点抓取 / 信息差 / 盈利点发现 类项目（约匹配 {total} 个）Star Top {len(repos)}:\n")
    for r in repos:
        print(f"{r['rank']}. {r['name']}  ⭐ {r['stars']:,}")
        print(f"   作者: {r['author']}  |  {r['author_url']}")
        print(f"   创建日期: {r['created_at'][:10]}  |  最近推送: {(r.get('pushed_at') or '')[:10]}")
        print(f"   链接: {r['url']}")
        if r.get("homepage"):
            print(f"   网站: {r['homepage']}")
        if r.get("description"):
            print(f"   简介: {r['description'][:130]}")
        print()

    out = Path(__file__).with_name("github_trend_gap_profit_top.json")
    out.write_text(
        json.dumps({"query": SEARCH_Q, "total_count": total, "items": repos}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"已保存: {out}")


if __name__ == "__main__":
    main()
