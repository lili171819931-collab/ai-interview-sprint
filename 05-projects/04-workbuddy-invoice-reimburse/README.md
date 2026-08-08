# 04 · WorkBuddy 发票报销 Skill

> 同源领域资产：面向 WorkBuddy 的发票报销智能专员（Prompt / Skill 包）  
> Web 可运行版本：[`../05-invoice-reimburse-web/`](../05-invoice-reimburse-web/)  
> 微信小程序版本：[`../06-piaoji-product/`](../06-piaoji-product/) · 源码 [`piaoji-mini`](../ai-projects/products/piaoji-mini/)

## 内容

| 路径 | 作用 |
|------|------|
| `极致Prompt-发票报销WorkBuddy.md` | 产品级极致 Prompt（类目/情景/CoT） |
| `skills/invoice-reimbursement/` | 可导入 WorkBuddy 的 Skill |
| `skills/.../references/` | 类目、情景、制度模板、CoT 管道 |
| `skills/.../scripts/validate_amounts.py` | 金额校验脚本示例 |
| `README.md` | 本说明 |

## 与票易报 / 票迹的关系

同一套费用类目、情景模式、合规思维链：

| 载体 | 目录 | 交付形态 |
|------|------|----------|
| **04** | 本目录 | 对话 Agent 快速出报销包 |
| **05** | `05-invoice-reimburse-web` | 多用户 Web 单据系统（审批/导出/留痕） |
| **06** | `06-piaoji-product` + `piaoji-mini` | 微信侧员工收票闭环 + 商业方案 |

面试时可讲：领域能力一次建模，多载体交付。
