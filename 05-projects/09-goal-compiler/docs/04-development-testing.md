# 04 · 开发与测试

## 1. 技术栈（刻意零依赖）

| 层 | 技术 | 理由 |
|----|------|------|
| 服务端 | Node.js ≥18（全局 fetch）+ node:http | 零安装即可运行 |
| 前端 | 原生 HTML/CSS/ESM JS | 商务简约、秒开、数据不出本地 |
| 编译引擎 | 规则模板 + 领域知识库 | 确定性、可测试、可离线 |
| 爬虫 | GitHub Search API + HN Algolia + 精选库 | 多源、CORS 友好 |
| 测试 | Node 内置 test runner + CDP 驱动 Chrome | 零第三方 |

## 2. 目录结构

```
09-goal-compiler/
├── server/
│   ├── server.mjs          # HTTP 服务 + 静态 + API
│   └── crawler.mjs         # 竞品爬虫（github/hn/curated）
├── public/
│   ├── index.html          # 5 Tab 单页
│   ├── styles.css          # 商务简约设计系统
│   └── js/
│       ├── app.mjs         # 前端逻辑
│       ├── competitive.mjs # 竞品评分/定位矩阵/SWOT
│       └── compiler/
│           ├── analyzer.mjs  # 分词/领域/意图/实体
│           ├── goal.mjs      # 摘要 + 20 段 Goal 生成
│           ├── chain.mjs     # 14 节点思维链
│           └── index.mjs     # compile() 主入口
├── data/
│   ├── cases.json           # 3 测试用例
│   └── competitors.db.json  # 16 精选竞品
├── docs/                    # 项目制文档（6 篇 + 截图）
└── tests/
    ├── compile.test.mjs     # 引擎单测
    ├── api.test.mjs         # 服务端 API 测试
    └── e2e-cdp.mjs          # 浏览器端到端
```

## 3. 编译引擎设计

```
rawInput
  └→ analyzer（分词/领域/意图/实体/缺口）
       └→ goal（目标树/假设/边界/验收/路线/风险/建议/20 段 Goal）
            └→ chain（14 推理节点，含 input/reasoning/output/evidence/decisions）
                 └→ compile() 返回完整对象（可序列化、可测试、可编辑）
```

关键设计点：
- **确定性**：同输入同输出（幂等），可单测。
- **可追溯**：每个结论来自 analysis 字段，链节点引用 evidence。
- **可编辑**：Goal Prompt 存 textarea，支持保存/恢复/导出。
- **可学习**：思维链按「理解→建模→架构→执行」四阶段、14 节点展开。

## 4. 测试结果（实测）

### 单元测试 `node --test tests/compile.test.mjs tests/api.test.mjs`
```
✔ 用例「AI 面试官工具」编译结果结构完整
✔ 用例「报销发票小程序」编译结果结构完整
✔ 用例「AI 英语口语提升计划」编译结果结构完整
✔ 最终 Goal Prompt 包含 20 段强制结构 + 执行原则
✔ 不同诉求生成不同目标（对象抽取）
✔ 空输入应抛错
✔ 同一输入确定性输出（幂等）
✔ 目标树结构五层齐全
✔ API: health / cases / competitors / competitive
结果：9/9 通过
```

### 端到端测试 `node tests/e2e-cdp.mjs`（headless Chrome）
```
✔ 页面标题
✔ 点击编译后结果区显示
✔ ① 原始需求理解非空
✔ ⑨ Goal Prompt 可编辑且非空（3177 字符）
✔ Goal Prompt 人工编辑生效
✔ 思维链节点渲染（14 个）
✔ 补充建议条数（8）
✔ 竞品分析结果渲染
✔ 竞品表格行数（7）
✔ 产品总监建议非空（140 字）
结果：10/10 通过
```

### 爬虫实测（真实网络）
```
items: 25 | errors: none
GitHub 返回：autoresearch 5.8k★、vibecode-pro-max-kit 1k★、goal-setter-skill 97★ …
Hacker News + 精选库合并去重正常
```

## 5. 质量门槛评估

| Level | 标准 | 本产品 |
|-------|------|--------|
| 1 能运行 | ✅ | ✅ |
| 2 能正确运行 | ✅ | ✅ |
| 3 稳定运行 | ✅ | ✅（10/10 E2E） |
| 4 可维护 | ✅ | 模块化 + 注释 + 文档 |
| 5 可扩展 | ✅ | adapter 式爬虫、可插 LLM |
| 6 生产级 | ⏳ | 缺账号/云部署/压测 |
