# TrendRadar 本地使用速查
# 安装目录：08-resources/TrendRadar
# 官方：https://github.com/sansan0/TrendRadar
# 文档：https://trendradar.sandev.cc/zh/docs/quick-start/

## 已完成
- 安装 uv
- 克隆仓库并 `uv sync`
- 首次抓取成功（11 平台热榜 + RSS）
- HTML 报告服务：http://127.0.0.1:8080/html/latest/current.html

## 常用命令

```bash
export PATH="$HOME/.local/bin:$PATH"
cd 08-resources/TrendRadar

# 再跑一轮抓取（会自动打开报告）
uv run python -m trendradar

# 本地查看报告（若 8080 未启动）
cd output && python3 -m http.server 8080
# 浏览器打开：
# http://127.0.0.1:8080/html/latest/current.html
```

## 配置

- 主配置：`config/config.yaml`
- 本地试用已关闭：通知推送、AI 分析/翻译（避免无 Key 报错）
- 推送渠道（飞书/企微/钉钉/Telegram 等）需要在 `notification.channels` 填写 webhook 后把 `notification.enabled` 改回 `true`
- 可视化配置器：https://sansan0.github.io/TrendRadar/

## 说明

本目录为本地工具副本，默认不建议整仓提交（含 `.venv` / `output`）。需要推送通知时再按官网文档配置渠道。

## 同步进智衡 AI Radar

```bash
cd 05-projects/07-ai-radar-dashboard
npm run trendradar:sync
# → data/trendradar-hot.json
# → 页面：http://localhost:3010/radar#trendradar-hot
```

全流程包装：`05-projects/07-ai-radar-dashboard/docs/15-trendradar-fusion-full-loop.md`
