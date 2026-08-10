"""用 Scrapling 抓取 GitHub 上服务于「一人公司」的项目，按 Star 取前 5。"""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode

from scrapling.fetchers import Fetcher

API_URL = "https://api.github.com/search/repositories"

# 覆盖中英文常见说法：一人公司 / solopreneur / indie hacker
SEARCH_Q = '"一人公司" OR solopreneur OR "indie hacker" OR "one-person business" OR "独立开发者"'


def fetch_top_repos(limit: int = 5) -> tuple[list[dict], int]:
    params = {
        "q": SEARCH_Q,
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

    data = json.loads(page.body.decode("utf-8") if isinstance(page.body, bytes) else page.body)
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
                "url": repo.get("html_url"),
                "homepage": repo.get("homepage") or None,
                "description": repo.get("description"),
                "language": repo.get("language"),
            }
        )
        if len(results) >= limit:
            break
    return results, data.get("total_count", 0)


def main() -> None:
    repos, total = fetch_top_repos(5)
    print(f"服务于「一人公司」相关项目（约匹配 {total} 个）Star Top {len(repos)}:\n")
    for r in repos:
        site = r["homepage"] or r["url"]
        print(f"{r['rank']}. {r['name']}  ⭐ {r['stars']:,}")
        print(f"   作者: {r['author']}  |  {r['author_url']}")
        print(f"   项目链接: {r['url']}")
        print(f"   网站链接: {site}")
        if r.get("description"):
            print(f"   简介: {r['description'][:120]}")
        print()

    out = Path(__file__).with_name("github_one_person_company_top.json")
    out.write_text(
        json.dumps({"query": SEARCH_Q, "total_count": total, "items": repos}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"已保存: {out}")


if __name__ == "__main__":
    main()
