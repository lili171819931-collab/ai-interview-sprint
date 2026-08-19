# NOTION_SYSTEM_AUDIT

> 审计时间：2026-08-18  
> 审计对象：`lili Yang's Notion`（lili171819931@gmail.com）

## 1. 执行环境

- Notion Workspace：lili Yang's Notion
- 当前用户：lili Yang（person，具备完整页面/数据库写入权限）
- 可用能力：create page、create database、create view、update page、duplicate page、move page、create comment
- 限制：`query_data_sources` 为限量版；`query_meeting_notes` 需要升级

## 2. 当前结构

### 2.1 顶层已有内容

| 页面 | 说明 | 与 Career OS 关系 |
| --- | --- | --- |
| 🔮 重启人生计划（365） | 个人人生 OS，包含健康/心理/情感/搞钱/学习/工作之旅 | 已有“工作之旅”入口 |
| 💡 个人指南｜Life Wiki | 个人 Wiki，含写作数据库、个人/副业/海外/技能提升 | 可复用个人背景信息 |
| 记录 | 普通记录页，下面挂着“面试准备” | 已有大量面试内容 |
| 微信读书知识库 / 理财 / 思维方法 / 副业探索 / PDCA周待办 等 | 个人知识与管理页面 | 可复用知识沉淀习惯 |

### 2.2 “工作之旅”已有分支

`重启人生计划（365） → 工作之旅`

- `AI 产品经理` 页面：包含 `岗位介绍`、`关键词`、`记录`
- `面试` 页面：包含 `招聘渠道`、`工作显化描述`、`自我介绍`

### 2.3 “面试准备”已有分支

`记录 → 面试准备`

- 自我认知：兴趣、能力、价值观、目标薪资（20K-25K）、目标平台（欧洲/德国/新加坡）
- 行业定位：AI 人工智能 & 低空经济，关注自动驾驶、机器人、低空经济
- 技能矩阵模板：Python、项目管理、Excel、Jira、跨部门沟通、英语 C1、德语
- Dream Offer 决策清单
- 行业调研框架（PEST + 岗位分析）
- `面试问题集合 → 学习清单-9.15 → 面试Q-结构大纲 → AI 产品经理版本 → AI产品经理`

## 3. 重复与冗余

- “AI产品经理 / AI 产品经理”存在多个重复页面，分别散落在不同祖先路径下
- “面试准备 / 面试问题集合 / 学习清单”层级较深，缺少统一导航
- 自我介绍模板有多个版本，未形成单一简历素材源

## 4. 已有可复用资产

- 个人背景：汽车行业 PM、技术推广、活动策划、总经理助理
- 教育背景：海外 CS Master（应用图像与信号处理方向）
- 目标岗位：AI 产品经理 / 海外项目经理 / AI 项目经理
- 面试素材：中英文自我介绍、岗位介绍、行业调研、技能矩阵
- 学习沉淀：自动驾驶、机器人、低空经济相关知识点

## 5. 缺失资源

- Career Dashboard 总控台
- 学习路线图数据库（Phase 0-6）
- 知识库数据库
- AI 产品框架库
- 项目组合 Portfolio 数据库
- 6 个 Portfolio 项目闭环
- AI 工具 & 模型数据库
- Case Study 库
- Prompt 库
- Agent / AI Engineering 学习库
- 市场与竞品调研数据库
- 面试题数据库
- 求职 Job Tracker
- 简历素材 / Bullet 数据库
- STAR Story 库
- 每日 / 每周执行循环
- 模板库
- 30/60/90 天路线图
- 能力雷达与 Gap Analysis

## 6. 建议架构

新建顶层页面：

```text
AI Product Manager Career OS
├── 01｜Career Dashboard
├── 02｜AI PM Learning Roadmap
├── 03｜AI Knowledge Base
├── 04｜AI Product Frameworks
├── 05｜Project Portfolio
├── 06｜AI Product Projects
├── 07｜AI Tools & Models
├── 08｜Case Study Library
├── 09｜Prompt Engineering
├── 10｜Agent & AI Engineering
├── 11｜Market & Competitor Research
├── 12｜Interview Preparation
├── 13｜Resume & Job Search
├── 14｜Daily / Weekly Execution
├── 15｜Portfolio Showcase
├── 16｜Templates
├── 17｜Resources
└── 18｜Archive
```

原则：不删除旧内容；把旧页面作为“历史素材”，通过关系/链接挂到新系统；新建内容以数据库为主，避免再次堆叠自由页面。

## 7. 结论

Notion 中已有“内容资产”，但缺少“执行系统”。需要优先补齐 Dashboard、核心数据库、关系、模板和项目闭环，而不是再收集资料。
