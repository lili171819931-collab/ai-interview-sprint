# 极致 Prompt · 全网热点情报系统（Global Trend Intelligence）

> 原始需求 Prompt 归档。执行入口见：[`16-global-trend-intelligence-architecture.md`](./16-global-trend-intelligence-architecture.md)

本文件保存用户提出的完整产品诉求摘要，便于版本追溯。

## 产品一句话

不是 News Aggregator，而是 **Personal Global Trend Intelligence System**：  
用户每天 5～10 分钟掌握真正关心领域的核心变化（What / Why / Changing / Next / Attention / Action）。

## 流水线

采集 → 清洗 → 去重 → 聚类 → 热度计算 → 趋势判断 → AI 理解 → 领域分类 → 个性化排序 → 简报生成 → 推送

## 阶段门禁

按 Phase 1→12 推进；**每 Phase 测试 → 修错 → 更新 README → 下一阶段**。  
Phase 0/1（架构与确认）完成前不进入大规模编码。

## 合规红线

优先 RSSHub / 官方 API / 公开 RSS/Atom / 合法公开页。  
禁止设计绕过验证码、登录保护、访问控制或平台安全机制的方案。
