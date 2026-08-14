/* ============ 视图：指挥中心 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, sc = C.scoring, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  /* 通用 SVG 折线图（供本视图与发布与数据复用） */
  C.chart = {
    line(series, { w = 640, h = 180, stroke = '#2456e6', labels = [] } = {}) {
      const vals = series.map((d) => d.value);
      const max = Math.max(...vals) * 1.15, min = Math.min(...vals) * 0.85;
      const rng = max - min || 1;
      const px = (i) => 40 + (i * (w - 80)) / Math.max(1, vals.length - 1);
      const py = (v) => 18 + (h - 52) * (1 - (v - min) / rng);
      const pts = vals.map((v, i) => `${px(i)},${py(v)}`).join(' ');
      const area = `M${px(0)},${py(vals[0])} L${pts.replace(/ /g, ' L')} L${px(vals.length - 1)},${h - 30} L${px(0)},${h - 30} Z`;
      let gl = '';
      for (let i = 0; i < 4; i++) { const gy = 18 + ((h - 52) * i) / 3; gl += `<line class="gridline" x1="40" y1="${gy}" x2="${w - 40}" y2="${gy}"/>`; }
      let dots = '', xl = '';
      vals.forEach((v, i) => {
        dots += `<circle class="dot" cx="${px(i)}" cy="${py(v)}" r="3"/>`;
        if (labels[i] !== undefined) xl += `<text class="chart-label" x="${px(i)}" y="${h - 14}" text-anchor="middle">${esc(labels[i])}</text>`;
      });
      return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
        ${gl}<path class="area" d="${area}"/><path class="line" d="M${pts}" stroke="${stroke}"/>${dots}${xl}</svg>`;
    },
  };

  function render(el) {
    const all = [...S.hotTopics, ...S.globalTopics];
    const scored = all
      .map((t) => ({ ...t, score: sc.hotScore(t), band: sc.hotBand(sc.hotScore(t)) }))
      .sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3);
    const globalTop = S.globalTopics.slice(0, 4);
    const week = S.metricSeries.slice(-7);
    const weekLabels = S.metricDays.slice(-7);

    const kpis = [
      { label: '实时抓取热点', value: C.hotLive ? String(C.hotLive.totalLive || C.hotLive.total || 100) : '46', delta: '多源真实 + 18 赛道', up: true },
      { label: '高价值机会', value: '10', delta: 'Opportunity ≥ 70', up: true },
      { label: '今日推荐选题', value: '3', delta: 'S/A 级', up: true },
      { label: '待发布内容', value: '3', delta: '含 TikTok / IG', up: false },
      { label: '今日商业机会', value: '4', delta: '+2 新发现', up: true },
      { label: '本周总播放', value: fmt(184.4e4), delta: '+23.1% 环比', up: true },
    ];

    const advice = [
      { rank: 1, title: '数字人直播新规下，普通人还有机会吗？', why: '热点爆发中(92 分)、商业价值高、竞品解读供给少，建议今天出短视频+解读文章。' },
      { rank: 2, title: '县城 48 小时：反向旅游保姆级路线', why: '增长极快(92)、视觉题材强、可结合实拍 Vlog，建议本周内发布。' },
      { rank: 3, title: 'AI 副业 30 天真实记录 Day8：回应质疑', why: '延续上一条爆款(31万播放)热度，评论区争议是二次传播燃料。' },
    ];

    const kanban = {};
    S.kanbanStages.forEach((s) => (kanban[s] = S.kanban.filter((k) => k.stage === s)));

    let kbHtml = '<div class="kanban">';
    for (const st of S.kanbanStages) {
      const items = kanban[st] || [];
      kbHtml += `<div class="kanban-col"><h4>${esc(st)}<span class="muted">${items.length}</span></h4>`;
      items.forEach((k) => {
        kbHtml += `<div class="kanban-card"><div class="t">${esc(k.title)}</div>
          <div class="meta">${esc(k.track)} · ${esc(k.owner)} · ${esc(k.due)}</div></div>`;
      });
      kbHtml += '</div>';
    }
    kbHtml += '</div>';

    el.innerHTML = `
      <div class="view-title">🎛️ 自媒体指挥中心</div>
      <div class="view-desc">一屏回答 5 个问题：今天做什么 / 对手在做什么 / 我该做什么 / 怎么快速做出来 / 效果如何。</div>

      <div class="row gap8 mb-16 wrap">
        <button class="btn primary" data-go="hotspot">🔥 Find Opportunities</button>
        <button class="btn primary" data-go="studio">🎬 Create Content</button>
        <button class="btn primary" data-go="business">💰 Find Business</button>
        <span class="grow"></span>
        <span class="chip">全球趋势：TikTok · Instagram · YouTube · Reddit</span>
      </div>

      <div class="grid g6 mb-16">${kpis.map((k) => `
        <div class="kpi"><div class="k-label">${esc(k.label)}</div><div class="k-value">${esc(k.value)}</div>
        <div class="k-delta ${k.up ? 'up' : 'muted'}">${esc(k.delta)}</div></div>`).join('')}
      </div>

      <div class="grid g3">
        <div class="card" style="grid-column: span 2;">
          <div class="card-head"><div class="card-title">🤖 AI 今日建议 · 最值得做的 3 个选题</div>
            <div class="card-sub">增长负责人 Agent 综合热点/竞品/历史表现生成</div></div>
          <div class="card-body">
            ${advice.map((a) => `
              <div class="list-item">
                <div class="score-ring" style="width:34px;height:34px;font-size:13px;">${a.rank}</div>
                <div class="grow">
                  <div class="b">${esc(a.title)}</div>
                  <div class="small text-2 mt-8">${esc(a.why)}</div>
                </div>
                <button class="btn sm" data-go="topics">去生成</button>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">📈 本周增长趋势</div><div class="card-sub">近 7 日播放（万）</div></div>
          <div class="card-body">${C.chart.line(week.map((d) => ({ value: d.views })), { h: 170, labels: weekLabels })}</div>
          <div class="card-foot">环比上周 +23.1% · 爆款带动明显（08-13 单日 34.5 万）</div>
        </div>
      </div>

      <div class="grid g3 mt-16">
        <div class="card">
          <div class="card-head"><div class="card-title">🔥 今日机会榜 TOP 3</div></div>
          <div class="card-body">
            ${top3.map((t, i) => `
              <div class="list-item">
                <div class="grow">
                  <div class="b">${i + 1}. ${esc(t.title)}</div>
                  <div class="mt-8">${badge(t.band.label, t.band.tone)} ${(t.platforms || [t.platform]).map((p) => `<span class="tag">${esc(p)}</span>`).join('')}</div>
                  <div class="small text-3 mt-8">${esc(t.recommendActions[0])}</div>
                </div>
                <div class="score-ring">${t.score}</div>
              </div>`).join('')}
          </div>
          <div class="card-foot"><a href="#hotspot">查看全部热点 →</a></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">🕵️ 竞品动态（情报员监控）</div></div>
          <div class="card-body">
            <div class="list-item"><div class="grow"><div class="b">AI 进化论·阿伟</div><div class="small text-2 mt-8">发布《DeepSeek 本地部署》教程 · 24h 播放 21 万</div></div></div>
            <div class="list-item"><div class="grow"><div class="b">大熊说AI副业</div><div class="small text-2 mt-8">发布《AI 副业 Day30 复盘》 · 播放 18 万 · 互动率高</div></div></div>
            <div class="list-item"><div class="grow"><div class="b">新晋账号「AI 搭子研究所」</div><div class="small text-2 mt-8">7 天涨粉 3.2 万 · 内容空白：数字人合规解读</div></div></div>
          </div>
          <div class="card-foot"><a href="#accounts">进入对标研究 →</a></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">🌍 全球趋势速览（Live 快照）</div></div>
          <div class="card-body">
            ${globalTop.map((t) => `
              <div class="list-item">
                <div class="grow"><div class="b" style="font-size:12px">${esc(t.title)}</div>
                <div class="small text-3 mt-8">${esc(t.platform)} · ${badge(t.status, t.status === 'Exploding' || t.status === 'Breaking' ? 'danger' : t.status === 'Rising' || t.status === 'Fast Growth' ? 'success' : 'warn')} · ${t.updatedMinAgo}min</div></div>
                <span class="score-ring" style="width:34px;height:34px;font-size:12px">${sc.hotScore(t)}</span>
              </div>`).join('')}
          </div>
          <div class="card-foot"><a href="#hotspot">进入全球热点雷达 →</a></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">📤 今日待发布</div></div>
          <div class="card-body">
            ${S.schedule.filter((s) => s.status === '待发布').slice(0, 3).map((s) => `
              <div class="list-item">
                <div class="grow"><div class="b">${esc(s.title)}</div>
                <div class="small text-2 mt-8">${esc(s.platform)} · ${esc(s.account)} · ${esc(s.date)} ${esc(s.time)}</div></div>
                ${badge('待发布', 'warn')}
              </div>`).join('')}
          </div>
          <div class="card-foot"><a href="#publish">进入发布中心 →</a></div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><div class="card-title">🏭 内容生产看板</div><div class="card-sub">选题 → 文案 → 脚本 → 制作 → 审核 → 待发布 → 已发布</div></div>
        <div class="card-body">${kbHtml}</div>
      </div>`;

    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => (location.hash = '#' + b.dataset.go)));
  }

  C.views.dashboard = { render };
})(typeof window !== 'undefined' ? window : globalThis);
