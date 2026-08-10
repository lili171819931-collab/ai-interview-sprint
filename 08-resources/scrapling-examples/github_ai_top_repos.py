"""用 Scrapling 抓取 GitHub 上 AI 相关、Star 最多的前 10 个项目。

说明：
- GitHub 网页搜索容易 429 限流，这里用官方 Search API（同样由 Scrapling Fetcher 请求）。
- 「订阅/关注热度」在 GitHub 排行里通常用 Star（stargazers）衡量。
"""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode

from scrapling.fetchers import Fetcher


API_URL = "https://api.github.com/search/repositories"


def fetch_top_ai_repos(limit: int = 10) -> list[dict]:
    params = {
        # 带 topic:ai 的仓库，按 Star 降序
        "q": "topic:ai",
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
        raise RuntimeError(f"GitHub API 请求失败，status={page.status}")

    body = page.body.decode("utf-8") if isinstance(page.body, bytes) else page.body
    data = json.loads(body)

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
                "url": repo.get("html_url"),
                "description": repo.get("description"),
                "language": repo.get("language"),
            }
        )
        if len(results) >= limit:
            break
    return results


def main() -> None:
    repos = fetch_top_ai_repos(10)
    if not repos:
        print("没有拿到仓库数据。")
        return

    print(f"GitHub AI 相关项目 Star Top {len(repos)}:\n")
    for r in repos:
        print(f"{r['rank']:2d}. {r['name']}  ⭐ {r['stars']:,}")
        print(f"    作者: {r['author']}  |  {r['author_url']}")
        print(f"    链接: {r['url']}")
        if r.get("description"):
            print(f"    简介: {r['description'][:100]}")
        print()

    out = Path(__file__).with_name("github_ai_top_repos.json")
    out.write_text(json.dumps(repos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已保存: {out}")


if __name__ == "__main__":
    main()
