/**
 * app.mjs — Goal Compiler 平台前端逻辑（v3）
 * 依赖：compiler/index（中英双语编译）、competitive（竞品分析）、caselib（案例库）
 * 新增：i18n 双语、多模态输入（语音/图片/文件）、案例库自动收录与搜索、
 *       8 数据源竞品、就绪度评估、⌘↵ 快捷编译、分享、设计自核验。
 */
import { compile } from './compiler/index.mjs';
import { buildReport, reportToMarkdown, categoryLabel, FEATURE_GAPS, DESIGN_FORMS, SCORING_RULES, QUADRANT_RULES, groupByCategory } from './competitive.mjs';
import { toCaseMeta, saveCase, saveCaseByType, removeCase, searchCases, categoriesOf, compileCase } from './caselib.mjs';
import { buildSkillMd, skillFilename } from './skilllib.mjs';

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
}
$$('.tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
window.addEventListener('hashchange', () => {
  const name = (location.hash || '#/compile').replace('#/', '');
  if (['compile', 'chain', 'competitive', 'cases', 'about'].includes(name)) switchTab(name);
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
  // 案例库：只收集「不同类型」的需求（按 领域·意图 去重）
  userCases = saveCaseByType(userCases, toCaseMeta(currentResult));
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
  const grid = $('#scoringRules');
  if (!grid) return;
  grid.innerHTML = SCORING_RULES.map((r) => `
    <div class="score-rule">
      <div class="score-rule-head"><strong>${escapeHtml(r.dim)}</strong><span class="hint">${escapeHtml(r.en)} · ${r.range} 分</span></div>
      <div class="score-rule-formula">${escapeHtml(r.formula)}</div>
      <div class="gap-why">${escapeHtml(r.meaning)}</div>
    </div>`).join('');
  const qr = $('#quadrantRules');
  if (qr) {
    qr.innerHTML = QUADRANT_RULES.map((q) => `
      <div class="quad-rule"><b>${lang === 'en' ? q.en : q.q}</b> <span class="hint">${escapeHtml(q.rule)}</span><div class="gap-why">${escapeHtml(q.note)}</div></div>`).join('');
  }
}

function renderCompSections(report) {
  const groups = groupByCategory(report.scored);
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

/* ================= 思维链 ================= */
function renderChain() {
  if (!currentResult) return;
  $('#chainEmpty').classList.add('hidden');
  $('#chainList').classList.remove('hidden');
  $('#chainList').innerHTML = currentResult.chain.map((n) => `
    <div class="chain-node" id="cn-${n.step}" data-step="${n.step}">
      <div class="chain-head">
        <span class="chain-step">${n.step}</span><span class="chain-phase">${n.phase}</span>
        <span class="chain-title">${escapeHtml(n.title)}</span><span class="chain-arrow">▾</span>
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
$('#playChainBtn').addEventListener('click', async () => {
  if (!currentResult) return;
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
async function runCompetitive() {
  const q = $('#compQuery').value.trim() || 'goal compiler prompt';
  const sources = checkedSources();
  $('#compLoading').classList.remove('hidden');
  $('#compError').classList.add('hidden');
  $('#compResult').classList.add('hidden');
  try {
    const res = await fetch(`/api/competitive?q=${encodeURIComponent(q)}&sources=${sources.join(',')}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failed');
    if (!data.items.length) throw new Error(lang === 'en' ? 'No results — try other keywords/sources' : '未检索到结果，请更换关键词或开启更多数据源');
    currentReport = buildReport(data.items, q);
    currentReport.sourceErrors = data.errors || [];
    renderReport(currentReport);
  } catch (err) {
    $('#compLoading').classList.add('hidden');
    $('#compError').textContent = `${lang === 'en' ? 'Scan failed' : '检索失败'}：${err.message}`;
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
  renderCompSections(report);
  renderCompTable(report.scored);
  renderPositioning(report);
  renderCategory(report.categoryDist);
  renderGaps(report.featureGaps);
  renderDesignForms(report.designForms);
  renderSwot(report.swot);
  $('#compOpps').innerHTML = report.opportunities.map((o) => `<li><strong>[${o.priority}] ${escapeHtml(o.title)}</strong> — ${escapeHtml(o.detail)}</li>`).join('');
  $('#compRec').textContent = report.recommendation;
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
  $('#compGaps').innerHTML = `<ul class="gap-list-ul">${gaps.map((g) => `
    <li class="gap-item ${g.status}">
      <span class="gap-mark">${g.status === 'implemented' ? '✅' : '◻️'}</span>
      <div><strong>[${g.priority}] ${escapeHtml(g.feature)}</strong> <span class="hint">来源：${escapeHtml(g.source)}</span>
      <div class="gap-why">${escapeHtml(g.why)}</div></div>
    </li>`).join('')}</ul>`;
}
function renderDesignForms(forms) {
  $('#compDesign').innerHTML = `<ul class="gap-list-ul">${forms.map((d) => `
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
function renderCaseLibrary() {
  window._caseRendered = true;
  // 分类过滤下拉
  const cats = new Set([...categoriesOf(userCases).map(([k]) => k), ..._cases.map((c) => c.domain)]);
  const sel = $('#caseCatFilter');
  const prev = sel.value;
  sel.innerHTML = `<option value="">${lang === 'en' ? 'All categories' : '全部分类'}</option>` + [...cats].map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (prev) sel.value = prev;

  const catFilter = sel.value;
  const q = caseSearchActive;
  const filteredUser = searchCases(userCases, q).filter((c) => !catFilter || `${c.domain} · ${c.intent}` === catFilter);
  const filteredDemo = _cases.filter((c) => {
    const hay = `${c.title} ${c.rawInput} ${c.domain}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!catFilter || c.domain === catFilter || `${c.domain} · ${c.intent || ''}`.trim() === catFilter);
  });

  $('#userCaseCount').textContent = `${lang === 'en' ? 'Total' : '共'} ${userCases.length} ${lang === 'en' ? 'cases' : '条'} · ${lang === 'en' ? 'matched' : '命中'} ${filteredUser.length}`;

  $('#userCaseGrid').innerHTML = filteredUser.length
    ? filteredUser.map((c, i) => `
      <div class="case-card" data-usercase="${c.id}">
        <span class="badge badge-cyan">📚 ${lang === 'en' ? 'Collected' : '已收录'} ${escapeHtml(c.domain)}</span>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.rawInput.slice(0, 90))}${c.rawInput.length > 90 ? '…' : ''}</p>
        <div class="case-meta"><span class="hint">${escapeHtml(c.intent)} · ${new Date(c.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
        <span class="case-action">${lang === 'en' ? 'Load & reference →' : '载入并参考分析 →'}</span>
      </div>`).join('')
    : `<div class="history-empty">${lang === 'en' ? 'No matching cases yet — every compile is auto-collected here.' : '暂无匹配案例 —— 每次编译会自动收录到这里。'}</div>`;

  $('#caseGrid').innerHTML = filteredDemo.map((c, i) => `
    <div class="case-card" data-case="${_cases.indexOf(c)}">
      <span class="badge badge-blue">⭐ ${lang === 'en' ? 'Demo' : '演示'} ${String(i + 1).padStart(2, '0')}</span>
      <h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.note || '')}</p>
      <div class="case-raw">${escapeHtml(c.rawInput)}</div>
      <span class="case-action">${lang === 'en' ? 'Load & compile →' : '载入并编译 →'}</span>
    </div>`).join('');

  $$('.case-card[data-case]').forEach((el) => el.addEventListener('click', () => loadCaseById(Number(el.dataset.case))));
  $$('.case-card[data-usercase]').forEach((el) => el.addEventListener('click', () => {
    const meta = userCases.find((c) => c.id === el.dataset.usercase);
    if (!meta) return;
    currentResult = compileCase(meta);
    renderResult(currentResult);
    switchTab('compile');
    toast(lang === 'en' ? 'Referenced collected case' : '已载入案例并生成参考分析');
  }));
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

/* ================= 初始化 ================= */
async function init() {
  loadHistory();
  loadUserCases();
  applyI18n();
  renderDesignAudit();
  renderScoringRules();
  renderUsageStats();
  await loadCases();
  await loadTemplates();
  fetch('/api/health').then((r) => r.json()).then((d) => { $('#serverStatus').textContent = d.ok ? (lang === 'en' ? 'online' : '服务正常') : 'local'; })
    .catch(() => { $('#serverStatus').textContent = 'offline'; });
  const name = (location.hash || '#/compile').replace('#/', '');
  if (['compile', 'chain', 'competitive', 'cases', 'about'].includes(name)) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
  }
}
init();
