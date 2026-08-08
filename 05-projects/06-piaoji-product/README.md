# 06 · 票迹 Piaoji：发票报销小程序 · 产品设计 → 上线闭环

> 类别：**Real Product · Full Loop（B 端费控切口）**  
> 一句话：把散落在邮箱和相册里的发票，自动收齐、识别、对上账单，一键生成 HR 能收下的报销包。  
> 本目录 = **产品/设计/流程/上线/商业价值/面试叙事**；**可运行源码**在子模块。

```
产品冻结 → 品类/情景/合规 → IA/思维链 → Mock 闭环代码
    → 本地验收 → 体验版内测 → 正式审核路径 → 商业 90 天验证
```

---

## 源码在哪

| 角色 | 路径 / URL |
|------|------------|
| 本冲刺仓（子模块） | [`../ai-projects/products/piaoji-mini/`](../ai-projects/products/piaoji-mini/) |
| AI 项目集（唯一源码仓） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/piaoji-mini |
| 跨仓对照 | [`../PATH-MAP.md`](../PATH-MAP.md) |

```bash
# 推荐：只跑产品
git clone https://github.com/lili171819931-collab/ai-projects.git
# 微信开发者工具打开：ai-projects/products/piaoji-mini

# 或连同面试仓（含子模块）
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 打开：ai-interview-sprint/05-projects/ai-projects/products/piaoji-mini
```

---

## 本目录交付物（按阅读顺序）

| 顺序 | 文件 | 内容 |
|------|------|------|
| 0 | [`README.md`](README.md) | 总览与操作入口（本文） |
| 1 | [`01-prd.md`](01-prd.md) | 定位、用户、Must/Won’t、成功标准 |
| 2 | [`02-ia-and-flows.md`](02-ia-and-flows.md) | IA、主/异常流程、状态机、思维链 |
| 3 | [`03-data-and-rules.md`](03-data-and-rules.md) | 模型、匹配/合规伪代码、案例索引 |
| 4 | [`04-design-system.md`](04-design-system.md) | 品牌、视觉、组件、文案 |
| 5 | [`05-ops-local-to-online.md`](05-ops-local-to-online.md) | 本地 → 体验版 → 正式上线 |
| 6 | [`06-acceptance.md`](06-acceptance.md) | 验收、演示脚本、风险 |
| 7 | [`interview-story.md`](interview-story.md) | 面试叙事与 AI/平台升级取舍 |
| 8 | [`07-commercial-plan.md`](07-commercial-plan.md) | **商业价值分析**：Conditional Go + 90 天验证 |
| 9 | [`极致Prompt-产品到上线闭环.md`](极致Prompt-产品到上线闭环.md) | 工程闭环 Prompt 入口 |
| 10 | [`极致Prompt-票迹商业价值专用版.md`](极致Prompt-票迹商业价值专用版.md) | 商业化专用 Prompt（已预填） |

源码侧 docs：

- `../ai-projects/products/piaoji-mini/docs/00-从0到1完整指南.md`
- `../ai-projects/products/piaoji-mini/docs/01-产品设计与思维链.md`
- `../ai-projects/products/piaoji-mini/docs/02-案例数据分析.md`
- `../ai-projects/products/piaoji-mini/docs/极致Prompt-发票报销工具小程序从0到1.md`

---

## 与相邻项目的关系

| 目录 | 关系 |
|------|------|
| [`01-weiji-product`](../01-weiji-product/) | C 端轻工具闭环样本；票迹是 **B 端费控切口** 对照样本 |
| [`04-workbuddy-invoice-reimburse`](../04-workbuddy-invoice-reimburse/) | 技能/WorkBuddy 向探索（可并列，不替代本目录） |
| [`05-invoice-reimburse-web`](../05-invoice-reimburse-web/) | Web 向实验；**微信小程序可运行源码以 piaoji-mini 为准** |

---

## 10 分钟快速跑通

1. 克隆 `ai-projects` 或本仓（含子模块）  
2. 微信开发者工具导入 `products/piaoji-mini`  
3. 编译 → 工作台「同步邮箱」→「按情景生成报销单」→ 打开出差正式包 → 导出 HR 包并复制说明  
4. 抽查拦截：招待超额 / 培训超期 / 乘机人不一致  

---

## 故事链（面试）

> 我做了票迹：把「收票→识票→对账→合规→HR 报销包」收成可演示闭环，并用 15 个情景案例证明规则引擎可解释；商业上走中小企业费控切口，90 天验证「一次通过 HR 验收率」与付费试点。

对照微迹：微迹证明 **C 端轻闭环**；票迹证明 **B 端流程+合规+交付物** 产品力。
