/* ============ 视图：全球热点雷达（Real-time Trend Radar） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, sc = C.scoring, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  let state = { region: '全部', cat: '全部', q: '', detail: null };

  const STATUS_TONE = { Breaking: 'danger', Exploding: 'danger', Rising: 'success', 'Fast Growth': 'success', Cooling: 'warn', Declining: 'muted' };

  function render(el) {
    const all = S.hotTopics.map((t) => ({ ...t, region: 'CN' })).concat(S.globalTopics.map((t) => ({ ...t, region: 'Global' })));
    const cats = ['全部', ...new Set(all.map((t) => t.category))];
    let list = all
      .map((t) => ({ ...t, score: sc.hotScore(t), band: sc.hotBand(sc.hotScore(t)), badges: sc.hotBadges(t) }))
      .filter((t) => (state.region === '全部' || t.region === state.region))
      .filter((t) => (state.cat === '全部' || t.category === state.cat))
      .filter((t) => !state.q || (t.title + t.category + t.platforms.join()).toLowerCase().includes(state.q.toLowerCase()))
      .sort((a, b) => b.score - a.score);

    el.innerHTML = `
      <div class="view-title">📡 全球热点雷达</div>
      <div class="view-desc">Real-time Trend Radar：全球（TikTok/Instagram/YouTube/Google Trends/Reddit/X/RSS）+ 国内（抖音/小红书/B站/视频号/微博/知乎）。</div>
      <div class="alert info"><span class="a-ico">ℹ️</span><div><b>数据真实性：</b>当前为快照数据（08-14），状态标注 <b>Live/Updated X min ago/Mock</b>；接入 Real-time Data Pipeline（Polling/Webhook/Streaming）后自动切换真实数据。禁止绕过登录/验证码/反爬。</div></div>

      <div class="card">
        <div class="card-body">
          <div class="row wrap gap8">
            <input class="input" style="width:220px" placeholder="搜索热点…" value="${esc(state.q)}" id="ht-q">
            <div class="tabs" style="border:0;margin:0" id="ht-region">
              ${['全部', 'Global', 'CN'].map((r) => `<div class="tab ${state.region === r ? 'active' : ''}" data-region="${r}">${r === 'Global' ? '🌍 全球' : r === 'CN' ? '🇨🇳 国内' : '全部'}</div>`).join('')}
            </div>
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
          <thead><tr><th>热点</th><th>平台/地区</th><th>实时状态</th><th>热度</th><th>增长</th><th>内容空白</th><th>竞争</th><th>Opportunity</th><th>速度 1h/6h/24h</th><th>徽章</th><th></th></tr></thead>
          <tbody>
            ${list.map((t) => `
              <tr>
                <td style="min-width:230px"><div class="b">${esc(t.title)}</div><div class="small text-3">${esc(t.summary)}</div></td>
                <td>${esc(t.platform)}<div class="small text-3">${t.region === 'Global' ? '🌍 全球' : '🇨🇳 国内'} · ${esc(t.category)}</div></td>
                <td>${t.status ? badge(t.status, STATUS_TONE[t.status] || 'info') + `<div class="small text-3 mt-8">${badge('Live', 'success')} ${t.updatedMinAgo}min ago</div>` : badge('Snapshot', 'muted')}</td>
                <td class="num">${t.heat}</td><td class="num">${t.growth}</td><td class="num">${t.contentGap || '—'}</td><td class="num">${t.competition}</td>
                <td><div class="row"><span class="score-ring" style="width:38px;height:38px;font-size:13px;">${t.score}</span></div></td>
                <td class="mono small">${esc(t.vel1h || '—')}<br>${esc(t.vel6h || '—')}<br>${esc(t.vel24h || '—')}</td>
                <td>${badge(t.band.label, t.band.tone)}<div class="mt-8">${t.badges.map((b) => badge(b.label, b.tone)).join(' ')}</div></td>
                <td><button class="btn sm" data-detail="${t.id}">分析</button></td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>

      <div id="ht-detail"></div>`;

    el.querySelector('#ht-q').addEventListener('input', (e) => { state.q = e.target.value; render(el); });
    el.querySelectorAll('#ht-region .tab').forEach((t) => t.addEventListener('click', () => { state.region = t.dataset.region; render(el); }));
    el.querySelectorAll('#ht-cats .tab').forEach((t) => t.addEventListener('click', () => { state.cat = t.dataset.cat; render(el); }));
    el.querySelectorAll('[data-detail]').forEach((b) => b.addEventListener('click', () => {
      state.detail = state.detail === b.dataset.detail ? null : b.dataset.detail;
      render(el);
    }));
    if (state.detail) {
      const t = all.find((x) => x.id === state.detail);
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
          <div class="grow"></div>${t.status ? badge(t.status, STATUS_TONE[t.status]) : ''}<button class="btn sm" data-close style="margin-left:8px">收起</button></div>
        <div class="card-body">
          <div class="grid g2">
            <div>
              <div class="b mb-8">热度曲线（示意 · 时间序列 TrendSnapshot）</div>
              ${C.chart.line(curve, { h: 140, labels: ['1h', '6h', '12h', '18h', 'D-1', 'D-2', 'D-3'] })}
              <div class="small text-3 mt-8">架构：Data Source → Collector → Normalizer → Dedup → Trend Engine → Scoring → Topic Engine → Dashboard</div>
            </div>
            <div>
              <div class="b mb-8">热点概览 · 与我的关系</div>
              <table class="tbl"><tbody>
                <tr><td class="text-3">热度 / 增长</td><td class="num">${t.heat} / ${t.growth}</td></tr>
                <tr><td class="text-3">内容空白（机会）</td><td class="num">${t.contentGap || '—'}</td></tr>
                <tr><td class="text-3">赛道相关性 / 商业价值</td><td class="num">${t.relevance} / ${t.businessValue}</td></tr>
                <tr><td class="text-3">竞争程度 / 生命周期风险</td><td class="num">${t.competition} / ${t.lifecycleRisk}</td></tr>
                <tr><td class="text-3">预计生命周期</td><td>${t.lifecycle} 周</td></tr>
                <tr><td class="text-3">速度（1h/6h/24h）</td><td class="mono">${esc(t.vel1h || '—')} / ${esc(t.vel6h || '—')} / ${esc(t.vel24h || '—')}</td></tr>
              </tbody></table>
              <div class="chain-decision mt-8"><b>🤖 热点→我的账号：</b>匹配度 ${Math.max(60, Math.min(98, 60 + t.relevance / 4))}% —— 推荐切入：${t.angles.slice(0, 3).map((a) => esc(a)).join(' / ')}</div>
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
