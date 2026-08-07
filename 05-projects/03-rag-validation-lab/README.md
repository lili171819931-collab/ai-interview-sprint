# 03 · 评测验证 Lab：最小 RAG / Grounding 验证

> 类别：**Validation Lab**｜作用：证明懂评测，不只会写 PRD  
> 建议紧贴主作品：用「周复盘」的 Fact Card + 洞察做黄金集练习

## 目标

用最小成本证明你理解 **grounding / RAG 思维**：没有证据与评测，生成体验上不去。

## 与主作品的关系

主作品 [`../02-ai-weekly-insight/`](../02-ai-weekly-insight/) 已定义：
- Fact Card = 证据
- 校验器 / 降级 = 失败处理
- 黄金集 = 评测资产

本 Lab 把其中「评测」部分练成可展示产出。

## 两条路径（二选一）

### 路径 A：会一点代码
- 用任意框架搭一个本地/在线问答（文档 ≤ 20 篇），或模拟「Fact → Insight」生成
- 记录：切分/注入策略、效果、失败案例、改进

### 路径 B：不会代码（同样成立，推荐冲刺期）
用产品方式完成「人工模拟 grounding 评测」：
1. 从周复盘场景准备 10 条（问题/场景 + Fact 摘要）
2. 标注生成是否可上线（数字是否一致、是否越界）
3. 写生成约束与拒答/降级规则
4. 输出评测表与 3 条教训

可直接复用：[`../02-ai-weekly-insight/metrics.md`](../02-ai-weekly-insight/metrics.md) 中的评测表模板。

## 本目录交付（请补齐）

- [ ] [`hypothesis.md`](hypothesis.md)：要验证的假设
- [ ] [`eval-sheet.md`](eval-sheet.md)：≥10 条评测
- [ ] [`lessons.md`](lessons.md)：3 条可进面试的教训

## 面试怎么讲

「我不是为了做 demo 而做 demo，而是为了验证：没有事实约束和评测闸门，AI 复盘会破坏微迹的信任。」
