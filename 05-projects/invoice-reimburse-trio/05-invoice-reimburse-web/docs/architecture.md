# 架构说明：票易报（产品 + 工程视角）

## 1. 系统草图

```
[浏览器 Web]
  登录 / 工作台 / 报销单详情 / 制度页
        │
        ▼
[Next.js App Router]
  Route Handlers（auth / claims / invoices / export）
        │
        ├─► Extractor（Mock OCR，可替换真实 Provider）
        ├─► Classifier（类目启发式 + 可手改）
        ├─► Compliance Engine（确定性规则）
        ├─► Pipeline Orchestrator（Stage 0–10）
        └─► Prisma + SQLite（可迁 Postgres）
```

## 2. 为什么这样拆

| 模块 | 产品原因 |
|------|----------|
| 识别与合规分离 | 财务信任来自规则，不是模型口才 |
| 金额用「分」整数 | 避免浮点误差导致勾稽失败 |
| Claim 状态机 | 草稿可改；提交后锁字段；驳回可重提 |
| Mock OCR 可插拔 | 无 Key 也能演示主路径，不阻塞产品验证 |
| 审批摘要单独导出 | 服务「1 屏决策」的审批人角色 |

## 3. 领域对象

- **User**：报销人 / 审批人  
- **Claim**：报销单（期间、事由、模式、汇总）  
- **Invoice**：票据结构化记录 + 合规结果  
- **Attachment**：原始文件与哈希（去重）  
- **Policy / CompanyProfile**：制度与抬头  

## 4. 流水线（与 Prompt 同源）

0 意图/模式 → 1 收材料 → 2 抽取 → 3 去重 → 4 归类 → 5 合规 → 6 汇总 → 7 摘要 → 8 提交 → 9 自检 → 10 导出

任一门禁失败：不宣称「可直接提交」，进入待确认/拒报分桶。

## 5. 数据可信边界

```
OCR 输出 ──(建议)──► InvoiceDraft
                         │ 用户可改
                         ▼
                   规则引擎校验
                         │
                         ▼
              Claim 汇总金额（唯一真相）
                         │
                         ▼
              审批摘要（只能引用真相）
```

## 6. 部署形态（MVP → 生产）

| 阶段 | 形态 |
|------|------|
| MVP | 单机 Next.js + SQLite + 本地 uploads/ |
| 试点 | Postgres + 对象存储 + 企业 SSO |
| 生产 | 私有化 / VPC；OCR 与验真走内网网关 |

## 7. 与 WorkBuddy 版关系

| | WorkBuddy Skill | 本 Web 平台 |
|--|-----------------|-------------|
| 交互 | 对话 + 本地文件 | 多用户单据系统 |
| 类目/情景/CoT | 同源 | 工程化为模块 |
| 适用 | 个人快速出报销包 | 团队审批与留痕 |
