/**
 * app.mjs — Goal Compiler 平台前端逻辑
 * 依赖：/js/compiler/index.mjs（编译引擎）、/js/competitive.mjs（竞品分析）
 */
import { compile } from './compiler/index.mjs';
import { buildReport, reportToMarkdown, categoryLabel } from './competitive.mjs';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

let currentResult = null;
let currentReport = null;
let historyList = [];

/* ================= 通用工具 ================= */
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
function download(filename, text, mime = 'text/markdown') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function copyText(text) {
  return navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板'), () => toast('复制失败'));
}
function badgeClass(score) { return score >= 4 ? 'score-high' : score >= 3 ? 'score-mid' : 'score-low'; }

/* ================= Tabs ================= */
function switchTab(name) {
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
  location.hash = `#/${name}`;
  if (name === 'chain' && currentResult) renderChain();
  if (name === 'cases' && !window._casesLoaded) loadCases();
}
$$('.tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
window.addEventListener('hashchange', () => {
  const name = (location.hash || '#/compile').replace('#/', '');
  if (['compile', 'chain', 'competitive', 'cases', 'about'].includes(name)) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
  }
});

/* ================= 编译 ================= */
function readInput() {
  const raw = $('#rawInput').value.trim();
  if (!raw) { toast('请先输入一段原始诉求'); return null; }
  const opts = {
    mode: $('#modeSelect').value,
    user: $('#optUser').value.trim(),
    timebox: $('#optTime').value.trim(),
    constraints: $('#optConst').value.trim(),
  };
  let augmented = raw;
  const extras = [];
  if (opts.user) extras.push(`目标用户：${opts.user}`);
  if (opts.timebox) extras.push(`时间盒：${opts.timebox}`);
  if (opts.constraints) extras.push(`约束：${opts.constraints}`);
  if (extras.length) augmented = `${raw}\n补充信息：${extras.join('；')}`;
  return { raw, augmented, opts };
}

function compileNow() {
  const input = readInput();
  if (!input) return;
  currentResult = compile(input.augmented, { mode: input.opts.mode });
  renderResult(currentResult);
  switchTab('compile');
}

$('#compileBtn').addEventListener('click', compileNow);
$('#rawInput').addEventListener('input', () => {
  const t = $('#rawInput').value.trim();
  const sentences = t.split(/[。！？!?；;\n]+/).filter((s) => s.trim()).length;
  $('#inputStats').textContent = `${t.length} 字 · ${sentences} 句`;
});
$('#clearInput').addEventListener('click', () => { $('#rawInput').value = ''; $('#inputStats').textContent = '0 字 · 0 句'; });
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
  $('#rIntent').textContent = `意图：${a.intent.label}`;
  $('#rDomain').textContent = `领域：${a.domains.primary}`;
  $('#rQuality').textContent = `质量门槛 L${r.qualityLevel}`;
  $('#rHash').textContent = `#${r.inputHash}`;
  $('#rTime').textContent = new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour12: false });
  $('#rUnderstanding').textContent = r.summary.understanding;
  $('#rDeepGoal').textContent = r.summary.deepGoal;

  $('#rAssumptions').innerHTML = r.summary.assumptions.map((x) => {
    const tag = x.startsWith('FACT') ? 'FACT' : x.startsWith('ASSUMPTION') ? 'ASSUMPTION' : 'DECISION';
    const cls = tag === 'FACT' ? 'badge-blue' : tag === 'ASSUMPTION' ? 'badge' : 'badge-green';
    return `<li><span class="badge ${cls}">${tag}</span> ${escapeHtml(x.replace(/^(FACT|ASSUMPTION|DECISION):\s*/, ''))}</li>`;
  }).join('');

  const t = r.summary.goalTree;
  const treeLines = [
    `<span class="t-goal">🎯 ${escapeHtml(t.goal)}</span>`,
    '├── 核心结果',
    ...t.results.map((x, i) => `│   ${i === t.results.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '├── 核心能力',
    ...t.abilities.map((x, i) => `│   ${i === t.abilities.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '├── 工作模块',
    ...t.modules.map((x, i) => `│   ${i === t.modules.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '├── 验收标准',
    ...t.standards.map((x, i) => `│   ${i === t.standards.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
    '└── 风险与约束',
    ...t.risks.map((x, i) => `    ${i === t.risks.length - 1 ? '└' : '├'}── ${escapeHtml(x)}`),
  ].join('\n');
  $('#rGoalTree').innerHTML = `<div class="tree">${treeLines}</div>`;

  $('#rScope').innerHTML = [
    scopeBox('scope-in', 'IN SCOPE · 必须完成', r.summary.scope.inScope),
    scopeBox('scope-out', 'OUT OF SCOPE · 明确不做', r.summary.scope.outOfScope),
    scopeBox('scope-opt', 'OPTIONAL · 增强项', r.summary.scope.optional),
  ].join('');

  $('#rCriteria').innerHTML = r.summary.successCriteria.map((x) => `<li>${escapeHtml(x)}</li>`).join('');

  $('#rRoadmap').innerHTML = `<div class="roadmap">${r.summary.roadmap.map((s) => `<div class="road-step"><b>${escapeHtml(s.phase)}</b><span>${escapeHtml(s.output)}</span></div>`).join('')}</div>`;

  const riskRows = r.summary.risks.map((x) => `<tr><td>${escapeHtml(x.risk)}</td><td>${escapeHtml(x.level)}</td><td>${escapeHtml(x.mitigation)}</td></tr>`).join('');
  $('#rRisks tbody').innerHTML = riskRows;

  $('#rSuggestions').innerHTML = r.suggestions.map((s) => `<span class="chip">💡 ${escapeHtml(s)}</span>`).join('');

  $('#goalPrompt').value = r.goalPrompt;
  $('#goalCount').textContent = `${r.goalPrompt.length} 字符`;
  $('#rMachineGoal').textContent = r.machineGoal;

  renderChain();
}

function scopeBox(cls, title, items) {
  return `<div class="scope-box ${cls}"><h4>${title}</h4><ul>${items.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`;
}

/* ================= Goal 编辑/导出 ================= */
$('#copyGoalBtn').addEventListener('click', () => currentResult && copyText($('#goalPrompt').value));
$('#copyGoalBtn2').addEventListener('click', () => currentResult && copyText($('#goalPrompt').value));
$('#resetGoalBtn').addEventListener('click', () => { if (currentResult) { $('#goalPrompt').value = currentResult.goalPrompt; toast('已恢复原文'); } });
$('#downloadBtn').addEventListener('click', () => {
  if (!currentResult) return;
  download(`goal-${currentResult.inputHash}.md`, exportResultMD(currentResult));
  toast('已导出 MD');
});
$('#saveDraftBtn').addEventListener('click', () => {
  if (!currentResult) return;
  const draft = {
    id: currentResult.id,
    hash: currentResult.inputHash,
    raw: currentResult.analysis.raw,
    title: currentResult.analysis.entities.object || '未命名目标',
    goal: $('#goalPrompt').value,
    savedAt: new Date().toISOString(),
  };
  historyList = [draft, ...historyList.filter((h) => h.id !== draft.id)].slice(0, 20);
  localStorage.setItem('gc-history', JSON.stringify(historyList));
  toast('已保存到历史');
});
$('#historyBtn').addEventListener('click', openHistory);

function loadHistory() {
  try { historyList = JSON.parse(localStorage.getItem('gc-history') || '[]'); } catch { historyList = []; }
}
function openHistory() {
  loadHistory();
  const box = $('#historyList');
  if (!historyList.length) { box.innerHTML = '<div class="history-empty">暂无草稿历史</div>'; }
  else {
    box.innerHTML = historyList.map((h, i) => `
      <div class="history-item">
        <div class="h-info">
          <div class="h-title">${escapeHtml(h.title)}</div>
          <div class="h-sub">${escapeHtml(h.raw.slice(0, 60))}… · ${new Date(h.savedAt).toLocaleString('zh-CN', { hour12: false })}</div>
        </div>
        <button class="btn-ghost" data-h-restore="${i}">恢复</button>
        <button class="btn-ghost" data-h-del="${i}">删除</button>
      </div>`).join('');
  }
  $('#historyModal').classList.remove('hidden');
}
$('#historyClose').addEventListener('click', () => $('#historyModal').classList.add('hidden'));
$('#historyModal').addEventListener('click', (e) => {
  if (e.target === $('#historyModal')) $('#historyModal').classList.add('hidden');
  const ri = e.target.dataset.hRestore;
  const di = e.target.dataset.hDel;
  if (ri != null) {
    const h = historyList[Number(ri)];
    if (h) {
      $('#goalPrompt').value = h.goal;
      $('#rawInput').value = h.raw;
      toast('已恢复草稿（可重新编译后对比）');
    }
    $('#historyModal').classList.add('hidden');
  }
  if (di != null) {
    historyList.splice(Number(di), 1);
    localStorage.setItem('gc-history', JSON.stringify(historyList));
    openHistory();
  }
});

function exportResultMD(r) {
  const L = [];
  L.push(`# Goal Compiler 编译结果 · #${r.inputHash}`);
  L.push('');
  L.push(`> 原始诉求：${r.analysis.raw}`);
  L.push(`> 意图：${r.analysis.intent.label} ｜ 领域：${r.analysis.domains.primary} ｜ 生成时间：${new Date(r.createdAt).toLocaleString('zh-CN', { hour12: false })}`);
  L.push('');
  L.push('## ① 原始需求理解');
  L.push(r.summary.understanding);
  L.push('');
  L.push('## ② 深层目标');
  L.push(r.summary.deepGoal);
  L.push('');
  L.push('## ③ 关键假设');
  r.summary.assumptions.forEach((x) => L.push(`- ${x}`));
  L.push('');
  L.push('## ④ 目标树');
  const t = r.summary.goalTree;
  L.push(`**${t.goal}**`);
  L.push('- 核心结果'); t.results.forEach((x) => L.push(`  - ${x}`));
  L.push('- 核心能力'); t.abilities.forEach((x) => L.push(`  - ${x}`));
  L.push('- 工作模块'); t.modules.forEach((x) => L.push(`  - ${x}`));
  L.push('- 验收标准'); t.standards.forEach((x) => L.push(`  - ${x}`));
  L.push('- 风险与约束'); t.risks.forEach((x) => L.push(`  - ${x}`));
  L.push('');
  L.push('## ⑤ 任务边界');
  L.push('### IN SCOPE'); r.summary.scope.inScope.forEach((x) => L.push(`- ${x}`));
  L.push('### OUT OF SCOPE'); r.summary.scope.outOfScope.forEach((x) => L.push(`- ${x}`));
  L.push('### OPTIONAL'); r.summary.scope.optional.forEach((x) => L.push(`- ${x}`));
  L.push('');
  L.push('## ⑥ 成功标准');
  r.summary.successCriteria.forEach((x) => L.push(`- [ ] ${x}`));
  L.push('');
  L.push('## ⑦ 执行路线');
  r.summary.roadmap.forEach((x) => L.push(`- ${x.phase}：${x.output}`));
  L.push('');
  L.push('## ⑧ 风险与应对');
  r.summary.risks.forEach((x) => L.push(`- ${x.risk}（${x.level}）→ ${x.mitigation}`));
  L.push('');
  L.push('## ＋ 你没考虑到的方向');
  r.suggestions.forEach((x) => L.push(`- ${x}`));
  L.push('');
  L.push('## ⑨ 最终 Goal Prompt（可编辑版）');
  L.push('');
  L.push('```markdown');
  L.push($('#goalPrompt').value);
  L.push('```');
  L.push('');
  L.push('## Machine-Executable Goal（紧凑版）');
  L.push('');
  L.push('```markdown');
  L.push(r.machineGoal);
  L.push('```');
  return L.join('\n');
}

/* ================= 思维链 ================= */
function renderChain() {
  if (!currentResult) return;
  $('#chainEmpty').classList.add('hidden');
  $('#chainList').classList.remove('hidden');
  $('#chainList').innerHTML = currentResult.chain.map((n) => `
    <div class="chain-node" id="cn-${n.step}" data-step="${n.step}">
      <div class="chain-head">
        <span class="chain-step">${n.step}</span>
        <span class="chain-phase">${n.phase}</span>
        <span class="chain-title">${escapeHtml(n.title)}</span>
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
$('#playChainBtn').addEventListener('click', async () => {
  if (!currentResult) return;
  const nodes = $$('#chainList .chain-node');
  nodes.forEach((n) => n.classList.remove('open'));
  for (const n of nodes) {
    n.classList.add('open');
    n.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise((r) => setTimeout(r, 650));
  }
});
$('#exportChainMd').addEventListener('click', () => {
  if (!currentResult) return;
  const L = ['# Goal Compiler 完整思维链', ''];
  currentResult.chain.forEach((n) => {
    L.push(`## ${n.step}. ${n.title}（${n.phase}）`);
    L.push(`- **Input**：${n.input}`);
    L.push(`- **Reasoning**：${n.reasoning}`);
    L.push(`- **Output**：${Array.isArray(n.output) ? n.output.join('；') : n.output}`);
    if (n.evidence && n.evidence.length) L.push(`- **Evidence**：${n.evidence.join('；')}`);
    if (n.decisions && n.decisions.length) L.push(`- **Decisions**：${n.decisions.join('；')}`);
    L.push('');
  });
  download(`chain-${currentResult.inputHash}.md`, L.join('\n'));
  toast('思维链已导出 MD');
});
$('#exportChainJson').addEventListener('click', () => {
  if (!currentResult) return;
  download(`chain-${currentResult.inputHash}.json`, JSON.stringify({ meta: { id: currentResult.id, input: currentResult.analysis.raw, createdAt: currentResult.createdAt }, chain: currentResult.chain }, null, 2), 'application/json');
  toast('思维链已导出 JSON');
});

/* ================= 竞品分析 ================= */
async function runCompetitive() {
  const q = $('#compQuery').value.trim() || 'goal compiler prompt';
  const sources = [];
  if ($('#srcGithub').checked) sources.push('github');
  if ($('#srcHN').checked) sources.push('hackernews');
  if ($('#srcCurated').checked) sources.push('curated');
  $('#compLoading').classList.remove('hidden');
  $('#compError').classList.add('hidden');
  $('#compResult').classList.add('hidden');
  try {
    const res = await fetch(`/api/competitive?q=${encodeURIComponent(q)}&sources=${sources.join(',')}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '检索失败');
    if (!data.items.length) throw new Error('未检索到结果，请尝试更换关键词或开启更多数据源');
    currentReport = buildReport(data.items, q);
    renderReport(currentReport);
  } catch (err) {
    $('#compLoading').classList.add('hidden');
    $('#compError').textContent = `检索失败：${err.message}（若为 GitHub 限流，可稍候重试或只勾选「精选库」离线分析）`;
    $('#compError').classList.remove('hidden');
  }
}
$('#compSearchBtn').addEventListener('click', runCompetitive);

let compSortKey = 'scores.threat';
let compSortDir = -1;

function renderReport(report) {
  $('#compLoading').classList.add('hidden');
  $('#compResult').classList.remove('hidden');
  $('#compMetrics').innerHTML = [
    `<span class="badge badge-blue">共 ${report.total} 个竞品</span>`,
    ...Object.entries(report.bySource).map(([k, v]) => `<span class="badge">${k} ${v}</span>`),
    `<span class="badge badge-green">检索词：${escapeHtml(report.query)}</span>`,
  ].join('');

  renderCompTable(report.scored);
  renderPositioning(report);
  renderCategory(report.categoryDist);
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
    const va = sortVal(a); const vb = sortVal(b);
    if (typeof va === 'string') return compSortDir * va.localeCompare(vb, 'zh');
    return compSortDir * (va - vb);
  });
  const head = ['name', 'categoryLabel', 'source', 'stars', 'scores.adoption', 'scores.productization', 'scores.depth', 'scores.threat'];
  const headLabel = { name: '名称', categoryLabel: '类别', source: '来源', stars: '⭐ 热度', 'scores.adoption': '采纳度', 'scores.productization': '产品化', 'scores.depth': '拆解深度', 'scores.threat': '威胁度' };
  $('#compTable thead').innerHTML = `<tr>${head.map((h) => `<th data-sort="${h}">${headLabel[h]} ${compSortKey === h ? (compSortDir < 0 ? '↓' : '↑') : ''}</th>`).join('')}</tr>`;
  $('#compTable tbody').innerHTML = sorted.map((it) => `<tr>
    <td><a href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${escapeHtml(it.name)}</a><br/><span class="hint">${escapeHtml((it.description || '').slice(0, 70))}</span></td>
    <td>${escapeHtml(it.categoryLabel)}</td>
    <td>${escapeHtml(it.source)}</td>
    <td>${it.stars || '—'}</td>
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
  const W = box.clientWidth || 560;
  const H = 340;
  box.innerHTML = `
    <div class="ax"></div><div class="ay"></div>
    <span class="axis-label" style="left:8px;top:8px">深度高</span>
    <span class="axis-label" style="right:8px;bottom:8px">产品化高</span>
  `;
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
    div.title = `${it.name}（产品化 ${it.scores.productization} / 深度 ${it.scores.depth}）`;
    box.appendChild(div);
    const tip = document.createElement('span');
    tip.className = 'pos-tip';
    tip.style.left = `${x}px`; tip.style.top = `${Math.max(12, y - 14)}px`;
    tip.textContent = it.name.length > 18 ? it.name.slice(0, 17) + '…' : it.name;
    box.appendChild(tip);
  });
  const quads = report.quadrants;
  const counts = [
    ['leader', quads.leader.length], ['specialist', quads.specialist.length],
    ['product', quads.product.length], ['niche', quads.niche.length],
  ];
  box.insertAdjacentHTML('beforeend', `<div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--faint)">领先者 ${counts[0][1]} · 深度专精 ${counts[1][1]} · 产品化 ${counts[2][1]} · 细分/早期 ${counts[3][1]}</div>`);
}

function renderCategory(dist) {
  const max = Math.max(1, ...dist.map((d) => d.count));
  $('#compCategory').innerHTML = `<div class="category-bars">${dist.map((d) => `
    <div class="cat-bar">
      <span>${escapeHtml(categoryLabel(d.name))}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(d.count / max) * 100}%"></div></div>
      <span>${d.count}</span>
    </div>`).join('')}</div>`;
}

function renderSwot(swot) {
  const items = [
    ['s', 'Strengths · 优势', swot.strengths],
    ['w', 'Weaknesses · 劣势', swot.weaknesses],
    ['o', 'Opportunities · 机会', swot.opportunities],
    ['t', 'Threats · 威胁', swot.threats],
  ];
  $('#compSwot').innerHTML = items.map(([cls, title, list]) => `<div class="swot-box swot-${cls}"><h4>${title}</h4><ul>${list.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`).join('');
}

$('#compExport').addEventListener('click', () => {
  if (!currentReport) return;
  download(`competitive-analysis-${Date.now()}.md`, reportToMarkdown(currentReport));
  toast('竞品分析报告已导出');
});

/* ================= 案例库 ================= */
let _cases = [];
async function loadCases() {
  window._casesLoaded = true;
  try {
    const res = await fetch('/api/cases');
    const data = await res.json();
    _cases = window._cases = data.cases || [];
  } catch {
    _cases = window._cases = [
      { id: 'case-1', title: '示例', rawInput: '示例诉求' },
    ];
  }
  $('#caseGrid').innerHTML = _cases.map((c, i) => `
    <div class="case-card" data-case="${i}">
      <span class="badge badge-blue">测试用例 ${String(i + 1).padStart(2, '0')}</span>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.note || '')}</p>
      <div class="case-raw">${escapeHtml(c.rawInput)}</div>
      <span class="case-action">载入并编译 →</span>
    </div>`).join('');
  $$('.case-card[data-case]').forEach((el) => el.addEventListener('click', () => loadCaseById(Number(el.dataset.case))));
}

/* ================= 初始化 ================= */
async function init() {
  loadHistory();
  await loadCases();
  fetch('/api/health').then((r) => r.json()).then((d) => {
    $('#serverStatus').textContent = d.ok ? '服务正常' : '本地运行';
  }).catch(() => { $('#serverStatus').textContent = '离线模式'; });
  const name = (location.hash || '#/compile').replace('#/', '');
  if (['compile', 'chain', 'competitive', 'cases', 'about'].includes(name)) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
  }
}
init();
