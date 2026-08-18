# 数据库 Schema（设计蓝图）

目标 Schema（V1 用内存 JSON 实现，V2 可迁移 SQLite/Postgres）：

```text
users                用户（V2+）
projects             项目主表
project_metrics      Stars/Forks/Issues/Releases 等指标
project_categories   项目-分类 多对多
project_tags         项目标签
project_scores       8 维评分 + 专项分
project_reports      Project Intelligence Report（25 节 JSON）
project_features     功能树
project_architecture 架构拆解
project_business_models 商业模式
project_opportunities 产品机会生成器输出
project_industries   行业应用
project_growth_history 7/30/90 天增长历史
project_releases     Release 时间线
project_contributors 贡献者
watchlists           用户收藏
ai_conversations     AI 对话记录
```

## V1 数据模型（TypeScript 类型）
- `Project` — 项目主数据 + `growthHistory` + `profile`（0-10 智能体属性）
- `ProjectScores` — 12 个评分字段
- `ProjectReport` — sections(25) / verdict(10) / opportunities(≥5) / onePersonStartup / copyPath / dna / recommendedActions
- `CategoryId` — 30 分类枚举
