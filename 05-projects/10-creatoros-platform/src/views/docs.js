/* ============ 视图：项目文档 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const md = C.renderMd, app = C.app;
  const esc = app.esc;

  const DOCS = [
    { id: '00', file: '00-产品分析.md', label: '00 · 产品分析', icon: '📐' },
    { id: '01', file: '01-项目流程管理.md', label: '01 · 项目流程管理', icon: '🗓️' },
    { id: '02', file: '02-开发与测试.md', label: '02 · 开发与测试', icon: '🛠️' },
    { id: '03', file: '03-商业价值分析.md', label: '03 · 商业价值分析', icon: '💰' },
    { id: '04', file: '04-产品完成报告.md', label: '04 · 产品完成报告', icon: '✅' },
    { id: '05', file: '05-优化版Prompt.md', label: '05 · 优化版 Prompt', icon: '📝' },
  ];
  const cache = {};
  let current = '00';

  function render(el) {
    el.innerHTML = `
      <div class="view-title">📚 项目文档（项目制打包）</div>
      <div class="view-desc">产品分析 → 项目管理 → 开发测试 → 商业价值 → 完成报告 → 优化版 Prompt 的完整项目制交付。</div>
      <div class="chain-layout">
        <div class="chain-phases">
          ${DOCS.map((d) => `<div class="chain-phase ${current === d.id ? 'active' : ''}" data-doc="${d.id}">
            <div class="row"><span>${d.icon}</span><span>${esc(d.label)}</span></div></div>`).join('')}
          <div class="chain-phase" data-open-github><div class="row"><span>🐙</span><span>GitHub 仓库</span></div></div>
        </div>
        <div id="doc-body"><div class="loading">加载文档…</div></div>
      </div>`;

    el.querySelectorAll('[data-doc]').forEach((d) => d.addEventListener('click', () => { current = d.dataset.doc; render(el); }));
    el.querySelector('[data-open-github]').addEventListener('click', () => {
      window.open('https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/10-creatoros-platform', '_blank');
    });
    load(el);
  }

  async function load(el) {
    const doc = DOCS.find((d) => d.id === current);
    const body = el.querySelector('#doc-body');
    if (cache[doc.id]) { body.innerHTML = '<div class="card"><div class="card-body doc">' + cache[doc.id] + '</div></div>'; return; }
    try {
      const res = await fetch('docs/' + doc.file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      cache[doc.id] = md.render(text);
      body.innerHTML = '<div class="card"><div class="card-body doc">' + cache[doc.id] + '</div></div>';
    } catch (err) {
      body.innerHTML = `<div class="alert warn"><span class="a-ico">⚠️</span><div>文档加载失败（file:// 模式不支持 fetch）。请运行 <code class="mono">npm start</code> 后访问 http://localhost:8787 。<br>原始文档位于 <code class="mono">docs/${esc(doc.file)}</code>。</div></div>`;
    }
  }

  C.views.docs = { render };
})(typeof window !== 'undefined' ? window : globalThis);
