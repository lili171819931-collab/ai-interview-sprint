# 极致 Prompt：日更实时更新与历史留存

> 可整段复制给 Cursor / Claude / GPT。  
> 目标：让智衡 AI Radar **永远显示上海时区「今天」的数据**，同时 **永不丢失昨天及更早的报告快照**。  
> 配套：`npm run daily:refresh` · `/api/refresh` · `/history` · `data/archive/YYYY-MM-DD/`

---

```text
你是「智衡 AI Radar」的日更系统工程师 + 数据产品负责人 + 情报归档架构师。

【项目根】
05-projects/07-ai-radar-dashboard/

【现状问题】
1. 界面仍显示昨天的 reportDate / generatedAt（freshness=stale）。
2. 日更会覆盖 data/*.json，若不归档会丢掉过往报告。
3. 用户需要「一键日更 → 今日实时」且「历史可回看」。

【硬约束】
- 时区一律 Asia/Shanghai；fresh = 快照日期 == 上海今天。
- 日更前必须先归档当前快照，再写新文件；失败时保留旧最新快照。
- 不自动改写 seed.ts 七维分数。
- 单路源失败不阻断整次日更；失败源在报告/页脚标注。
- 不在日志/聊天打印 Cookie、Token、账号隐私。
- 生产环境默认禁止任意人触发刷新；本地/显式 ALLOW_LIVE_REFRESH=1 才开放 API。

【必须落地的能力】
A. 归档与历史索引
- 脚本：scripts/lib/archive.ts
- 目录：data/archive/YYYY-MM-DD/{daily-bundle,radar-daily-report,builder-pulse-daily,trendradar-hot,global-hot-topics,live-fetch-report}.json
- 索引：data/history/index.json（按日期倒序，含 files + summary）
- 规则：按各文件自身 reportDate/generatedAt（上海日）归档；同日重复日更覆盖该日归档，不删其他日期。

B. 一键日更管线
- scripts/daily-refresh.ts
- 模式：
  - full：归档 → refresh-data → radar → pulse → trendradar → hot → 再归档今日
  - quick：归档 → radar + hot → 再归档
  - hot：归档 → hot → 再归档
- npm scripts：
  - daily:refresh
  - daily:refresh:quick
  - daily:refresh:hot
  - daily:refresh:offline

C. 实时触发
- POST /api/refresh?mode=quick|hot|full
- 首页 /radar /hot /history 提供「立即日更」按钮（RefreshControls）
- 刷新成功后 router.refresh()，FreshnessBadge 必须变为「今日已更新」

D. 历史浏览
- /history 列表
- /history/[date] 展示当日雷达摘录、热点摘录、Pulse 标题
- Nav 增加「历史报告」

E. 验收标准（必须实测）
1. 执行日更前：若当前 JSON 是昨天，先出现在 data/archive/昨天/。
2. 日更后：
   - data/daily-bundle.json、radar-daily-report.json、global-hot-topics.json 的日期 = 上海今天
   - 首页 FreshnessBadge = fresh
   - /hot 生成时间是今天
3. /history 能看到昨天与今天两条（或至少昨天）。
4. 再次日更不会删除昨天归档。
5. 给出可复制命令与页面 URL。

【执行顺序】
Step 0：读 docs/data-contract.md、现有 scripts/*、data/*.json 的 generatedAt/reportDate。
Step 1：实现/补齐 archive + daily-refresh + API + UI（若已存在则审查缺口并修）。
Step 2：运行 npm run daily:refresh（或 quick），打印前后日期对比。
Step 3：打开 http://localhost:3010/ 与 /hot /history，确认 fresh + 历史可点。
Step 4：更新 docs/data-contract.md、docs/ia.md、README 日更章节；不要改无关文档。
Step 5：输出变更清单、验收结果、残余风险（哪些源仍可能失败）。

【输出格式】
1. 一句话结论：是否已达到「今日实时 + 历史留存」。
2. 变更文件列表。
3. 日更前后日期对比表。
4. 验证命令与 URL。
5. 未解决项（如某登录态源失败）与下一步。

现在开始执行。先检查 data/*.json 日期，再动手改代码与跑日更。
```

---

## 本地命令速查

```bash
cd 05-projects/07-ai-radar-dashboard

# 推荐：全量日更（先归档再刷新）
npm run daily:refresh

# 更快：只更雷达 + 热点
npm run daily:refresh:quick

# 只更热点
npm run daily:refresh:hot

# 离线（不请求外网；热点用已有 JSON）
npm run daily:refresh:offline
```

页面：

| URL | 作用 |
|-----|------|
| http://localhost:3010/ | 总览 + 新鲜度 + 立即日更 |
| http://localhost:3010/hot | 今日国内外热点 |
| http://localhost:3010/radar | 今日雷达日报 |
| http://localhost:3010/history | 历史报告列表 |
| http://localhost:3010/history/YYYY-MM-DD | 某日快照 |

API：`POST /api/refresh?mode=quick|hot|full`
