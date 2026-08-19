# 02 · 信息架构、流程与思维链

## 页面结构

```
Tab：工作台 | 收票箱 | 报销单 | 我的
页：invoice-detail | claim-export
```

首屏预算：品牌 + 待办数 + 同步/拆单 CTA + 最近发票。禁止运营位与统计墙。

## 主路径

```
同步邮箱/上传 → OCR/入库 → 分类+情景 → 匹配账单 → 合规扫描
 → 按情景拆单（风险票单独成包）→ ready 导出 HR 包 → 复制说明/CSV
```

## 状态机

- Invoice：`imported → ocr_* → categorized → linked|link_skipped|need_review`
- Claim：`draft → ready|blocked → exported`
- MailAccount：`disconnected → connected → syncing → idle`

## 思维链（CoT，详情页可见）

CoT-1 采集 → 2 解析 → 3 验真占位 → 4 分类 → 5 情景 → 6 关联 → 7 合规 → 11 解释  
（成表/打包在导出页完成）

实现：`utils/cot.js`；匹配：`utils/match.js`；合规：`utils/policy.js`。

## 异常路径

| 异常 | 系统动作 |
| --- | --- |
| 重复票 | 同步跳过 / 上传标记 duplicate |
| 低置信度 | need_review，阻断 ready |
| 招待超额 | blocked + over_cap |
| 超期 | blocked + overdue |
| 乘机人不一致 | blocked |
| 个人话费抬头 | warn + 比例可报 |
| 灰色私票 | warn；自动拆单默认剔除 |
