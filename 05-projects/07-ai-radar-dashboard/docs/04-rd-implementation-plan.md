# 研发实施方案（R&D Implementation Plan）

## 1. 技术栈

- Next.js App Router + TypeScript
- 数据校验：Zod
- 图标：lucide-react
- 数据源：公开 RSS / Atom / Changelog

## 2. 模块拆分

### 页面层
- `src/app/page.tsx` 总览
- `src/app/tools/*` 目录与详情
- `src/app/compare/page.tsx` 对比工作台
- `src/app/sources/page.tsx` 来源报告
- `src/app/methodology/page.tsx` 方法口径

### 组件层
- 导航与基础组件：`Nav`、`IconChip`、`FreshnessBadge`
- 可视化组件：`viz/*`（DataChain/Flow/Mindmap/charts）
- 业务组件：`ToolsResultBoard`、`CompareWorkspace`、`CompareModal`

### 数据层
- `src/data/seed.ts`：人工底座
- `src/data/live-sources.ts`：公开源登记
- `src/lib/schema.ts`：数据契约校验
- `scripts/refresh-data.ts`：日更管线

## 3. 数据流

1. seed 初始化工具基线
2. 拉取公开源最新 item
3. 合并 changelog / highlights
4. Zod 校验与极端分护栏
5. 原子写入 bundle 与 fetch report
6. 页面按 fresh/stale/missing 呈现

## 4. 关键工程约束

- 不依赖私有接口或登录态抓取
- 抓取失败不覆盖历史成功快照
- 评分字段仅人工维护，不自动改写
- 图表组件 SSR 安全，不依赖浏览器专属 API

## 5. Definition of Done（研发）

- 本地 `npm run dev` 可访问核心页面
- `npm run data:refresh` 可执行并输出报告
- `npm run build` 通过
- 文档同步更新且路径一致
