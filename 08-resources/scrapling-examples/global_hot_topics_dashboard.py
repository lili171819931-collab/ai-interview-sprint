#!/usr/bin/env python3
"""国内外实时热点网页看板。

聚合：
- 国内：微博 / 抖音 / B站热搜 / 知乎 / 头条 / 小红书（NewsNow + 公开页）
- 国内增强：V2EX / B站热门 / 雪球（Agent Reach）
- 海外：Hacker News / TechCrunch Social / Product Hunt
- 可选：Exa 全球科技热点；Reddit / Twitter / 小红书 OpenCLI（失败不阻断）

输出：
- global_hot_topics.json
- global_hot_topics.html（自动 open）
"""

from __future__ import annotations

import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
import webbrowser
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
OUT_JSON = ROOT / "global_hot_topics.json"
OUT_HTML = ROOT / "global_hot_topics.html"

NEWSNOW = "https://newsnow.busiyi.world/api/s?id={id}&latest"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

CN_NEWSNOW = [
    ("weibo", "微博热搜", "国内"),
    ("douyin", "抖音热榜", "国内"),
    ("bilibili-hot-search", "B站热搜", "国内"),
    ("zhihu", "知乎热榜", "国内"),
    ("toutiao", "今日头条热榜", "国内"),
]

INTL_RSS = [
    ("techcrunch-social", "TechCrunch Social", "https://techcrunch.com/category/social/feed/", "海外"),
    ("hacker-news", "Hacker News", "https://news.ycombinator.com/rss", "海外"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _ssl_context():
    try:
        import certifi  # type: ignore
        import ssl

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:  # noqa: BLE001
        import ssl

        return ssl.create_default_context()


def http_get(url: str, timeout: int = 25, headers: dict[str, str] | None = None) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept": "application/json,text/html,*/*", **(headers or {})},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
        return resp.read().decode("utf-8", errors="replace")


def _clean(text: str) -> str:
    text = unescape(re.sub(r"<[^>]+>", "", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def item(
    *,
    platform: str,
    region: str,
    rank: int,
    title: str,
    url: str = "",
    heat: Any = None,
    fetched_at: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "platform": platform,
        "region": region,
        "rank": rank,
        "title": title,
        "heat": heat,
        "url": url,
        "fetched_at": fetched_at,
    }
    if extra:
        row.update(extra)
    return row


def source_ok(label: str, region: str, mode: str, hits: int) -> dict[str, Any]:
    return {"label": label, "region": region, "ok": True, "mode": mode, "hits": hits}


def source_fail(label: str, region: str, err: Exception) -> dict[str, Any]:
    return {
        "label": label,
        "region": region,
        "ok": False,
        "mode": "failed",
        "hits": 0,
        "error": f"{type(err).__name__}: {err}",
    }


# ---------- NewsNow ----------
def fetch_newsnow(source_id: str, label: str, region: str, limit: int = 12) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    raw = http_get(NEWSNOW.format(id=source_id))
    data = json.loads(raw)
    items: list[dict] = []
    for i, row in enumerate((data.get("items") or [])[:limit], 1):
        title = _clean(row.get("title") or "")
        if not title:
            continue
        link = row.get("url") or row.get("mobileUrl") or ""
        if not link and source_id == "weibo":
            link = f"https://s.weibo.com/weibo?q={quote(title)}"
        items.append(
            item(
                platform=label,
                region=region,
                rank=i,
                title=title,
                url=link,
                heat=row.get("hot") or max(1, 50 - i),
                fetched_at=fetched_at,
                extra={"source_id": source_id},
            )
        )
    return items, source_ok(label, region, f"live:newsnow:{source_id}", len(items))


# ---------- RSS ----------
def fetch_rss(source_id: str, label: str, url: str, region: str, limit: int = 12) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    body = http_get(url)
    blocks = re.findall(r"<item>(.*?)</item>", body, flags=re.I | re.S)
    items: list[dict] = []
    for i, block in enumerate(blocks[: limit * 2], 1):
        tm = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", block, re.I | re.S)
        lm = re.search(r"<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>", block, re.I | re.S)
        title = _clean(tm.group(1) if tm else "")
        link = _clean(lm.group(1) if lm else "")
        if not title:
            continue
        items.append(
            item(
                platform=label,
                region=region,
                rank=len(items) + 1,
                title=title,
                url=link,
                heat=max(1, 40 - len(items)),
                fetched_at=fetched_at,
                extra={"source_id": source_id},
            )
        )
        if len(items) >= limit:
            break
    return items, source_ok(label, region, f"live:rss:{source_id}", len(items))


# ---------- 小红书（公开 explore SSR，失败可跳过）----------
def _parse_xhs_state(body: str) -> dict[str, Any]:
    m = re.search(r"window\.__INITIAL_STATE__\s*=\s*(\{.+?\});?\s*</script>", body, re.S)
    if not m:
        raise RuntimeError("missing __INITIAL_STATE__")
    return json.loads(m.group(1).replace(":undefined", ":null"))


def _xhs_items_from_state(state: dict[str, Any], limit: int, fetched_at: str, label: str, region: str) -> list[dict]:
    feeds = (state.get("feed") or {}).get("feeds") or []
    items: list[dict] = []
    for i, feed in enumerate(feeds, 1):
        card = feed.get("noteCard") or {}
        title = _clean(card.get("displayTitle") or card.get("title") or "")
        if not title:
            continue
        note_id = feed.get("id")
        interact = card.get("interactInfo") or {}
        items.append(
            item(
                platform=label,
                region=region,
                rank=i,
                title=title,
                url=f"https://www.xiaohongshu.com/explore/{note_id}",
                heat=interact.get("likedCount") or max(1, 45 - i),
                fetched_at=fetched_at,
                extra={"source_id": "xiaohongshu", "author": (card.get("user") or {}).get("nickname")},
            )
        )
        if len(items) >= limit:
            break
    return items


def fetch_xhs(limit: int = 10) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    label, region = "小红书探索页", "国内"
    errors: list[str] = []
    # 1) scrapling if installed
    try:
        from scrapling.fetchers import Fetcher  # type: ignore

        page = Fetcher.get("https://www.xiaohongshu.com/explore", stealthy_headers=True, timeout=30)
        if page.status != 200:
            raise RuntimeError(f"status={page.status}")
        body = page.body.decode("utf-8", errors="replace") if isinstance(page.body, bytes) else str(page.body or "")
        state = None
        scripts = page.css("script::text").getall() if hasattr(page, "css") else []
        for script in scripts:
            if script and "window.__INITIAL_STATE__" in script:
                raw = script.split("window.__INITIAL_STATE__=", 1)[1].strip().rstrip(";")
                state = json.loads(raw.replace(":undefined", ":null"))
                break
        if state is None:
            state = _parse_xhs_state(body)
        items = _xhs_items_from_state(state, limit, fetched_at, label, region)
        if items:
            return items, source_ok(label, region, "live:xhs-explore:scrapling", len(items))
        raise RuntimeError("empty feeds")
    except Exception as e:  # noqa: BLE001
        errors.append(f"scrapling:{type(e).__name__}: {e}")
    # 2) plain HTTP fallback
    try:
        body = http_get("https://www.xiaohongshu.com/explore", headers={"Referer": "https://www.xiaohongshu.com/"})
        state = _parse_xhs_state(body)
        items = _xhs_items_from_state(state, limit, fetched_at, label, region)
        if items:
            return items, source_ok(label, region, "live:xhs-explore:http", len(items))
        raise RuntimeError("empty feeds")
    except Exception as e:  # noqa: BLE001
        errors.append(f"http:{type(e).__name__}: {e}")
        return [], source_fail(label, region, RuntimeError(" | ".join(errors)))


# ---------- Agent Reach: V2EX ----------
def fetch_v2ex(limit: int = 12) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    label, region = "V2EX 热门", "国内"
    try:
        raw = http_get(
            "https://www.v2ex.com/api/topics/hot.json",
            headers={"User-Agent": "agent-reach/1.0"},
        )
        data = json.loads(raw)
        items = []
        for i, row in enumerate(data[:limit], 1):
            items.append(
                item(
                    platform=label,
                    region=region,
                    rank=i,
                    title=_clean(row.get("title") or ""),
                    url=row.get("url") or "",
                    heat=row.get("replies"),
                    fetched_at=fetched_at,
                    extra={"source_id": "v2ex"},
                )
            )
        return items, source_ok(label, region, "live:v2ex-api", len(items))
    except Exception as e:  # noqa: BLE001
        return [], source_fail(label, region, e)


# ---------- Agent Reach: bili hot ----------
def fetch_bili_hot(limit: int = 12) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    label, region = "B站热门视频", "国内"
    bili = shutil.which("bili") or str(Path.home() / ".local/bin/bili")
    if not Path(bili).exists() and not shutil.which("bili"):
        return [], source_fail(label, region, RuntimeError("bili CLI not found"))
    try:
        proc = subprocess.run(
            [bili if Path(bili).exists() else "bili", "hot", "-n", str(limit)],
            capture_output=True,
            text=True,
            timeout=60,
            env={**os.environ, "PATH": f"{Path.home() / '.local/bin'}:{os.environ.get('PATH', '')}"},
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "bili hot failed")
        # YAML-ish from bili; prefer json if present
        out = proc.stdout
        data = None
        try:
            data = json.loads(out)
        except json.JSONDecodeError:
            # parse simple yaml list under data.items
            titles = re.findall(r"^\s*title:\s*(.+)$", out, re.M)
            urls = re.findall(r"^\s*url:\s*(.+)$", out, re.M)
            views = re.findall(r"^\s*view:\s*(\d+)", out, re.M)
            items = []
            for i, title in enumerate(titles[:limit], 1):
                title = _clean(title.strip("'\""))
                url = urls[i - 1].strip() if i - 1 < len(urls) else ""
                heat = int(views[i - 1]) if i - 1 < len(views) else None
                items.append(
                    item(
                        platform=label,
                        region=region,
                        rank=i,
                        title=title,
                        url=url,
                        heat=heat,
                        fetched_at=fetched_at,
                        extra={"source_id": "bili-hot"},
                    )
                )
            return items, source_ok(label, region, "live:bili-cli", len(items))
        rows = (((data or {}).get("data") or {}).get("items")) or []
        items = []
        for i, row in enumerate(rows[:limit], 1):
            stats = row.get("stats") or {}
            items.append(
                item(
                    platform=label,
                    region=region,
                    rank=i,
                    title=_clean(row.get("title") or ""),
                    url=row.get("url") or "",
                    heat=stats.get("view"),
                    fetched_at=fetched_at,
                    extra={"source_id": "bili-hot"},
                )
            )
        return items, source_ok(label, region, "live:bili-cli", len(items))
    except Exception as e:  # noqa: BLE001
        return [], source_fail(label, region, e)


# ---------- Agent Reach: xueqiu via opencli ----------
def fetch_xueqiu(limit: int = 10) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    label, region = "雪球热帖", "国内"
    if not shutil.which("opencli"):
        return [], source_fail(label, region, RuntimeError("opencli not found"))
    try:
        proc = subprocess.run(
            ["opencli", "xueqiu", "hot", "-f", "yaml"],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "xueqiu hot failed")
        out = proc.stdout
        texts = re.findall(r"^\s*text:\s*>-?\s*\n((?:\s{4,}.*\n)+)", out, re.M) or re.findall(
            r"^\s*text:\s*(.+)$", out, re.M
        )
        urls = re.findall(r"^\s*url:\s*(https?://\S+)", out, re.M)
        likes = re.findall(r"^\s*likes:\s*(\d+)", out, re.M)
        items = []
        # Prefer block texts
        if texts and isinstance(texts[0], str) and "\n" in texts[0]:
            cleaned = [_clean(t) for t in texts]
        else:
            cleaned = [_clean(t) for t in texts]
        for i, title in enumerate(cleaned[:limit], 1):
            if len(title) > 120:
                title = title[:117] + "..."
            items.append(
                item(
                    platform=label,
                    region=region,
                    rank=i,
                    title=title or f"雪球热帖 #{i}",
                    url=urls[i - 1] if i - 1 < len(urls) else "",
                    heat=int(likes[i - 1]) if i - 1 < len(likes) else None,
                    fetched_at=fetched_at,
                    extra={"source_id": "xueqiu"},
                )
            )
        if not items:
            raise RuntimeError("no xueqiu items parsed")
        return items, source_ok(label, region, "live:opencli-xueqiu", len(items))
    except Exception as e:  # noqa: BLE001
        return [], source_fail(label, region, e)


# ---------- Optional OpenCLI social ----------
def fetch_opencli_yaml(platform: str, args: list[str], label: str, region: str, limit: int = 8) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    if not shutil.which("opencli"):
        return [], source_fail(label, region, RuntimeError("opencli not found"))
    try:
        proc = subprocess.run(
            ["opencli", platform, *args, "-f", "yaml"],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or f"{platform} failed")
        out = proc.stdout
        titles = re.findall(r"^\s*(?:title|text|name):\s*(.+)$", out, re.M)
        urls = re.findall(r"^\s*(?:url|link|permalink):\s*(https?://\S+)", out, re.M)
        items = []
        for i, title in enumerate(titles[:limit], 1):
            title = _clean(title.strip("'\""))
            if not title or title.lower() in {"true", "false"}:
                continue
            if len(title) > 140:
                title = title[:137] + "..."
            items.append(
                item(
                    platform=label,
                    region=region,
                    rank=len(items) + 1,
                    title=title,
                    url=urls[len(items)] if len(items) < len(urls) else "",
                    heat=None,
                    fetched_at=fetched_at,
                    extra={"source_id": f"opencli-{platform}"},
                )
            )
            if len(items) >= limit:
                break
        if not items:
            raise RuntimeError("no items parsed")
        return items, source_ok(label, region, f"live:opencli-{platform}", len(items))
    except Exception as e:  # noqa: BLE001
        return [], source_fail(label, region, e)


def _opencli_json(platform: str, args: list[str], timeout: int = 90) -> list:
    if not shutil.which("opencli"):
        raise RuntimeError("opencli not found")
    proc = subprocess.run(
        ["opencli", platform, *args, "-f", "json", "--window", "background"],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or f"{platform} failed").strip())
    raw = (proc.stdout or "").strip()
    if not raw:
        raise RuntimeError("no items parsed")
    data = json.loads(raw)
    if isinstance(data, dict):
        data = data.get("items") or data.get("data") or data.get("posts") or []
    if not isinstance(data, list) or not data:
        raise RuntimeError("no items parsed")
    return data


def fetch_reddit_hot(limit: int = 8) -> tuple[list[dict], dict]:
    """Reddit 热门：opencli `hot` 常返回空数组，改走 popular / frontpage。"""
    fetched_at = now_iso()
    label, region = "Reddit 热门", "海外"
    errors: list[str] = []
    for args in (["popular"], ["frontpage"], ["subreddit", "technology"]):
        try:
            rows = _opencli_json("reddit", args)
            items: list[dict] = []
            for row in rows:
                if not isinstance(row, dict):
                    continue
                title = _clean(str(row.get("title") or row.get("text") or ""))
                if not title:
                    continue
                url = str(row.get("url") or row.get("permalink") or row.get("link") or "")
                if url.startswith("/"):
                    url = "https://www.reddit.com" + url
                heat = row.get("score") or row.get("upvotes") or row.get("ups")
                items.append(
                    item(
                        platform=label,
                        region=region,
                        rank=len(items) + 1,
                        title=title[:140],
                        url=url if url.startswith("http") else "",
                        heat=heat if isinstance(heat, int) else None,
                        fetched_at=fetched_at,
                        extra={"source_id": "opencli-reddit", "via": " ".join(args)},
                    )
                )
                if len(items) >= limit:
                    break
            if items:
                return items, source_ok(label, region, f"live:opencli-reddit:{args[0]}", len(items))
            errors.append(f"{' '.join(args)}: empty")
        except Exception as e:  # noqa: BLE001
            errors.append(f"{' '.join(args)}: {e}")
    return [], source_fail(label, region, RuntimeError("; ".join(errors) or "no items parsed"))


def fetch_twitter_trends24(limit: int = 8) -> list[dict]:
    """公开 Worldwide 趋势页（不依赖已失效的 twitter-cli ClientTransaction）。"""
    fetched_at = now_iso()
    html = http_get("https://trends24.in/", timeout=30)
    block = re.search(r"class=trend-card__list>(.*?)</ol>", html, re.S)
    if not block:
        raise RuntimeError("trends24 list not found")
    names = re.findall(r"class=trend-link>([^<]+)", block.group(1))
    hrefs = re.findall(r'href="(https?://[^"]+)"', block.group(1))
    items: list[dict] = []
    seen: set[str] = set()
    for i, name in enumerate(names):
        title = _clean(unescape(name))
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        url = hrefs[i] if i < len(hrefs) else f"https://x.com/search?q={quote(title)}"
        items.append(
            item(
                platform="Twitter/X 趋势",
                region="海外",
                rank=len(items) + 1,
                title=title[:140],
                url=url,
                heat=None,
                fetched_at=fetched_at,
                extra={"source_id": "trends24"},
            )
        )
        if len(items) >= limit:
            break
    if not items:
        raise RuntimeError("no trends parsed")
    return items


# ---------- Optional Twitter via twitter-cli, fallback trends24 ----------
def fetch_twitter_trends(limit: int = 8) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    label, region = "Twitter/X 趋势", "海外"
    try:
        items = fetch_twitter_trends24(limit)
        return items, source_ok(label, region, "live:trends24", len(items))
    except Exception as primary:  # noqa: BLE001
        twitter = shutil.which("twitter") or str(Path.home() / ".local/bin/twitter")
        if not shutil.which("twitter") and not Path(twitter).exists():
            return [], source_fail(label, region, primary)
        bin_path = twitter if Path(twitter).exists() else "twitter"
        try:
            env = {
                **os.environ,
                "PATH": f"{Path.home() / '.local/bin'}:{Path.home() / '.agent-reach-venv/bin'}:{os.environ.get('PATH', '')}",
            }
            cfg_path = Path.home() / ".agent-reach" / "config.yaml"
            if cfg_path.exists():
                text = cfg_path.read_text(encoding="utf-8")
                for key, env_key in (
                    ("twitter_auth_token", "TWITTER_AUTH_TOKEN"),
                    ("twitter_ct0", "TWITTER_CT0"),
                    ("auth_token", "TWITTER_AUTH_TOKEN"),
                    ("ct0", "TWITTER_CT0"),
                ):
                    m = re.search(rf"^{key}:\s*[\"']?([^\s\"']+)", text, re.M)
                    if m and not env.get(env_key):
                        env[env_key] = m.group(1)
            proc = subprocess.run(
                [bin_path, "search", "AI OR tech OR startup", "-n", str(limit)],
                capture_output=True,
                text=True,
                timeout=90,
                env=env,
            )
            if proc.returncode != 0:
                raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "twitter search failed")
            out = proc.stdout
            titles = re.findall(r"^\s*(?:text|full_text|title):\s*(.+)$", out, re.M)
            urls = re.findall(r"^\s*(?:url|link):\s*(https?://\S+)", out, re.M)
            items: list[dict] = []
            for i, title in enumerate(titles[:limit], 1):
                title = _clean(title.strip("'\""))
                if not title:
                    continue
                if len(title) > 140:
                    title = title[:137] + "..."
                items.append(
                    item(
                        platform=label,
                        region=region,
                        rank=len(items) + 1,
                        title=title,
                        url=urls[len(items)] if len(items) < len(urls) else "",
                        heat=None,
                        fetched_at=fetched_at,
                        extra={"source_id": "twitter-cli"},
                    )
                )
                if len(items) >= limit:
                    break
            if not items:
                raise RuntimeError("no tweets parsed")
            return items, source_ok(label, region, "live:twitter-cli", len(items))
        except Exception:  # noqa: BLE001
            return [], source_fail(label, region, primary)


# ---------- Optional Exa ----------
def fetch_exa(limit: int = 8) -> tuple[list[dict], dict]:
    fetched_at = now_iso()
    label, region = "Exa 全球科技热点", "海外"
    if not shutil.which("mcporter"):
        return [], source_fail(label, region, RuntimeError("mcporter not found"))
    try:
        proc = subprocess.run(
            [
                "mcporter",
                "call",
                "exa.web_search_exa",
                'query="today trending tech AI news worldwide"',
                f"numResults={limit}",
            ],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "exa failed")
        out = proc.stdout
        # Parse Title/URL pairs from mcporter text output
        blocks = re.split(r"\n---\n", out)
        items = []
        for block in blocks:
            tm = re.search(r"^Title:\s*(.+)$", block, re.M)
            um = re.search(r"^URL:\s*(https?://\S+)", block, re.M)
            if not tm:
                continue
            items.append(
                item(
                    platform=label,
                    region=region,
                    rank=len(items) + 1,
                    title=_clean(tm.group(1)),
                    url=um.group(1) if um else "",
                    heat=None,
                    fetched_at=fetched_at,
                    extra={"source_id": "exa"},
                )
            )
            if len(items) >= limit:
                break
        if not items:
            # alternate pattern
            titles = re.findall(r'"title"\s*:\s*"([^"]+)"', out)
            urls = re.findall(r'"url"\s*:\s*"(https?://[^"]+)"', out)
            for i, title in enumerate(titles[:limit], 1):
                items.append(
                    item(
                        platform=label,
                        region=region,
                        rank=i,
                        title=_clean(title),
                        url=urls[i - 1] if i - 1 < len(urls) else "",
                        heat=None,
                        fetched_at=fetched_at,
                        extra={"source_id": "exa"},
                    )
                )
        if not items:
            raise RuntimeError("no exa results parsed")
        return items, source_ok(label, region, "live:exa-mcporter", len(items))
    except Exception as e:  # noqa: BLE001
        return [], source_fail(label, region, e)


def collect_all() -> dict[str, Any]:
    platforms: dict[str, list[dict]] = {}
    sources: dict[str, Any] = {}

    def register(sid: str, items: list[dict], meta: dict) -> None:
        sources[sid] = meta
        if items:
            platforms[meta["label"]] = items

    jobs = []

    def run(sid: str, fn, *args, **kwargs):
        try:
            items, meta = fn(*args, **kwargs)
        except Exception as e:  # noqa: BLE001
            items, meta = [], source_fail(sid, "未知", e)
        return sid, items, meta

    with ThreadPoolExecutor(max_workers=8) as ex:
        for sid, label, region in CN_NEWSNOW:
            jobs.append(ex.submit(run, sid, fetch_newsnow, sid, label, region))
        jobs.append(ex.submit(run, "producthunt", fetch_newsnow, "producthunt", "Product Hunt", "海外", 12))
        jobs.append(ex.submit(run, "xiaohongshu", fetch_xhs, 10))
        for sid, label, url, region in INTL_RSS:
            jobs.append(ex.submit(run, sid, fetch_rss, sid, label, url, region))
        jobs.append(ex.submit(run, "v2ex", fetch_v2ex, 12))
        jobs.append(ex.submit(run, "bili-hot", fetch_bili_hot, 12))
        jobs.append(ex.submit(run, "xueqiu", fetch_xueqiu, 10))
        jobs.append(ex.submit(run, "exa", fetch_exa, 8))
        # optional social — fail soft
        jobs.append(ex.submit(run, "reddit", fetch_reddit_hot, 8))
        jobs.append(ex.submit(run, "twitter", fetch_twitter_trends, 8))
        jobs.append(
            ex.submit(
                run,
                "xhs-opencli",
                fetch_opencli_yaml,
                "xiaohongshu",
                ["search", "热点"],
                "小红书(OpenCLI)",
                "国内",
                8,
            )
        )

        for fut in as_completed(jobs):
            sid, items, meta = fut.result()
            register(sid, items, meta)

    all_items = [it for rows in platforms.values() for it in rows]
    return {
        "generatedAt": now_iso(),
        "tool": "global_hot_topics_dashboard",
        "methodNote": (
            "NewsNow 公开聚合（微博/抖音/B站热搜/知乎/头条/PH）+ RSS（HN/TechCrunch）"
            " + Agent Reach（V2EX/B站热门/雪球）+ OpenCLI Reddit popular + Trends24 X 趋势；失败源页内标注。"
        ),
        "sources": sources,
        "platforms": platforms,
        "stats": {
            "platforms": len(platforms),
            "items": len(all_items),
            "sources_ok": sum(1 for v in sources.values() if v.get("ok")),
            "sources_total": len(sources),
            "by_region": {
                "国内": sum(1 for it in all_items if it.get("region") == "国内"),
                "海外": sum(1 for it in all_items if it.get("region") == "海外"),
            },
        },
    }


def render_html(report: dict[str, Any]) -> str:
    generated = html.escape(report["generatedAt"])
    stats = report["stats"]
    sources = report["sources"]
    platforms = report["platforms"]

    # Stable order: CN first then intl
    cn_order = [
        "微博热搜",
        "抖音热榜",
        "B站热搜",
        "B站热门视频",
        "知乎热榜",
        "今日头条热榜",
        "小红书探索页",
        "小红书(OpenCLI)",
        "V2EX 热门",
        "雪球热帖",
    ]
    intl_order = [
        "Hacker News",
        "TechCrunch Social",
        "Product Hunt",
        "Exa 全球科技热点",
        "Reddit 热门",
        "Twitter/X 趋势",
    ]

    def ordered(names: list[str]) -> list[tuple[str, list[dict]]]:
        seen = set()
        out: list[tuple[str, list[dict]]] = []
        for n in names:
            if n in platforms:
                out.append((n, platforms[n]))
                seen.add(n)
        for n, rows in platforms.items():
            if n not in seen:
                # classify leftover by first item region
                region = (rows[0].get("region") if rows else "") or ""
                if (names is cn_order and region == "国内") or (names is intl_order and region == "海外"):
                    out.append((n, rows))
                    seen.add(n)
        return out

    def platform_cards(pairs: list[tuple[str, list[dict]]]) -> str:
        if not pairs:
            return '<p class="empty">本区域暂无可用数据源</p>'
        chunks = []
        for name, rows in pairs:
            lis = []
            for row in rows:
                title = html.escape(str(row.get("title") or ""))
                url = html.escape(str(row.get("url") or ""))
                rank = html.escape(str(row.get("rank") or ""))
                heat = row.get("heat")
                heat_s = html.escape(str(heat)) if heat is not None else ""
                link = f'<a href="{url}" target="_blank" rel="noopener">{title}</a>' if url else title
                heat_html = f'<span class="heat">{heat_s}</span>' if heat_s else ""
                lis.append(f'<li><span class="rank">{rank}</span><div class="body">{link}{heat_html}</div></li>')
            chunks.append(
                f'<section class="platform"><h3>{html.escape(name)}</h3><ol>{"".join(lis)}</ol></section>'
            )
        return '<div class="grid">' + "".join(chunks) + "</div>"

    source_rows = []
    for sid, meta in sorted(sources.items(), key=lambda x: (0 if x[1].get("ok") else 1, x[1].get("label") or x[0])):
        flag = "ok" if meta.get("ok") else "fail"
        err = html.escape(str(meta.get("error") or ""))
        source_rows.append(
            "<tr>"
            f'<td><span class="dot {flag}"></span>{html.escape(meta.get("label") or sid)}</td>'
            f'<td>{html.escape(meta.get("region") or "")}</td>'
            f'<td>{html.escape(meta.get("mode") or "")}</td>'
            f'<td>{meta.get("hits", 0)}</td>'
            f'<td class="err">{err}</td>'
            "</tr>"
        )

    cn_html = platform_cards(ordered(cn_order))
    intl_html = platform_cards(ordered(intl_order))

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>国内外实时热点看板</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Serif+SC:wght@600;700&display=swap" rel="stylesheet" />
<style>
:root {{
  --bg0: #0f1419;
  --bg1: #171d25;
  --bg2: #1f2833;
  --line: #2c3744;
  --text: #e7edf4;
  --muted: #8b98a8;
  --accent: #3dd6c6;
  --warn: #e6b35a;
  --fail: #e26d6d;
  --ok: #62c98d;
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0;
  font-family: "IBM Plex Sans", "PingFang SC", sans-serif;
  color: var(--text);
  background:
    radial-gradient(1200px 600px at 10% -10%, #1a2a33 0%, transparent 55%),
    radial-gradient(900px 500px at 100% 0%, #243018 0%, transparent 45%),
    var(--bg0);
  min-height: 100vh;
}}
.wrap {{ max-width: 1200px; margin: 0 auto; padding: 28px 20px 64px; }}
header h1 {{
  font-family: "Noto Serif SC", serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  margin: 0 0 8px;
  letter-spacing: 0.02em;
}}
.sub {{ color: var(--muted); font-size: 0.95rem; line-height: 1.5; margin: 0 0 18px; }}
.meta {{
  display: flex; flex-wrap: wrap; gap: 10px 14px;
  margin-bottom: 22px;
}}
.chip {{
  background: var(--bg2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  color: var(--muted);
}}
.chip strong {{ color: var(--accent); font-weight: 600; }}
.tabs {{ display: flex; gap: 8px; margin: 8px 0 20px; }}
.tab {{
  appearance: none; border: 1px solid var(--line); background: var(--bg1);
  color: var(--muted); padding: 10px 16px; border-radius: 10px; cursor: pointer;
  font: inherit;
}}
.tab.active {{
  color: var(--bg0); background: var(--accent); border-color: var(--accent); font-weight: 600;
}}
.panel {{ display: none; }}
.panel.active {{ display: block; }}
.grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}}
.platform {{
  background: linear-gradient(180deg, var(--bg1), var(--bg2));
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 14px 8px;
  min-height: 180px;
}}
.platform h3 {{
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--line);
  padding-bottom: 8px;
}}
.platform ol {{ list-style: none; margin: 0; padding: 0; }}
.platform li {{
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(255,255,255,0.06);
}}
.platform li:last-child {{ border-bottom: 0; }}
.rank {{
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  padding-top: 2px;
}}
.body a {{
  color: var(--text);
  text-decoration: none;
  line-height: 1.35;
}}
.body a:hover {{ color: var(--accent); text-decoration: underline; }}
.heat {{
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.78rem;
}}
.empty {{ color: var(--muted); }}
footer {{
  margin-top: 36px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}}
footer h2 {{ font-size: 1.05rem; margin: 0 0 12px; }}
table {{
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
}}
th, td {{
  text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line);
  vertical-align: top;
}}
th {{ color: var(--muted); font-weight: 500; }}
.dot {{
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  margin-right: 8px;
}}
.dot.ok {{ background: var(--ok); }}
.dot.fail {{ background: var(--fail); }}
.err {{ color: var(--warn); max-width: 360px; word-break: break-word; }}
.note {{ color: var(--muted); font-size: 0.82rem; margin-top: 14px; line-height: 1.5; }}
@media (max-width: 640px) {{
  .wrap {{ padding: 18px 14px 48px; }}
  th:nth-child(3), td:nth-child(3) {{ display: none; }}
}}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>国内外实时热点看板</h1>
      <p class="sub">公开聚合 + Agent Reach 多源抓取 · 失败源见页脚状态 · 本地静态页可离线打开本次快照</p>
      <div class="meta">
        <div class="chip">生成时间 <strong>{generated}</strong></div>
        <div class="chip">可用源 <strong>{stats['sources_ok']}/{stats['sources_total']}</strong></div>
        <div class="chip">条目 <strong>{stats['items']}</strong></div>
        <div class="chip">国内 <strong>{stats['by_region']['国内']}</strong> · 海外 <strong>{stats['by_region']['海外']}</strong></div>
      </div>
      <div class="tabs" role="tablist">
        <button class="tab active" data-tab="cn" type="button">国内</button>
        <button class="tab" data-tab="intl" type="button">海外</button>
      </div>
    </header>

    <main>
      <div id="panel-cn" class="panel active">{cn_html}</div>
      <div id="panel-intl" class="panel">{intl_html}</div>
    </main>

    <footer>
      <h2>数据源状态</h2>
      <table>
        <thead><tr><th>来源</th><th>区域</th><th>模式</th><th>条目</th><th>错误</th></tr></thead>
        <tbody>{''.join(source_rows)}</tbody>
      </table>
      <p class="note">{html.escape(report.get('methodNote') or '')}<br/>
      刷新：在本目录执行 <code>python3 global_hot_topics_dashboard.py</code></p>
    </footer>
  </div>
<script>
document.querySelectorAll('.tab').forEach((btn) => {{
  btn.addEventListener('click', () => {{
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.getAttribute('data-tab') === 'intl' ? 'panel-intl' : 'panel-cn';
    document.getElementById(id).classList.add('active');
  }});
}});
</script>
</body>
</html>
"""


def main() -> None:
    print("抓取国内外实时热点…")
    report = collect_all()
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_HTML.write_text(render_html(report), encoding="utf-8")

    print(f"生成时间: {report['generatedAt']}")
    print(
        f"源 {report['stats']['sources_ok']}/{report['stats']['sources_total']} · "
        f"条目 {report['stats']['items']} "
        f"(国内 {report['stats']['by_region']['国内']} / 海外 {report['stats']['by_region']['海外']})"
    )
    for sid, meta in sorted(report["sources"].items(), key=lambda x: x[0]):
        flag = "OK" if meta.get("ok") else "FAIL"
        print(f"- {meta.get('label', sid)}: {flag} / {meta.get('hits', 0)}")
        if meta.get("error"):
            print(f"  ! {meta['error'][:160]}")
    print(f"\n已保存: {OUT_JSON}")
    print(f"已保存: {OUT_HTML}")

    if os.environ.get("HOT_NO_OPEN") == "1":
        print("跳过自动打开浏览器（HOT_NO_OPEN=1）")
    else:
        try:
            webbrowser.open(OUT_HTML.resolve().as_uri())
            print("已在浏览器打开看板")
        except Exception as e:  # noqa: BLE001
            print(f"自动打开失败，请手动打开: {OUT_HTML} ({e})", file=sys.stderr)


if __name__ == "__main__":
    main()
