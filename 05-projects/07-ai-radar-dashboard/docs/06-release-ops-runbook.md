# 上线与运维手册（Release & Ops Runbook）

## 1. 本地运行

```bash
cd 05-projects/07-ai-radar-dashboard
npm install
npm run data:refresh
npm run dev
```

## 2. 发布前检查清单

1. `npm run data:refresh` 执行成功
2. `data/daily-bundle.json` 与 `data/live-fetch-report.json` 更新
3. `npm run build` 通过
4. 关键页面可访问：`/`、`/tools`、`/compare`、`/sources`、`/methodology`
5. 文档同步更新

## 3. 日更运行策略

- 在线模式：`npm run data:refresh`
- 离线模式：`npm run data:refresh:offline`
- 建议频率：每日 1 次（避免频繁噪声更新）

## 4. 故障处理

### 4.1 抓取失败
- 现象：`live-fetch-report` 失败数升高
- 处理：检查公开源 URL、解析逻辑、超时设置
- 保障：失败不覆盖旧快照

### 4.2 页面 500（dev 缓存问题）
- 现象：本地访问报错
- 处理：停止 dev，删除 `.next`，重启 `npm run dev`

### 4.3 构建失败
- 处理顺序：类型错误 → 导入错误 → 数据契约错误 → 重跑 build

## 5. 回滚策略

- 使用最近成功的 `daily-bundle.json`
- 代码回退到最近稳定提交
- 保留失败报告用于后续修复

## 6. 观测建议（后续）

- 记录抓取成功率趋势
- 记录 stale 出现频次
- 记录用户常用搜索词与对比路径
