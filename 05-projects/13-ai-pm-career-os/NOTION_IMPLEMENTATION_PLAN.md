# NOTION_IMPLEMENTATION_PLAN

> 目标：把 `lili Yang's Notion` 从“AI 学习资料库”升级为“AI Product Manager Career Operating System”
> 执行原则：就业结果 > 学习过程；项目制 > 课程制；Portfolio First；No Busywork

## 1. 执行条件

- Notion 写入权限：已具备（page / database / view / template 均可创建）
- 需要用户补充的关键输入：
  - 当前完整简历 / 工作经历时间线
  - 目标公司清单与 3-5 份真实 JD
  - 6 个 Portfolio 项目的优先级（可先按建议方向占位）
  - 期望薪资、城市/国家偏好

## 2. 顶层结构

新建顶层页面 `AI Product Manager Career OS`，下挂 18 个 section：

```text
01｜Career Dashboard
02｜AI PM Learning Roadmap
03｜AI Knowledge Base
04｜AI Product Frameworks
05｜Project Portfolio
06｜AI Product Projects
07｜AI Tools & Models
08｜Case Study Library
09｜Prompt Engineering
10｜Agent & AI Engineering
11｜Market & Competitor Research
12｜Interview Preparation
13｜Resume & Job Search
14｜Daily / Weekly Execution
15｜Portfolio Showcase
16｜Templates
17｜Resources
18｜Archive
```

## 3. 核心 Databases

| Database | 主要字段 | 用途 |
| --- | --- | --- |
| Career Goals | 目标岗位、目标行业、阶段、优先级、截止日期、状态 | Dashboard 目标区 |
| Learning Roadmap | 阶段、模块、技能、学习任务、产出物、关联项目、状态 | 学习闭环 |
| Knowledge Base | 主题、类型、摘要、来源、标签、关联项目 | 知识沉淀 |
| AI Product Frameworks | 框架名、适用场景、步骤、案例、熟练度 | 产品方法库 |
| Projects | 项目名、阶段、任务、完成率、Portfolio 状态、是否可面试展示 | 项目执行 |
| Project Tasks | 项目、任务、优先级、状态、截止日期、产出物 | 任务拆解 |
| Portfolio | 项目、成果、Demo/GitHub 链接、指标、面试故事 | 作品集 |
| Case Studies | 项目、背景、问题、方案、结果、复盘、STAR | 面试案例 |
| AI Tools & Models | 工具/模型、类型、用途、成本、替代品、熟练度 | 工具库 |
| Prompt Library | 场景、Prompt、变量、效果、版本 | Prompt 复用 |
| Agent & AI Engineering | 概念、原理、工具、项目、熟练度 | Agent 能力 |
| Market Research | 行业、公司、产品、趋势、机会、竞品 | 市场研究 |
| Interview Questions | 类别、问题、参考回答、STAR 关联、难度、状态 | 面试题库 |
| Interview Log | 公司、岗位、轮次、日期、问题、反馈、结果 | 面试记录 |
| Job Tracker | 公司、职位、JD 链接、匹配度、状态、截止日期、下一步 | 求职漏斗 |
| Resume Bullets | 岗位、经历、动作、结果、量化指标、可用版本 | 简历素材 |
| STAR Stories | Situation、Task、Action、Result、技能、关联岗位 | 行为面试 |
| Daily / Weekly Execution | 周期、目标、任务、完成情况、复盘 | 执行循环 |

## 4. 关键 Relations

```text
Career Goals ──< Learning Roadmap
Learning Roadmap ──< Knowledge Base
Learning Roadmap ──< Projects
Projects ──< Project Tasks
Projects ──< Portfolio
Projects ──< Case Studies
Case Studies ──< Interview Questions
Resume Bullets ──< Job Tracker
Job Tracker ──< Interview Log
Job Tracker ──< STAR Stories
Interview Questions ──< Interview Log
```

## 5. 模板

- Project Template：项目背景、目标、用户、PRD、架构、Demo、指标、复盘
- PRD Template：背景、目标、范围、用户流程、功能需求、非功能需求、指标、风险
- Case Study Template：背景、问题、方案、结果、量化数据、教训
- Resume Bullet Template：动词 + 任务 + 动作 + 量化结果
- Interview Question Template：问题、答题框架、参考回答、STAR 映射
- Job Application Template：公司、JD、匹配度、简历版本、投递状态、下一步
- Weekly Review Template：本周目标、完成项、阻塞、下周计划、学习/项目/求职进展

## 6. 内容种子（首批）

- Phase 0-6 学习路线：AI PM 认知 → AI 基础 → LLM Product → RAG → Agent → 产品设计/评估 → 商业化
- 6 个 Portfolio 项目建议：
  1. AI Knowledge Assistant（RAG）
  2. AI Product Requirement Generator（PRD + Agent）
  3. Career OS 本身（AI Product 求职系统）
  4. AI Radar Dashboard（已有项目可复用）
  5. AI 招聘 JD 匹配助手
  6. 汽车行业 AI 场景 Case Study
- 面试题库首批：自我介绍、AI PM 认知、LLM/RAG/Agent 原理、项目深挖、STAR 行为题
- Job Tracker 首批：空模板，等用户提供目标公司

## 7. 建库顺序

1. 创建顶层 `AI Product Manager Career OS`
2. 创建 18 个 section 页面
3. 创建核心数据库 + 关系
4. 创建 Dashboard
5. 创建模板
6. 写入学习路线、项目、知识、面试、求职种子内容
7. QA：架构、关系、导航、模板、执行闭环、面试可用性

## 8. 验收标准

- 首页 1 眼看到：目标、学习进度、项目进度、求职进度
- 学习能闭环到项目
- 项目能闭环到 Portfolio
- Portfolio 能闭环到简历
- 简历能闭环到面试
- 面试能闭环到 Offer
- 所有核心内容可复用、可更新、不重复堆砌
