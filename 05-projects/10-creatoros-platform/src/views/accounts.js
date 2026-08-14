/* ============ 视图：对标研究 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  let state = { detail: null, mine: 'acc01', compare: ['acc02', 'acc03'] };

  function render(el) {
    el.innerHTML = `
      <div class="view-title">🎯 对标研究</div>
      <div class="view-desc">账号情报库 · 一键暴力拆解 · 对标矩阵 —— 回答「我的竞争对手最近在做什么」。</div>

      <div class="grid g4 mb-16">
        ${S.accounts.map((a) => `
          <div class="card" style="margin:0">
            <div class="card-body">
              <div class="row spread"><div class="b">${esc(a.name)}</div>${badge(a.platform, 'outline')}</div>
              <div class="small text-3 mt-8">${esc(a.track)} · ${esc(a.bizType)}</div>
              <div class="grid g3 mt-12" style="gap:6px;text-align:center">
                <div><div class="b">${esc(a.fans)}</div><div class="small text-3">粉丝</div></div>
                <div><div class="b">${a.viralRate}%</div><div class="small text-3">爆款率</div></div>
                <div><div class="b">+${a.growthRate}%</div><div class="small text-3">月增</div></div>
              </div>
              <div class="small text-3 mt-12">${esc(a.positioning)}</div>
              <div class="mt-12"><button class="btn sm w-full" data-teardown="${a.id}">🔪 一键暴力拆解</button></div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card" id="bench">
        <div class="card-head"><div class="card-title">⚔️ 对标矩阵</div><div class="card-sub">我的账号 VS 竞品 · 10 维对比</div></div>
        <div class="card-body">
          <div class="row wrap gap12 mb-12">
            <div class="field" style="margin:0"><label>我的账号</label>
              <select class="input" id="bm-mine" style="width:200px">${S.accounts.map((a) => `<option value="${a.id}" ${state.mine === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
            <div class="field" style="margin:0"><label>对比账号 A</label>
              <select class="input" id="bm-a" style="width:200px">${S.accounts.map((a) => `<option value="${a.id}" ${state.compare[0] === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
            <div class="field" style="margin:0"><label>对比账号 B</label>
              <select class="input" id="bm-b" style="width:200px">${S.accounts.map((a) => `<option value="${a.id}" ${state.compare[1] === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
          </div>
          <div id="bm-table"></div>
          <div class="chain-decision mt-12" id="bm-verdict"></div>
        </div>
      </div>
      <div id="teardown"></div>`;

    const m = S.accounts.find((x) => x.id === state.mine);
    const a = S.accounts.find((x) => x.id === state.compare[0]);
    const b = S.accounts.find((x) => x.id === state.compare[1]);
    const rows = [
      ['定位', m.positioning, a.positioning, b.positioning],
      ['人设', m.persona, a.persona, b.persona],
      ['粉丝', m.fans, a.fans, b.fans],
      ['更新频率', m.updateFreq, a.updateFreq, b.updateFreq],
      ['爆款率', m.viralRate + '%', a.viralRate + '%', b.viralRate + '%'],
      ['标题能力', m.titleFormulas.join('/'), a.titleFormulas.join('/'), b.titleFormulas.join('/')],
      ['内容结构', Object.entries(m.contentMix).map(([k, v]) => k + v + '%').join(' '), Object.entries(a.contentMix).map(([k, v]) => k + v + '%').join(' '), Object.entries(b.contentMix).map(([k, v]) => k + v + '%').join(' ')],
      ['商业化', m.bizType, a.bizType, b.bizType],
    ];
    el.querySelector('#bm-table').innerHTML = `
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>维度</th><th>我的账号（${esc(m.name)}）</th><th>A（${esc(a.name)}）</th><th>B（${esc(b.name)}）</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td class="text-2 b">${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody>
      </table></div>`;
    el.querySelector('#bm-verdict').innerHTML = `<b>🤖 AI 结论 · 你应该学什么：</b>学 ${esc(a.name)} 的「${esc(a.titleFormulas[0])}」标题与「${esc(a.viralFormula.split('×')[0])}」选题；学 ${esc(b.name)} 的「${esc(b.videoStructure.split('→')[1] || '节奏')}」结构。不应学：盲目日更牺牲质量、模仿高成本制作而忽视选题。你的差异化：${esc(m.positioning)}。`;

    el.querySelector('#bm-mine').addEventListener('change', (e) => { state.mine = e.target.value; render(el); });
    el.querySelector('#bm-a').addEventListener('change', (e) => { state.compare[0] = e.target.value; render(el); });
    el.querySelector('#bm-b').addEventListener('change', (e) => { state.compare[1] = e.target.value; render(el); });
    el.querySelectorAll('[data-teardown]').forEach((b) => b.addEventListener('click', () => {
      state.detail = state.detail === b.dataset.teardown ? null : b.dataset.teardown;
      render(el);
    }));

    if (state.detail) {
      const acc = S.accounts.find((x) => x.id === state.detail);
      if (acc) renderTeardown(el, acc);
      else state.detail = null;
    }
  }

  function renderTeardown(el, acc) {
    const div = el.querySelector('#teardown');
    const mix = Object.entries(acc.contentMix);
    div.innerHTML = `
      <div class="card">
        <div class="card-head"><div class="card-title">🔪 Competitor Deep Dive · ${esc(acc.name)}</div>
          <div class="grow"></div><button class="btn sm" data-close>收起</button></div>
        <div class="card-body">
          <div class="grid g2">
            <div>
              <div class="b mb-8">1️⃣ 人设与定位</div>
              <div class="chain-step"><span class="arrow">身份</span><span>${esc(acc.persona)}</span></div>
              <div class="chain-step"><span class="arrow">定位</span><span>${esc(acc.positioning)}</span></div>
              <div class="chain-step"><span class="arrow">用户</span><span>${esc(acc.track)} 赛道 · ${esc(acc.platform)} 平台</span></div>
              <div class="chain-step"><span class="arrow">商业</span><span>${esc(acc.bizType)}</span></div>
              <div class="b mt-12 mb-8">2️⃣ 内容结构（类型占比）</div>
              ${mix.map(([k, v]) => `<div class="row mb-8"><span class="text-2" style="width:70px">${esc(k)}</span><span class="mini-bar"><i style="width:${v}%"></i></span><span class="num">${v}%</span></div>`).join('')}
            </div>
            <div>
              <div class="b mb-8">3️⃣ 标题公式</div>
              ${acc.titleFormulas.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}
              <div class="b mt-12 mb-8">4️⃣ 视频结构</div>
              <div class="small" style="line-height:1.9">${esc(acc.videoStructure)}</div>
              <div class="b mt-12 mb-8">5️⃣ 爆款公式</div>
              <div class="alert success" style="margin:0"><span class="a-ico">🏆</span><div class="b">${esc(acc.viralFormula)}</div></div>
            </div>
          </div>
          <div class="chain-out mt-12"><b>📌 可复用到我的账号：</b>直接采纳「${esc(acc.titleFormulas[0])}」标题模板 + 「${esc(acc.videoStructure.split('→')[0].trim())}」开场结构，先跑 3 条验证互动率。</div>
        </div>
      </div>`;
    div.querySelector('[data-close]').addEventListener('click', () => { state.detail = null; render(el); });
  }

  C.views.accounts = { render };
})(typeof window !== 'undefined' ? window : globalThis);
