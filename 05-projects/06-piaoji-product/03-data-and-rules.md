# 03 · 数据模型与规则

## 核心实体

`UserProfile` · `MailAccount` · `Invoice` · `Bill` · `InvoiceBillLink` · `Trip` · `Claim` · `HrPackage` · `PolicyRule`

存储 Key：`piaoji_state_v1`（`wx.storage`）

## 匹配（票账）

```
score = amount*0.5 + dateWindow*0.3 + merchantSimilarity*0.2
window = travel ? 7天 : 3天
返回 Top3（score≥0.35）
```

## 合规优先级

1. duplicate  
2. low_ocr（<0.85）  
3. title_mismatch / personal_title（话费可比例）  
4. over_cap / missing_client / attendees  
5. overdue（>90 天）  
6. passenger_mismatch  
7. private_spend / fx（warn）

## 拆单策略（Case15）

- 无 error → 按 `scenarioMode` 生成正式包  
- 有 error → 同情景「待处理风险」包（blocked）  
- C10 灰色私票默认不进自动包  

## 案例索引

完整 15 案见源码 `docs/02-案例数据分析.md` 与 `mock/cases.js`。  
种子发票：`mock/seed.js`（差旅三件套、招待超额、超期培训、模糊票、项目采购、机票乘机人、话费比例、外币等）。
