/**
 * competitive.mjs — 竞品分析引擎（产品总监视角）
 * 对爬取/精选的竞品数据做评分、定位矩阵、SWOT 与差异化建议，全部在浏览器端计算。
 */

const CATEGORY_LABEL = {
  skill: 'Skill/技能',
  repo: '仓库/技能库',
  saas: 'SaaS 产品',
  webapp: '网页应用',
  mcp: 'MCP/集成',
  npm: 'npm 库',
  ai: 'AI 模型',
  discussion: '社区讨论',
  'repo/skill': '仓库/技能库',
};

const CATEGORY_ORDER = ['SaaS 产品', '网页应用', 'Skill/技能', '仓库/技能库', 'MCP/集成', 'npm 库', 'AI 模型', '社区讨论'];

export function categoryLabel(c) {
  return CATEGORY_LABEL[c] || c || '其他';
}

/** 产品化程度（x 轴）：网页/SaaS > npm/MCP > repo/skill > discussion */
export function productizationScore(it) {
  const c = it.category || '';
  if (c === 'saas' || c === 'webapp') return 0.9;
  if (c === 'npm') return 0.7;
  if (c === 'mcp') return 0.6;
  if (c === 'ai') return 0.65;
  if (c === 'repo' || c === 'repo/skill' || c === 'skill') return 0.4;
  return 0.3;
}

/** 目标拆解深度（y 轴）：按能力关键词打分 */
export function depthScore(it) {
  const hay = `${it.name} ${it.description} ${(it.tags || []).join(' ')}`.toLowerCase();
  const deep = ['acceptance', '验收', 'goal', '任务书', 'breakdown', '拆解', 'spec', 'scope', 'constraint', 'verify', '验证', 'todo', 'task', 'contract', 'stop condition', 'done'];
  let s = 0;
  for (const k of deep) if (hay.includes(k)) s += 1;
  const boost = it.category === 'skill' || it.category === 'repo/skill' ? 0.6 : 0.3;
  return Math.min(1, 0.25 + s * 0.16 + boost);
}

/** 采纳度/热度：归一化 stars */
export function adoptionScore(it) {
  const raw = it.stars || 0;
  const a = Math.min(1, Math.log10(raw + 1) / 4.5);
  if (it.adoption != null) return it.adoption / 5;
  return Math.max(0.1, a);
}

/** 威胁度 */
export function threatScore(it) {
  if (it.threat != null) return it.threat / 5;
  const s = 0.35 * adoptionScore(it) + 0.35 * depthScore(it) + 0.3 * productizationScore(it);
  return Math.min(1, s + 0.2);
}

export function scoreCompetitors(items, query = '') {
  return items.map((it) => {
    const prod = productizationScore(it);
    const depth = depthScore(it);
    const adopt = adoptionScore(it);
    const threat = threatScore(it);
    return {
      ...it,
      categoryLabel: categoryLabel(it.category),
      scores: {
        productization: +(prod * 5).toFixed(1),
        depth: +(depth * 5).toFixed(1),
        adoption: +(adopt * 5).toFixed(1),
        threat: +(threat * 5).toFixed(1),
        relevance: relevanceScore(it, query),
      },
      positioning: { x: +(prod * 100).toFixed(1), y: +(depth * 100).toFixed(1) },
    };
  });
}

/** 产品总监视角分析报告 */
export function buildReport(items, query) {
  const scored = scoreCompetitors(items, query);
  const byCategory = {};
  for (const it of scored) {
    byCategory[it.categoryLabel] = (byCategory[it.categoryLabel] || 0) + 1;
  }
  const categoryDist = Object.entries(byCategory)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.name) - CATEGORY_ORDER.indexOf(b.name));

  // 定位矩阵象限
  const quadrants = {
    leader: scored.filter((it) => it.positioning.x >= 55 && it.positioning.y >= 55),
    specialist: scored.filter((it) => it.positioning.x < 55 && it.positioning.y >= 55),
    product: scored.filter((it) => it.positioning.x >= 55 && it.positioning.y < 55),
    niche: scored.filter((it) => it.positioning.x < 55 && it.positioning.y < 55),
  };

  const topThreat = [...scored].sort((a, b) => b.scores.threat - a.scores.threat).slice(0, 4);
  const topAdoption = [...scored].sort((a, b) => b.scores.adoption - a.scores.adoption).slice(0, 3);
  const topDepth = [...scored].sort((a, b) => b.scores.depth - a.scores.depth).slice(0, 3);

  const swot = {
    strengths: [
      '网页可视化 + 人工编辑 + 版本历史：竞品多为纯文本 Skill/仓库，缺少可交互产物台',
      '完整思维链结构化输出：唯一把「编译过程」本身作为学习产品的平台',
      '零依赖本地可跑、数据完全本地化，隐私友好',
      '内置竞品情报模块，具备「产品总监视角」差异化分析能力',
    ],
    weaknesses: [
      '无 LLM 深度生成（当前为规则模板引擎），长尾复杂诉求深度受限',
      '无账号/云端同步，多人协作弱',
      '品牌与生态尚未建立',
    ],
    opportunities: [
      `「诉求→目标任务书」市场快速增长，但成熟产品少（${query ? `检索词：${query}` : '当前检索'}）`,
      '与 Claude Code / Codex / Cursor 生态深度集成（Skill 导出、/goal 一键投递）',
      '面向「Agent 使用者的教练」定位：教会用户写 Goal 是蓝海',
      '企业内训/团队流程标准化场景付费意愿强',
    ],
    threats: [
      'SaaS 巨头（ClickUp/Notion/Taskade）可能快速补齐目标拆解能力',
      'Anthropic/OpenAI 官方若内置 Goal 编译，会极大挤压独立产品空间',
      '开源 Skill 迭代速度快，方法论易被复制',
    ],
  };

  const opportunities = [
    {
      title: '差异化：做「会教人的编译器」',
      detail: '竞品只给结果，本平台把 14 步思维链结构化展示并支持导出学习，直接面向「想学会如何拆解目标」的人群。',
      priority: 'P0',
    },
    {
      title: '差异化：可编辑 + 版本管理',
      detail: '最终 Goal Prompt 支持人工编辑、保存历史、导出 MD/JSON，成为用户的「目标资产库」。',
      priority: 'P0',
    },
    {
      title: '差异化：内置竞品情报台',
      detail: '从产品总监视角自动生成定位矩阵/SWOT/差异化建议，帮用户做「要不要做」的决策。',
      priority: 'P1',
    },
    {
      title: '生态切入点：Skill 导出',
      detail: '一键把编译结果导出为可安装的 Agent Skill（SKILL.md），与现有生态（khazix/superpowers）形成互补而非竞争。',
      priority: 'P1',
    },
  ];

  const recommendation = topThreat[0]
    ? `综合来看，威胁度最高的是「${topThreat[0].name}」（威胁 ${topThreat[0].scores.threat}/5，${topThreat[0].categoryLabel}）。其优势在${topThreat[0].strengths ? topThreat[0].strengths[0] : '产品化'}；建议以「可视化思维链 + 可编辑目标资产 + 竞品情报台」三件套切入，避开与其正面文本能力竞争，主打 Agent 用户的学习与沉淀场景。`
    : '暂无足够数据，建议增加检索词广度后重试。';

  const featureGaps = FEATURE_GAPS;
  const designForms = DESIGN_FORMS;
  return {
    query,
    total: scored.length,
    bySource: countBy(scored, 'source'),
    categoryDist,
    quadrants,
    topThreat,
    topAdoption,
    topDepth,
    swot,
    opportunities,
    recommendation,
    featureGaps,
    designForms,
    scored,
  };
}

function countBy(arr, key) {
  const m = {};
  for (const it of arr) m[it[key]] = (m[it[key]] || 0) + 1;
  return m;
}

/** 导出 Markdown 报告 */
export function reportToMarkdown(report) {
  const L = [];
  L.push(`# 竞品分析报告（产品总监视角）`);
  L.push('');
  L.push(`- 检索词：${report.query}`);
  L.push(`- 竞品数量：${report.total}　|　来源分布：${Object.entries(report.bySource).map(([k, v]) => `${k} ${v}`).join('、')}`);
  L.push('');
  L.push('## 一、竞品清单与评分');
  L.push('');
  L.push('| 名称 | 类别 | 来源 | 相关度 | 热度 | 产品化 | 拆解深度 | 威胁 |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const it of report.scored) {
    L.push(`| [${it.name}](${it.url}) | ${it.categoryLabel} | ${it.source} | ${it.scores.relevance} | ${it.scores.adoption} | ${it.scores.productization} | ${it.scores.depth} | ${it.scores.threat} |`);
  }
  L.push('');
  L.push('## 六、功能缺口与设计形式借鉴（竞品启示）');
  L.push('');
  L.push('### 功能缺口');
  for (const f of report.featureGaps) L.push(`- [${f.status === 'implemented' ? 'x' : ' '}] **[${f.priority}] ${f.feature}**（来源：${f.source}）— ${f.why}`);
  L.push('');
  L.push('### 网页设计形式借鉴');
  for (const d of report.designForms) L.push(`- ${d.adopted ? '✅' : '◻'} ${d.form}（借鉴：${d.from}）— ${d.note}`);
  L.push('');
  L.push('## 二、市场格局');
  L.push('');
  for (const c of report.categoryDist) L.push(`- ${c.name}：${c.count} 个`);
  L.push('');
  L.push('## 三、SWOT');
  L.push('');
  L.push('### Strengths（优势）');
  for (const s of report.swot.strengths) L.push(`- ${s}`);
  L.push('');
  L.push('### Weaknesses（劣势）');
  for (const s of report.swot.weaknesses) L.push(`- ${s}`);
  L.push('');
  L.push('### Opportunities（机会）');
  for (const s of report.swot.opportunities) L.push(`- ${s}`);
  L.push('');
  L.push('### Threats（威胁）');
  for (const s of report.swot.threats) L.push(`- ${s}`);
  L.push('');
  L.push('## 四、差异化机会');
  L.push('');
  for (const o of report.opportunities) L.push(`- **[${o.priority}] ${o.title}**：${o.detail}`);
  L.push('');
  L.push('## 五、产品总监建议');
  L.push('');
  L.push(report.recommendation);
  L.push('');
  return L.join('\n');
}

/* ================= 竞品启示：功能缺口 + 网页设计形式借鉴 ================= */

/** 竞品对比后补充的「功能缺口」清单（含来源证据与落地状态） */
export const FEATURE_GAPS = [
  { feature: '就绪度评估（Ready Banner）', source: 'Compiler(madara88645)', category: '功能', why: '告诉用户编译结果是否可直接执行及原因', status: 'implemented', priority: 'P0' },
  { feature: '中英文双语 / 一键翻译', source: 'Notion AI / Taskade', category: '功能', why: 'Agent 与出海场景刚需，扩大受众', status: 'implemented', priority: 'P0' },
  { feature: '多模态输入（语音/图片/文件）', source: 'Notion AI Voice / ChatGPT', category: '交互', why: '降低表达成本，适配移动与口述场景', status: 'implemented', priority: 'P0' },
  { feature: '案例库自动收录 + 相似检索', source: 'Notion / ClickUp 模板库', category: '功能', why: '需求即资产，沉淀可复用分析', status: 'implemented', priority: 'P0' },
  { feature: '键盘快捷键（Cmd/Ctrl+Enter 编译）', source: 'Taskade / ClickUp', category: '交互', why: '专业用户效率刚需', status: 'implemented', priority: 'P1' },
  { feature: '多数据源竞品扫描（8 源）', source: '情报类产品', category: '功能', why: '情报广度决定决策质量', status: 'implemented', priority: 'P0' },
  { feature: '定位矩阵 / SWOT / 差异化建议', source: 'Stoa / 咨询方法', category: '分析', why: '产品总监级决策支持', status: 'implemented', priority: 'P0' },
  { feature: '模板市场 / 预设诉求库', source: 'Taskade / Compiler', category: '功能', why: '降低空白页焦虑，加速上手', status: 'planned', priority: 'P1' },
  { feature: '一键导出可安装 SKILL.md', source: 'khazix / superpowers 生态', category: '生态', why: '与 Agent 生态打通，形成分发', status: 'planned', priority: 'P1' },
  { feature: '团队空间 / 分享链接', source: 'ClickUp / Notion', category: '协作', why: '团队流程标准化与传播', status: 'planned', priority: 'P2' },
  { feature: 'LLM 深度生成（自备 Key）', source: 'ChatGPT / Claude', category: 'AI', why: '长尾复杂诉求的深度理解', status: 'planned', priority: 'P2' },
  { feature: '埋点与用量分析', source: 'SaaS 标配', category: '数据', why: '验证产品假设、驱动迭代', status: 'planned', priority: 'P2' },
];

/** 竞品网页设计形式借鉴清单 */
export const DESIGN_FORMS = [
  { form: '深色科技风 + 渐变点缀', from: 'Linear / Vercel', adopted: true, note: '深空蓝黑底 + 电光蓝/青渐变，商务科技感' },
  { form: '卡片网格 + 顶部渐变描边', from: 'Linear / Raycast', adopted: true, note: '信息层级清晰，暗色下保持呼吸感' },
  { form: '分步向导（Stepper）', from: 'Stripe / Compiler', adopted: true, note: '思维链 14 步逐步展开，即「可学习的向导」' },
  { form: '定位矩阵可视化（四象限散点）', from: '咨询报告 / Stoa', adopted: true, note: '把抽象竞争格局变成一眼可读的图' },
  { form: '空状态 + 引导文案', from: 'Notion / Linear', adopted: true, note: '编译/思维链/竞品均有空状态引导' },
  { form: '骨架屏 / Skeleton', from: 'Notion / Linear', adopted: false, note: '检索加载更自然（P2 规划）' },
  { form: 'AI 对话式输入框', from: 'ChatGPT / v0', adopted: false, note: '多轮澄清式输入（P2 规划）' },
  { form: '侧边栏主导航', from: 'Notion / ClickUp', adopted: false, note: '复杂功能扩展时再引入（当前 5 Tab 足够）' },
  { form: '模板画廊（Gallery）', from: 'Taskade / v0', adopted: false, note: '案例库升级为画廊形态（P1 规划）' },
];

/** 计算每条竞品与检索词的相关度（0-5） */
export function relevanceScore(it, query) {
  const q = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!q.length) return 3;
  const hay = `${it.name} ${it.description} ${(it.tags || []).join(' ')} ${it.title || ''}`.toLowerCase();
  let s = 0;
  for (const t of q) if (hay.includes(t)) s += 1;
  return Math.min(5, s);
}

/* ================= 评分规则说明（竞品页展示） ================= */
export const SCORING_RULES = [
  { dim: '相关度', en: 'Relevance', range: '0-5', formula: '检索词命中 名称/描述/标签 的次数（≤5）', meaning: '与当前调研主题的相关程度' },
  { dim: '产品化', en: 'Productization', range: '0-5', formula: 'SaaS/Web≈0.9 · npm≈0.7 · MCP≈0.6 · repo/skill≈0.4 · 讨论≈0.3（×5）', meaning: '交付形态的成熟度' },
  { dim: '拆解深度', en: 'Depth', range: '0-5', formula: '0.25 + 能力关键词命中×0.16 + 类型加成（skill/repo +0.6，其他 +0.3），封顶 5', meaning: '目标拆解/验收/边界的方法论完备度' },
  { dim: '采纳度', en: 'Adoption', range: '0-5', formula: 'log10(star+1)/4.5（×5）；精选库用人工评分', meaning: '社区热度/用户采纳水平' },
  { dim: '威胁度', en: 'Threat', range: '0-5', formula: '0.35×采纳 + 0.35×深度 + 0.3×产品化 + 0.2 基础（×5）', meaning: '对本产品构成的竞争威胁' },
];

export const QUADRANT_RULES = [
  { q: '领先者', en: 'Leaders', rule: '产品化 ≥ 55 且 深度 ≥ 55', note: '形态成熟 + 方法论完备，需重点对标' },
  { q: '深度专精', en: 'Specialists', rule: '产品化 < 55 且 深度 ≥ 55', note: '方法论强但形态轻（多为 Skill/仓库）' },
  { q: '产品化', en: 'Productized', rule: '产品化 ≥ 55 且 深度 < 55', note: '产品成熟但拆解深度一般（多为 SaaS）' },
  { q: '细分/早期', en: 'Niche/Early', rule: '产品化 < 55 且 深度 < 55', note: '早期/细分玩家' },
];

/** 按分类分组（供「分类区域」布局） */
export function groupByCategory(scored) {
  const map = new Map();
  for (const it of scored) {
    const k = it.categoryLabel || '其他';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return [...map.entries()]
    .map(([name, items]) => ({
      name,
      count: items.length,
      avgThreat: +(items.reduce((s, i) => s + i.scores.threat, 0) / items.length).toFixed(1),
      avgRelevance: +(items.reduce((s, i) => s + i.scores.relevance, 0) / items.length).toFixed(1),
      items: [...items].sort((a, b) => b.scores.threat - a.scores.threat),
    }))
    .sort((a, b) => b.avgThreat - a.avgThreat);
}

/* ================= v6：输入需求型竞品分析 + 本产品报告 + 启示思维框图 ================= */

/** 本产品（需求拆解平台）竞品分析报告 —— 始终保留、弹窗展示 */
export const SELF_REPORT = {
  product: 'Goal Compiler · 需求拆解平台',
  tagline: '可视化思维链 + 可编辑目标资产 + 竞品情报台',
  position: { x: 72, y: 88, note: '产品化中高 + 拆解深度领先' },
  strengths: [
    '网页可视化 + 人工编辑 + 版本历史（竞品多为纯文本 Skill/仓库）',
    '完整思维链结构化输出（14 节点 + 思维框图 + 弹窗解释）——「会教人的编译器」',
    '8-9 大数据源竞品情报 + 产品总监视角（评分规则公开/定位矩阵/功能缺口/设计借鉴）',
    '零依赖本地运行、数据不出本地、中英双语、多模态输入',
  ],
  weaknesses: [
    '规则模板引擎（非 LLM），长尾复杂诉求深度受限',
    '无账号/云端协作',
    '品牌与生态尚未建立',
  ],
  opportunities: [
    '「诉求→目标任务书」市场快速增长但成熟产品少',
    '与 Claude Code / Codex / Cursor 生态深度集成（SKILL.md 一键导出）',
    '「Agent 使用者的教练」定位：教会用户写 Goal 是蓝海',
    '模板市场 + AI 多轮澄清：降低上手门槛',
  ],
  threats: [
    'SaaS 巨头（ClickUp/Notion/Taskade）可能快速补齐目标拆解',
    'Anthropic/OpenAI 官方内置 Goal 编译将挤压独立空间',
    '开源 Skill 方法论易被复制',
  ],
  actions: [
    { priority: 'P0', action: '坚持「思维链教学 + 目标资产沉淀 + 情报台」三件套差异化，不与文本能力正面竞争' },
    { priority: 'P0', action: '模板市场 + AI 多轮澄清式输入，把空白页焦虑降到最低' },
    { priority: 'P1', action: 'SKILL.md 导出与 Agent 生态分发，形成「生成→安装→使用」闭环' },
    { priority: 'P1', action: '公开评分规则与数据来源，建立「透明情报」信任感' },
    { priority: 'P2', action: 'LLM 深度增强 + 团队空间，服务企业流程标准化' },
  ],
};

/** 竞品启示思维框图：按类别组织建议节点（可点开详细说明） */
export function buildInsightDiagram(report) {
  const nodes = [];
  for (const g of report.featureGaps) {
    nodes.push({
      id: `gap-${g.feature}`,
      group: g.category || '功能',
      title: g.feature,
      status: g.status,
      detail: `来源证据：${g.source}。为什么补：${g.why}。优先级：${g.priority}。`,
    });
  }
  for (const d of report.designForms) {
    nodes.push({
      id: `form-${d.form}`,
      group: '设计',
      title: d.form,
      status: d.adopted ? 'implemented' : 'planned',
      detail: `借鉴来源：${d.from}。说明：${d.note}。`,
    });
  }
  // 按类别分组
  const groups = new Map();
  for (const n of nodes) {
    if (!groups.has(n.group)) groups.set(n.group, []);
    groups.get(n.group).push(n);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}

/** 雷达图数据：本产品 vs 行业均值 vs 领先者（5 维能力） */
export function buildRadarData(scored) {
  const dims = [
    { key: 'relevance', label: '相关度' },
    { key: 'productization', label: '产品化' },
    { key: 'depth', label: '拆解深度' },
    { key: 'adoption', label: '采纳度' },
  ];
  const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  const leader = (arr) => (arr.length ? Math.max(...arr) : 0);
  const series = [
    { name: '本产品', scores: [4.5, 4.2, 4.8, 2.6] },
    { name: '行业均值', scores: dims.map((d) => +(avg(scored.map((it) => it.scores[d.key]))).toFixed(2)) },
    { name: '领先者', scores: dims.map((d) => +(leader(scored.map((it) => it.scores[d.key]))).toFixed(2)) },
  ];
  return { dims, series, max: 5 };
}

/** 汇总竞品启示 → 产品总监建议（结构化） */
export function buildAggregatedRecommendation(report) {
  const impl = report.featureGaps.filter((g) => g.status === 'implemented').length;
  const planned = report.featureGaps.filter((g) => g.status === 'planned').length;
  const topThreatName = report.topThreat[0]?.name || '头部竞品';
  const topThreatScore = report.topThreat[0]?.scores.threat || 0;
  const landscape = report.categoryDist.map((c) => `${c.name}×${c.count}`).join('、');
  return {
    summary: `市场共 ${report.total} 个相关竞品（${landscape}）。威胁度最高为「${topThreatName}」（${topThreatScore}/5）。竞品启示已补 ${impl} 项功能、规划 ${planned} 项。`,
    points: [
      `以「可视化思维链 + 可编辑目标资产 + 竞品情报台」三件套切入，不正面拼文本生成能力`,
      `优先落地：模板市场 + AI 多轮澄清（降低上手门槛）；SKILL.md 导出（生态分发）`,
      `保持透明：公开评分规则与数据来源，建立情报信任`,
      `监测 ${report.topThreat.slice(0, 2).map((t) => t.name).join('、')}，若其补齐「思维链教学」则强化目标资产沉淀壁垒`,
    ],
  };
}

export function selfReportToMarkdown() {
  const r = SELF_REPORT;
  const L = [];
  L.push(`# 本产品竞品分析报告：${r.product}`);
  L.push('');
  L.push(`> ${r.tagline}`);
  L.push('');
  L.push('## 定位'); L.push(`- 定位矩阵：产品化 ${r.position.x} / 拆解深度 ${r.position.y}（${r.position.note}）`);
  L.push('');
  L.push('## 优势'); r.strengths.forEach((x) => L.push(`- ${x}`));
  L.push(''); L.push('## 劣势'); r.weaknesses.forEach((x) => L.push(`- ${x}`));
  L.push(''); L.push('## 机会'); r.opportunities.forEach((x) => L.push(`- ${x}`));
  L.push(''); L.push('## 威胁'); r.threats.forEach((x) => L.push(`- ${x}`));
  L.push(''); L.push('## 行动清单');
  for (const a of r.actions) L.push(`- [${a.priority}] ${a.action}`);
  L.push('');
  return L.join('\n');
}
