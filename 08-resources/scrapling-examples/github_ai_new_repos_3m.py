"""用 Scrapling 抓取近 3 个月新发布、AI 相关、Star 最多的前 15 个 GitHub 项目。"""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlencode

from scrapling.fetchers import Fetcher

API_URL = "https://api.github.com/search/repositories"


def since_days_ago(days: int = 90) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


def fetch_new_ai_repos(limit: int = 15, days: int = 90) -> list[dict]:
    since = since_days_ago(days)
    params = {
        # 近 N 天新创建 + topic:ai，按 Star 降序
        "q": f"topic:ai created:>{since}",
        "sort": "stars",
        "order": "desc",
        "per_page": str(limit),
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

    payload = page.body.decode("utf-8") if isinstance(page.body, bytes) else page.body
    data = json.loads(payload)

    results: list[dict] = []
    for i, repo in enumerate(data.get("items") or [], 1):
        owner = repo.get("owner") or {}
        results.append(
            {
                "rank": i,
                "name": repo.get("full_name"),
                "author": owner.get("login"),
                "author_url": owner.get("html_url"),
                "stars": repo.get("stargazers_count"),
                "forks": repo.get("forks_count"),
                "created_at": repo.get("created_at"),
                "url": repo.get("html_url"),
                "homepage": repo.get("homepage") or None,
                "description": repo.get("description"),
                "language": repo.get("language"),
            }
        )
        if len(results) >= limit:
            break
    return results, since, data.get("total_count", 0)


def main() -> None:
    repos, since, total = fetch_new_ai_repos(15, days=90)
    if not repos:
        print(f"近 3 个月（created:>{since}）没有匹配到 AI 项目。")
        return

    print(f"近 3 个月新发布 AI 项目（created:>{since}，共匹配约 {total} 个）")
    print(f"按 Star 排序 Top {len(repos)}:\n")

    for r in repos:
        site = r["homepage"] or r["url"]
        print(f"{r['rank']:2d}. {r['name']}  ⭐ {r['stars']:,}")
        print(f"    作者: {r['author']}  |  {r['author_url']}")
        print(f"    创建: {r['created_at']}")
        print(f"    项目链接: {r['url']}")
        print(f"    网站链接: {site}")
        if r.get("description"):
            print(f"    简介: {r['description'][:110]}")
        print()

    out = Path(__file__).with_name("github_ai_new_repos_3m.json")
    out.write_text(
        json.dumps({"since": since, "total_count": total, "items": repos}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"已保存: {out}")


if __name__ == "__main__":
    main()
