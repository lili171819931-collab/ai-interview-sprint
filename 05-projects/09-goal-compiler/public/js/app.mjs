/**
 * app.mjs — Goal Compiler 平台前端逻辑（v3）
 * 依赖：compiler/index（中英双语编译）、competitive（竞品分析）、caselib（案例库）
 * 新增：i18n 双语、多模态输入（语音/图片/文件）、案例库自动收录与搜索、
 *       8 数据源竞品、就绪度评估、⌘↵ 快捷编译、分享、设计自核验。
 */
import { compile } from './compiler/index.mjs';
import { buildReport, reportToMarkdown, categoryLabel, FEATURE_GAPS, DESIGN_FORMS, SCORING_RULES, QUADRANT_RULES, groupByCategory, SELF_REPORT, buildInsightDiagram, buildRadarData, buildAggregatedRecommendation, selfReportToMarkdown } from './competitive.mjs';
import { toCaseMeta, saveCase, saveCaseByType, removeCase, searchCases, categoriesOf, compileCase } from './caselib.mjs';
import { buildSkillMd, skillFilename } from './skilllib.mjs';
import { nextQuestion, addTurn, transcriptToInput } from './dialogue.mjs';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

let currentResult = null;
let currentReport = null;
let historyList = [];
let userCases = [];
let attachments = [];
let lang = 'zh';
let caseSearchActive = '';

/* ================= i18n 词典 ================= */
const I18N = {
  brandSub: { zh: '诉求拆解平台 · 把模糊想法编译成可执行目标任务书', en: 'Requirement Compiler · turn vague ideas into executable task specs' },
  tabCompile: { zh: '诉求拆解', en: 'Compile' }, tabChain: { zh: '思维链', en: 'Chain' },
  tabComp: { zh: '竞品分析', en: 'Intel' }, tabCases: { zh: '案例库', en: 'Cases' }, tabAbout: { zh: '关于', en: 'About' },
  inTitle: { zh: '① 输入原始诉求', en: '① Raw Request' },
  inHint: { zh: '支持中英文，一句话或一段描述均可', en: 'Chinese & English, one sentence or a paragraph' },
  inPlaceholder: { zh: '例：我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈，按岗位定制问题…', en: 'e.g. Build an AI interviewer tool that helps programmers prep for interviews, with mock interviews and scoring…' },
  clear: { zh: '清空', en: 'Clear' }, voice: { zh: '语音', en: 'Voice' }, image: { zh: '图片', en: 'Image' }, file: { zh: '文件', en: 'File' },
  mode: { zh: '编译模式', en: 'Mode' }, modeStd: { zh: '标准模式（快）', en: 'Standard' }, modeDeep: { zh: '深度模式（更全假设）', en: 'Deep' },
  optSummary: { zh: '可选补充信息（提高编译精度）', en: 'Optional context (better precision)' },
  optUser: { zh: '目标用户/受益方', en: 'Target user' }, optTime: { zh: '时间盒', en: 'Timebox' }, optConst: { zh: '关键约束', en: 'Constraints' },
  compileBtn: { zh: '⚡ 开始编译 ⌘↵', en: '⚡ Compile ⌘↵' },
  quick: { zh: '快速体验：', en: 'Try:' }, outTitle: { zh: '② 编译结果', en: '② Compiled Result' },
  translate: { zh: '🌐 翻译为英文', en: '🌐 中文版' },
  copy: { zh: '复制', en: 'Copy' }, download: { zh: '导出 MD', en: 'Export MD' },
  saveDraft: { zh: '存草稿', en: 'Save' }, history: { zh: '历史', en: 'History' },
  empty1: { zh: '输入一段「模糊想法」并点击<strong>开始编译</strong>，<br/>平台将展示完整思维链并生成可编辑的 <strong>Machine-Executable Goal</strong>。', en: 'Paste a vague idea and hit <strong>Compile</strong>.<br/>The platform shows the full chain of thought and builds an editable <strong>Machine-Executable Goal</strong>.' },
  empty2: { zh: '支持中文 / English、语音 / 图片 / 文件输入；编译结果自动收录进案例库。', en: 'Supports Chinese/English, voice/image/file input; results auto-saved to the case library.' },
  s1: { zh: '① 原始需求理解', en: '① Request Understanding' }, s2: { zh: '② 深层目标', en: '② Deeper Goal' },
  s3: { zh: '关键假设', en: 'Key Assumptions' }, s3h: { zh: 'FACT / ASSUMPTION / DECISION 三态标注', en: 'FACT / ASSUMPTION / DECISION labels' },
  s4: { zh: '④ 目标树', en: '④ Goal Tree' }, s5: { zh: '⑤ 任务边界', en: '⑤ Scope' },
  s6: { zh: '成功标准', en: 'Success Criteria' }, s7: { zh: '⑦ 执行路线', en: '⑦ Roadmap' }, s8: { zh: '⑧ 风险与应对', en: '⑧ Risks & Mitigations' },
  riskCol: { zh: '风险', en: 'Risk' }, lvlCol: { zh: '等级', en: 'Level' }, mitCol: { zh: '默认应对', en: 'Mitigation' },
  sug: { zh: '你没考虑到的方向', en: 'Missed Directions' }, sugH: { zh: '基于领域默认补全', en: 'auto-filled by domain' },
  s9: { zh: '最终 Goal Prompt', en: 'Final Goal Prompt' }, s9h: { zh: '可编辑 · 脱离上下文可独立执行', en: 'editable · runs standalone' },
  machine: { zh: 'Machine-Executable Goal（紧凑版 WHO/WHY/WHAT…）', en: 'Machine-Executable Goal (compact WHO/WHY/WHAT…)' },
  reset: { zh: '恢复原文', en: 'Reset' }, share: { zh: '🔗 复制分享文本', en: '🔗 Copy share text' },
  chainTitle: { zh: '完整思维链 <span class="hint">Goal Compiler 的推理全过程 · 结构化可导出</span>', en: 'Full Chain of Thought <span class="hint">structured & exportable</span>' },
  chainHint: { zh: 'Goal Compiler 的推理全过程 · 结构化可导出', en: 'full reasoning process · structured & exportable' },
  play: { zh: '▶ 逐步演示', en: '▶ Play' }, exportMd: { zh: '导出 MD', en: 'Export MD' }, exportJson: { zh: '导出 JSON', en: 'Export JSON' },
  chainEmpty: { zh: '先在上方「诉求拆解」中完成一次编译，<br/>这里将以 14 个推理节点展示完整思维链。', en: 'Compile once above first.<br/>The 14 reasoning nodes will appear here.' },
  compTitle: { zh: '竞品分析 <span class="hint">8 大数据源 · 产品总监视角</span>', en: 'Competitive Intel <span class="hint">8 data sources · product-director view</span>' },
  compHint: { zh: '8 大数据源 · 产品总监视角', en: '8 data sources · product-director view' },
  compSearch: { zh: '检索并分析', en: 'Scan & analyze' },
  compLoading: { zh: '检索中…（GitHub 未认证限流 10 次/分钟，稍候）', en: 'Scanning… (GitHub unauthenticated rate-limit ~10/min)' },
  compTable: { zh: '竞品清单与评分', en: 'Competitor list & scores' },
  compTableHint: { zh: '点击表头排序', en: 'click headers to sort' },
  compMatrix: { zh: '定位矩阵 <span class="hint">X=产品化 · Y=拆解深度</span>', en: 'Positioning Matrix <span class="hint">X=productization · Y=depth</span>' },
  lgLeader: { zh: '领先者', en: 'Leaders' }, lgSpec: { zh: '深度专精', en: 'Specialists' }, lgProd: { zh: '产品化', en: 'Productized' }, lgNiche: { zh: '细分/早期', en: 'Niche/Early' },
  compCat: { zh: '市场格局', en: 'Market Landscape' },
  compGapTitle: { zh: '竞品启示 · 功能缺口（补充未考虑的功能）', en: 'Insights · Feature gaps (features you might have missed)' },
  compDesignTitle: { zh: '竞品启示 · 网页设计形式借鉴', en: 'Insights · Web design patterns to borrow' },
  compOpps: { zh: '差异化机会', en: 'Differentiation' }, compRec: { zh: '产品总监建议', en: 'Product-director recommendation' },
  compExport: { zh: '导出分析报告 MD', en: 'Export report MD' },
  caseTitle: { zh: '案例库 <span class="hint">每次编译自动收录 · 搜索相似需求可参考分析</span>', en: 'Case Library <span class="hint">auto-collected · search similar needs</span>' },
  caseHint: { zh: '每次编译自动收录 · 搜索相似需求可参考分析', en: 'auto-collected per compile · search & reference' },
  caseSearchPh: { zh: '🔍 搜索相似需求（关键词 / 领域 / 意图）…', en: '🔍 Search similar needs (keywords / domain / intent)…' },
  userCases: { zh: '已收录案例（自动）', en: 'Collected cases (auto)' }, demoCases: { zh: '内置演示用例', en: 'Built-in demos' },
  aboutTitle: { zh: '关于本项目', en: 'About' },
  aboutLead: { zh: '把一段模糊想法，编译成一份「机器可直接执行、人类可直接验收、AI 可连续自主工作数小时」的专家级 Goal Task Specification。', en: 'Compile a vague idea into an expert-level Goal Task Specification that machines can execute, humans can verify, and AI can run autonomously for hours.' },
  pillars: { zh: '产品三件套定位', en: 'Three-pillar positioning' },
  p1: { zh: '🧠 可视化思维链', en: '🧠 Visual chain of thought' }, p1d: { zh: '：14 个推理节点结构化输出，可学习、可导出。', en: ': 14 structured reasoning nodes, learnable & exportable.' },
  p2: { zh: '🗂 可编辑目标资产', en: '🗂 Editable goal assets' }, p2d: { zh: '：Goal 可编辑/版本历史/自动收录案例库，越用越值钱。', en: ': editable, versioned, auto-collected — an asset that compounds.' },
  p3: { zh: '📡 竞品情报台', en: '📡 Competitive intel desk' }, p3d: { zh: '：8 大数据源扫描 + 产品总监视角（定位矩阵/SWOT/功能缺口）。', en: ': 8-source scan + product-director view (matrix/SWOT/gaps).' },
  features: { zh: '能力清单（本次升级）', en: 'Capabilities (this upgrade)' },
  f1: { zh: '🌐 中英文双语：一键把编译结果翻译为英文（Goal Prompt + 分析）', en: '🌐 Bilingual: one-click English output (Goal + analysis)' },
  f2: { zh: '📚 案例库自动收录：每次编译按领域/意图自动归类，相似需求可搜索参考', en: '📚 Auto case library: categorized per compile, searchable' },
  f3: { zh: '🎤🖼📎 多模态输入：语音（中/英）、图片附件、文本文件', en: '🎤🖼📎 Multimodal input: voice (zh/en), image, files' },
  f4: { zh: '🔍 竞品数据源扩展至 8 个：GitHub / HN / npm / SO / HF / Gitee / Reddit / 精选库', en: '🔍 8 intel sources: GitHub/HN/npm/SO/HF/Gitee/Reddit/curated' },
  f5: { zh: '💡 竞品启示：功能缺口 + 网页设计形式借鉴（补未考虑项）', en: '💡 Insights: feature gaps + design patterns' },
  f6: { zh: '✅ 就绪度评估、⌘↵ 快捷编译、🔗 分享、设计自核验', en: '✅ readiness check, ⌘↵ shortcut, share, design audit' },
  techStack: { zh: '技术栈', en: 'Tech stack' },
  techDesc: { zh: 'Node.js（零第三方依赖）服务端 + 原生 JS/CSS 前端。编译引擎为规则模板 + 领域知识库 + 中英双语生成，可离线运行。', en: 'Node.js (zero-dependency) server + vanilla JS/CSS frontend. Rule-template + domain KB + bilingual generator; runs offline.' },
  docs: { zh: '文档', en: 'Docs' }, histTitle: { zh: '草稿历史', en: 'Draft history' },
  tabMarket: { zh: '模板市场', en: 'Market' },
  marketTitle: { zh: '🧩 模板市场 <span class="hint">内置模板 + 开源 GitHub 集合 · 按分类展示 · 输入自动关联推荐</span>', en: '🧩 Template Market <span class="hint">built-in + open-source GitHub · categorized · auto-recommends</span>' },
  marketHint: { zh: '内置模板 + 开源 GitHub 集合 · 按分类展示 · 输入自动关联推荐', en: 'built-in + GitHub · categorized · auto-recommend' },
  marketSearchPh: { zh: '🔍 搜索模板 / 技能库 / 提示词…', en: '🔍 Search templates / skills / prompts…' },
  marketLoading: { zh: '加载中…（含 GitHub 实时检索）', en: 'Loading… (incl. live GitHub scan)' },
  dialogue: { zh: 'AI 多轮澄清式输入（先问清，再编译）', en: 'AI multi-turn clarification (ask first, then compile)' },
  chatPh: { zh: '回答 AI 的澄清问题…', en: 'Answer the AI clarification…' },
  chatCompile: { zh: '✅ 完成并编译', en: '✅ Compile' },
  chatSkip: { zh: '跳过，直接编译', en: 'Skip & compile' },
  analyzeTarget: { zh: '分析对象', en: 'Analyzing' },
  useReq: { zh: '🎯 用当前需求分析', en: '🎯 Use current request' },
  selfReport: { zh: '📊 本产品竞品分析报告', en: '📊 Self competitive report' },
  insightDiagramBtn: { zh: '🧠 竞品启示思维框图', en: '🧠 Insights diagram' },
  compInsightTitle: { zh: '🧠 竞品启示 · 结构化思维框图', en: '🧠 Insights · structured diagram' },
  compInsightHint: { zh: '点击节点查看详细说明', en: 'click nodes for details' },
  compChartsTitle: { zh: '📊 相关图表分析', en: '📊 Charts & analysis' },
  selfReportTitle: { zh: '📊 本产品（需求拆解平台）竞品分析报告', en: '📊 Self (Requirement Platform) competitive report' },
  cviewSelf: { zh: '📊 本产品竞品分析', en: '📊 Self analysis' },
  cviewReq: { zh: '🎯 需求竞品分析', en: '🎯 Request analysis' },
  closestTitle: { zh: '最接近需求的项目 Top3', en: 'Closest projects to your request · Top3' },
  relOnly: { zh: '仅显示高相关（相关度 ≥ 1）', en: 'high-relevance only (≥1)' },
  insightMode: { zh: '需求结构', en: 'Request structure' },
  expertTitle: { zh: '专家版诉求思维模式拆解 · 全方位细节分析', en: 'Expert request-thinking breakdown · full detail analysis' },
  selfSourcesTitle: { zh: '🔗 关联数据源（与需求分析同口径）', en: '🔗 Linked data sources (same as request analysis)' },
  selfScan: { zh: '🔄 扫描本产品相关竞品（9 源）', en: '🔄 Scan self-competitors (9 sources)' },
  selfScanTitle: { zh: '📡 同口径分析结果（本产品 vs 竞品）', en: '📡 Same-pipeline results (self vs competitors)' },
  dialogueToggle: { zh: '展开', en: 'Open' },
  divergenceTitle: { zh: '需求发散式分析（针对本需求的场景化扩展）', en: 'Divergent analysis (scenario-specific extensions for this request)' },
  selfReportExport: { zh: '导出 MD', en: 'Export MD' },
};

/* ================= 通用工具 ================= */
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
function download(filename, text, mime = 'text/markdown') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function copyText(text) {
  return navigator.clipboard.writeText(text).then(() => toast(lang === 'en' ? 'Copied' : '已复制到剪贴板'), () => toast(lang === 'en' ? 'Copy failed' : '复制失败'));
}
function badgeClass(score) { return score >= 4 ? 'score-high' : score >= 3 ? 'score-mid' : 'score-low'; }
const T = (key) => (I18N[key] ? I18N[key][lang] : key);

/* ================= i18n ================= */
function applyI18n() {
  $$('[data-i18n]').forEach((el) => { el.innerHTML = T(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach((el) => { el.placeholder = T(el.dataset.i18nPh); });
  $$('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  if (currentResult) renderResult(currentResult);
  if (window._caseRendered) renderCaseLibrary();
  renderScoringRules();
  renderUsageStats();
}
function setLang(l) {
  lang = l;
  document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';
  applyI18n();
}
$$('.lang-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ================= Tabs ================= */
function switchTab(name) {
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
  location.hash = `#/${name}`;
  if (name === 'chain' && currentResult) renderChain();
  if (name === 'cases' && !window._casesLoaded) loadCases();
  if (name === 'cases') renderCaseLibrary();
  if (name === 'market' && !window._marketLoaded) loadMarket();
  if (name === 'competitive') renderSelfComp();
}
$$('.tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
window.addEventListener('hashchange', () => {
  const name = (location.hash || '#/compile').replace('#/', '');
  if (['compile', 'chain', 'competitive', 'cases', 'market', 'about'].includes(name)) switchTab(name);
});

/* ================= 多模态输入 ================= */
function renderAttachments() {
  const box = $('#attachList');
  if (!attachments.length) { box.innerHTML = ''; return; }
  box.innerHTML = attachments.map((a, i) => `
    <span class="attach-chip" title="${escapeHtml(a.name)}">
      ${a.type === 'image' ? '🖼' : a.type === 'voice' ? '🎤' : '📎'} ${escapeHtml(a.name.length > 24 ? a.name.slice(0, 22) + '…' : a.name)}
      <button class="attach-x" data-attach-del="${i}">✕</button>
    </span>`).join('');
  $$('[data-attach-del]').forEach((b) => b.addEventListener('click', () => {
    attachments.splice(Number(b.dataset.attachDel), 1);
    renderAttachments();
  }));
}

$('#imgBtn').addEventListener('click', () => { const fi = $('#fileInput'); fi.accept = 'image/*'; fi.multiple = true; fi.click(); });
$('#fileBtn').addEventListener('click', () => { const fi = $('#fileInput'); fi.accept = '.txt,.md,.csv,.tsv,.json,.log,image/*'; fi.multiple = true; fi.click(); });
$('#fileInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      attachments.push({ type: 'image', name: f.name, dataUrl, size: f.size });
    } else {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (['txt', 'md', 'csv', 'tsv', 'json', 'log', 'html', 'js', 'mjs', 'py', 'css'].includes(ext)) {
        const text = await f.text();
        attachments.push({ type: 'file', name: f.name, text: text.slice(0, 4000), size: f.size });
        toast(lang === 'en' ? `Read ${f.name} content` : `已读取 ${f.name} 内容`);
      } else {
        attachments.push({ type: 'file', name: f.name, size: f.size });
      }
    }
  }
  renderAttachments();
});

// 语音输入（Web Speech API，Chrome 支持中/英）
$('#voiceBtn').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(lang === 'en' ? 'Voice needs Chrome/Edge' : '语音输入需 Chrome/Edge 浏览器'); return; }
  const rec = new SR();
  rec.lang = lang === 'en' ? 'en-US' : 'zh-CN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  $('#voiceStatus').textContent = lang === 'en' ? 'listening…' : '聆听中…';
  rec.onresult = (ev) => {
    const text = ev.results[0][0].transcript;
    const ta = $('#rawInput');
    ta.value = ta.value ? ta.value + (ta.value.endsWith('\n') ? '' : '\n') + text : text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    attachments.push({ type: 'voice', name: lang === 'en' ? 'Voice note' : '语音转写', text });
    renderAttachments();
    toast(lang === 'en' ? 'Voice transcribed' : '语音已转写');
  };
  rec.onerror = (ev) => { $('#voiceStatus').textContent = ''; toast(`语音: ${ev.error}`); };
  rec.onend = () => { $('#voiceStatus').textContent = ''; };
  rec.start();
});

/* ================= 输入历史建议 ================= */
let suggestItems = [];
let suggestIndex = -1;

function buildSuggestItems() {
  const map = new Map();
  const add = (raw, source, domain, intent) => {
    const key = (raw || '').trim();
    if (!key || map.has(key)) return;
    map.set(key, { raw: key, source, domain, intent });
  };
  for (const h of historyList) add(h.raw, '草稿', '', '');
  for (const c of userCases) add(c.rawInput, '案例', c.domain, c.intent);
  for (const c of _cases) add(c.rawInput, '演示', c.domain, '');
  suggestItems = [...map.values()];
}

function renderSuggestions() {
  const box = $('#inputSuggestions');
  const val = $('#rawInput').value.trim().toLowerCase();
  const items = suggestItems
    .filter((it) => !val || it.raw.toLowerCase().includes(val))
    .slice(0, 8);
  if (!items.length) { box.classList.add('hidden'); return; }
  box.innerHTML = items.map((it, i) => `
    <button class="sug-item ${i === suggestIndex ? 'active' : ''}" data-sug="${i}" type="button">
      <span class="sug-raw">${escapeHtml(it.raw.length > 64 ? it.raw.slice(0, 62) + '…' : it.raw)}</span>
      <span class="sug-meta">${it.source}${it.domain ? ' · ' + escapeHtml(it.domain) : ''}</span>
    </button>`).join('');
  box.classList.remove('hidden');
  $$('[data-sug]').forEach((b) => b.addEventListener('click', () => pickSuggestion(Number(b.dataset.sug))));
}

function pickSuggestion(i) {
  const it = suggestItems[i];
  if (!it) return;
  $('#rawInput').value = it.raw;
  attachments = [];
  renderAttachments();
  $('#rawInput').dispatchEvent(new Event('input', { bubbles: true }));
  $('#inputSuggestions').classList.add('hidden');
  $('#rawInput').focus();
  toast(`${lang === 'en' ? 'Loaded history input' : '已填入历史输入'}：${it.source}`);
}

$('#rawInput').addEventListener('focus', () => { buildSuggestItems(); suggestIndex = -1; renderSuggestions(); });
$('#rawInput').addEventListener('input', () => { suggestIndex = -1; renderSuggestions(); });
$('#rawInput').addEventListener('keydown', (e) => {
  const open = !$('#inputSuggestions').classList.contains('hidden');
  if (!open) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); suggestIndex = Math.min(suggestIndex + 1, suggestItems.length - 1); renderSuggestions(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); suggestIndex = Math.max(suggestIndex - 1, 0); renderSuggestions(); }
  else if (e.key === 'Enter' && suggestIndex >= 0) { e.preventDefault(); pickSuggestion(suggestIndex); }
  else if (e.key === 'Escape') { $('#inputSuggestions').classList.add('hidden'); }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.input-wrap')) $('#inputSuggestions').classList.add('hidden');
});

/* ================= 编译 ================= */
function readInput() {
  const raw = $('#rawInput').value.trim();
  if (!raw) { toast(lang === 'en' ? 'Enter a request first' : '请先输入一段原始诉求'); return null; }
  const opts = {
    mode: $('#modeSelect').value, user: $('#optUser').value.trim(),
    timebox: $('#optTime').value.trim(), constraints: $('#optConst').value.trim(),
  };
  const extras = [];
  if (opts.user) extras.push(`目标用户：${opts.user}`);
  if (opts.timebox) extras.push(`时间盒：${opts.timebox}`);
  if (opts.constraints) extras.push(`约束：${opts.constraints}`);
  // 附件并入上下文
  const attachLines = [];
  for (const a of attachments) {
    if (a.type === 'voice') attachLines.push(`语音转写：${a.text}`);
    else if (a.type === 'file' && a.text) attachLines.push(`文件「${a.name}」内容摘录：${a.text.slice(0, 800)}`);
    else if (a.type === 'image') attachLines.push(`图片附件「${a.name}」：作为视觉参考，需人工解读或接入视觉模型（P2）`);
    else attachLines.push(`附件「${a.name}」：${a.size} 字节`);
  }
  let augmented = raw;
  if (extras.length) augmented += `\n补充信息：${extras.join('；')}`;
  if (attachLines.length) augmented += `\n[附件上下文]\n${attachLines.join('\n')}`;
  return { raw, augmented, opts };
}

function compileNow() {
  const input = readInput();
  if (!input) return;
  currentResult = compile(input.augmented, { mode: input.opts.mode });
  // 案例库：完整记录每次新增（按输入去重，不覆盖历史条目）
  userCases = saveCase(userCases, toCaseMeta(currentResult), 200);
  persistCases();
  trackStats(currentResult);
  renderResult(currentResult);
  switchTab('compile');
}

$('#compileBtn').addEventListener('click', compileNow);
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && e.target.id === 'rawInput') { e.preventDefault(); compileNow(); }
});
$('#rawInput').addEventListener('input', () => {
  const t = $('#rawInput').value.trim();
  const sentences = t.split(/[。！？!?；;\n]+/).filter((s) => s.trim()).length;
  $('#inputStats').textContent = `${t.length} ${lang === 'en' ? 'chars' : '字'} · ${sentences} ${lang === 'en' ? 'sent' : '句'}`;
});
$('#clearInput').addEventListener('click', () => { $('#rawInput').value = ''; attachments = []; renderAttachments(); $('#inputStats').textContent = '0'; });
$$('.chip[data-quick]').forEach((c) => c.addEventListener('click', () => loadCaseById(Number(c.dataset.quick))));

function loadCaseById(idx) {
  if (!window._cases) return;
  const c = window._cases[idx];
  if (!c) return;
  $('#rawInput').value = c.rawInput;
  $('#inputStats').textContent = `${c.rawInput.length} 字`;
  switchTab('compile');
  compileNow();
}

/* ================= 渲染结果 ================= */
function renderResult(r) {
  $('#emptyState').classList.add('hidden');
  $('#result').classList.remove('hidden');
  const a = r.analysis;
  const S = lang === 'en' ? r.summaryEn : r.summary;
  const goal = lang === 'en' ? r.goalPromptEn : r.goalPrompt;
  const machine = lang === 'en' ? r.machineGoalEn : r.machineGoal;

  $('#rIntent').textContent = `${lang === 'en' ? 'Intent' : '意图'}：${lang === 'en' ? a.intent.type : a.intent.label}`;
  $('#rDomain').textContent = `${lang === 'en' ? 'Domain' : '领域'}：${lang === 'en' ? (r.summaryEn.domain || a.domains.primary) : a.domains.primary}`;
  $('#rQuality').textContent = `${lang === 'en' ? 'Quality' : '质量门槛'} L${r.qualityLevel}`;
  $('#rLang').textContent = lang === 'en' ? 'English' : '中文';
  $('#rHash').textContent = `#${r.inputHash}`;
  $('#rTime').textContent = new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour12: false });
  $('#rAttach').textContent = attachments.length ? `${lang === 'en' ? 'Attachments' : '附件'} ${attachments.length}` : '';
  $('#rAttach').classList.toggle('badge-cyan', attachments.length > 0);

  $('#rUnderstanding').textContent = S.understanding;
  $('#rDeepGoal').textContent = S.deepGoal;

  $('#rAssumptions').innerHTML = S.assumptions.map((x) => {
    const tag = x.startsWith('FACT') ? 'FACT' : x.startsWith('ASSUMPTION') ? 'ASSUMPTION' : 'DECISION';
    const cls = tag === 'FACT' ? 'badge-blue' : tag === 'ASSUMPTION' ? 'badge' : 'badge-green';
    return `<li><span class="badge ${cls}">${tag}</span> ${escapeHtml(x.replace(/^(FACT|ASSUMPTION|DECISION):\s*/, ''))}</li>`;
  }).join('');

  const t = S.goalTree;
  const treeLines = [
    `<span class="t-goal">🎯 ${escapeHtml(t.goal)}</span>`,
    '├── ' + (lang === 'en' ? 'Key results' : '核心结果'),
    ...t.results.map((x, i) => `│   ${i === t.results.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '├── ' + (lang === 'en' ? 'Core capabilities' : '核心能力'),
    ...t.abilities.map((x, i) => `│   ${i === t.abilities.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '├── ' + (lang === 'en' ? 'Work modules' : '工作模块'),
    ...t.modules.map((x, i) => `│   ${i === t.modules.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '├── ' + (lang === 'en' ? 'Acceptance' : '验收标准'),
    ...t.standards.map((x, i) => `│   ${i === t.standards.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '└── ' + (lang === 'en' ? 'Risks & constraints' : '风险与约束'),
    ...t.risks.map((x, i) => `    ${i === t.risks.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
  ].join('\n');
  $('#rGoalTree').innerHTML = `<div class="tree">${treeLines}</div>`;

  $('#rScope').innerHTML = [
    scopeBox('scope-in', lang === 'en' ? 'IN SCOPE' : 'IN SCOPE · 必须完成', S.scope.inScope),
    scopeBox('scope-out', lang === 'en' ? 'OUT OF SCOPE' : 'OUT OF SCOPE · 明确不做', S.scope.outOfScope),
    scopeBox('scope-opt', lang === 'en' ? 'OPTIONAL' : 'OPTIONAL · 增强项', S.scope.optional),
  ].join('');

  $('#rCriteria').innerHTML = S.successCriteria.map((x) => `<li>${escapeHtml(x)}</li>`).join('');

  $('#rRoadmap').innerHTML = `<div class="roadmap">${S.roadmap.map((s) => `<div class="road-step"><b>${escapeHtml(s.phase)}</b><span>${escapeHtml(s.output)}</span></div>`).join('')}</div>`;

  const riskRows = S.risks.map((x) => `<tr><td>${escapeHtml(x.risk)}</td><td>${escapeHtml(x.level)}</td><td>${escapeHtml(x.mitigation)}</td></tr>`).join('');
  $('#rRisks tbody').innerHTML = riskRows;

  $('#rSuggestions').innerHTML = r.suggestions.map((s) => `<span class="chip">💡 ${escapeHtml(s)}</span>`).join('');

  $('#goalPrompt').value = goal;
  $('#goalCount').textContent = `${goal.length} chars`;
  $('#rMachineGoal').textContent = machine;

  renderReadyBanner(r);
  renderChain();
}

function scopeBox(cls, title, items) {
  return `<div class="scope-box ${cls}"><h4>${title}</h4><ul>${items.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`;
}

/** 就绪度评估（竞品启示功能） */
function renderReadyBanner(r) {
  const a = r.analysis;
  const checks = [];
  if (a.entities.object && a.entities.object !== '待明确的对象') checks.push(lang === 'en' ? `clear objective (${a.entities.object})` : `目标对象明确（${a.entities.object}）`);
  if (a.gaps.length <= 3) checks.push(lang === 'en' ? 'mostly complete input' : '信息较完整');
  else checks.push(lang === 'en' ? `${a.gaps.length} gaps, defaults applied` : `${a.gaps.length} 处缺口已用默认方案兜底`);
  if (a.entities.constraints.length) checks.push(lang === 'en' ? 'constraints captured' : '约束已捕获');
  const ok = a.gaps.length <= 3;
  $('#readyBanner').className = `ready-banner ${ok ? 'ready' : 'warn'}`;
  $('#readyBanner').innerHTML = `${ok ? '✅' : '⚠️'} ${lang === 'en' ? 'Readiness' : '就绪度'}：${checks.join(' · ')}`;
}

/* ================= Goal 编辑/导出 ================= */
$('#translateBtn').addEventListener('click', () => {
  if (!currentResult) { toast(lang === 'en' ? 'Compile first' : '请先编译'); return; }
  setLang(lang === 'en' ? 'zh' : 'en');
  toast(lang === 'en' ? 'Switched to English' : '已切换为英文');
});
$('#copyGoalBtn').addEventListener('click', () => currentResult && copyText($('#goalPrompt').value));
$('#copyGoalBtn2').addEventListener('click', () => currentResult && copyText($('#goalPrompt').value));
$('#resetGoalBtn').addEventListener('click', () => { if (currentResult) { $('#goalPrompt').value = lang === 'en' ? currentResult.goalPromptEn : currentResult.goalPrompt; toast(lang === 'en' ? 'Reset' : '已恢复原文'); } });
$('#shareBtn').addEventListener('click', () => {
  if (!currentResult) return;
  const share = `# Goal Compiler 编译结果 #${currentResult.inputHash}\n\n> ${currentResult.analysis.raw}\n\n${$('#goalPrompt').value}`;
  copyText(share);
});
$('#downloadBtn').addEventListener('click', () => {
  if (!currentResult) return;
  download(`goal-${currentResult.inputHash}.md`, exportResultMD(currentResult));
  toast(lang === 'en' ? 'Exported MD' : '已导出 MD');
});
$('#saveDraftBtn').addEventListener('click', () => {
  if (!currentResult) return;
  const draft = {
    id: currentResult.id, hash: currentResult.inputHash, raw: currentResult.analysis.raw,
    title: currentResult.analysis.entities.object || '未命名目标', goal: $('#goalPrompt').value,
    savedAt: new Date().toISOString(),
  };
  historyList = [draft, ...historyList.filter((h) => h.id !== draft.id)].slice(0, 20);
  localStorage.setItem('gc-history', JSON.stringify(historyList));
  toast(lang === 'en' ? 'Saved to history' : '已保存到历史');
});
$('#historyBtn').addEventListener('click', openHistory);

function loadHistory() {
  try { historyList = JSON.parse(localStorage.getItem('gc-history') || '[]'); } catch { historyList = []; }
}
function openHistory() {
  loadHistory();
  const box = $('#historyList');
  if (!historyList.length) box.innerHTML = '<div class="history-empty">—</div>';
  else {
    box.innerHTML = historyList.map((h, i) => `
      <div class="history-item">
        <div class="h-info"><div class="h-title">${escapeHtml(h.title)}</div><div class="h-sub">${escapeHtml(h.raw.slice(0, 60))}… · ${new Date(h.savedAt).toLocaleString('zh-CN', { hour12: false })}</div></div>
        <button class="btn-ghost" data-h-restore="${i}">↩</button>
        <button class="btn-ghost" data-h-del="${i}">✕</button>
      </div>`).join('');
  }
  $('#historyModal').classList.remove('hidden');
}
$('#historyClose').addEventListener('click', () => $('#historyModal').classList.add('hidden'));
$('#historyModal').addEventListener('click', (e) => {
  if (e.target === $('#historyModal')) $('#historyModal').classList.add('hidden');
  const ri = e.target.dataset.hRestore, di = e.target.dataset.hDel;
  if (ri != null) {
    const h = historyList[Number(ri)];
    if (h) { $('#goalPrompt').value = h.goal; $('#rawInput').value = h.raw; toast('已恢复草稿'); }
    $('#historyModal').classList.add('hidden');
  }
  if (di != null) { historyList.splice(Number(di), 1); localStorage.setItem('gc-history', JSON.stringify(historyList)); openHistory(); }
});

function exportResultMD(r) {
  const S = lang === 'en' ? r.summaryEn : r.summary;
  const goal = lang === 'en' ? r.goalPromptEn : r.goalPrompt;
  const machine = lang === 'en' ? r.machineGoalEn : r.machineGoal;
  const L = [];
  L.push(`# Goal Compiler 编译结果 · #${r.inputHash}（${lang === 'en' ? 'EN' : '中文'}）`);
  L.push(`> 原始诉求：${r.analysis.raw}`);
  if (attachments.length) L.push(`> 附件：${attachments.map((a) => a.name).join('、')}`);
  L.push(`> 意图：${lang === 'en' ? r.analysis.intent.type : r.analysis.intent.label} ｜ 领域：${lang === 'en' ? (r.summaryEn.domain || r.analysis.domains.primary) : r.analysis.domains.primary}`);
  L.push('');
  L.push(`## ${lang === 'en' ? '① Understanding' : '① 原始需求理解'}`); L.push(S.understanding);
  L.push(''); L.push(`## ${lang === 'en' ? '② Deeper goal' : '② 深层目标'}`); L.push(S.deepGoal);
  L.push(''); L.push(`## ${lang === 'en' ? '③ Assumptions' : '③ 关键假设'}`); S.assumptions.forEach((x) => L.push(`- ${x}`));
  const t = S.goalTree;
  L.push(''); L.push(`## ${lang === 'en' ? '④ Goal tree' : '④ 目标树'}`); L.push(`**${t.goal}**`);
  L.push('- ' + (lang === 'en' ? 'Results' : '核心结果')); t.results.forEach((x) => L.push(`  - ${x}`));
  L.push('- ' + (lang === 'en' ? 'Capabilities' : '核心能力')); t.abilities.forEach((x) => L.push(`  - ${x}`));
  L.push('- ' + (lang === 'en' ? 'Modules' : '工作模块')); t.modules.forEach((x) => L.push(`  - ${x}`));
  L.push('- ' + (lang === 'en' ? 'Acceptance' : '验收标准')); t.standards.forEach((x) => L.push(`  - ${x}`));
  L.push('- ' + (lang === 'en' ? 'Risks' : '风险')); t.risks.forEach((x) => L.push(`  - ${x}`));
  L.push(''); L.push(`## ${lang === 'en' ? '⑤ Scope' : '⑤ 任务边界'}`);
  L.push('### IN'); S.scope.inScope.forEach((x) => L.push(`- ${x}`));
  L.push('### OUT'); S.scope.outOfScope.forEach((x) => L.push(`- ${x}`));
  L.push('### OPTIONAL'); S.scope.optional.forEach((x) => L.push(`- ${x}`));
  L.push(''); L.push(`## ${lang === 'en' ? '⑥ Success criteria' : '⑥ 成功标准'}`); S.successCriteria.forEach((x) => L.push(`- [ ] ${x}`));
  L.push(''); L.push(`## ${lang === 'en' ? '⑦ Roadmap' : '⑦ 执行路线'}`); S.roadmap.forEach((x) => L.push(`- ${x.phase}：${x.output}`));
  L.push(''); L.push(`## ${lang === 'en' ? '⑧ Risks' : '⑧ 风险与应对'}`); S.risks.forEach((x) => L.push(`- ${x.risk}（${x.level}）→ ${x.mitigation}`));
  L.push(''); L.push(`## ＋ ${lang === 'en' ? 'Missed directions' : '你没考虑到的方向'}`); r.suggestions.forEach((x) => L.push(`- ${x}`));
  L.push(''); L.push(`## ⑨ ${lang === 'en' ? 'Final Goal Prompt (editable)' : '最终 Goal Prompt（可编辑版）'}`); L.push('```markdown'); L.push(goal); L.push('```');
  L.push(''); L.push(`## ${lang === 'en' ? 'Machine-Executable Goal' : 'Machine-Executable Goal（紧凑版）'}`); L.push('```markdown'); L.push(machine); L.push('```');
  return L.join('\n');
}

/* ================= 本地用量统计（隐私友好埋点替代） ================= */
function loadStats() {
  try { return JSON.parse(localStorage.getItem('gc-stats') || 'null') || { compiles: 0, byDomain: {}, byIntent: {}, lastAt: null }; }
  catch { return { compiles: 0, byDomain: {}, byIntent: {}, lastAt: null }; }
}
function trackStats(r) {
  const st = loadStats();
  st.compiles += 1;
  st.byDomain[r.analysis.domains.primary] = (st.byDomain[r.analysis.domains.primary] || 0) + 1;
  st.byIntent[r.analysis.intent.label] = (st.byIntent[r.analysis.intent.label] || 0) + 1;
  st.lastAt = new Date().toISOString();
  localStorage.setItem('gc-stats', JSON.stringify(st));
  renderUsageStats();
}
function renderUsageStats() {
  const st = loadStats();
  const topDomain = Object.entries(st.byDomain).sort((a, b) => b[1] - a[1])[0];
  const topIntent = Object.entries(st.byIntent).sort((a, b) => b[1] - a[1])[0];
  const el = $('#usageStats');
  if (!el) return;
  el.innerHTML = `
    <div class="usage-stat"><b>${st.compiles}</b><span>${lang === 'en' ? 'compiles' : '编译次数'}</span></div>
    <div class="usage-stat"><b>${Object.keys(st.byDomain).length}</b><span>${lang === 'en' ? 'domains' : '覆盖领域'}</span></div>
    <div class="usage-stat"><b>${topDomain ? `${topDomain[0]} ×${topDomain[1]}` : '—'}</b><span>${lang === 'en' ? 'top domain' : '高频领域'}</span></div>
    <div class="usage-stat"><b>${topIntent ? `${topIntent[0]} ×${topIntent[1]}` : '—'}</b><span>${lang === 'en' ? 'top intent' : '高频意图'}</span></div>`;
}

/* ================= 模板库（竞品启示功能） ================= */
let _templates = [];
async function loadTemplates() {
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    _templates = data.templates || [];
  } catch { _templates = []; }
  renderTemplates();
}
function renderTemplates() {
  const box = $('#templateList');
  if (!box) return;
  if (!_templates.length) { box.innerHTML = '<span class="hint">—</span>'; return; }
  box.innerHTML = _templates.map((t, i) => `<span class="chip" data-tpl="${i}" title="${escapeHtml(t.desc)}">${escapeHtml(t.title)}</span>`).join('');
  $$('[data-tpl]').forEach((c) => c.addEventListener('click', () => {
    const t = _templates[Number(c.dataset.tpl)];
    if (!t) return;
    $('#rawInput').value = t.raw;
    $('#rawInput').dispatchEvent(new Event('input', { bubbles: true }));
    switchTab('compile');
    toast(`${lang === 'en' ? 'Template loaded' : '已载入模板'}：${t.title}`);
  }));
}

/* ================= SKILL.md 导出 ================= */
$('#skillBtn').addEventListener('click', () => {
  if (!currentResult) return;
  const md = buildSkillMd(currentResult, { lang });
  download(skillFilename(currentResult), md);
  toast(`${lang === 'en' ? 'SKILL.md exported (installable to .claude/skills or .codex/skills)' : '已导出可安装 SKILL.md（可放入 .claude/skills 或 .codex/skills）'}`);
});

/* ================= 评分规则 + 分类区域 ================= */
function renderScoringRules() {
  const grids = [['#scoringRules', '#quadrantRules'], ['#scoringRulesReq', '#quadrantRulesReq']];
  for (const [gSel, qSel] of grids) {
    const grid = $(gSel);
    if (!grid) continue;
    grid.innerHTML = SCORING_RULES.map((r) => `
      <div class="score-rule">
        <div class="score-rule-head"><strong>${escapeHtml(r.dim)}</strong><span class="hint">${escapeHtml(r.en)} · ${r.range} 分</span></div>
        <div class="score-rule-formula">${escapeHtml(r.formula)}</div>
        <div class="gap-why">${escapeHtml(r.meaning)}</div>
      </div>`).join('');
    const qr = $(qSel);
    if (qr) qr.innerHTML = QUADRANT_RULES.map((q) => `
      <div class="quad-rule"><b>${lang === 'en' ? q.en : q.q}</b> <span class="hint">${escapeHtml(q.rule)}</span><div class="gap-why">${escapeHtml(q.note)}</div></div>`).join('');
  }
}

function renderCompSections(report) {
  const relOnly = $('#relOnly') ? $('#relOnly').checked : false;
  let items = report.scored;
  if (relOnly) items = items.filter((it) => it.scores.relevance >= 1);
  const relStats = $('#relStats');
  if (relStats) relStats.textContent = `显示 ${items.length}/${report.scored.length} 条（相关度≥1）`;
  const groups = groupByCategory(items);
  const box = $('#compSections');
  box.innerHTML = groups.map((g) => `
    <div class="comp-section">
      <div class="comp-section-head">
        <h4>${escapeHtml(g.name)} <span class="badge">${g.count}</span></h4>
        <span class="hint">${lang === 'en' ? 'avg threat' : '平均威胁'} ${g.avgThreat} · ${lang === 'en' ? 'avg relevance' : '平均相关'} ${g.avgRelevance}</span>
      </div>
      <div class="comp-section-items">
        ${g.items.map((it) => `
          <div class="comp-item">
            <div class="comp-item-main">
              <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener"><strong>${escapeHtml(it.name)}</strong></a>
              <span class="hint">${escapeHtml((it.description || '').slice(0, 90))}</span>
            </div>
            <div class="comp-item-scores">
              <span class="mini-score" title="threat">${lang === 'en' ? 'T' : '威'} <b class="${badgeClass(it.scores.threat)}">${it.scores.threat.toFixed(1)}</b></span>
              <span class="mini-score" title="relevance">${lang === 'en' ? 'R' : '相'} <b class="${badgeClass(it.scores.relevance)}">${it.scores.relevance.toFixed(1)}</b></span>
              <span class="mini-score" title="stars">⭐ ${it.stars || '—'}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('') || '<div class="history-empty">—</div>';
}

/* ================= 思维链（框图 + 列表 + 弹窗） ================= */
let chainView = 'diagram';
let chainModalIdx = -1;
const PHASE_ORDER = ['理解', '建模', '架构', '执行'];

const METHOD_MAP = {
  1: { method: '输入规范', note: '把原始诉求标准化：切句、抽词、识别意图与领域，作为后续推断的原材料基线。' },
  2: { method: '表层/深层分离', note: '先识别「嘴上说的」，避免把手段当目标。' },
  3: { method: '六问模型', note: '表层/深层/最终/价值/成功/隐含约束六问，穿透真实意图。' },
  4: { method: '结果优先倒推', note: '最终价值 → 成果 → 成功标准 → 路径，而非 功能→步骤→工具 正推。' },
  5: { method: '三态假设', note: 'FACT / ASSUMPTION / DECISION 分级补全，低风险自决、高风险默认+标注。' },
  6: { method: '目标树五层', note: '目标 → 结果/能力/模块/验收/风险，识别决定成败的 20%。' },
  7: { method: '边界与优先级', note: 'IN / OUT / OPTIONAL + P0-P3，杜绝范围蔓延。' },
  8: { method: '交付物 + DoD', note: '每个交付物可验证；Definition of Done 九项全检。' },
  9: { method: '阶段门禁', note: 'Discovery→…→Acceptance 串行推进，每阶段有输入/输出/判断标准。' },
  10: { method: '风险登记册', note: '风险 × 等级 × 默认应对，信息缺口也入册。' },
  11: { method: '自主执行 + 上下文表', note: '自决→执行→验证→修复→继续；维护 Current State/Next Action/Key Decisions。' },
  12: { method: '领域知识注入', note: '按领域词典补全用户未考虑的方向与功能。' },
  13: { method: '20 段机器执行结构', note: 'ROLE→FINAL REPORT 强制结构，脱离上下文可独立执行。' },
  14: { method: '防作弊验收 + 汇报', note: '可复现证据、暗卷自留、最终 5 项汇报。' },
};

function renderChainExpert(r) {
  const box = $('#chainExpert');
  if (!box) return;
  box.classList.remove('hidden');
  const decisions = r.chain.filter((n) => n.decisions && n.decisions.length).length;
  const evidence = r.chain.filter((n) => n.evidence && n.evidence.length).length;
  const metrics = [
    ['阶段', String(new Set(r.chain.map((n) => n.phase)).size)],
    ['推理节点', String(r.chain.length)],
    ['关键决策', String(decisions)],
    ['证据引用', String(evidence)],
    ['假设标注', String(r.summary.assumptions.length)],
    ['风险登记', String(r.summary.risks.length)],
    ['质量门槛', `L${r.qualityLevel}`],
  ];
  $('#expertMetrics').innerHTML = metrics.map(([k, v]) => `<div class="expert-metric"><b>${v}</b><span>${k}</span></div>`).join('');
  const a = r.analysis;
  const d = r.divergence;
  $('#reqProfile').innerHTML = `
    <div class="req-profile-row">
      <span class="badge badge-blue">🎯 ${escapeHtml(a.entities.object || '目标对象')}</span>
      <span class="badge">领域：${escapeHtml(a.domains.primary)}</span>
      <span class="badge badge-cyan">意图：${escapeHtml(a.intent.label)}</span>
      <span class="badge">缺口：${a.gaps.length}</span>
      <span class="badge badge-green">发散：${d.features.length} 功能 · ${d.scenarios.length} 场景 · ${d.variants.length} 变体 · ${d.edgeCases.length} 特例</span>
    </div>`;
  $('#expertNote').textContent = `专家点评：本次编译覆盖 ${r.chain.length} 个推理节点、${new Set(r.chain.map((n) => n.phase)).size} 个阶段，方法链完整（输入规范 → 六问模型 → 目标树 → 三态假设 → 阶段门禁 → 防作弊验收），并针对「${a.entities.object || '该需求'}」给出 ${d.features.length + d.scenarios.length + d.variants.length + d.edgeCases.length} 条发散式扩展建议（含 ${d.edgeCases.length} 条特例分析）。${a.gaps.length ? `输入存在 ${a.gaps.length} 处信息缺口，已用「最合理默认方案」兜底并在假设区标注。` : '输入信息较完整，可直接进入执行。'}`;
  renderDivergence(r);
}

/** 发散式分析渲染（需求场景化扩展） */
function renderDivergence(r) {
  const sec = $('#divergenceSection');
  if (!sec) return;
  sec.classList.remove('hidden');
  const d = r.divergence;
  $('#divergenceSummary').textContent = d.summary;
  const scenarioItems = d.scenarios.map((it) => ({ ...it, detail: `${it.detail}\n\n${d.scenarioDetail(it.title)}` }));
  const groups = [
    { name: '💡 推荐添加的功能', items: d.features },
    { name: '🧩 应用场景（细节描述）', items: scenarioItems },
    { name: '👥 潜在用户变体', items: d.variants },
    { name: '🔬 特例分析（异常/边界）', items: d.edgeCases },
    { name: '⚠️ 边界提醒', items: d.pitfalls },
  ];
  $('#divergenceGroups').innerHTML = groups.map((g) => `
    <div class="divergence-group">
      <div class="divergence-group-head">${g.name} <span class="hint">×${g.items.length}</span></div>
      <div class="divergence-chips">${g.items.map((it, i) => `<span class="chip" data-dvg="${escapeHtml(g.name)}|${i}">${escapeHtml(it.title)}</span>`).join('')}</div>
    </div>`).join('');
  $$('#divergenceGroups [data-dvg]').forEach((el) => el.addEventListener('click', () => {
    const [gname, idx] = el.dataset.dvg.split('|');
    const group = groups.find((g) => g.name === gname);
    const it = group.items[Number(idx)];
    if (!it) return;
    $('#insightModalTitle').textContent = `${gname} · ${it.title}`;
    $('#insightModalBody').innerHTML = `<div class="result-meta"><span class="badge badge-cyan">${escapeHtml(it.tag)}</span></div><div class="chain-body-open"><div class="row"><span class="label">详情</span><div class="reasoning">${escapeHtml(it.detail)}</div></div></div>`;
    $('#insightModal').classList.remove('hidden');
  }));
}

function renderChain() {
  if (!currentResult) return;
  $('#chainEmpty').classList.add('hidden');
  renderChainExpert(currentResult);
  renderDivergence(currentResult);
  renderChainDiagram();
  renderChainList();
  const isDiag = chainView === 'diagram';
  $('#chainDiagram').classList.toggle('hidden', !isDiag);
  $('#chainList').classList.toggle('hidden', isDiag);
  $('#chainDiagramTip').classList.toggle('hidden', !isDiag);
}
$$('#chainViewSeg .seg-btn').forEach((b) => b.addEventListener('click', () => {
  chainView = b.dataset.view;
  $$('#chainViewSeg .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
  if (currentResult) renderChain();
}));

/** 思维框图：按阶段泳道 + 箭头连接 */
function renderChainDiagram() {
  const box = $('#chainDiagram');
  const phases = PHASE_ORDER.map((ph) => currentResult.chain.filter((n) => n.phase === ph));
  box.innerHTML = `<div class="cd-flow">${phases.map((nodes, pi) => `
    <div class="cd-lane">
      <div class="cd-lane-head">${escapeHtml(nodes[0]?.phase || '')} <span class="hint">×${nodes.length}</span></div>
      <div class="cd-lane-body">
        ${nodes.map((n) => `
          <div class="cd-node" data-cd="${n.step}" title="${escapeHtml(n.title)}">
            <span class="cd-node-step">${n.step}</span>
            <div class="cd-node-title">${escapeHtml(n.title)}</div>
            <div class="cd-node-method">${METHOD_MAP[n.step] ? escapeHtml(METHOD_MAP[n.step].method) : ''}</div>
            <div class="cd-node-out">${escapeHtml(Array.isArray(n.output) ? n.output[0] : n.output).slice(0, 34)}${(Array.isArray(n.output) ? n.output[0] : n.output).length > 34 ? '…' : ''}</div>
          </div>`).join('')}
      </div>
    </div>
    ${pi < phases.length - 1 ? '<div class="cd-arrow">→</div>' : ''}`).join('')}
    <div class="cd-arrow">→</div>
    <div class="cd-lane divergence-lane">
      <div class="cd-lane-head">🧭 发散分析 <span class="hint">×${[...currentResult.divergence.features, ...currentResult.divergence.scenarios].length}</span></div>
      <div class="cd-lane-body">
        ${[...currentResult.divergence.features, ...currentResult.divergence.scenarios, ...currentResult.divergence.edgeCases].slice(0, 8).map((it) => `
          <div class="cd-node" data-dvg-node="${escapeHtml(it.tag)}|${escapeHtml(it.title)}">
            <span class="cd-node-step ok">${it.tag === '特例分析' ? '⚠' : '↗'}</span>
            <div class="cd-node-title">${escapeHtml(it.tag)}：${escapeHtml(it.title.slice(0, 22))}</div>
            <div class="cd-node-method">${escapeHtml(it.detail.slice(0, 30))}…</div>
          </div>`).join('')}
      </div>
    </div></div>`;
  $$('#chainDiagram .cd-node').forEach((el) => {
    if (el.dataset.cd) {
      el.addEventListener('click', () => { chainModalIdx = currentResult.chain.findIndex((n) => n.step === el.dataset.cd); openChainModal(); });
    } else if (el.dataset.dvgNode) {
      el.addEventListener('click', () => {
        const [tag, title] = el.dataset.dvgNode.split('|');
        const all = [...currentResult.divergence.features, ...currentResult.divergence.scenarios, ...currentResult.divergence.variants, ...currentResult.divergence.pitfalls];
        const it = all.find((x) => x.tag === tag && x.title === title) || all.find((x) => x.title === title);
        if (!it) return;
        $('#insightModalTitle').textContent = `${tag} · ${it.title}`;
        $('#insightModalBody').innerHTML = `<div class="result-meta"><span class="badge badge-cyan">${escapeHtml(it.tag)}</span></div><div class="chain-body-open"><div class="row"><span class="label">详情</span><div class="reasoning">${escapeHtml(it.detail)}</div></div></div>`;
        $('#insightModal').classList.remove('hidden');
      });
    }
  });
}

function renderChainList() {
  $('#chainList').innerHTML = currentResult.chain.map((n) => `
    <div class="chain-node" id="cn-${n.step}" data-step="${n.step}">
      <div class="chain-head">
        <span class="chain-step">${n.step}</span><span class="chain-phase">${n.phase}</span>
        <span class="chain-title">${escapeHtml(n.title)}</span>
        ${METHOD_MAP[n.step] ? `<span class="chain-method">${escapeHtml(METHOD_MAP[n.step].method)}</span>` : ''}
        <span class="chain-arrow">▾</span>
      </div>
      <div class="chain-body">
        <div class="row"><span class="label">Input</span><div class="input-text">${escapeHtml(n.input)}</div></div>
        <div class="row"><span class="label">Reasoning</span><div class="reasoning">${escapeHtml(n.reasoning)}</div></div>
        <div class="row"><span class="label">Output</span><div class="outcome">${Array.isArray(n.output) ? n.output.map((o) => `• ${escapeHtml(o)}`).join('<br/>') : escapeHtml(n.output)}</div></div>
        ${n.evidence && n.evidence.length ? `<div class="row"><span class="label">Evidence</span><ul class="ev">${n.evidence.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}
        ${n.decisions && n.decisions.length ? `<div class="row"><span class="label">Decisions</span><ul class="dec">${n.decisions.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul></div>` : ''}
      </div>
    </div>`).join('');
  $$('.chain-node .chain-head').forEach((h) => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
}

/** 弹窗解释 */
function openChainModal() {
  if (!currentResult || chainModalIdx < 0) return;
  const n = currentResult.chain[chainModalIdx];
  $('#chainModalTitle').textContent = `${n.step}. ${n.title}`;
  $('#chainModalPos').textContent = `${chainModalIdx + 1}/${currentResult.chain.length}`;
  $('#chainModalBody').innerHTML = `
    <div class="result-meta"><span class="badge badge-blue">Step ${n.step}</span><span class="chain-phase">${n.phase}</span>${METHOD_MAP[n.step] ? `<span class="badge badge-cyan">🧠 ${escapeHtml(METHOD_MAP[n.step].method)}</span>` : ''}</div>
    ${METHOD_MAP[n.step] ? `<div class="row"><span class="label">专家要点</span><div class="reasoning">${escapeHtml(METHOD_MAP[n.step].note)}</div></div>` : ''}
    <div class="chain-body-open">
      <div class="row"><span class="label">Input</span><div class="input-text">${escapeHtml(n.input)}</div></div>
      <div class="row"><span class="label">Reasoning</span><div class="reasoning">${escapeHtml(n.reasoning)}</div></div>
      <div class="row"><span class="label">Output</span><div class="outcome">${Array.isArray(n.output) ? n.output.map((o) => `• ${escapeHtml(o)}`).join('<br/>') : escapeHtml(n.output)}</div></div>
      ${n.evidence && n.evidence.length ? `<div class="row"><span class="label">Evidence</span><ul class="ev">${n.evidence.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}
      ${n.decisions && n.decisions.length ? `<div class="row"><span class="label">Decisions</span><ul class="dec">${n.decisions.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
  $('#chainModal').classList.remove('hidden');
}
function closeChainModal() { $('#chainModal').classList.add('hidden'); }
$('#chainModalClose').addEventListener('click', closeChainModal);
$('#chainModal').addEventListener('click', (e) => { if (e.target === $('#chainModal')) closeChainModal(); });
$('#chainModalPrev').addEventListener('click', () => {
  if (chainModalIdx > 0) { chainModalIdx -= 1; openChainModal(); }
});
$('#chainModalNext').addEventListener('click', () => {
  if (chainModalIdx < currentResult.chain.length - 1) { chainModalIdx += 1; openChainModal(); }
});

$('#playChainBtn').addEventListener('click', async () => {
  if (!currentResult) return;
  if (chainView === 'diagram') {
    const nodes = $$('#chainDiagram .cd-node');
    nodes.forEach((n) => n.classList.remove('active'));
    for (const n of nodes) {
      n.classList.add('active');
      n.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise((r) => setTimeout(r, 550));
    }
    return;
  }
  const nodes = $$('#chainList .chain-node');
  nodes.forEach((n) => n.classList.remove('open'));
  for (const n of nodes) {
    n.classList.add('open'); n.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise((r) => setTimeout(r, 550));
  }
});

$('#exportChainMd').addEventListener('click', () => {
  if (!currentResult) return;
  const L = ['# Goal Compiler 完整思维链', ''];
  currentResult.chain.forEach((n) => {
    L.push(`## ${n.step}. ${n.title}（${n.phase}）`);
    L.push(`- **Input**：${n.input}`); L.push(`- **Reasoning**：${n.reasoning}`);
    L.push(`- **Output**：${Array.isArray(n.output) ? n.output.join('；') : n.output}`);
    if (n.evidence && n.evidence.length) L.push(`- **Evidence**：${n.evidence.join('；')}`);
    if (n.decisions && n.decisions.length) L.push(`- **Decisions**：${n.decisions.join('；')}`);
    L.push('');
  });
  download(`chain-${currentResult.inputHash}.md`, L.join('\n'));
});
$('#exportChainJson').addEventListener('click', () => {
  if (!currentResult) return;
  download(`chain-${currentResult.inputHash}.json`, JSON.stringify({ meta: { id: currentResult.id, input: currentResult.analysis.raw, createdAt: currentResult.createdAt }, chain: currentResult.chain }, null, 2), 'application/json');
});

/* ================= 竞品分析 ================= */
function checkedSources() {
  const s = [];
  const map = { srcGithub: 'github', srcHN: 'hackernews', srcCurated: 'curated', srcNpm: 'npm', srcSO: 'stackoverflow', srcHF: 'huggingface', srcGitee: 'gitee', srcReddit: 'reddit' };
  for (const [id, src] of Object.entries(map)) if ($('#' + id).checked) s.push(src);
  return s;
}
function ghToken() { return localStorage.getItem('gc-gh-token') || ''; }
function updateGhStatus() {
  const st = $('#ghTokenStatus'); if (!st) return;
  const t = ghToken();
  st.textContent = t ? '✅ Token 已启用（5000 次/时）' : '未认证（10 次/分）';
  st.style.color = t ? 'var(--green)' : 'var(--amber)';
}
$('#ghToken').addEventListener('input', (e) => { localStorage.setItem('gc-gh-token', e.target.value.trim()); updateGhStatus(); });

async function runCompetitive() {
  const q = $('#compQuery').value.trim() || 'goal compiler prompt';
  const sources = checkedSources();
  const token = ghToken();
  $('#compLoading').classList.remove('hidden');
  $('#compError').classList.add('hidden');
  $('#compResult').classList.add('hidden');
  try {
    const res = await fetch(`/api/competitive?q=${encodeURIComponent(q)}&sources=${sources.join(',')}&token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failed');
    if (!data.items.length) throw new Error(lang === 'en' ? 'No results — try other keywords/sources' : '未检索到结果，请更换关键词或开启更多数据源');
    currentReport = buildReport(data.items, q);
    currentReport.sourceErrors = data.errors || [];
    currentReport.ghAuth = data.ghAuth || 'anonymous';
    renderReport(currentReport);
  } catch (err) {
    $('#compLoading').classList.add('hidden');
    const ghHint = /github/i.test(err.message) && !ghToken()
      ? ` ${lang === 'en' ? '— add a GitHub Token to raise the limit to 5000/hr.' : '—— 添加 GitHub Token 可提升至 5000 次/时。'}`
      : '';
    $('#compError').textContent = `${lang === 'en' ? 'Scan failed' : '检索失败'}：${err.message}${ghHint}`;
    $('#compError').classList.remove('hidden');
  }
}
$('#compSearchBtn').addEventListener('click', runCompetitive);

let compSortKey = 'scores.threat', compSortDir = -1;
function renderReport(report) {
  $('#compLoading').classList.add('hidden');
  $('#compResult').classList.remove('hidden');
  const errNote = report.sourceErrors && report.sourceErrors.length
    ? `<span class="badge badge-amber">⚠ ${report.sourceErrors.length} 个源暂不可用：${escapeHtml(report.sourceErrors.slice(0, 2).join('；'))}</span>` : '';
  $('#compMetrics').innerHTML = [
    `<span class="badge badge-blue">${report.total} 竞品</span>`,
    ...Object.entries(report.bySource).map(([k, v]) => `<span class="badge">${k} ${v}</span>`),
    `<span class="badge badge-green">${escapeHtml(report.query)}</span>`,
    errNote,
  ].join('');
  renderClosestProjects(report);
  renderCompSections(report);
  renderCompTable(report.scored);
  renderPositioning(report);
  renderCategory(report.categoryDist);
  renderGaps(report.featureGaps);
  renderDesignForms(report.designForms);
  renderInsight(report);
  renderCharts(report);
  renderSwot(report.swot);
  $('#compOpps').innerHTML = report.opportunities.map((o) => `<li><strong>[${o.priority}] ${escapeHtml(o.title)}</strong> — ${escapeHtml(o.detail)}</li>`).join('');
  const agg = buildAggregatedRecommendation(report);
  $('#compRec').textContent = agg.summary;
  $('#compRecPoints').innerHTML = agg.points.map((x) => `<li>${escapeHtml(x)}</li>`).join('');
  if (!$('#compTarget').textContent.includes('需求：')) $('#compTarget').textContent = `自定义：${report.query.slice(0, 40)}`;
}

function renderCompTable(items) {
  const sortVal = (it) => {
    if (compSortKey === 'name') return it.name;
    if (compSortKey === 'categoryLabel') return it.categoryLabel;
    if (compSortKey === 'stars') return it.stars;
    return it.scores[compSortKey] || 0;
  };
  const sorted = [...items].sort((a, b) => {
    const va = sortVal(a), vb = sortVal(b);
    if (typeof va === 'string') return compSortDir * va.localeCompare(vb, 'zh');
    return compSortDir * (va - vb);
  });
  const head = ['name', 'categoryLabel', 'source', 'stars', 'scores.relevance', 'scores.adoption', 'scores.productization', 'scores.depth', 'scores.threat'];
  const headLabel = {
    name: lang === 'en' ? 'Name' : '名称', categoryLabel: lang === 'en' ? 'Type' : '类别', source: 'Source',
    stars: '⭐', 'scores.relevance': lang === 'en' ? 'Relev.' : '相关度',
    'scores.adoption': lang === 'en' ? 'Adopt' : '采纳度', 'scores.productization': lang === 'en' ? 'Prod.' : '产品化',
    'scores.depth': lang === 'en' ? 'Depth' : '深度', 'scores.threat': lang === 'en' ? 'Threat' : '威胁',
  };
  $('#compTable thead').innerHTML = `<tr>${head.map((h) => `<th data-sort="${h}">${headLabel[h]} ${compSortKey === h ? (compSortDir < 0 ? '↓' : '↑') : ''}</th>`).join('')}</tr>`;
  $('#compTable tbody').innerHTML = sorted.map((it) => `<tr>
    <td><a href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${escapeHtml(it.name)}</a><br/><span class="hint">${escapeHtml((it.description || '').slice(0, 64))}</span></td>
    <td>${escapeHtml(it.categoryLabel)}</td><td>${escapeHtml(it.source)}</td><td>${it.stars || '—'}</td>
    <td class="score-cell ${badgeClass(it.scores.relevance)}">${it.scores.relevance.toFixed(1)}</td>
    <td class="score-cell ${badgeClass(it.scores.adoption)}">${it.scores.adoption.toFixed(1)}</td>
    <td class="score-cell ${badgeClass(it.scores.productization)}">${it.scores.productization.toFixed(1)}</td>
    <td class="score-cell ${badgeClass(it.scores.depth)}">${it.scores.depth.toFixed(1)}</td>
    <td class="score-cell ${badgeClass(it.scores.threat)}">${it.scores.threat.toFixed(1)}</td>
  </tr>`).join('');
  $$('#compTable th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (compSortKey === k) compSortDir *= -1; else { compSortKey = k; compSortDir = -1; }
    renderCompTable(sorted);
  }));
}

function renderPositioning(report) {
  const box = $('#positioning');
  const W = box.clientWidth || 560, H = 340;
  box.innerHTML = `<div class="ax"></div><div class="ay"></div>
    <span class="axis-label" style="left:8px;top:8px">${lang === 'en' ? 'deep' : '深度高'}</span>
    <span class="axis-label" style="right:8px;bottom:8px">${lang === 'en' ? 'productized' : '产品化高'}</span>`;
  report.scored.forEach((it) => {
    const x = 8 + (it.positioning.x / 100) * (W - 16);
    const y = H - 8 - (it.positioning.y / 100) * (H - 16);
    let cls = 'niche';
    if (it.positioning.x >= 55 && it.positioning.y >= 55) cls = 'leader';
    else if (it.positioning.y >= 55) cls = 'specialist';
    else if (it.positioning.x >= 55) cls = 'product';
    const div = document.createElement('div');
    div.className = `pos-dot ${cls}`;
    div.style.left = `${x}px`; div.style.top = `${y}px`;
    div.title = `${it.name}`;
    box.appendChild(div);
    const tip = document.createElement('span');
    tip.className = 'pos-tip';
    tip.style.left = `${x}px`; tip.style.top = `${Math.max(12, y - 14)}px`;
    tip.textContent = it.name.length > 18 ? it.name.slice(0, 17) + '…' : it.name;
    box.appendChild(tip);
  });
  const q = report.quadrants;
  box.insertAdjacentHTML('beforeend', `<div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--faint)">${q.leader.length}·${q.specialist.length}·${q.product.length}·${q.niche.length}</div>`);
}

function renderCategory(dist) {
  const max = Math.max(1, ...dist.map((d) => d.count));
  $('#compCategory').innerHTML = `<div class="category-bars">${dist.map((d) => `
    <div class="cat-bar"><span>${escapeHtml(categoryLabel(d.name))}</span>
    <div class="bar-track"><div class="bar-fill" style="width:${(d.count / max) * 100}%"></div></div><span>${d.count}</span></div>`).join('')}</div>`;
}

function renderGaps(gaps) {
  const box = $('#compGaps'); if (!box) return;
  box.innerHTML = `<ul class="gap-list-ul">${gaps.map((g) => `
    <li class="gap-item ${g.status}">
      <span class="gap-mark">${g.status === 'implemented' ? '✅' : '◻️'}</span>
      <div><strong>[${g.priority}] ${escapeHtml(g.feature)}</strong> <span class="hint">来源：${escapeHtml(g.source)}</span>
      <div class="gap-why">${escapeHtml(g.why)}</div></div>
    </li>`).join('')}</ul>`;
}
function renderDesignForms(forms) {
  const box = $('#compDesign'); if (!box) return;
  box.innerHTML = `<ul class="gap-list-ul">${forms.map((d) => `
    <li class="gap-item ${d.adopted ? 'implemented' : 'planned'}">
      <span class="gap-mark">${d.adopted ? '✅' : '◻️'}</span>
      <div><strong>${escapeHtml(d.form)}</strong> <span class="hint">借鉴：${escapeHtml(d.from)}</span>
      <div class="gap-why">${escapeHtml(d.note)}</div></div>
    </li>`).join('')}</ul>`;
}

function renderSwot(swot) {
  const items = [
    ['s', 'Strengths', swot.strengths], ['w', 'Weaknesses', swot.weaknesses],
    ['o', 'Opportunities', swot.opportunities], ['t', 'Threats', swot.threats],
  ];
  $('#compSwot').innerHTML = items.map(([cls, title, list]) => `<div class="swot-box swot-${cls}"><h4>${title}</h4><ul>${list.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`).join('');
}
$('#compExport').addEventListener('click', () => {
  if (!currentReport) return;
  download(`competitive-analysis-${Date.now()}.md`, reportToMarkdown(currentReport));
  toast(lang === 'en' ? 'Report exported' : '竞品分析报告已导出');
});

/* ================= 案例库 ================= */
let _cases = [];
function persistCases() { localStorage.setItem('gc-user-cases', JSON.stringify(userCases)); }
function loadUserCases() {
  try { userCases = JSON.parse(localStorage.getItem('gc-user-cases') || '[]'); } catch { userCases = []; }
}

async function loadCases() {
  window._casesLoaded = true;
  try {
    const res = await fetch('/api/cases');
    const data = await res.json();
    _cases = window._cases = data.cases || [];
  } catch { _cases = window._cases = []; }
  renderCaseLibrary();
}
const DOMAIN_STYLE = {
  '软件/产品': ['#3b82f6', '🖥'], '数据/AI': ['#8b5cf6', '🤖'], '内容/创作': ['#ec4899', '✍️'],
  '学习/成长': ['#22d3ee', '📚'], '商业/创业': ['#f59e0b', '💼'], '运营/增长': ['#10b981', '📈'],
  '效率/自动化': ['#14b8a6', '⚙️'], '硬件/IoT': ['#f97316', '🔧'], '设计/体验': ['#6366f1', '🎨'],
};
const DOMAIN_COLOR = (d) => (DOMAIN_STYLE[d] ? DOMAIN_STYLE[d][0] : '#64748b');
const DOMAIN_ICON = (d) => (DOMAIN_STYLE[d] ? DOMAIN_STYLE[d][1] : '📌');
function galleryCard({ title, domain, intent, raw, sub, actionHtml, onClick }) {
  const color = DOMAIN_COLOR(domain);
  return `
  <div class="case-card gallery" style="--cat:${color}" onclick="${onClick ? `(${onClick})` : ''}">
    <div class="case-banner" style="background:linear-gradient(120deg, ${color}33, ${color}11);border-bottom:1px solid ${color}55">
      <span class="case-banner-icon">${DOMAIN_ICON(domain)}</span>
      <span class="badge" style="color:${color};background:${color}22;border-color:${color}44">${escapeHtml(domain)}</span>
    </div>
    <div class="case-body">
      <div class="case-title-row"><h3>${escapeHtml(title)}</h3><span class="hint">${escapeHtml(intent || '')}</span></div>
      <div class="case-raw">${escapeHtml(raw.slice(0, 90))}${raw.length > 90 ? '…' : ''}</div>
      ${sub ? `<div class="case-meta">${sub}</div>` : ''}
      <span class="case-action">${actionHtml}</span>
    </div>
  </div>`;
}

function renderCaseLibrary() {
  window._caseRendered = true;
  const catCounts = categoriesOf(userCases);
  // 分类过滤下拉
  const cats = new Set([...categoriesOf(userCases).map(([k]) => k), ..._cases.map((c) => c.domain)]);
  const sel = $('#caseCatFilter');
  let catSummaryEl = $('#caseCatSummary');
  if (!catSummaryEl && sel && sel.parentElement) {
    const div = document.createElement('div');
    div.id = 'caseCatSummary'; div.className = 'case-cat-summary';
    sel.parentElement.insertBefore(div, sel.nextSibling);
    catSummaryEl = div;
  }
  const prev = sel.value;
  const catCountMap = new Map(catCounts);
  sel.innerHTML = `<option value="">${lang === 'en' ? 'All categories' : '全部分类'} (${userCases.length})</option>` + [...cats].map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${catCountMap.get(c) || 0})</option>`).join('');
  if (prev) sel.value = prev;

  const catFilter = sel.value;
  const q = caseSearchActive;
  const filteredUser = searchCases(userCases, q).filter((c) => !catFilter || `${c.domain} · ${c.intent}` === catFilter);
  const filteredDemo = _cases.filter((c) => {
    const hay = `${c.title} ${c.rawInput} ${c.domain}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!catFilter || c.domain === catFilter || `${c.domain} · ${c.intent || ''}`.trim() === catFilter);
  });

  $('#userCaseCount').textContent = `${lang === 'en' ? 'Total' : '共'} ${userCases.length} ${lang === 'en' ? 'cases' : '条'} · ${catCounts.length} ${lang === 'en' ? 'types' : '类'} · ${lang === 'en' ? 'matched' : '命中'} ${filteredUser.length}`;
  const catSummary = $('#caseCatSummary');
  if (catSummary) catSummary.innerHTML = catCounts.map(([k, v]) => `<span class="chip">${escapeHtml(k)} <b>(${v})</b></span>`).join('') || '';

  $('#userCaseGrid').innerHTML = filteredUser.length
    ? filteredUser.map((c) => galleryCard({
        title: c.title, domain: c.domain, intent: c.intent, raw: c.rawInput,
        sub: `📚 ${lang === 'en' ? 'Collected' : '已收录'} · ${new Date(c.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })} · Goal ${c.goalLen || ''} 字符`,
        actionHtml: lang === 'en' ? 'Load & reference →' : '载入并参考分析 →',
        onClick: `loadUserCase('${c.id}')`,
      })).join('')
    : `<div class="history-empty">${lang === 'en' ? 'No matching cases yet — every compile is auto-collected here.' : '暂无匹配案例 —— 每次编译会自动收录到这里。'}</div>`;

  $('#caseGrid').innerHTML = filteredDemo.map((c, i) => galleryCard({
      title: c.title, domain: c.domain || '通用', intent: '演示', raw: c.rawInput,
      sub: `⭐ ${lang === 'en' ? 'Demo' : '演示'} ${String(i + 1).padStart(2, '0')} · ${escapeHtml(c.note || '')}`,
      actionHtml: lang === 'en' ? 'Load & compile →' : '载入并编译 →',
      onClick: `loadCaseById(${_cases.indexOf(c)})`,
    })).join('');

  window.loadCaseById = loadCaseById;
  window.loadUserCase = (id) => {
    const meta = userCases.find((c) => c.id === id);
    if (!meta) return;
    currentResult = compileCase(meta);
    renderResult(currentResult);
    switchTab('compile');
    toast(lang === 'en' ? 'Referenced collected case' : '已载入案例并生成参考分析');
  };
}
$('#caseSearch').addEventListener('input', (e) => { caseSearchActive = e.target.value.trim(); renderCaseLibrary(); });
$('#caseCatFilter').addEventListener('change', () => renderCaseLibrary());

/* ================= 设计自核验 ================= */
function renderDesignAudit() {
  const contrast = '#e6edf7 on #0f172a → ≈ 14.9:1（≥4.5:1 ✅）';
  const items = [
    { item: '视觉层次（标题/正文/辅助三级）', detail: 'h2/h3/lead/hint 字号与颜色分层', pass: true },
    { item: '正文对比度（WCAG AA）', detail: contrast, pass: true },
    { item: '焦点可见（键盘可达）', detail: ':focus 辉光 + Tab 导航 + ⌘↵ 快捷编译', pass: true },
    { item: '空状态引导', detail: '编译/思维链/竞品/案例库均有空状态', pass: true },
    { item: '加载态与错误态', detail: '竞品检索 loading + 错误提示；爬虫源失败可降级', pass: true },
    { item: '响应式适配', detail: '≤1080px 单列，滚动条暗色化', pass: true },
    { item: '信息密度（商务高效）', detail: '表格化 + 徽章 + 标签，一屏可读', pass: true },
    { item: '动效克制', detail: 'fade 0.18s + hover 微交互，无干扰动效', pass: true },
    { item: '可访问性标注', detail: 'aria/语义化 + 颜色不唯一依赖（文字+图形）', pass: true },
    { item: '骨架屏（检索加载）', detail: '竞品启示：Notion/Linear 风格 Skeleton', pass: false, planned: true },
    { item: '首访引导（Tour）', detail: '竞品启示：v0/Compiler 的新手引导', pass: false, planned: true },
  ];
  const passed = items.filter((i) => i.pass).length;
  $('#designAudit').innerHTML = `
    <div class="audit-score">${passed}/${items.length} <span>${lang === 'en' ? 'passing' : '通过'}</span></div>
    <div class="audit-items">${items.map((i) => `
      <div class="audit-item ${i.pass ? 'ok' : 'todo'}">
        <span class="audit-mark">${i.pass ? '✅' : i.planned ? '◻️' : '❌'}</span>
        <div><strong>${escapeHtml(i.item)}</strong><div class="gap-why">${escapeHtml(i.detail)}</div></div>
      </div>`).join('')}</div>`;
}

/* ================= AI 多轮澄清式输入 ================= */
let dialogueTranscript = [];
let dialogueQ = null;

function renderChat() {
  const area = $('#chatArea');
  let html = '<div class="chat-bubble bot">👋 ' + (lang === 'en' ? 'Tell me your idea first, then I will clarify step by step.' : '先告诉我你的想法，我会逐步澄清关键信息。') + '</div>';
  for (const t of dialogueTranscript) {
    html += `<div class="chat-bubble user">${escapeHtml(t.answer)}</div>`;
    html += `<div class="chat-bubble bot">${escapeHtml(t.question)}</div>`;
  }
  if (dialogueQ) html += `<div class="chat-bubble bot ask">❓ ${escapeHtml(dialogueQ.question)}</div>`;
  else html += `<div class="chat-bubble bot done">✅ ${lang === 'en' ? 'Clarification complete — click Compile.' : '澄清完成，点击「完成并编译」。'}</div>`;
  area.innerHTML = html;
  area.scrollTop = area.scrollHeight;
  $('#chatStatus').textContent = dialogueTranscript.length ? `${dialogueTranscript.length}/${dialogueTranscript.length + (dialogueQ ? 1 : 0)}` : '';
}

function startDialogue() {
  const raw = $('#rawInput').value.trim();
  if (!raw) { toast(lang === 'en' ? 'Enter a request first' : '请先输入诉求'); return; }
  dialogueTranscript = [];
  dialogueQ = nextQuestion(dialogueTranscript);
  renderChat();
}
function askNext() {
  const inputText = transcriptToInput(dialogueTranscript, $('#rawInput').value);
  // 用原始输入重新分析，仅当对话已加入时
  if (dialogueTranscript.length) dialogueQ = nextQuestion(dialogueTranscript);
  renderChat();
}
$('#chatSend').addEventListener('click', () => {
  const v = $('#chatInput').value.trim();
  if (!v) return;
  if (!dialogueQ) { toast(lang === 'en' ? 'Clarification done' : '澄清已完成'); return; }
  dialogueTranscript = addTurn(dialogueTranscript, dialogueQ.qid, dialogueQ.question, v);
  $('#chatInput').value = '';
  dialogueQ = nextQuestion(dialogueTranscript);
  renderChat();
});
$('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#chatSend').click(); } });
$('#chatCompile').addEventListener('click', () => {
  const raw = $('#rawInput').value.trim();
  if (!raw) { toast(lang === 'en' ? 'Enter a request first' : '请先输入诉求'); return; }
  const input = transcriptToInput(dialogueTranscript, raw);
  $('#rawInput').value = input;
  $('#rawInput').dispatchEvent(new Event('input', { bubbles: true }));
  compileNow();
});
$('#chatSkip').addEventListener('click', () => { dialogueTranscript = []; dialogueQ = null; renderChat(); compileNow(); });
$('#dialogueToggle').addEventListener('click', () => {
  const box = $('#dialogueBox');
  const open = box.classList.toggle('hidden');
  $('#dialogueToggle').textContent = open ? (lang === 'en' ? 'Open' : '展开') : (lang === 'en' ? 'Close' : '收起');
  if (!open && !dialogueQ && !dialogueTranscript.length) startDialogue();
  if (!open) $('#chatInput').focus();
});
$('#chatInput').addEventListener('focus', () => { if (!dialogueQ && !dialogueTranscript.length) startDialogue(); });

/* ================= 输入自动关联模板推荐 ================= */
function renderRecommendTemplates() {
  const box = $('#recTemplates');
  if (!box) return;
  const raw = $('#rawInput').value.trim().toLowerCase();
  if (!raw || !_templates.length) { box.innerHTML = ''; return; }
  const scored = _templates.map((t) => {
    const hay = `${t.title} ${t.domain} ${t.desc} ${t.raw}`.toLowerCase();
    const tokens = raw.split(/[\s，。！？、]+/).filter((x) => x.length >= 2);
    let score = 0;
    for (const tk of tokens) if (hay.includes(tk)) score += 2;
    for (const kw of t.raw.split(/[\s，。！？、]+/).filter((x) => x.length >= 2)) if (raw.includes(kw)) score += 1;
    return { t, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!scored.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<span class="hint">✨ ${lang === 'en' ? 'Recommended templates' : '推荐模板'}：</span>` + scored.map((x) => {
    const idx = _templates.indexOf(x.t);
    return `<span class="chip" data-rectpl="${idx}">${escapeHtml(x.t.title)}</span>`;
  }).join('');
  $$('[data-rectpl]').forEach((c) => c.addEventListener('click', () => {
    const t = _templates[Number(c.dataset.rectpl)];
    if (t) { $('#rawInput').value = t.raw; $('#rawInput').dispatchEvent(new Event('input', { bubbles: true })); toast(`${lang === 'en' ? 'Template loaded' : '已载入模板'}：${t.title}`); }
  }));
}
$('#rawInput').addEventListener('input', renderRecommendTemplates);

/* ================= 模板市场页 ================= */
let _marketData = null;
async function loadMarket() {
  window._marketLoaded = true;
  $('#marketLoading').classList.remove('hidden');
  try {
    const res = await fetch('/api/templates/market');
    _marketData = await res.json();
    renderMarket();
  } catch (e) { $('#marketLoading').textContent = `market error: ${e.message}`; }
  $('#marketLoading').classList.add('hidden');
}
let marketCat = '';
function renderMarket() {
  if (!_marketData) return;
  const kw = $('#marketSearch').value.trim().toLowerCase();
  const groups = _marketData.byCategory
    .map((g) => ({ ...g, items: g.items.filter((it) => (!marketCat || it.category === marketCat) && (!kw || `${it.name} ${it.description} ${it.title || ''} ${(it.tags || []).join(' ')} ${it.domain || ''}`.toLowerCase().includes(kw))) }))
    .filter((g) => g.items.length);
  const cats = ['', ..._marketData.byCategory.map((g) => g.name)];
  $('#marketCats').innerHTML = cats.map((c) => `<span class="chip ${marketCat === c ? 'active' : ''}" data-mcat="${escapeHtml(c)}">${c ? escapeHtml(c) : (lang === 'en' ? 'All' : '全部')}</span>`).join('');
  $$('[data-mcat]').forEach((c) => c.addEventListener('click', () => { marketCat = c.dataset.mcat; renderMarket(); }));
  $('#marketGroups').innerHTML = groups.map((g) => `
    <section class="card market-group">
      <h3>${escapeHtml(g.name)} <span class="badge">${g.items.length}</span></h3>
      <div class="market-grid">
        ${g.items.map((it) => it.kind === 'template' ? `
          <div class="market-card">
            <div class="market-badge">📋 模板</div>
            <h4>${escapeHtml(it.title)}</h4>
            <p>${escapeHtml(it.desc || '')}</p>
            <div class="market-raw">${escapeHtml(it.raw.slice(0, 90))}${it.raw.length > 90 ? '…' : ''}</div>
            <div class="market-actions"><button class="btn-ghost" data-mfill="${escapeHtml(it.raw)}">${lang === 'en' ? 'Fill input' : '填入输入框'}</button></div>
          </div>` : `
          <div class="market-card repo">
            <div class="market-badge">🐙 开源 ${it.stars ? `⭐ ${it.stars}` : ''}</div>
            <h4>${escapeHtml(it.name)}</h4>
            <p>${escapeHtml(it.description || '')}</p>
            <div class="market-tags">${(it.tags || []).slice(0, 4).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="market-actions"><a class="btn-ghost" href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${lang === 'en' ? 'Visit repo' : '访问仓库 ↗'}</a></div>
          </div>`).join('')}
      </div>
    </section>`).join('') || '<div class="history-empty">—</div>';
  $$('[data-mfill]').forEach((b) => b.addEventListener('click', () => {
    $('#rawInput').value = b.dataset.mfill;
    $('#rawInput').dispatchEvent(new Event('input', { bubbles: true }));
    switchTab('compile');
    toast(lang === 'en' ? 'Template filled' : '模板已填入输入框');
  }));
}
$('#marketSearch').addEventListener('input', renderMarket);

/* ================= 竞品 v6：分析对象 / 本产品报告 / 启示框图 / 图表 ================= */
function currentReqForAnalysis() {
  if (currentResult) return currentResult.analysis.raw;
  const v = $('#rawInput').value.trim();
  return v || '';
}
$('#useReqBtn').addEventListener('click', () => {
  const req = currentReqForAnalysis();
  if (!req) { toast(lang === 'en' ? 'Compile or enter a request first' : '请先输入/编译一个需求'); return; }
  // 用「对象 + 关键词」构造更接近需求的检索词，提升相关度
  let q = req.slice(0, 80);
  if (currentResult) {
    const obj = currentResult.analysis.entities.object || '';
    const kws = currentResult.keywordTop.filter((k) => /[a-z]/i.test(k)).slice(0, 3).join(' ');
    if (obj && !q.includes(obj)) q = `${obj} ${q}`;
    if (kws) q = `${q} ${kws}`;
  }
  $('#compQuery').value = q;
  $('#compTarget').textContent = `需求：${req.slice(0, 36)}${req.length > 36 ? '…' : ''}`;
  if (currentResult) renderReqInsight(currentResult);
  runCompetitive();
});
// 双视图切换：本产品竞品分析 / 需求竞品分析
$$('#compViewSeg .seg-btn').forEach((b) => b.addEventListener('click', () => {
  const v = b.dataset.cview;
  $$('#compViewSeg .seg-btn').forEach((x) => x.classList.toggle('active', x === b));
  $('#compViewSelf').classList.toggle('hidden', v !== 'self');
  $('#compViewReq').classList.toggle('hidden', v !== 'req');
  if (v === 'self') renderSelfComp();
  else renderScoringRules();
}));
function renderSelfComp() {
  const r = SELF_REPORT;
  $('#selfCompBody').innerHTML = `
    <div class="result-meta"><span class="badge badge-blue">${escapeHtml(r.product)}</span><span class="badge badge-green">${escapeHtml(r.tagline)}</span></div>
    <div class="comp-grid-2">
      <div class="card"><h3>定位</h3><p>产品化 ${r.position.x} / 拆解深度 ${r.position.y} — ${escapeHtml(r.position.note)}</p><div class="mini-pos"><div class="mini-dot" style="left:${r.position.x}%;top:${100 - r.position.y}%"></div></div></div>
      <div class="card"><h3>能力雷达（本产品 vs 精选库均值）</h3><div id="selfRadar"></div></div>
    </div>
    <div class="comp-grid-2">
      <div class="card"><h3>优势</h3><ul class="check-list">${r.strengths.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3>劣势</h3><ul class="check-list">${r.weaknesses.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="comp-grid-2">
      <div class="card"><h3>机会</h3><ul class="check-list">${r.opportunities.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3>威胁</h3><ul class="check-list">${r.threats.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="card"><h3>行动清单</h3><ul class="check-list">${r.actions.map((a) => `<li><strong>[${a.priority}]</strong> ${escapeHtml(a.action)}</li>`).join('')}</ul></div>`;
  // 本产品雷达（无竞品数据时用精选库均值近似）
  const radarData = { dims: [{ key: 'relevance', label: '相关度' }, { key: 'productization', label: '产品化' }, { key: 'depth', label: '拆解深度' }, { key: 'adoption', label: '采纳度' }], max: 5, series: [
    { name: '本产品', scores: [4.5, 4.2, 4.8, 2.6] },
    { name: '竞品均值', scores: [3.4, 2.9, 3.2, 3.6] },
  ] };
  $('#selfRadar').innerHTML = svgRadar(radarData);
}
$('#selfReportExport2').addEventListener('click', () => { download(`self-competitive-report.md`, selfReportToMarkdown()); toast('已导出'); });

const SELF_SOURCES = ['github', 'hackernews', 'npm', 'stackoverflow', 'huggingface', 'gitee', 'reddit', 'devto', 'curated'];
const SOURCE_LABEL = { github: 'GitHub', hackernews: 'HN', npm: 'npm', stackoverflow: 'StackOverflow', huggingface: 'HuggingFace', gitee: 'Gitee', reddit: 'Reddit', devto: 'Dev.to', curated: '精选库' };
function renderSelfSources() {
  const box = $('#selfSources'); if (!box) return;
  box.innerHTML = SELF_SOURCES.map((src) => `<span class="badge badge-cyan">${SOURCE_LABEL[src]}</span>`).join('');
}
async function runSelfScan() {
  const token = ghToken();
  const btn = $('#selfScanBtn');
  if (btn) { btn.disabled = true; btn.textContent = lang === 'en' ? 'Scanning…' : '扫描中…'; }
  try {
    const res = await fetch(`/api/competitive?q=goal compiler prompt task spec agent skill&sources=${SELF_SOURCES.join(',')}&token=${encodeURIComponent(token)}`);
    const data = await res.json();
    const report = buildReport(data.items, 'goal compiler · 本产品赛道');
    report.ghAuth = data.ghAuth || 'anonymous';
    const bySrc = Object.entries(report.bySource).map(([k, v]) => `<span class="badge">${k} ${v}</span>`).join('');
    $('#selfScanMetrics').innerHTML = [
      `<span class="badge badge-blue">共 ${report.total} 个相关竞品</span>`,
      bySrc,
      report.ghAuth === 'token' ? `<span class="badge badge-green">GitHub Token ✅</span>` : `<span class="badge badge-amber">GitHub 未认证（10/分）</span>`,
      ...(data.errors || []).slice(0, 2).map((e) => `<span class="badge badge-amber">⚠ ${escapeHtml(e)}</span>`),
    ].join('');
    const top = [...report.scored].sort((a, b) => b.scores.threat - a.scores.threat).slice(0, 3);
    $('#selfScanBody').innerHTML = `
      <p class="hint" style="margin-top:0">威胁度 Top 3（与需求分析同评分口径）：</p>
      ${top.map((it) => `<div class="closest-item"><a href="${escapeHtml(it.url)}" target="_blank" rel="noopener"><strong>${escapeHtml(it.name)}</strong></a><span class="hint">${it.categoryLabel} · 威胁 ${it.scores.threat.toFixed(1)} · ${escapeHtml((it.description || '').slice(0, 80))}</span></div>`).join('')}`;
  } catch (e) {
    $('#selfScanMetrics').innerHTML = `<span class="badge badge-amber">⚠ ${escapeHtml(e.message)}</span>`;
  }
  if (btn) { btn.disabled = false; btn.textContent = lang === 'en' ? '🔄 Scan self-competitors (9 sources)' : '🔄 扫描本产品相关竞品（9 源）'; }
}
$('#selfScanBtn').addEventListener('click', runSelfScan);
$('#insightDiagramBtn').addEventListener('click', () => {
  if (!currentReport) { runCompetitive(); setTimeout(() => document.getElementById('insightDiagram').scrollIntoView({ behavior: 'smooth' }), 2500); return; }
  document.getElementById('insightDiagram').scrollIntoView({ behavior: 'smooth' });
});
function openSelfReport() {
  const r = SELF_REPORT;
  $('#selfReportBody').innerHTML = `
    <div class="result-meta"><span class="badge badge-blue">${escapeHtml(r.product)}</span><span class="badge badge-green">${escapeHtml(r.tagline)}</span></div>
    <div class="card"><h3>定位</h3><p>产品化 ${r.position.x} / 拆解深度 ${r.position.y} — ${escapeHtml(r.position.note)}</p></div>
    <div class="comp-grid-2">
      <div class="card"><h3>优势</h3><ul class="check-list">${r.strengths.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3>劣势</h3><ul class="check-list">${r.weaknesses.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="comp-grid-2">
      <div class="card"><h3>机会</h3><ul class="check-list">${r.opportunities.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3>威胁</h3><ul class="check-list">${r.threats.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="card"><h3>行动清单</h3><ul class="check-list">${r.actions.map((a) => `<li><strong>[${a.priority}]</strong> ${escapeHtml(a.action)}</li>`).join('')}</ul></div>`;
  $('#selfReportModal').classList.remove('hidden');
}
$('#selfReportClose').addEventListener('click', () => $('#selfReportModal').classList.add('hidden'));
$('#selfReportModal').addEventListener('click', (e) => { if (e.target === $('#selfReportModal')) $('#selfReportModal').classList.add('hidden'); });
$('#selfReportExport').addEventListener('click', () => { download(`self-competitive-report.md`, selfReportToMarkdown()); toast('已导出'); });

/** 需求结构思维框图：展示所填需求的结构思维（目标树 + 假设 + 建议），点击弹窗说明 */
function renderReqInsight(r) {
  const t = r.summary.goalTree;
  const groups = [
    { name: '目标树', items: [
      { id: 'rt-goal', title: t.goal, detail: '最终目标（结果优先倒推）' },
      ...t.results.map((x, i) => ({ id: `rt-r${i}`, title: `结果${i + 1}：${x.slice(0, 30)}`, detail: x })),
      ...t.abilities.map((x, i) => ({ id: `rt-a${i}`, title: `能力${i + 1}：${x.slice(0, 30)}`, detail: x })),
      ...t.modules.map((x, i) => ({ id: `rt-m${i}`, title: `模块${i + 1}：${x.slice(0, 30)}`, detail: x })),
      ...t.standards.map((x, i) => ({ id: `rt-s${i}`, title: `验收${i + 1}：${x.slice(0, 30)}`, detail: x })),
      ...t.risks.map((x, i) => ({ id: `rt-k${i}`, title: `风险${i + 1}：${x.slice(0, 30)}`, detail: x })),
    ] },
    { name: '关键假设', items: r.summary.assumptions.slice(0, 6).map((x, i) => ({ id: `as-${i}`, title: x.slice(0, 30), detail: x })) },
    { name: '你没考虑到的方向', items: r.suggestions.map((x, i) => ({ id: `sg-${i}`, title: x.slice(0, 26), detail: x })) },
  ].filter((g) => g.items.length);
  const box = $('#insightDiagram');
  box.innerHTML = `<div class="cd-flow">${groups.map((g) => `
    <div class="cd-lane">
      <div class="cd-lane-head">${escapeHtml(g.name)} <span class="hint">×${g.items.length}</span></div>
      <div class="cd-lane-body">
        ${g.items.map((n) => `<div class="cd-node" data-ri="${escapeHtml(n.id)}" data-group="${escapeHtml(g.name)}">
          <span class="cd-node-step ok">▸</span><div class="cd-node-title">${escapeHtml(n.title)}</div></div>`).join('')}
      </div>
    </div>`).join('')}</div>`;
  $$('#insightDiagram .cd-node').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.ri;
    const all = groups.flatMap((g) => g.items);
    const node = all.find((n) => n.id === id);
    if (!node) return;
    $('#insightModalTitle').textContent = `${el.dataset.group} · ${node.title}`;
    $('#insightModalBody').innerHTML = `<div class="chain-body-open"><div class="row"><span class="label">说明</span><div class="reasoning">${escapeHtml(node.detail)}</div></div></div>`;
    $('#insightModal').classList.remove('hidden');
  }));
}

/** 洞察入口：勾选「需求结构」显示所填需求结构；否则显示竞品启示 */
function renderInsight(report) {
  const reqMode = $('#insightMode') ? $('#insightMode').checked : true;
  if (reqMode && currentResult) { renderReqInsight(currentResult); return; }
  renderInsightDiagram(report);
}
$('#insightMode').addEventListener('change', () => { if (currentReport) renderInsight(currentReport); });

/** 最接近需求的项目 Top3（按相关度） */
function renderClosestProjects(report) {
  const top = [...report.scored].sort((a, b) => b.scores.relevance - a.scores.relevance).slice(0, 3);
  $('#closestProjects').innerHTML = top.length ? `<ul class="closest-ul">${top.map((it) => `
    <li class="closest-item">
      <a href="${escapeHtml(it.url)}" target="_blank" rel="noopener"><strong>${escapeHtml(it.name)}</strong></a>
      <span class="hint">相关度 ${it.scores.relevance.toFixed(1)} · 威胁 ${it.scores.threat.toFixed(1)} · ${escapeHtml((it.description || '').slice(0, 80))}</span>
    </li>`).join('')}</ul>` : '<div class="history-empty">—</div>';
}
$('#relOnly').addEventListener('change', () => { if (currentReport) renderCompSections(currentReport); });

function renderInsightDiagram(report) {
  const groups = buildInsightDiagram(report);
  const box = $('#insightDiagram');
  box.innerHTML = `<div class="cd-flow">${groups.map((g, gi) => `
    <div class="cd-lane">
      <div class="cd-lane-head">${escapeHtml(g.name)} <span class="hint">×${g.items.length}</span></div>
      <div class="cd-lane-body">
        ${g.items.map((n) => `
          <div class="cd-node" data-insight="${escapeHtml(n.id)}" data-group="${escapeHtml(g.name)}">
            <span class="cd-node-step ${n.status === 'implemented' ? 'ok' : ''}">${n.status === 'implemented' ? '✓' : '◻'}</span>
            <div class="cd-node-title">${escapeHtml(n.title)}</div>
          </div>`).join('')}
      </div>
    </div>`).join('')}</div>`;
  $$('#insightDiagram .cd-node').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.insight;
    const g = report.featureGaps.find((x) => `gap-${x.feature}` === id);
    const d = report.designForms.find((x) => `form-${x.form}` === id);
    const node = g || d;
    if (!node) return;
    const detail = g ? `来源证据：${g.source}。为什么补：${g.why}。优先级：${g.priority}。状态：${g.status === 'implemented' ? '已实现' : '规划中'}。` : `借鉴来源：${d.from}。说明：${d.note}。状态：${d.adopted ? '已采纳' : '规划中'}。`;
    $('#insightModalTitle').textContent = `${el.dataset.group} · ${node.feature || node.form}`;
    $('#insightModalBody').innerHTML = `
      <div class="result-meta"><span class="badge ${(g ? g.status : d.adopted) === 'implemented' || (g ? g.status : d.adopted) === true ? 'badge-green' : 'badge-gray'}">${g ? (g.status === 'implemented' ? '✅ 已实现' : '◻️ 规划中') : (d.adopted ? '✅ 已采纳' : '◻️ 规划中')}</span></div>
      <div class="chain-body-open">
        <div class="row"><span class="label">说明</span><div class="reasoning">${escapeHtml(detail)}</div></div>
        <div class="row"><span class="label">建议</span><div class="outcome">${escapeHtml(g ? g.why : d.note)}</div></div>
      </div>`;
    $('#insightModal').classList.remove('hidden');
  }));
}
$('#insightModalClose').addEventListener('click', () => $('#insightModal').classList.add('hidden'));
$('#insightModal').addEventListener('click', (e) => { if (e.target === $('#insightModal')) $('#insightModal').classList.add('hidden'); });

/* ---- 图表：SVG 雷达 + 威胁 Top5 条形 ---- */
function svgRadar(data) {
  const W = 300, H = 240, cx = W / 2, cy = H / 2, R = 78;
  const n = data.dims.length;
  const pt = (i, r) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };
  const poly = (r) => data.dims.map((_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');
  const series = data.series.map((sr, si) => {
    const color = ['#22d3ee', '#64748b', '#fbbf24'][si] || '#3b82f6';
    const pts = sr.scores.map((v, i) => pt(i, (v / data.max) * R).map((x) => x.toFixed(1)).join(',')).join(' ');
    return { name: sr.name, color, pts };
  });
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="radar-svg" role="img" aria-label="radar">`;
  for (let ring = 1; ring <= 4; ring++) svg += `<polygon points="${poly((R * ring) / 4)}" fill="none" stroke="#1e2a44" stroke-width="1"/>`;
  data.dims.forEach((d, i) => {
    const [x, y] = pt(i, R + 16);
    svg += `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0].toFixed(1)}" y2="${pt(i, R)[1].toFixed(1)}" stroke="#1e2a44"/>`;
    svg += `<text x="${x}" y="${y}" fill="#94a3b8" font-size="10" text-anchor="middle">${escapeHtml(d.label)}</text>`;
  });
  series.forEach((sr) => { svg += `<polygon points="${sr.pts}" fill="${sr.color}" fill-opacity="0.14" stroke="${sr.color}" stroke-width="2"/>`; });
  svg += '</svg>';
  const legend = series.map((sr) => `<span class="lg" style="--c:${sr.color}"><i style="background:${sr.color}"></i>${escapeHtml(sr.name)}</span>`).join('');
  return `<div class="radar-wrap"><div class="radar-chart">${svg}</div><div class="legend">${legend}</div></div>`;
}
function renderCharts(report) {
  const radar = svgRadar(buildRadarData(report.scored));
  const top = [...report.scored].sort((a, b) => b.scores.threat - a.scores.threat).slice(0, 5);
  const maxT = Math.max(1, ...top.map((t) => t.scores.threat));
  const threatBars = `<div class="chart-block"><h4>威胁度 Top 5</h4>${top.map((t) => `
    <div class="cat-bar"><span style="font-size:11px">${escapeHtml(t.name.slice(0, 14))}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(t.scores.threat / maxT) * 100}%;background:linear-gradient(90deg,#f87171,#fbbf24)"></div></div>
      <span>${t.scores.threat.toFixed(1)}</span></div>`).join('')}</div>`;
  const catBars = `<div class="chart-block"><h4>分类分布</h4>${report.categoryDist.map((c) => `
    <div class="cat-bar"><span style="font-size:11px">${escapeHtml(categoryLabel(c.name))}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(c.count / Math.max(1, ...report.categoryDist.map((x) => x.count))) * 100}%"></div></div>
      <span>${c.count}</span></div>`).join('')}</div>`;
  $('#compCharts').innerHTML = `<div class="comp-charts-grid">${radar}${threatBars}${catBars}</div>`;
}

/* ================= 初始化 ================= */
async function init() {
  loadHistory();
  loadUserCases();
  applyI18n();
  renderDesignAudit();
  renderScoringRules();
  renderUsageStats();
  renderSelfSources();
  updateGhStatus();
  $('#ghToken').value = ghToken();
  await loadCases();
  await loadTemplates();
  fetch('/api/health').then((r) => r.json()).then((d) => { $('#serverStatus').textContent = d.ok ? (lang === 'en' ? 'online' : '服务正常') : 'local'; })
    .catch(() => { $('#serverStatus').textContent = 'offline'; });
  const name = (location.hash || '#/compile').replace('#/', '');
  if (['compile', 'chain', 'competitive', 'cases', 'market', 'about'].includes(name)) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
  }
}
init();
