# 极致 Prompt：微迹 · 从产品设计到上线闭环（含面试仓包装）

> 可整段复制给 Cursor / Claude / GPT。  
> 目标：交付「可运行代码 + 完整文档 + 操作手册 + 面试叙事」，并更新到  
> `ai-interview-sprint/05-projects/`（叙事完整项目）与 `ai-projects/products/weiji-mini/`（唯一源码）。

---

```markdown
# Role
你是同时具备产品、交互、视觉、微信小程序工程、发布运维与面试作品包装能力的负责人。
任务：把「微习惯打卡」做成从 0 到 1 的**完整闭环项目**，不是只有代码或只有 PRD。

必须覆盖逻辑链：
产品冻结 → IA/规则/状态机 → 设计系统 → 可运行小程序
→ 本地验收 → 体验版分发 → 正式审核上线 → 迭代闭环
→ 写入 ai-interview-sprint/05-projects/01-weiji-product/
→ 源码唯一落点 ai-projects/products/weiji-mini/
→ 更新 PATH-MAP / 05-projects README → 推送 GitHub
→ 产出可复用极致 Prompt（自洽）

取舍原则：更短路径、更可演示、更少状态、文档与实现一致、公开仓无密钥。

---

# 一、成功定义（Done）
## A. 产品工程
- 可创建微习惯（模板+自定义，≤2 步）
- 今日打卡/取消（取消确认）
- streak 策略写死且实现一致（推荐策略 A）
- 今日进度、历史月历、本地存储
- 空/完成/错误态齐全；活跃习惯上限 7
- 页面 ≤ 4：今日 / 记录 / 创建 / 详情

## B. 文档包装（05-projects/01-weiji-product）
必须有：
README 总览、PRD、IA与流程、数据与规则、设计系统、
本地到上线操作手册、验收清单、面试叙事、极致 Prompt

## C. 源码仓（ai-projects/products/weiji-mini）
- 可导入微信开发者工具直接运行
- docs 含 0到1指南、体验版清单、GitHub步骤、Prompt
- AppID 公开占位 touristappid；私有配置 gitignore

## D. 上线闭环
- 写清：本地预览 → 上传体验版 → 体验成员 → 提审发布 → 迭代
- 明确：GitHub ≠ 微信版本
- 明确：游客 AppID 不可分发/提审

## E. GitHub
- 推送 ai-projects 与 ai-interview-sprint（或给可执行命令与阻断说明）
- 更新子模块指针（若源码有变）
- 不提交 AppSecret；不把无关脏文件（.vercel、demo.db 等）塞进提交

## 非目标
社交排行、云同步账号、复杂图表、订阅消息、AI 自动代打卡、付费社区。
AI 周复盘只作为后续接口指向 02-ai-weekly-insight，不塞进 MVP 首屏。

---

# 二、仓库拓扑（必须遵守，禁止再复制第二份源码）
```
ai-projects（唯一源码）
 └── products/weiji-mini/

ai-interview-sprint
 └── 05-projects/
      ├── ai-projects/          ← submodule → ai-projects
      ├── 01-weiji-product/     ← 完整项目文档（本任务增强）
      ├── PATH-MAP.md
      └── README.md
```
禁止在 01-weiji-product 再贴一份完整小程序源码副本。

---

# 三、产品规则（写死）
品牌：微迹 Weiji；主色 #1F7A6B；强调 #E39B6B。
Streak 策略 A：今日未打卡时展示截至昨天的连续天数。
禁止补打；软删归档；本地 YYYY-MM-DD；写失败 Toast。
首屏禁止运营杂讯。

---

# 四、时间盒（参考 150–180 分钟）
T0-15 冻结 MVP 与仓位策略
T15-40 PRD + IA + 规则
T40-100 代码可运行（若已有则对齐文档）
T100-140 01-weiji-product 完整文档 + 上线手册
T140-180 PATH-MAP/README + GitHub 推送 + Prompt 存档

---

# 五、输出顺序（严格）
Step 0 作战计划
Step 1 MVP 冻结
Step 2 用户故事 + Given/When/Then
Step 3 IA + 流程 + 状态机
Step 4 数据模型 + streak 伪代码
Step 5 设计系统
Step 6 可运行代码（或对齐现有实现）
Step 7 本地→体验→正式上线手册
Step 8 验收与演示脚本
Step 9 包装进 05-projects/01-weiji-product + 更新 PATH-MAP
Step 10 同步 ai-projects 文档并推送双仓
Step 11 面试叙事钩子（连到 02 周复盘）
Step 12 极致 Prompt 存档（本文件自洽）

---

# 六、质量红线
- 不允许只有 UI 没有规则
- 不允许 streak 含糊
- 不允许文档路径与真实仓位矛盾
- 不允许声称已上线/已推送但无 URL 或无可执行补救命令
- 不允许提交密钥与游客分发方案当作上线方案

---

# 七、开始指令
先检查工作区：若在 weiji-mini 独立旧仓，改为在 ai-projects + ai-interview-sprint 工作。
若需切换 root：对目标仓使用已存在或已 push 的分支名，避免 move 因缺 remote ref 失败。
立即从 Step 0 执行；取舍时砍 Should，不动 Must 与上线链路文档。
```

---

## 使用方式

1. **从零执行**：复制上方 fenced Prompt  
2. **只补文档包装**：追加 `源码已在 ai-projects/products/weiji-mini，只做 Step 7–12`  
3. **只补上线**：追加 `只产出并核对本地→体验→审核发布清单`  
4. **只推 GitHub**：追加 `文档已齐，执行双仓 commit/push 与 submodule 指针更新`
