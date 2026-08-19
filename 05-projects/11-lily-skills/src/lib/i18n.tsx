"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "zh" | "en";

const DICT: Record<string, { zh: string; en: string }> = {
  // ---- App shell ----
  "app.name": { zh: "Lily-Skills", en: "Lily-Skills" },
  "app.tagline": { zh: "Personal AI Skill OS", en: "Personal AI Skill OS" },
  "nav.dashboard": { zh: "Dashboard", en: "Dashboard" },
  "nav.agent": { zh: "AI Agent", en: "AI Agent" },
  "nav.skills": { zh: "Skills", en: "Skills" },
  "nav.workflows": { zh: "Workflows", en: "Workflows" },
  "nav.executions": { zh: "Execution Center", en: "Execution Center" },
  "nav.analytics": { zh: "Analytics", en: "Analytics" },
  "nav.developer": { zh: "Developer Center", en: "Developer Center" },
  "topbar.search": { zh: "搜索 Skills、工作流、能力…", en: "Search skills, workflows, capabilities…" },
  "topbar.ask": { zh: "🤖 Ask AI Agent", en: "🤖 Ask AI Agent" },
  "app.status_running": { zh: "平台运行中", en: "Platform running" },
  "app.status_connecting": { zh: "连接中…", en: "Connecting…" },
  "app.status_offline": { zh: "离线", en: "Offline" },

  // ---- Common ----
  "common.loading": { zh: "加载中…", en: "Loading…" },
  "common.run": { zh: "运行", en: "Run" },
  "common.execute": { zh: "执行", en: "Execute" },
  "common.favorite": { zh: "收藏", en: "Favorite" },
  "common.favorited": { zh: "已收藏", en: "Favorited" },
  "common.back": { zh: "返回", en: "Back" },
  "common.approve": { zh: "批准", en: "Approve" },
  "common.cancel": { zh: "取消", en: "Cancel" },
  "common.create": { zh: "新建", en: "New" },
  "common.delete": { zh: "删除", en: "Delete" },
  "common.edit": { zh: "编辑", en: "Edit" },
  "common.save": { zh: "保存", en: "Save" },
  "common.none": { zh: "暂无", en: "None" },
  "common.usage": { zh: "次使用", en: "uses" },
  "common.success_rate": { zh: "成功率", en: "success rate" },
  "common.last_used": { zh: "最近", en: "Last used" },
  "common.duration": { zh: "耗时", en: "Duration" },
  "common.error": { zh: "错误", en: "Error" },
  "common.status": { zh: "状态", en: "Status" },
  "common.all": { zh: "全部", en: "All" },
  "common.yes": { zh: "是", en: "Yes" },
  "common.no": { zh: "否", en: "No" },
  "common.confirm": { zh: "确认", en: "Confirm" },

  // ---- Status labels ----
  "status.completed": { zh: "已完成", en: "Completed" },
  "status.running": { zh: "执行中", en: "Running" },
  "status.queued": { zh: "排队中", en: "Queued" },
  "status.failed": { zh: "失败", en: "Failed" },
  "status.cancelled": { zh: "已取消", en: "Cancelled" },
  "status.awaiting_approval": { zh: "待审批", en: "Pending approval" },
  "status.healthy": { zh: "健康", en: "Healthy" },
  "status.degraded": { zh: "降级", en: "Degraded" },
  "status.down": { zh: "不可用", en: "Down" },
  "status.active": { zh: "启用", en: "Active" },
  "status.draft": { zh: "草稿", en: "Draft" },
  "status.testing": { zh: "测试中", en: "Testing" },
  "status.deprecated": { zh: "已弃用", en: "Deprecated" },
  "status.archived": { zh: "已归档", en: "Archived" },
  "status.proposed": { zh: "待确认", en: "Proposed" },
  "status.approved": { zh: "已批准", en: "Approved" },

  // ---- Dashboard ----
  "dash.agent_ready": { zh: "AI AGENT READY", en: "AI AGENT READY" },
  "dash.hero": { zh: "今天想完成什么？", en: "What do you want to accomplish today?" },
  "dash.placeholder": { zh: "例如：帮我分析 TikTok 上 AI Agent 的热点，并生成 5 个适合我的选题", en: "e.g. Analyze trending AI Agent topics on TikTok and generate 5 topic ideas for me" },
  "dash.submit": { zh: "交给 Agent", en: "Ask Agent" },
  "dash.stat_skills": { zh: "Skills", en: "Skills" },
  "dash.stat_skills_sub": { zh: "个启用", en: "active" },
  "dash.stat_exec": { zh: "Executions", en: "Executions" },
  "dash.stat_exec_sub": { zh: "成功率", en: "success rate" },
  "dash.stat_wf": { zh: "Workflows", en: "Workflows" },
  "dash.stat_wf_sub": { zh: "已运行 {n} 次", en: "{n} runs" },
  "dash.stat_rec": { zh: "AI 推荐采纳率", en: "AI acceptance rate" },
  "dash.stat_rec_sub": { zh: "推荐引擎在学习", en: "Recommendation engine learning" },
  "dash.quick": { zh: "Quick Actions", en: "Quick Actions" },
  "dash.quick_ask": { zh: "Ask AI Agent", en: "Ask AI Agent" },
  "dash.quick_ask_desc": { zh: "自然语言发起任务", en: "Start a task in natural language" },
  "dash.quick_search": { zh: "Search Skills", en: "Search Skills" },
  "dash.quick_search_desc": { zh: "浏览全部能力", en: "Browse all capabilities" },
  "dash.quick_wf": { zh: "Create Workflow", en: "Create Workflow" },
  "dash.quick_wf_desc": { zh: "编排多 Skill 流程", en: "Orchestrate multi-skill flows" },
  "dash.quick_exec": { zh: "Execution Center", en: "Execution Center" },
  "dash.quick_exec_desc": { zh: "查看运行记录", en: "View run history" },
  "dash.recommended": { zh: "AI Recommendation", en: "AI Recommendation" },
  "dash.recommended_sub": { zh: "基于语义匹配与历史使用偏好", en: "Based on semantic match & usage preferences" },
  "dash.rec_badge": { zh: "推荐", en: "Recommended" },
  "dash.rec_loading": { zh: "正在加载推荐…", en: "Loading recommendations…" },
  "dash.recent": { zh: "Recent Activity", en: "Recent Activity" },
  "dash.recent_empty": { zh: "暂无执行记录", en: "No executions yet" },
  "dash.favs": { zh: "⭐ Favorites", en: "⭐ Favorites" },
  "dash.favs_empty": { zh: "还没有收藏，去 Skills 页点亮 ⭐", en: "No favorites yet — star a Skill on the Skills page" },
  "dash.uncategorized": { zh: "未分类", en: "Uncategorized" },
  "dash.tutorial": { zh: "🎬 快速上手教程", en: "🎬 Quick Tutorial" },
  "dash.tutorial_sub": { zh: "2 分钟看懂：Agent 找 Skill、Skills 运行、Workflow 编排、Skill Hub 导入", en: "2 minutes: Agent → Skills → Workflows → Skill Hub" },
  "dash.chip1": { zh: "AI 热点选题", en: "AI trend topics" },
  "dash.chip2": { zh: "竞品分析", en: "Competitor analysis" },
  "dash.chip3": { zh: "生成内容简报", en: "Content brief" },
  "dash.chip4": { zh: "每周报告", en: "Weekly report" },

  // ---- Skills ----
  "skills.title": { zh: "Skills", en: "Skills" },
  "skills.subtitle": { zh: "个能力单元 · 新 Skill 注册后自动进入 Registry / 搜索 / Agent Tool Registry", en: "capabilities · new Skills auto-enter Registry / Search / Agent Tool Registry" },
  "skills.search_ph": { zh: "搜索 Skill…", en: "Search skills…" },
  "skills.all_categories": { zh: "全部分类", en: "All categories" },
  "skills.sort_relevance": { zh: "相关度", en: "Relevance" },
  "skills.sort_usage": { zh: "最常用", en: "Most used" },
  "skills.sort_newest": { zh: "最新", en: "Newest" },
  "skills.sort_success": { zh: "成功率", en: "Success rate" },
  "skills.empty": { zh: "没有找到匹配的 Skill", en: "No matching skills found" },
  "skills.empty_hint": { zh: "试试换一个关键词，或到 Developer Center 注册新 Skill", en: "Try another keyword, or register a new Skill in the Developer Center" },

  // ---- Skill detail ----
  "detail.back": { zh: "返回 Skills", en: "Back to Skills" },
  "detail.ai_understand": { zh: "AI 理解", en: "AI Understanding" },
  "detail.run_skill": { zh: "Run Skill", en: "Run Skill" },
  "detail.no_input": { zh: "该 Skill 无需输入参数。", en: "This Skill needs no input." },
  "detail.network_warn": { zh: "⚠ 该 Skill 会请求外部网络：", en: "⚠ This Skill calls an external network:" },
  "detail.risk_warn": { zh: "⚠ 高风险 Skill 执行前需要人工审批。", en: "⚠ High-risk Skills require human approval before execution." },
  "detail.result": { zh: "执行结果", en: "Execution result" },
  "detail.approval_required": { zh: "该执行需要审批（高风险 / 敏感权限）。", en: "This execution requires approval (high risk / sensitive permissions)." },
  "detail.approve_run": { zh: "批准并执行", en: "Approve & execute" },
  "detail.executing": { zh: "执行中…", en: "Executing…" },
  "detail.meta": { zh: "元数据", en: "Metadata" },
  "detail.exec_type": { zh: "执行类型", en: "Execution type" },
  "detail.risk_level": { zh: "风险等级", en: "Risk level" },
  "detail.health": { zh: "健康状态", en: "Health" },
  "detail.author": { zh: "作者", en: "Author" },
  "detail.source": { zh: "来源", en: "Source" },
  "detail.created": { zh: "注册时间", en: "Registered" },
  "detail.permissions": { zh: "权限", en: "Permissions" },
  "detail.readonly": { zh: "只读", en: "Read-only" },
  "detail.related": { zh: "相关 Skills", en: "Related Skills" },
  "detail.not_found": { zh: "Skill 不存在", en: "Skill not found" },
  "detail.risk_low": { zh: "低风险", en: "Low risk" },
  "detail.risk_medium": { zh: "中风险", en: "Medium risk" },
  "detail.risk_high": { zh: "高风险", en: "High risk" },
  "detail.risk_critical": { zh: "严重风险", en: "Critical risk" },

  // ---- Agent ----
  "agent.sessions": { zh: "会话", en: "Sessions" },
  "agent.new_session": { zh: "+ 新建", en: "+ New" },
  "agent.hero_title": { zh: "Lily AI Agent", en: "Lily AI Agent" },
  "agent.hero_desc": { zh: "告诉我你想完成什么，我会自动找到合适的 Skill、生成计划并执行。", en: "Tell me what you want to accomplish — I'll find the right Skills, build a plan, and execute it." },
  "agent.thinking": { zh: "Agent 正在理解你的需求…", en: "Agent is understanding your request…" },
  "agent.plan_badge": { zh: "AGENT 执行计划", en: "AGENT EXECUTION PLAN" },
  "agent.intent": { zh: "意图：", en: "Intent: " },
  "agent.rec_skills": { zh: "推荐 Skills", en: "Recommended Skills" },
  "agent.confirm_exec": { zh: "确认执行", en: "Confirm & run" },
  "agent.run_direct": { zh: "直接执行", en: "Run directly" },
  "agent.needs_approval": { zh: "部分步骤需要审批", en: "Some steps need approval" },
  "agent.approve_continue": { zh: "批准并继续", en: "Approve & continue" },
  "agent.completed": { zh: "任务完成", en: "Task completed" },
  "agent.input_ph": { zh: "描述你的目标… 例如：帮我分析 AI Agent 海外热点并生成内容选题", en: "Describe your goal… e.g. Analyze trending AI Agent topics and generate content ideas" },
  "agent.hint": { zh: "Agent 会先给出理解与计划，确认后再执行 · 高风险操作需审批", en: "Agent proposes understanding & plan first; high-risk actions require approval" },

  // ---- Workflows ----
  "wf.title": { zh: "Workflows", en: "Workflows" },
  "wf.subtitle": { zh: "用一组 Skill 组合成可复用的自动化流程", en: "Combine Skills into reusable automation flows" },
  "wf.new_ph": { zh: "新工作流名称…", en: "New workflow name…" },
  "wf.nodes": { zh: "节点", en: "nodes" },
  "wf.empty_list": { zh: "还没有工作流", en: "No workflows yet" },
  "wf.choose": { zh: "选择或创建一个工作流", en: "Select or create a workflow" },
  "wf.empty_nodes": { zh: "空工作流，从上方添加节点开始", en: "Empty workflow — add nodes above to start" },
  "wf.run_input": { zh: "运行参数（JSON）", en: "Run input (JSON)" },
  "wf.current_run": { zh: "当前运行", en: "Current run" },
  "wf.waiting_approval": { zh: "等待人工审批", en: "Waiting for human approval" },
  "wf.approve_continue": { zh: "批准继续", en: "Approve & continue" },
  "wf.history": { zh: "运行历史", en: "Run history" },
  "wf.history_empty": { zh: "暂无运行记录", en: "No runs yet" },
  "wf.schedule": { zh: "⏰ 定时：", en: "⏰ Schedule: " },
  "wf.node.trigger": { zh: "触发", en: "Trigger" },
  "wf.node.skill": { zh: "Skill", en: "Skill" },
  "wf.node.ai": { zh: "AI 决策", en: "AI Decision" },
  "wf.node.condition": { zh: "条件", en: "Condition" },
  "wf.node.transform": { zh: "转换", en: "Transform" },
  "wf.node.approval": { zh: "人工审批", en: "Approval" },
  "wf.node.output": { zh: "输出", en: "Output" },
  "wf.pick_skill": { zh: "选择 Skill", en: "Pick a Skill" },
  "wf.approval_msg_ph": { zh: "审批提示语", en: "Approval message" },
  "wf.ai_query_ph": { zh: "AI 决策查询", en: "AI decision query" },
  "wf.cond_field_ph": { zh: "字段，如 input.count", en: "Field, e.g. input.count" },
  "wf.cond_value_ph": { zh: "比较值", en: "Compare value" },
  "wf.status.draft": { zh: "草稿", en: "Draft" },
  "wf.status.active": { zh: "启用", en: "Active" },
  "wf.status.archived": { zh: "归档", en: "Archived" },

  // ---- Executions ----
  "exec.title": { zh: "Execution Center", en: "Execution Center" },
  "exec.subtitle": { zh: "所有 Skill 执行的统一记录与审计", en: "Unified record & audit of all Skill executions" },
  "exec.all_status": { zh: "全部状态", en: "All statuses" },
  "exec.empty": { zh: "暂无执行记录", en: "No executions yet" },
  "exec.empty_hint": { zh: "运行一个 Skill 或让 Agent 执行任务后，这里会出现记录", en: "Run a Skill or ask the Agent to execute a task to see records here" },
  "exec.input": { zh: "输入", en: "Input" },
  "exec.logs": { zh: "日志", en: "Logs" },
  "exec.no_logs": { zh: "无结构化日志", en: "No structured logs" },
  "exec.no_output": { zh: "无输出", en: "No output" },

  // ---- Analytics ----
  "an.title": { zh: "Analytics", en: "Analytics" },
  "an.subtitle": { zh: "Skill 使用数据与平台健康度", en: "Skill usage data & platform health" },
  "an.avg_duration": { zh: "平均耗时", en: "Avg duration" },
  "an.wf_completion": { zh: "工作流完成率", en: "Workflow completion" },
  "an.failed": { zh: "失败执行", en: "Failed executions" },
  "an.awaiting": { zh: "待审批", en: "Pending approval" },
  "an.ai_recs": { zh: "AI 推荐", en: "AI recommendations" },
  "an.accept_rate": { zh: "采纳率", en: "acceptance rate" },
  "an.sessions": { zh: "Agent 会话", en: "Agent sessions" },
  "an.daily": { zh: "近 14 天执行量", en: "Executions (last 14 days)" },
  "an.categories": { zh: "分类分布", en: "Category distribution" },
  "an.no_data": { zh: "暂无数据", en: "No data" },
  "an.top_skills": { zh: "最常用 Skills", en: "Most used Skills" },
  "an.no_usage": { zh: "暂无使用数据", en: "No usage data yet" },

  // ---- Developer ----
  "dev.title": { zh: "Developer Center", en: "Developer Center" },
  "dev.subtitle": { zh: "Skill Hub · 能力聚合中枢：优先复用开源能力（Reuse > Wrap > Build），新能力接入后自动进入 Registry / 搜索 / Agent Tool Registry，无需开发页面", en: "Skill Hub · capability aggregation: prefer reusing open-source capabilities (Reuse > Wrap > Build); once added they auto-enter Registry / Search / Agent Tool Registry — no pages to build" },
  "dev.tab.create": { zh: "创建 Skill", en: "Create Skill" },
  "dev.tab.import": { zh: "Manifest 导入", en: "Manifest Import" },
  "dev.tab.test": { zh: "测试控制台", en: "Test Console" },
  "dev.tab.scan": { zh: "自动扫描", en: "Auto Scan" },
  "dev.tab.github": { zh: "GitHub 导入", en: "GitHub Import" },
  "dev.github_sub": { zh: "粘贴 GitHub 仓库地址，自动分析 Repo → 生成 Manifest + Adapter → 注册为 Skill（Reuse > Wrap > Build）", en: "Paste a GitHub repo URL — auto-analyze the repo, generate a Manifest + Adapter, and register it as a Skill (Reuse > Wrap > Build)" },
  "dev.github_url": { zh: "GitHub 仓库 URL", en: "GitHub repo URL" },
  "dev.github_url_ph": { zh: "https://github.com/owner/repo", en: "https://github.com/owner/repo" },
  "dev.github_import_btn": { zh: "导入并注册", en: "Import & register" },
  "dev.github_hint": { zh: "优先复用成熟开源能力，不要重复造轮子：先找 → 复用 → 包一层 Adapter → 才自己写。", en: "Prefer reusing mature open-source capabilities: find → reuse → wrap with an Adapter → only then build." },
  "dev.github_overrides": { zh: "可选覆盖（留空则自动推断）", en: "Optional overrides (leave empty to auto-infer)" },
  "dev.github_name": { zh: "名称", en: "Name" },
  "dev.github_desc": { zh: "描述", en: "Description" },
  "dev.github_category": { zh: "分类", en: "Category" },
  "dev.github_command": { zh: "命令模板（{{args}} 占位符）", en: "Command template ({{args}} placeholder)" },
  "dev.github_analyzing": { zh: "正在分析 GitHub 仓库…", en: "Analyzing GitHub repo…" },
  "dev.create_sub": { zh: "填写基本信息，注册后立即可用", en: "Fill in basics — usable immediately after registration" },
  "dev.name": { zh: "名称 *", en: "Name *" },
  "dev.name_ph": { zh: "如 TikTok Trend Scanner", en: "e.g. TikTok Trend Scanner" },
  "dev.desc_ph": { zh: "一句话描述这个能力", en: "One sentence describing this capability" },
  "dev.icon": { zh: "图标", en: "Icon" },
  "dev.desc": { zh: "描述 *", en: "Description *" },
  "dev.category": { zh: "分类", en: "Category" },
  "dev.tags": { zh: "Tags（逗号分隔）", en: "Tags (comma separated)" },
  "dev.exec_type": { zh: "执行类型", en: "Execution type" },
  "dev.risk": { zh: "风险等级", en: "Risk level" },
  "dev.endpoint": { zh: "Endpoint URL", en: "Endpoint URL" },
  "dev.command": { zh: "命令模板（{{key}} 占位符）", en: "Command template ({{key}} placeholders)" },
  "dev.schema": { zh: "Input Schema (JSON Schema)", en: "Input Schema (JSON Schema)" },
  "dev.register": { zh: "注册 Skill", en: "Register Skill" },
  "dev.import_sub": { zh: "粘贴标准 Skill Manifest，系统自动分类、打 Tag、建立搜索索引并加入 Agent Tool Registry", en: "Paste a standard Skill Manifest — the platform auto-categorizes, tags, indexes, and registers it with the Agent" },
  "dev.import_btn": { zh: "导入并注册", en: "Import & register" },
  "dev.test_sub": { zh: "选择 Skill 并直接执行，验证输入输出", en: "Pick a Skill and execute it directly to verify I/O" },
  "dev.pick_skill": { zh: "选择 Skill…", en: "Pick a Skill…" },
  "dev.input_json": { zh: "输入 JSON", en: "Input JSON" },
  "dev.scan_sub": { zh: "扫描 skills/ 目录下的 skill.json，自动注册或更新所有本地 Skill 包", en: "Scan skills/ folder for skill.json manifests and auto-register/update all local Skill packages" },
  "dev.scan_desc": { zh: "每个 skills/<name>/skill.json + adapter.ts 是一个 Skill 包。运行扫描后，新 Skill 会自动进入 Registry、分类、Tag、搜索索引与 Agent Tool Registry。", en: "Each skills/<name>/skill.json + adapter.ts is a Skill package. After scanning, new Skills auto-enter Registry, categories, tags, search index, and Agent Tool Registry." },
  "dev.scan_btn": { zh: "立即扫描", en: "Scan now" },

  // ---- Risk / permission labels ----
  "perm.read": { zh: "读取", en: "Read" },
  "perm.write": { zh: "写入", en: "Write" },
  "perm.external_api": { zh: "外部 API", en: "External API" },
  "perm.file": { zh: "文件系统", en: "File system" },
  "perm.browser": { zh: "浏览器", en: "Browser" },
  "perm.social_media": { zh: "社交媒体", en: "Social media" },
  "perm.email": { zh: "邮件", en: "Email" },
  "perm.database": { zh: "数据库", en: "Database" },
  "perm.payment": { zh: "支付", en: "Payment" },
  "perm.network": { zh: "网络", en: "Network" },
};

type Dict = Record<string, { zh: string; en: string }>;

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "lily-skills-lang";

function detectLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "zh") return saved;
  const nav = navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("zh") ? "zh" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => {
        const entry = (DICT as Dict)[key] ?? { zh: key, en: key };
        let text = lang === "en" ? entry.en : entry.zh;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            text = text.replaceAll(`{${k}}`, String(v));
          }
        }
        return text;
      },
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
