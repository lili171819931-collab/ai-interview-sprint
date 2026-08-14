/* ============ 视图：完整思维链 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const TC = C.thinkingChain, app = C.app;
  const esc = app.esc, badge = app.badge;

  let state = { phase: 'all', open: {}, playing: false, timer: null };

  function nodeHtml(n, isOpen) {
    return `
      <div class="chain-node ${isOpen ? 'open' : ''}" id="cn-${n.id}">
        <div class="chain-node-head" data-toggle="${n.id}">
          <div class="idx">${n.id.toUpperCase()}</div>
          <div class="q">${esc(n.title)}</div>
          <span class="small text-3" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n.question)}</span>
          <span class="chev">▶</span>
        </div>
        <div class="chain-node-body">
          <div class="small text-3 b mb-8">思考过程（${n.steps.length} 步）</div>
          ${n.steps.map((s, i) => `<div class="chain-step"><span class="arrow">${String(i + 1).padStart(2, '0')}</span><div><div>${esc(s.text)}</div>${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}</div></div>`).join('')}
          <div class="chain-decision"><b>✅ 决策：</b>${esc(n.decision)}</div>
          <div class="small text-3 b mb-8">备选方案（为什么不做）</div>
          ${n.alternatives.map((a) => `<div class="chain-alt"><b>✗ ${esc(a.text)}</b> — ${esc(a.why)}</div>`).join('')}
          <div class="chain-out"><b>📦 产物：</b>${esc(n.output)}</div>
          <div class="chain-learn"><b>💡 复盘要点：</b>${esc(n.learn)}</div>
        </div>
      </div>`;
  }

  function exportMd() {
    let md = '# CreatorOS 完整思维链（结构化输出）\n\n';
    for (const p of TC.phases) {
      const ns = TC.nodes.filter((n) => n.phase === p.id);
      md += `\n## ${p.name} ${p.desc}\n\n`;
      for (const n of ns) {
        md += `### ${n.title}\n\n**问题：** ${n.question}\n\n**思考过程：**\n`;
        n.steps.forEach((s, i) => { md += `${i + 1}. ${s.text}${s.note ? `（${s.note}）` : ''}\n`; });
        md += `\n**决策：** ${n.decision}\n\n**备选方案：**\n`;
        n.alternatives.forEach((a) => { md += `- ~~${a.text}~~ → ${a.why}\n`; });
        md += `\n**产物：** ${n.output}\n\n**复盘要点：** ${n.learn}\n\n---\n`;
      }
    }
    return md;
  }

  function render(el) {
    const phases = [{ id: 'all', name: '全部', icon: '🧭', desc: '20 个决策节点' }, ...TC.phases];
    const filtered = state.phase === 'all' ? TC.nodes : TC.nodes.filter((n) => n.phase === state.phase);
    const counts = {};
    TC.nodes.forEach((n) => (counts[n.phase] = (counts[n.phase] || 0) + 1));

    el.innerHTML = `
      <div class="view-title">🧠 完整思维链（结构化输出）</div>
      <div class="view-desc">以「问题 → 思考过程 → 备选方案 → 决策 → 产物 → 复盘要点」六要素，结构化输出搭建本产品的完整思维链条，供快速掌握与复用。</div>

      <div class="player-bar">
        <button class="btn primary sm" id="tc-play">▶ 自动播放</button>
        <button class="btn sm" id="tc-open">全部展开</button>
        <button class="btn sm" id="tc-close">全部收起</button>
        <span class="grow"></span>
        <span class="chip">${TC.nodes.length} 节点 · ${TC.phases.length} 阶段</span>
        <button class="btn sm" id="tc-export">⬇ 导出 Markdown</button>
        <button class="btn sm" id="tc-export-json">⬇ 导出 JSON</button>
      </div>

      <div class="chain-layout">
        <div class="chain-phases">
          ${phases.map((p) => `
            <div class="chain-phase ${state.phase === p.id ? 'active' : ''}" data-phase="${p.id}">
              <div class="row spread"><span>${p.icon} ${esc(p.name)}</span><span class="n">${p.id === 'all' ? TC.nodes.length : counts[p.id] || 0}</span></div>
              <div class="small text-3" style="font-size:10.5px">${esc(p.desc)}</div>
            </div>`).join('')}
        </div>
        <div id="tc-nodes">${filtered.map((n) => nodeHtml(n, !!state.open[n.id])).join('')}</div>
      </div>`;

    el.querySelectorAll('[data-phase]').forEach((p) => p.addEventListener('click', () => { stopPlay(); state.phase = p.dataset.phase; state.open = {}; render(el); }));
    el.querySelectorAll('[data-toggle]').forEach((t) => t.addEventListener('click', () => {
      const id = t.dataset.toggle;
      state.open[id] = !state.open[id];
      const node = document.getElementById('cn-' + id);
      node.classList.toggle('open');
    }));
    el.querySelector('#tc-open').addEventListener('click', () => { filtered.forEach((n) => (state.open[n.id] = true)); render(el); });
    el.querySelector('#tc-close').addEventListener('click', () => { state.open = {}; render(el); });
    el.querySelector('#tc-export').addEventListener('click', () => {
      download('creatoros-thinking-chain.md', exportMd());
      app.toast('思维链 Markdown 已导出');
    });
    el.querySelector('#tc-export-json').addEventListener('click', () => {
      download('creatoros-thinking-chain.json', JSON.stringify({ phases: TC.phases, nodes: TC.nodes }, null, 2));
      app.toast('思维链 JSON 已导出');
    });
    el.querySelector('#tc-play').addEventListener('click', () => {
      if (state.playing) { stopPlay(); el.querySelector('#tc-play').textContent = '▶ 自动播放'; return; }
      const list = filtered.slice();
      state.playing = true;
      el.querySelector('#tc-play').textContent = '⏸ 停止播放';
      let i = 0;
      state.timer = setInterval(() => {
        if (i >= list.length) { stopPlay(); el.querySelector('#tc-play').textContent = '▶ 自动播放'; return; }
        const n = list[i];
        state.open[n.id] = true;
        const node = document.getElementById('cn-' + n.id);
        if (node) {
          node.classList.add('open');
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        i++;
      }, 2600);
    });
  }

  function stopPlay() { if (state.timer) { clearInterval(state.timer); state.timer = null; } state.playing = false; }

  function download(name, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  C.views.chain = { render };
})(typeof window !== 'undefined' ? window : globalThis);
