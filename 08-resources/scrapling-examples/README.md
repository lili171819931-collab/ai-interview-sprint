# Scrapling 示例脚本（情报研究工具箱）

> 归属学习仓：`08-resources/scrapling-examples/`  
> 产品挂钩：[`05-projects/07-ai-radar-dashboard`](../../05-projects/07-ai-radar-dashboard/) 的机会发现 / 雷达研究前置能力  
> 安装：`pip install "scrapling[all]" && scrapling install`

本目录用 [Scrapling](https://github.com/D4Vinci/Scrapling) 做**可复现的公开情报实验**，为智衡「机会简报」迭代提供研究输入，不替代产品内正式日更管线。

## 脚本清单

| 脚本 | 目标 | 输出 |
|------|------|------|
| `global_hot_topics_dashboard.py` | 国内外实时热点网页看板（NewsNow + RSS + Agent Reach + 可选 Exa/OpenCLI） | `global_hot_topics.json` + `.html`（自动打开） |
| `cn_platforms_hot_topics.py` | 微博 + 小红书 + 微信视频号(短视频代理) · 十大类热点/热度/来源/趋势 | `cn_platforms_hot_topics.json` + `.md` |
| `funding_hot_topics.py` | 国内外投融资 Top10 · 进展 / 下一步计划（财联社/华尔街见闻/格隆汇/金十 + TechCrunch） | `funding_hot_topics.json` + `.md` |
| `selfmedia_hot_topics.py` | 网页版自媒体热点 Top10（微博/抖音/B站/知乎/头条/小红书 + TechCrunch Social/PH/HN） | `selfmedia_hot_topics.json` + `.md` |
| `xhs_hot_notes.py` | 小红书探索页热门笔记标题（SSR） | `xhs_hot_notes.json` |
| `github_ai_top_repos.py` | GitHub `topic:ai` Star Top10 | `github_ai_top_repos.json` |
| `github_ai_new_repos_3m.py` | 近 3 个月新建 AI 项目 Star Top15 | `github_ai_new_repos_3m.json` |
| `github_one_person_company_top.py` | 一人公司 / 独立开发相关 Top5 | `github_one_person_company_top.json` |
| `github_trend_gap_profit_top.py` | 热点抓取 / 信息差 / 盈利点发现类 Top5 | `github_trend_gap_profit_top.json` |

## 与产品全流程的关系

```
研究（Scrapling 示例）
  → 发现对标与机会源（如 BuilderPulse）
    → 需求冻结与能力映射（docs/14）
      → 研发接入 /pulse
        → 验收与 GitHub 同步
```

## 合规提醒

- 优先使用官方 API / 公开 SSR；遵守目标站 ToS 与频率限制。  
- BuilderPulse 报告内容为 CC BY-NC：产品内仅结构化展示并署名，不做商业转载。  
- 示例 JSON 为某次运行快照，需重新跑脚本刷新。

## 快速运行

```bash
cd 08-resources/scrapling-examples
python3 global_hot_topics_dashboard.py  # 国内外实时热点 → 打开 HTML 看板
python3 cn_platforms_hot_topics.py   # 三平台十大类热点（在线失败自动降级）
python3 funding_hot_topics.py        # 国内外投融资 Top10 + 进展/下一步
python3 selfmedia_hot_topics.py      # 网页版自媒体国内外 Top10
python3 github_trend_gap_profit_top.py
python3 github_ai_new_repos_3m.py
```
