"""国内外投融资热点：抓取 Top10 话题、当前进展、下一步计划。

数据源（Scrapling 公开页/聚合 API，无登录破解）：
- 国内：NewsNow · 财联社 / 华尔街见闻热榜 / 格隆汇 / 金十
- 海外：TechCrunch Funding / Venture RSS

输出：
- funding_hot_topics.json
- funding_hot_topics.md
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
OUT_JSON = ROOT / "funding_hot_topics.json"
OUT_MD = ROOT / "funding_hot_topics.md"

NEWSNOW = "https://newsnow.busiyi.world/api/s?id={id}&latest"
CN_SOURCES = [
    ("cls", "财联社", "国内"),
    ("wallstreetcn-hot", "华尔街见闻热榜", "国内"),
    ("gelonghui", "格隆汇", "国内"),
    ("jin10", "金十数据", "国内"),
]
INTL_RSS = [
    ("techcrunch-funding", "TechCrunch Funding", "https://techcrunch.com/tag/funding/feed/", "海外"),
    ("techcrunch-venture", "TechCrunch Venture", "https://techcrunch.com/category/venture/feed/", "海外"),
]

FUNDING_RE = re.compile(
    r"融资|投融资|投资|募资|定增|增发|回购|IPO|上市|申购|并购|收购|私募|创投|"
    r"A轮|B轮|C轮|D轮|Pre-?A|种子轮|战略投资|领投|跟投|"
    r"fund(?:ing|raise)|raises?\b|raised\b|Series\s+[A-F]\b|venture|valuation|"
    r"acquisition|acquired|IPO|SPACs?|buyback|equity offering",
    re.I,
)

STAGE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("融资交割/到账", re.compile(r"raises?|raised|完成融资|获投|融资完成|closed", re.I)),
    ("募资进行中", re.compile(r"拟进行|拟议|计划融资|seeking|raises? an|fund to", re.I)),
    ("上市/二级市场进展", re.compile(r"IPO|上市|申购|发行|增发|普通股发行|buyback|回购", re.I)),
    ("并购重组", re.compile(r"并购|收购|收购|acquired|acquisition|股权结构变更", re.I)),
    ("机构配置/调研", re.compile(r"机构调研|增持|持仓|评级|外资配置|领投|跟投|investing in", re.I)),
    ("市场情绪/宏观资金", re.compile(r"泡沫|配置空间|佣金|涨跌|盘前|热度|长协", re.I)),
]


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


def infer_stage(title: str) -> str:
    for name, pat in STAGE_PATTERNS:
        if pat.search(title):
            return name
    return "事件跟踪中"


AMOUNT_RE = re.compile(
    r"("
    r"\$\s?\d+(?:\.\d+)?\s*(?:billion|million|B|M|K)\b|"
    r"\d+(?:\.\d+)?\s*(?:亿|万)\s*元|"
    r"\d+(?:\.\d+)?\s*亿美元|"
    r"数十亿\s*美元"
    r")",
    re.I,
)
AI_HARDTECH_RE = re.compile(
    r"(?<![A-Za-z])AI(?![A-Za-z])|大模型|芯片|半导体|机器人|robotaxi|drone|agentic",
    re.I,
)


def infer_progress(title: str, stage: str, region: str) -> str:
    t = title
    m_amt = AMOUNT_RE.search(t)
    amount = m_amt.group(1).strip() if m_amt else None
    bits = [f"阶段：{stage}"]
    if amount:
        bits.append(f"金额线索：{amount}")
    if AI_HARDTECH_RE.search(t):
        bits.append("赛道：AI/硬科技相关")
    if region == "海外" and re.search(r"raises?|fund", t, re.I):
        bits.append("海外创投叙事：轮次/估值信息通常随新闻稿同步披露")
    if region == "国内" and re.search(r"回购|增发|发行|申购", t):
        bits.append("国内资本市场：关注公告落地与认购进度")
    return "；".join(bits)


def infer_next_plan(title: str, stage: str, region: str) -> str:
    if stage == "融资交割/到账":
        return "跟踪资金用途（研发/扩张/并购）、下一轮时间窗口，以及竞品是否跟进融资。"
    if stage == "募资进行中":
        return "关注条款落地（估值/领投方）与监管/交易所披露；产品侧可放入机会简报「待验证」池。"
    if stage == "上市/二级市场进展":
        return "跟踪发行价/认购倍率/首日表现；对一人公司选题可做「二级市场情绪 vs 基本面」对照。"
    if stage == "并购重组":
        return "核对交易结构、控制权变化与协同叙事；观察是否带来行业整合连锁反应。"
    if stage == "机构配置/调研":
        return "把机构动向映射到产业链上下游标的，形成「谁在加仓 / 谁被调研」简报条目。"
    if AI_HARDTECH_RE.search(title):
        return "优先核对是否可映射到智衡雷达的 AI 机会卡片（融资→产品化→分发）。"
    if region == "海外":
        return "同步中文摘要与国内对标公司，判断是否存在信息差选题。"
    return "持续监测同源二次报道与官方公告，避免把传闻写成定论。"


def fetch_newsnow(source_id: str, label: str, region: str) -> tuple[list[dict], str]:
    url = NEWSNOW.format(id=source_id)
    page = scrapling_get(url)
    if page.status != 200:
        raise RuntimeError(f"{source_id} status={page.status}")
    data = json.loads(_body_text(page))
    items: list[dict] = []
    for i, row in enumerate(data.get("items") or [], 1):
        title = _clean(row.get("title") or "")
        if not title or not FUNDING_RE.search(title):
            continue
        link = row.get("url") or row.get("mobileUrl") or ""
        if not link and row.get("id"):
            link = f"https://newsnow.busiyi.world/s/{source_id}?q={quote(title)}"
        stage = infer_stage(title)
        items.append(
            {
                "title": title,
                "url": link,
                "source": label,
                "source_id": source_id,
                "region": region,
                "rank_in_source": i,
                "stage": stage,
                "progress": infer_progress(title, stage, region),
                "next_plan": infer_next_plan(title, stage, region),
                "heat": max(1, 40 - i),  # 榜位靠前更热
            }
        )
    return items, f"live:newsnow:{source_id}"


def fetch_rss(source_id: str, label: str, url: str, region: str) -> tuple[list[dict], str]:
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
        # TechCrunch funding feed 本身已是投融资频道，仍用关键词加分
        if source_id.startswith("techcrunch") or FUNDING_RE.search(title):
            if not FUNDING_RE.search(title) and not source_id.startswith("techcrunch"):
                continue
            stage = infer_stage(title)
            heat = max(1, 35 - i)
            if FUNDING_RE.search(title):
                heat += 8
            items.append(
                {
                    "title": title,
                    "url": link,
                    "source": label,
                    "source_id": source_id,
                    "region": region,
                    "rank_in_source": i,
                    "stage": stage,
                    "progress": infer_progress(title, stage, region),
                    "next_plan": infer_next_plan(title, stage, region),
                    "heat": heat,
                }
            )
    return items, f"live:rss:{source_id}"


def dedupe_rank(items: list[dict], limit: int = 10) -> list[dict]:
    seen: set[str] = set()
    ranked: list[dict] = []
    for it in sorted(items, key=lambda x: (-(x.get("heat") or 0), x.get("rank_in_source") or 999)):
        key = re.sub(r"\W+", "", (it.get("title") or "").lower())[:48]
        if not key or key in seen:
            continue
        seen.add(key)
        row = dict(it)
        row["rank"] = len(ranked) + 1
        ranked.append(row)
        if len(ranked) >= limit:
            break
    return ranked


def build_next_steps(top: list[dict], source_status: dict[str, Any]) -> list[dict]:
    cn = sum(1 for t in top if t.get("region") == "国内")
    intl = sum(1 for t in top if t.get("region") == "海外")
    stages = {}
    for t in top:
        stages[t["stage"]] = stages.get(t["stage"], 0) + 1
    top_stages = ", ".join(f"{k}×{v}" for k, v in sorted(stages.items(), key=lambda x: -x[1])[:3]) or "—"

    ai_hits = [t["title"] for t in top if AI_HARDTECH_RE.search(t["title"])]
    steps = [
        {
            "signal": "国内外投融资节奏",
            "what": f"Top10 中 国内 {cn} / 海外 {intl}；主导阶段：{top_stages}",
            "next": "日报固定输出「国内公告型 + 海外轮次型」双栏，避免只追单一市场噪声。",
            "evidence": f"有效源 {sum(1 for v in source_status.values() if v.get('ok'))}/{len(source_status)}",
        },
        {
            "signal": "AI/硬科技资金密度",
            "what": ("；".join(ai_hits[:3]) if ai_hits else "本轮 Top10 未显著命中 AI/硬科技融资标题"),
            "next": "把命中项写入智衡雷达机会卡：融资事件 → 产品能力 → 可做内容/分发动作。",
            "evidence": f"AI相关命中 {len(ai_hits)}",
        },
        {
            "signal": "进展核验优先级",
            "what": "优先核验「募资进行中 / 上市进展」，其次「已交割融资」与「并购重组」。",
            "next": "每条热点补：金额、轮次/工具、投资方、是否有官方公告链接。",
            "evidence": top_stages,
        },
        {
            "signal": "产品下一步",
            "what": "投融资热点可成为机会简报的资金面信号层。",
            "next": "接入 /radar：展示 Top10 + stage + next_plan；失败时降级展示上次 JSON 快照。",
            "evidence": "本脚本输出 funding_hot_topics.json",
        },
    ]
    return steps


def to_markdown(report: dict) -> str:
    lines = [
        "# 国内外投融资热点 Top10",
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
            f"- **{meta.get('label', sid)}**（{meta.get('region')}）：{flag} · mode=`{meta.get('mode')}` · 命中 {meta.get('hits', 0)}"
        )
        if meta.get("error"):
            lines.append(f"  - error: {meta['error']}")
    lines += ["", "## Top10 热点话题与进展", ""]
    for t in report["topics"]:
        lines.append(f"### {t['rank']}. {t['title']}")
        lines.append(f"- 区域/来源：{t['region']} · {t['source']}")
        lines.append(f"- 进展：{t['progress']}")
        lines.append(f"- 下一步计划：{t['next_plan']}")
        lines.append(f"- 链接：[{t['url']}]({t['url']})")
        lines.append("")
    lines += ["## 汇总：下一步计划", ""]
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

    for sid, label, url, region in INTL_RSS:
        try:
            items, mode = fetch_rss(sid, label, url, region)
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

    topics = dedupe_rank(all_items, limit=10)
    next_steps = build_next_steps(topics, sources)

    report = {
        "generatedAt": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "tool": "scrapling",
        "methodNote": (
            "Scrapling 抓取公开 NewsNow 财经源 + TechCrunch 投融资 RSS；"
            "按投融资关键词过滤并综合榜位热度取 Top10；进展/下一步为启发式标注，非投资建议。"
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
    print(f"候选投融资条目: {report['stats']['candidates']} → Top{report['stats']['topN']}")
    for sid, meta in sources.items():
        print(f"- {meta['label']}: {'OK' if meta['ok'] else 'FAIL'} / hits={meta['hits']}")
    print("\nTop10:")
    for t in topics:
        print(f"  {t['rank']}. [{t['region']}/{t['source']}] {t['title'][:80]}")
        print(f"     进展: {t['progress']}")
        print(f"     下一步: {t['next_plan']}")
    print("\n汇总下一步:")
    for tr in next_steps:
        print(f"  · {tr['signal']}: {tr['next']}")
    print(f"\n已保存: {OUT_JSON}")
    print(f"已保存: {OUT_MD}")


if __name__ == "__main__":
    main()
