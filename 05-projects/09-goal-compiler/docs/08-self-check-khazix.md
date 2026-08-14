# 08 · 参考项目自检：对齐 khazix/leader 并补齐功能

> 依据 [khazix-skills/leader/SKILL.md](https://github.com/KKKKhazix/khazix-skills/blob/main/leader/SKILL.md) 逐项自检，
> 找出本平台缺失/薄弱能力并在 v11 补齐。

## 一、自检结论（12 项，全部对齐 ✅）

| # | khazix 能力 | 本平台之前 | v11 补齐情况 |
|---|------------|-----------|--------------|
| 1 | 执行型/探索型自动分流 | ❌ 缺失 | ✅ 新增 `# TASK TYPE`：按意图自动判别（research→探索型，其余→执行型），探索型改法（结论+置信度交付） |
| 2 | ≤4000 字符硬上限 | ⚠️ 无校验 | ✅ 新增 `compactGoalPrompt`（中文）+ `buildGoalPromptEnCompact`（英文精简模板）；超长自动压缩，就绪度显示 `N/4000` |
| 3 | 防作弊验收 | ⚠️ 泛化 | ✅ `# RULES`（法：禁止 .skip/放宽断言/mock/删测试/\|\| true）+ `# VALIDATION`（基线不可退/暗卷自留/反向验证） |
| 4 | 断点续跑 | ❌ 缺失 | ✅ `# CHECKPOINT & RESUME`：PROGRESS.md / 开工回执 / BLOCKED.md / 连败 3 次换路径 |
| 5 | 法 vs 情报分家 | ❌ 缺失 | ✅ `# RULES & GUIDANCE`：法（违反即不合格，可溯源）+ 情报（建议，可偏离但记录原因） |
| 6 | 多 Agent 并行 | ❌ 缺失 | ✅ `# MULTI-AGENT`：全局段/地界错开/接缝归属/共享写入点唯一归属 |
| 7 | 一次性提问 ≤5 + 选项 + 推荐 | ⚠️ 无上限 | ✅ AI 多轮澄清 5 问封顶，每题 4 个选项 + 推荐默认，可点选 |
| 8 | 任务 0 基线核验 + 实测数字 | ❌ 缺失 | ✅ TASK BREAKDOWN 任务 0：环境实测/基线数字/开工回执 |
| 9 | 明卷 + 暗卷验收 | ❌ 缺失 | ✅ FINAL REPORT 含明卷结果 + 暗卷结论 + 基线变化 |
| 10 | 可安装 SKILL 形态 | ✅ v4 已有 | ✅ 🧩 一键导出 SKILL.md |
| 11 | 交付三样（用法/任务书/收尾） | ⚠️ 部分 | ✅ Goal 顶部「使用指引（粘贴 /goal）」+ 编辑器 + 汇报 |
| 12 | 必要时联网调研 | ✅ v1 已有 | ✅ 竞品情报台 9 数据源 |

## 二、v11 新增/更新清单

- `public/js/compiler/goal.mjs`：Goal 新增 TASK TYPE / RULES & GUIDANCE / 任务 0 / CHECKPOINT / MULTI-AGENT / 防作弊 VALIDATION / 明卷暗卷 FINAL REPORT / 使用指引；`compactGoalPrompt` 双语 ≤4000
- `public/js/compiler/goal-en.mjs`：英文版同步补齐 + `buildGoalPromptEnCompact` 精简模板（≤4000）
- `public/js/compiler/index.mjs`：compile 输出 compact 双语版本
- `public/js/dialogue.mjs`：澄清 ≤5 问、每题选项+推荐、修复 nextQuestion 未含原始诉求的 bug
- `public/js/app.mjs`：就绪度显示字符预算；超长自动压缩；对话选项点选；About 页 khazix 自检面板（12/12 ✅）
- `docs/08-self-check-khazix.md`：本自检报告
