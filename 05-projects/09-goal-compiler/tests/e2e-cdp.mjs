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
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
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

  const sugg = await evalJS(`document.querySelectorAll('#rSuggestions .chip').length`);
  checks.push([`补充建议条数（${sugg}）`, sugg >= 3]);

  // 切换到竞品分析 tab 并检索（仅精选库，离线）
  await evalJS(`(() => {
    ['srcGithub','srcHN','srcNpm','srcSO','srcHF','srcGitee','srcReddit'].forEach(id => { document.getElementById(id).checked = false; });
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

  // 截图：各关键视图
  await shot('/tmp/gc-shot-result.png');
  await evalJS(`document.querySelector('.tab[data-tab="chain"]').click()`); await sleep(700);
  await shot('/tmp/gc-shot-chain.png');
  await evalJS(`document.querySelector('.tab[data-tab="competitive"]').click()`); await sleep(700);
  await shot('/tmp/gc-shot-competitive.png');
  await evalJS(`document.querySelector('.tab[data-tab="cases"]').click()`); await sleep(700);
  await shot('/tmp/gc-shot-cases.png');
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
