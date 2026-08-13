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

export function scoreCompetitors(items) {
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
      },
      positioning: { x: +(prod * 100).toFixed(1), y: +(depth * 100).toFixed(1) },
    };
  });
}

/** 产品总监视角分析报告 */
export function buildReport(items, query) {
  const scored = scoreCompetitors(items);
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
  L.push('| 名称 | 类别 | 来源 | 热度 | 产品化 | 拆解深度 | 威胁 |');
  L.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const it of report.scored) {
    L.push(`| [${it.name}](${it.url}) | ${it.categoryLabel} | ${it.source} | ${it.scores.adoption} | ${it.scores.productization} | ${it.scores.depth} | ${it.scores.threat} |`);
  }
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
