# 项目作品夹

本目录放面试可展示的项目资产。

| 项目 | 类型 | 路径 | 说明 |
|------|------|------|------|
| 微迹 Weiji | 真实产品（Git 子模块） | [`weiji-mini/`](weiji-mini/) | 从 0 到 1 微信小程序，证明落地与产品闭环 |
| AI 功能方案 | 面试主作品（必做） | [`ai-feature-prd/`](ai-feature-prd/) | RAG/Agent/平台 三选一 PRD |
| 最小 RAG 验证 | 辅作品 | [`mini-rag-demo/`](mini-rag-demo/) | 验证假设，不炫技 |

## 微迹如何服务面试

上游仓库：https://github.com/lili171819931-collab/weiji-mini

建议叙事：
1. **从 0 到 1**：需求 → 信息架构 → 最小路径 → 可运行交付
2. **产品判断**：为何做微习惯、为何本地存储、砍掉了什么
3. **AI 升级想象**（加分）：在已有产品上如何加 AI（提醒、复盘、个性化）且何时不该加

详细面试转化见：[`weiji-interview.md`](weiji-interview.md)

## 克隆本仓库时拉取子模块

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 若已克隆：
git submodule update --init --recursive
```
