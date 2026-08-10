# 14 · 机会简报能力迭代：项目制全流程包装

> 迭代代号：Opportunity Brief / BuilderPulse 对齐  
> 归属项目：`05-projects/07-ai-radar-dashboard`  
> 日期：2026-08-10  
> 目标用户：独立开发者、一人公司、AI 产品经理（需要「今天做什么」而不是「再刷一屏」）

---

## 0. 为什么做这一轮（问题定义）

智衡 AI Radar 已具备：

- 工具目录 + 七维评分（选型）
- 5 监控池雷达日报（情报）
- 来源可追溯（可信）

但仍缺一层**行动转化**：

| 已有能力 | 缺口 |
|----------|------|
| 知道行业在变 | 不知道「今天该做一个什么」 |
| 信号列表 | 缺少 Why now / 2 小时可执行方案 |
| 机会洞察短句 | 缺少结构化「发现机会」题库 |

对标公开项目 [BuilderPulse](https://github.com/BuilderPulse/BuilderPulse#chinese)：  
**一条高置信构建建议 + 多源交叉验证 + 机会发现题库**。

本轮把该能力以**非商业、可署名、可降级**的方式接入智衡，完成一次完整产品迭代闭环。

---

## 1. 立项与范围（Project Charter 增量）

### 1.1 目标

- 新增 `/pulse`「机会简报」页面，展示今日构建建议、Why now、2 小时构建、Top 信号、机会题库。
- `/radar` 增加摘要卡，形成「雷达发现 → 机会行动」漏斗。
- 建立 `pulse:install` / `pulse:sync` 日更管线，失败可降级到 seed。
- 用项目制文档证明：不是临时加页面，而是需求→设计→研发→验收→发布可追溯。

### 1.2 In / Out

| In Scope | Out of Scope |
|----------|--------------|
| 解析 BuilderPulse 公开中文日报结构 | 商用转载 / 付费二次分发（遵守 CC BY-NC） |
| 本地 vendor 安装与远程 raw 回退 | 登录爬取、绕过反爬、自动改七维分 |
| Zod 契约 + JSON 落盘 | 自研全量 300+ 源实时抓取引擎（下阶段） |
| 导航 / 演示 / 验收更新 | 用户账号体系、付费订阅 |

### 1.3 成功标准

- [x] `npm run pulse:install` 可安装/更新本地 BuilderPulse
- [x] `npm run pulse:sync` 产出 `data/builder-pulse-daily.json`
- [x] `/pulse`、`/radar` 可演示；`npm run build` 通过
- [x] 无网/解析失败时 seed 降级不白屏
- [x] README / IA / 验收清单 / 面试叙事同步更新

---

## 2. 需求冻结（Requirements）

### 2.1 用户故事

1. **作为**一人公司 Builder，**我希望**每天看到一条可执行构建建议，**以便**减少选题焦虑。  
2. **作为** AI PM，**我希望**看到 Why now 与反向视角，**以便**做机会评估而不是跟风。  
3. **作为**面试演示者，**我希望**讲清「雷达→机会」产品链路，**以便**证明产品判断力。

### 2.2 功能清单（MoSCoW）

| 优先级 | 功能 |
|--------|------|
| Must | 今日建议、Why now、2 小时构建、机会卡片、来源署名 |
| Should | Top 信号、白话简报、命中记录、radar 摘要入口 |
| Could | 远程 raw 同步（无 vendor 时） |
| Won't（本轮） | 自动生成原创付费报告、登录态抓取 |

### 2.3 非功能

- 许可合规：展示层标注 CC BY-NC 与原作者。
- 可靠：同步失败 → seed；页面可读。
- 可运维：安装与同步拆成独立 npm scripts。

---

## 3. 产品设计（IA / 交互）

### 3.1 信息架构增量

```
/radar   ← 5 池信号 + BuilderPulse 摘要卡（漏斗入口）
/pulse   ← 今日构建建议 + 机会发现题库（行动层）
```

导航新增：**机会简报**。

### 3.2 页面结构（/pulse）

1. 今日建议（Hero）  
2. 编辑视角 + 白话简报  
3. Top 信号  
4. 发现机会（分类卡片：发布 / 搜索 / 开源缺口 / 抱怨 / 技术选型 / 竞争 / 趋势 / 行动）  
5. 命中记录 + 许可与命令说明  

### 3.3 数据契约

见 `src/lib/pulse-types.ts` + `src/lib/pulse-schema.ts`：

- `buildIdea`：title / whyNow / timebox*
- `opportunities[]`：signal / plainSpeak / judgment / counterpoint
- `source`：local | remote | seed

---

## 4. 项目管理（里程碑）

| 里程碑 | 交付 | 状态 |
|--------|------|------|
| M1 研究对标 | 阅读 BuilderPulse 中文 README + 日报结构 | ✅ |
| M2 安装接入 | `pulse:install` → vendor（gitignore） | ✅ |
| M3 数据管线 | `sync-builder-pulse.ts` + JSON | ✅ |
| M4 产品界面 | `/pulse` + Nav + `/radar` 卡 | ✅ |
| M5 验收发布 | build / 文档 / GitHub 同步 | ✅ |

风险与对策：

- **许可风险** → 署名 + NC 声明，不二次商用打包原文  
- **解析脆弱** → Zod + seed 降级  
- **服务中断** → 运维上强调 `npm run dev` 常驻（ERR_CONNECTION_REFUSED 排查）

---

## 5. 研发实现（Engineering）

| 文件 | 作用 |
|------|------|
| `scripts/install-builder-pulse.sh` | 克隆/更新 BuilderPulse |
| `scripts/sync-builder-pulse.ts` | Markdown → JSON |
| `src/app/pulse/page.tsx` | 机会简报 UI |
| `src/lib/pulse-*.ts` | 类型 / Zod / 读取 |
| `src/data/pulse-seed.ts` | 离线基线 |
| `data/builder-pulse-daily.json` | 日更产物 |

命令：

```bash
npm run pulse:install
npm run pulse:sync
npm run data:refresh   # 含 pulse
npm run dev            # :3010 → /pulse
```

---

## 6. 测试与验收（QA）

见更新后的 [`验收清单.md`](验收清单.md)「机会简报」小节。

最小回归：

1. `pulse:sync` 成功，JSON 含 `buildIdea.title`  
2. 打开 `/pulse` 可见今日建议  
3. `/radar` 可见摘要卡并可跳转  
4. 删除 JSON 后仍可 seed 降级渲染  
5. `npm run build` 通过  

运维注意：若浏览器 `ERR_CONNECTION_REFUSED`，优先检查 3010 是否有 `next dev` 在听，而不是先怀疑页面代码。

---

## 7. 发布与运维（Release）

1. 文档与代码一并进入 `ai-interview-sprint` 主仓 `05-projects/07-*`  
2. `vendor/BuilderPulse` 不进仓（体积 + 上游日更），用 install 脚本拉取  
3. 演示路径：总览 → 动态雷达 → **机会简报** → 来源报告  

---

## 8. 商业与 AI PM 视角

### 价值主张

- Radar = **看见变化**  
- Pulse = **决定今天做什么**  

对一人公司：把信息差变成可执行构建清单。  
对企业选型台叙事：可延展为「内部机会简报」模块（自有源，不依赖第三方 NC 内容）。

### 下阶段（Roadmap）

1. 用 Scrapling / 公开 API 自建机会源（降低对第三方日报依赖）  
2. 机会卡片与工具目录候选池打通（一键进 seed）  
3. 周报复盘：哪些建议被验证 / 证伪  

研究侧示例已沉淀：`08-resources/scrapling-examples/`（热点、GitHub AI、一人公司、信息差类检索脚本）。

---

## 9. 面试一分钟讲法

> 这一轮我不是堆页面，而是补「情报→行动」闭环。对标 BuilderPulse 的产品结构，用项目制把需求、契约、安装同步、降级、验收和许可边界一次做完。演示时从 `/radar` 进 `/pulse`，能讲清 Why now，也能讲清为什么不自动改七维分、不违规抓取。

---

## 10. 关联文档

- [`00-project-charter.md`](00-project-charter.md)  
- [`ia.md`](ia.md)  
- [`验收清单.md`](验收清单.md)  
- [`interview-story.md`](interview-story.md)  
- [`演示脚本.md`](演示脚本.md)  
- 产品 README：[`../README.md`](../README.md)  
- 上游对标：https://github.com/BuilderPulse/BuilderPulse#chinese  
