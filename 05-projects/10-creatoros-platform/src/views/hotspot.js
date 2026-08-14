/* ============ 视图：热点雷达 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, sc = C.scoring, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  let state = { cat: '全部', q: '', detail: null };

  function render(el) {
    const cats = ['全部', ...new Set(S.hotTopics.map((t) => t.category))];
    let list = S.hotTopics
      .map((t) => ({ ...t, score: sc.hotScore(t), band: sc.hotBand(sc.hotScore(t)), badges: sc.hotBadges(t) }))
      .filter((t) => (state.cat === '全部' || t.category === state.cat))
      .filter((t) => !state.q || (t.title + t.category + t.platforms.join()).toLowerCase().includes(state.q.toLowerCase()))
      .sort((a, b) => b.score - a.score);

    el.innerHTML = `
      <div class="view-title">📡 热点雷达</div>
      <div class="view-desc">统一 Hot Topic Engine · Hot Score 综合评分。数据为 Demo 快照（非实时），真实接入见 HotTopicProvider 设计。</div>
      <div class="alert info"><span class="a-ico">ℹ️</span><div><b>数据真实性：</b>当前为快照数据（08-14），接入搜索趋势/平台榜单后自动切换为真实数据，UI 会同步标注。</div></div>

      <div class="card">
        <div class="card-body">
          <div class="row wrap gap8">
            <input class="input" style="width:240px" placeholder="搜索热点…" value="${esc(state.q)}" id="ht-q">
            <div class="tabs" style="border:0;margin:0" id="ht-cats">
              ${cats.map((c) => `<div class="tab ${state.cat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</div>`).join('')}
            </div>
            <div class="grow"></div>
            <span class="chip">共 ${list.length} 个</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>热点</th><th>平台</th><th>赛道</th><th>热度</th><th>增长</th><th>商业</th><th>竞争</th><th>Hot Score</th><th>频段/徽章</th><th>生命周期</th><th></th></tr></thead>
          <tbody>
            ${list.map((t) => `
              <tr>
                <td style="min-width:240px"><div class="b">${esc(t.title)}</div><div class="small text-3">${esc(t.summary)}</div></td>
                <td>${t.platforms.map((p) => `<span class="tag">${esc(p)}</span>`).join('')}</td>
                <td>${esc(t.category)}</td>
                <td class="num">${t.heat}</td><td class="num">${t.growth}</td><td class="num">${t.businessValue}</td><td class="num">${t.competition}</td>
                <td><div class="row"><span class="score-ring" style="width:38px;height:38px;font-size:13px;">${t.score}</span></div></td>
                <td>${badge(t.band.label, t.band.tone)}<div class="mt-8">${t.badges.map((b) => badge(b.label, b.tone)).join(' ')}</div></td>
                <td>预计 ${t.lifecycle} 周</td>
                <td><button class="btn sm" data-detail="${t.id}">分析</button></td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>

      <div id="ht-detail"></div>`;

    el.querySelector('#ht-q').addEventListener('input', (e) => { state.q = e.target.value; render(el); });
    el.querySelectorAll('#ht-cats .tab').forEach((t) => t.addEventListener('click', () => { state.cat = t.dataset.cat; render(el); }));
    el.querySelectorAll('[data-detail]').forEach((b) => b.addEventListener('click', () => {
      state.detail = state.detail === b.dataset.detail ? null : b.dataset.detail;
      render(el);
    }));
    if (state.detail) {
      const t = S.hotTopics.find((x) => x.id === state.detail);
      if (t) renderDetail(el, t);
      else state.detail = null;
    }
  }

  function renderDetail(el, t) {
    const curve = [30, 38, 52, 61, 78, 88, 92].map((v, i) => ({ value: v }));
    const div = el.querySelector('#ht-detail');
    div.innerHTML = `
      <div class="card">
        <div class="card-head"><div class="card-title">🔍 Topic Intelligence · ${esc(t.title)}</div>
          <div class="grow"></div><button class="btn sm" data-close>收起</button></div>
        <div class="card-body">
          <div class="grid g2">
            <div>
              <div class="b mb-8">热度曲线（示意）</div>
              ${C.chart.line(curve, { h: 140, labels: ['D-6','D-5','D-4','D-3','D-2','D-1','今'] })}
            </div>
            <div>
              <div class="b mb-8">热点概览</div>
              <table class="tbl"><tbody>
                <tr><td class="text-3">热度 / 增长</td><td class="num">${t.heat} / ${t.growth}</td></tr>
                <tr><td class="text-3">讨论度 / 传播性</td><td class="num">${t.discussion} / ${t.virality}</td></tr>
                <tr><td class="text-3">赛道相关性 / 商业价值</td><td class="num">${t.relevance} / ${t.businessValue}</td></tr>
                <tr><td class="text-3">竞争程度 / 生命周期风险</td><td class="num">${t.competition} / ${t.lifecycleRisk}</td></tr>
                <tr><td class="text-3">预计生命周期</td><td>${t.lifecycle} 周</td></tr>
                <tr><td class="text-3">代表平台</td><td>${t.platforms.join(' / ')}</td></tr>
              </tbody></table>
            </div>
          </div>
          <div class="grid g2 mt-12">
            <div>
              <div class="b mb-8">💡 AI 内容机会分析 · ${t.angles.length} 个切入角度</div>
              ${t.angles.map((a, i) => `<div class="chain-step"><span class="arrow">${String(i + 1).padStart(2, '0')}</span><span>${esc(a)}</span></div>`).join('')}
            </div>
            <div>
              <div class="b mb-8">✅ 推荐动作</div>
              ${t.recommendActions.map((a, i) => `<div class="chain-step"><span class="arrow">→</span><span>${esc(a)}</span></div>`).join('')}
              <div class="mt-12"><button class="btn primary sm" data-goto-topics data-title="${esc(t.title)}">基于该热点生成选题 →</button></div>
            </div>
          </div>
        </div>
      </div>`;
    div.querySelector('[data-close]').addEventListener('click', () => { state.detail = null; render(el); });
    div.querySelector('[data-goto-topics]').addEventListener('click', (e) => {
      try { sessionStorage.setItem('cos_gen_from', e.target.dataset.title); } catch (_) {}
      location.hash = '#topics';
    });
  }

  C.views.hotspot = { render };
})(typeof window !== 'undefined' ? window : globalThis);
