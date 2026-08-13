/**
 * e2e-cdp.mjs — 端到端交互验证（CDP 驱动 headless Chrome）
 * 启动 headless Chrome → 打开平台 → 载入案例 → 点击编译 → 校验结果 DOM → 截图。
 * 用法：node tests/e2e-cdp.mjs [port]
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP = 'http://localhost:8910';
const DEBUG_PORT = 9333;
const SHOT = '/tmp/gc-e2e.png';

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=/tmp/gc-cdp-profile',
  '--window-size=1440,2400',
  APP,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws = null;
let msgId = 0;
const pending = new Map();

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJS(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    const desc = r.exceptionDetails.exception?.description || r.exceptionDetails.text;
    throw new Error(`eval failed [${expr.slice(0, 120)}]: ${String(desc).slice(0, 400)}`);
  }
  return r.result?.value;
}

async function shot(path) {
  const r = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path, Buffer.from(r.data, 'base64'));
}

try {
  // 等 DevTools 端口
  let targets = null;
  for (let i = 0; i < 40; i++) {
    try {
      targets = await (await fetch(`http://localhost:${DEBUG_PORT}/json/list`)).json();
      if (targets.length) break;
    } catch { /* retry */ }
    await sleep(400);
  }
  if (!targets || !targets.length) throw new Error('no CDP target');
  const page = targets.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id).resolve(m.result);
      pending.delete(m.id);
    }
  };
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await sleep(1500);

  const checks = [];
  const title = await evalJS('document.title');
  checks.push(['页面标题', title.includes('Goal Compiler')]);

  // 载入案例 0（AI 面试官工具）—— 直接填输入框并触发编译
  await evalJS(`(() => {
    const ta = document.getElementById('rawInput');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, '我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈，按岗位定制问题');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('compileBtn').click();
    return true;
  })()`);
  await sleep(1200);

  const resultVisible = await evalJS(`!document.getElementById('result').classList.contains('hidden')`);
  checks.push(['点击编译后结果区显示', resultVisible]);

  const obj = await evalJS(`document.getElementById('rUnderstanding').textContent`);
  checks.push(['① 原始需求理解非空', (obj || '').length > 10]);

  const goalLen = await evalJS(`document.getElementById('goalPrompt').value.length`);
  checks.push([`⑨ Goal Prompt 可编辑且非空（${goalLen} 字符）`, goalLen > 1500]);

  const editable = await evalJS(`(() => {
    const el = document.getElementById('goalPrompt');
    el.value = el.value.replace('# ROLE', '# ROLE （已人工修改）');
    return el.value.includes('已人工修改');
  })()`);
  checks.push(['Goal Prompt 人工编辑生效', editable]);

  const chainNodes = await evalJS(`document.querySelectorAll('#chainList .chain-node').length`);
  checks.push([`思维链节点渲染（${chainNodes} 个）`, chainNodes >= 10]);

  // v5：思维框图 + 节点弹窗 + 历史输入建议
  const laneCount = await evalJS(`document.querySelectorAll('#chainDiagram .cd-lane').length`);
  const nodeCount = await evalJS(`document.querySelectorAll('#chainDiagram .cd-node').length`);
  checks.push([`思维框图泳道（${laneCount} 阶段）`, laneCount === 4]);
  checks.push([`思维框图节点（${nodeCount} 个主逻辑）`, nodeCount === 14]);
  const expertMetrics = await evalJS(`document.querySelectorAll('#expertMetrics .expert-metric').length`);
  checks.push([`专家版拆解指标（${expertMetrics} 项）`, expertMetrics >= 6]);
  const methodTags = await evalJS(`document.querySelectorAll('#chainDiagram .cd-node-method').length`);
  checks.push([`方法论标签（${methodTags} 节点）`, methodTags === 14]);
  const modalOpen = await evalJS(`(() => {
    document.querySelector('#chainDiagram .cd-node').click();
    return !document.getElementById('chainModal').classList.contains('hidden') &&
           document.getElementById('chainModalBody').textContent.length > 50;
  })()`);
  checks.push(['点击主逻辑弹出解释弹窗', modalOpen]);
  const modalNext = await evalJS(`(() => {
    document.getElementById('chainModalNext').click();
    return document.getElementById('chainModalPos').textContent === '2/14';
  })()`);
  checks.push(['弹窗前后节点导航（2/14）', modalNext]);
  await evalJS(`document.getElementById('chainModalClose').click()`);
  const sugOpen = await evalJS(`(() => {
    const ta = document.getElementById('rawInput');
    ta.focus(); ta.dispatchEvent(new Event('focus', { bubbles: true }));
    return !document.getElementById('inputSuggestions').classList.contains('hidden') &&
           document.querySelectorAll('#inputSuggestions .sug-item').length >= 1;
  })()`);
  checks.push(['输入框历史建议下拉', sugOpen]);
  const sugPick = await evalJS(`(() => {
    const n = document.querySelectorAll('#inputSuggestions .sug-item').length;
    if (n > 0) { document.querySelector('#inputSuggestions .sug-item').click(); return document.getElementById('rawInput').value.length > 5; }
    return false;
  })()`);
  checks.push(['点击建议填入输入框', sugPick]);

  const sugg = await evalJS(`document.querySelectorAll('#rSuggestions .chip').length`);
  checks.push([`补充建议条数（${sugg}）`, sugg >= 3]);

  // v7：双视图 —— 打开竞品 tab，本产品竞品分析默认可见
  await evalJS(`document.querySelector('.tab[data-tab="competitive"]').click()`); await sleep(600);
  const selfViewVisible = await evalJS(`!document.getElementById('compViewSelf').classList.contains('hidden')`);
  checks.push(['本产品竞品分析界面默认可见', selfViewVisible]);
  const selfBodyCards = await evalJS(`document.querySelectorAll('#selfCompBody .card').length`);
  checks.push([`本产品报告内容（${selfBodyCards} 卡）`, selfBodyCards >= 5]);
  const radarSelf = await evalJS(`!!document.querySelector('#selfCompBody .radar-svg')`);
  checks.push(['本产品能力雷达图', radarSelf]);
  // 切到需求竞品分析
  await evalJS(`document.querySelector('#compViewSeg .seg-btn[data-cview="req"]').click()`); await sleep(300);
  const reqViewVisible = await evalJS(`!document.getElementById('compViewReq').classList.contains('hidden')`);
  checks.push(['需求竞品分析界面切换', reqViewVisible]);
  await evalJS(`(() => {
    ['srcGithub','srcHN','srcNpm','srcSO','srcHF','srcGitee','srcReddit','srcDevto'].forEach(id => { document.getElementById(id).checked = false; });
    document.getElementById('srcCurated').checked = true;
    document.getElementById('compQuery').value = 'goal compiler';
    document.getElementById('compSearchBtn').click();
    return true;
  })()`);
  await sleep(1200);
  const compVisible = await evalJS(`!document.getElementById('compResult').classList.contains('hidden')`);
  checks.push(['竞品分析结果渲染', compVisible]);
  const compRows = await evalJS(`document.querySelectorAll('#compTable tbody tr').length`);
  checks.push([`竞品表格行数（${compRows}）`, compRows >= 5]);
  const recLen = await evalJS(`document.getElementById('compRec').textContent.length`);
  checks.push([`产品总监建议非空（${recLen} 字）`, recLen > 20]);
  const gapCount = await evalJS(`document.querySelectorAll('#compGaps .gap-item').length`);
  checks.push([`功能缺口清单（${gapCount} 项）`, gapCount >= 5]);
  const designCount = await evalJS(`document.querySelectorAll('#compDesign .gap-item').length`);
  checks.push([`设计形式借鉴（${designCount} 项）`, designCount >= 4]);
  const relCol = await evalJS(`[...document.querySelectorAll('#compTable thead th')].some(th => th.textContent.includes('相关度'))`);
  checks.push(['竞品表含相关度列', relCol]);

  // v3：就绪度评估 + 案例库自动收录 + 英文切换
  const readyVisible = await evalJS(`!document.getElementById('readyBanner').classList.contains('hidden')`);
  checks.push(['就绪度评估横幅显示', readyVisible]);
  await evalJS(`document.querySelector('.tab[data-tab="cases"]').click()`); await sleep(600);
  const userCaseCount = await evalJS(`document.querySelectorAll('#userCaseGrid .case-card').length`);
  checks.push([`案例库自动收录（${userCaseCount} 条用户案例）`, userCaseCount >= 1]);
  const caseSearchHit = await evalJS(`(() => {
    const el = document.getElementById('caseSearch');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, '面试'); el.dispatchEvent(new Event('input', { bubbles: true }));
    return document.querySelectorAll('#userCaseGrid .case-card').length >= 1;
  })()`);
  checks.push(['相似需求搜索命中', caseSearchHit]);
  await evalJS(`document.querySelector('.lang-btn[data-lang="en"]').click()`); await sleep(500);
  const enGoal = await evalJS(`document.getElementById('goalPrompt').value.includes('# MISSION')`);
  checks.push(['一键切换英文（Goal 含 # MISSION）', enGoal]);
  await evalJS(`document.querySelector('.lang-btn[data-lang="zh"]').click()`); await sleep(300);

  // v4：评分规则 / 分类区域 / 模板库 / 按类型去重 / SKILL 导出按钮
  await evalJS(`(() => {
    const el = document.getElementById('caseSearch');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`); await sleep(300);
  // 同类型再次编译 → 案例数不变（去重）
  await evalJS(`document.querySelector('.tab[data-tab="compile"]').click(); document.getElementById('compileBtn').click()`); await sleep(900);
  await evalJS(`document.querySelector('.tab[data-tab="cases"]').click()`); await sleep(500);
  const dedupeCount = await evalJS(`document.querySelectorAll('#userCaseGrid .case-card').length`);
  checks.push([`同类型去重后案例数=1（${dedupeCount}）`, dedupeCount === 1]);
  // 不同类型（学习/成长）→ 新增
  await evalJS(`document.querySelectorAll('#caseGrid .case-card')[2].click()`); await sleep(900);
  await evalJS(`document.querySelector('.tab[data-tab="cases"]').click()`); await sleep(500);
  const typeCount = await evalJS(`document.querySelectorAll('#userCaseGrid .case-card').length`);
  checks.push([`不同类型收录（${typeCount} 条）`, typeCount === 2]);
  // 模板库
  await evalJS(`document.querySelector('.tab[data-tab="compile"]').click()`); await sleep(400);
  const tplCount = await evalJS(`document.querySelectorAll('#templateList .chip').length`);
  checks.push([`模板库预设（${tplCount} 个）`, tplCount >= 8]);
  const tplFill = await evalJS(`(() => {
    document.querySelector('#templateList .chip').click();
    return document.getElementById('rawInput').value.length > 10;
  })()`);
  checks.push(['模板点击填入输入框', tplFill]);
  const skillBtn = await evalJS(`!!document.getElementById('skillBtn')`);
  checks.push(['导出 SKILL.md 按钮存在', skillBtn]);

  // v6：推荐模板 / AI 多轮澄清 / 本产品报告 / 启示框图 / 图表 / 汇总建议
  const recTpl = await evalJS(`(() => {
    const ta = document.getElementById('rawInput');
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, '我想做一个 AI 面试官工具，模拟面试打分');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return document.querySelectorAll('#recTemplates .chip').length >= 1;
  })()`);
  checks.push(['输入自动关联推荐模板', recTpl]);
  const dialogQ = await evalJS(`(() => {
    document.getElementById('dialogueToggle').click();
    document.getElementById('chatInput').focus();
    return document.querySelectorAll('#chatArea .chat-bubble.ask').length === 1;
  })()`);
  checks.push(['AI 多轮澄清：首问出现', dialogQ]);
  const dialogTurn = await evalJS(`(() => {
    const ci = document.getElementById('chatInput');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(ci, '程序员和求职者');
    document.getElementById('chatSend').click();
    return document.querySelectorAll('#chatArea .chat-bubble.user').length === 1 &&
           document.querySelectorAll('#chatArea .chat-bubble.ask').length === 1;
  })()`);
  checks.push(['AI 澄清：回答后进入下一问', dialogTurn]);
  const dialogCompile = await evalJS(`(() => { document.getElementById('chatCompile').click(); return !document.getElementById('result').classList.contains('hidden'); })()`);
  checks.push(['AI 澄清：完成并编译', dialogCompile]);
  await evalJS(`document.querySelector('.tab[data-tab="competitive"]').click()`); await sleep(500);
  const closestTop = await evalJS(`document.querySelectorAll('#closestProjects .closest-item').length`);
  checks.push([`最接近需求项目 Top3（${closestTop}）`, closestTop >= 1]);
  const relStats = await evalJS(`document.getElementById('relStats').textContent.length > 3`);
  checks.push(['相关度过滤统计', relStats]);
  const useReq = await evalJS(`(() => {
    document.getElementById('useReqBtn').click();
    return document.getElementById('compTarget').textContent.includes('需求：');
  })()`);
  checks.push(['用当前需求分析（分析对象突出）', useReq]);
  await sleep(1500);
  const insightNodes = await evalJS(`document.querySelectorAll('#insightDiagram .cd-node').length`);
  checks.push([`竞品启示思维框图节点（${insightNodes}）`, insightNodes >= 10]);
  const insightModal = await evalJS(`(() => {
    document.querySelector('#insightDiagram .cd-node').click();
    const ok = !document.getElementById('insightModal').classList.contains('hidden') && document.getElementById('insightModalBody').textContent.length > 5;
    document.getElementById('insightModalClose').click();
    return ok;
  })()`);
  checks.push(['启示节点点击弹窗说明', insightModal]);
  const radarSvg = await evalJS(`!!document.querySelector('#compCharts .radar-svg')`);
  const chartBlocks = await evalJS(`document.querySelectorAll('#compCharts .chart-block').length`);
  checks.push([`图表（雷达 ${radarSvg ? '✓' : '✗'} + 区块 ${chartBlocks}）`, radarSvg && chartBlocks >= 2]);
  const recPoints = await evalJS(`document.querySelectorAll('#compRecPoints li').length`);
  checks.push([`产品总监建议汇总要点（${recPoints} 条）`, recPoints >= 3]);
  const grid2 = await evalJS(`document.querySelectorAll('.comp-grid-2 .card').length`);
  checks.push(['功能缺口+设计借鉴并列显示（comp-grid-2）', grid2 >= 2]);
  // 模板市场
  await evalJS(`document.querySelector('.tab[data-tab="market"]').click()`); await sleep(900);
  const marketGroups = await evalJS(`document.querySelectorAll('#marketGroups .market-group').length`);
  checks.push([`模板市场分类区（${marketGroups} 组）`, marketGroups >= 3]);
  const marketRepo = await evalJS(`document.querySelectorAll('#marketGroups .market-card.repo').length`);
  checks.push([`开源 GitHub 集合条目（${marketRepo}）`, marketRepo >= 3]);
  const marketFill = await evalJS(`(() => {
    const b = document.querySelector('#marketGroups [data-mfill]');
    if (!b) return false;
    b.click();
    return document.getElementById('rawInput').value.length > 5;
  })()`);
  checks.push(['模板市场条目填入输入框', marketFill]);
  // 评分规则 + 分类区域
  await evalJS(`document.querySelector('.tab[data-tab="competitive"]').click()`); await sleep(400);
  const ruleCount = await evalJS(`document.querySelectorAll('#scoringRules .score-rule').length`);
  checks.push([`评分规则维度（${ruleCount} 个）`, ruleCount === 5]);
  const quadCount = await evalJS(`document.querySelectorAll('#quadrantRules .quad-rule').length`);
  checks.push([`定位矩阵象限规则（${quadCount} 个）`, quadCount === 4]);
  const sectionCount = await evalJS(`document.querySelectorAll('#compSections .comp-section').length`);
  checks.push([`按分类区域分组（${sectionCount} 区）`, sectionCount >= 2]);
  // v8：GitHub Token / 数据源 / 模板横条 / AI 折叠
  await evalJS(`document.querySelector('.tab[data-tab="competitive"]').click()`); await sleep(400);
  const ghField = await evalJS(`!!document.getElementById('ghToken') && document.getElementById('ghTokenStatus').textContent.length > 0`);
  checks.push(['GitHub Token 配置行', ghField]);
  const selfSrcBadges = await evalJS(`document.querySelectorAll('#selfSources .badge').length`);
  checks.push([`本产品关联数据源（${selfSrcBadges} 源）`, selfSrcBadges >= 9]);
  const selfScanBtn = await evalJS(`!!document.getElementById('selfScanBtn')`);
  checks.push(['本产品同口径扫描按钮', selfScanBtn]);
  await evalJS(`document.querySelector('.tab[data-tab="compile"]').click()`); await sleep(300);
  const tplStrip = await evalJS(`document.querySelectorAll('.tpl-scroll .chip').length`);
  checks.push([`模板库横向横条（${tplStrip} 个）`, tplStrip >= 8]);
  const dlgCollapsed = await evalJS(`(() => {
    const box = document.getElementById('dialogueBox');
    const btn = document.getElementById('dialogueToggle');
    if (!box.classList.contains('hidden')) btn.click();
    const collapsed = box.classList.contains('hidden');
    btn.click();
    return collapsed;
  })()`);
  checks.push(['AI 澄清可收起/展开（不拥挤）', dlgCollapsed]);
  await evalJS(`document.querySelector('.tab[data-tab="about"]').click()`); await sleep(400);
  const statCount = await evalJS(`document.querySelectorAll('#usageStats .usage-stat').length`);
  checks.push([`本地用量统计（${statCount} 项）`, statCount === 4]);

  // 截图：各关键视图
  await shot('/tmp/gc-shot-result.png');
  await evalJS(`document.querySelector('.tab[data-tab="chain"]').click()`); await sleep(700);
  await shot('/tmp/gc-shot-chain.png');

  await evalJS(`document.querySelector('.tab[data-tab="cases"]').click()`); await sleep(700);
  await shot('/tmp/gc-shot-cases.png');
  await evalJS(`document.querySelector('.tab[data-tab="market"]').click()`); await sleep(900);
  await shot('/tmp/gc-shot-market.png');
  await evalJS(`document.querySelector('.tab[data-tab="competitive"]').click()`); await sleep(600);
  await shot('/tmp/gc-shot-selfreport.png');
  await evalJS(`document.querySelector('#compViewSeg .seg-btn[data-cview="req"]').click()`); await sleep(500);
  await shot('/tmp/gc-shot-competitive.png');
  await evalJS(`document.querySelector('.tab[data-tab="about"]').click()`); await sleep(700);
  await shot('/tmp/gc-shot-about.png');
  console.log('screenshots saved to /tmp/gc-shot-*.png');

  let pass = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? '✔' : '✖'} ${name}`);
    if (ok) pass++;
  }
  console.log(`\n结果：${pass}/${checks.length} 项通过`);
  process.exitCode = pass === checks.length ? 0 : 1;
} catch (err) {
  console.error('E2E FAILED:', err.message);
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill('SIGKILL');
}
