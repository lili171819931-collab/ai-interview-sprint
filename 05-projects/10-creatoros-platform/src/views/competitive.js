/* ============ 视图：竞品情报雷达 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const CP = C.competitors, crawl = C.crawler, comp = C.competitor, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  let state = { running: false, tab: 'report' };

  function render(el) {
    const trust = crawl.sourceTrust();
    const report = comp.directorReport(CP.competitors, CP.FEATURE_KEYS, CP.market);
    const gaps = report.gaps.filter((g) => g.supported <= 3);

    el.innerHTML = `
      <div class="view-title">🔍 竞品情报雷达</div>
      <div class="view-desc">从 GitHub、Awesome 列表、AI 导航站、Product Hunt、行业网站等多平台爬取当前现有类似 Skill/产品，执行竞品分析与对比，并从产品总监视角输出战略报告。</div>

      <div class="grid g2">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🕷️ Skill 爬取管线</div>
            <div class="grow"></div><button class="btn primary sm" id="cp-run" ${state.running ? 'disabled' : ''}>${state.running ? '⏳ 爬取中…' : '▶ 开始爬取'}</button></div>
          <div class="card-body">
            <div class="steps" id="cp-steps">
              ${crawl.PIPELINE.map((s, i) => `<span class="step-pill wait" data-step="${s.id}">${i + 1}. ${esc(s.name)}</span>`).join('')}
            </div>
            <div id="cp-log"></div>
            <div class="mt-12">
              <div class="b small mb-8">数据源适配器（6 个）</div>
              ${crawl.SOURCE_ADAPTERS.map((s) => `
                <div class="list-item">
                  <div class="grow"><div class="b" style="font-size:12px">${esc(s.name)}</div>
                  <div class="small text-3">${esc(s.endpoint)} · ${esc(s.note)}</div></div>
                  ${badge({ snapshot: '快照', mock: 'Mock', todo: '未接入' }[s.status], { snapshot: 'success', mock: 'warn', todo: 'muted' }[s.status])}
                </div>`).join('')}
            </div>
          </div>
          <div class="card-foot">快照占比 ${trust.snapshotRatio}% · 有网环境执行 <code class="mono">npm run crawl</code> 可抓取真实数据合并入库</div>
        </div>

        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">📊 市场快照</div></div>
          <div class="card-body">
            <div class="grid g3 mb-12">
              <div class="kpi" style="margin:0"><div class="k-label">样本竞品</div><div class="k-value">${CP.competitors.length}</div></div>
              <div class="kpi" style="margin:0"><div class="k-label">平均覆盖率</div><div class="k-value">${report.avgCoverage}%</div></div>
              <div class="kpi" style="margin:0"><div class="k-label">覆盖率第一</div><div class="k-value" style="font-size:15px">${esc(report.leader ? report.leader.name : '—')}</div></div>
            </div>
            <div class="b small mb-8">🎯 定位象限（x 平台广度 × y AI 深度）</div>
            <div class="quad-chart">
              ${[['全能型增长 OS', '右上'], ['渠道/分发平台', '右下'], ['AI 创作工具', '左上'], ['单点效率工具', '左下']].map(([q, _]) => `
                <div class="quad-cell"><h5>${esc(q)}</h5>
                ${report.positions.filter((p) => p.quad === q).map((p) => `<div class="q-item">• <b>${esc(p.name)}</b></div>`).join('') || '<div class="q-item text-3">（空缺）</div>'}
                </div>`).join('')}
            </div>
            <div class="quad-note">全能型增长 OS 存在明显空缺 —— 正是 CreatorOS 的切入位置</div>
          </div>
        </div>
      </div>

      <div class="tabs mt-16">
        <div class="tab ${state.tab === 'report' ? 'active' : ''}" data-tab="report">📋 产品总监报告</div>
        <div class="tab ${state.tab === 'github' ? 'active' : ''}" data-tab="github">🐙 GitHub 相似项目（真实 · ${(C.githubLive?.items || []).length}）</div>
        <div class="tab ${state.tab === 'matrix' ? 'active' : ''}" data-tab="matrix">⚔️ 对比矩阵</div>
        <div class="tab ${state.tab === 'gap' ? 'active' : ''}" data-tab="gap">🧩 差距分析</div>
        <div class="tab ${state.tab === 'list' ? 'active' : ''}" data-tab="list">🗂️ 竞品样本库（${CP.competitors.length}）</div>
      </div>
      <div id="cp-body"></div>`;

    el.querySelector('#cp-run').addEventListener('click', () => runCrawl(el));
    el.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { state.tab = t.dataset.tab; render(el); }));
    const body = el.querySelector('#cp-body');

    if (state.tab === 'github') {
      const gh = C.githubLive || { items: [], crawledAt: null };
      body.innerHTML = `
        <div class="alert success"><span class="a-ico">🐙</span><div><b>真实联网数据</b>（GitHub Search API · sort=stars）· 抓取时间 <code class="mono">${esc((gh.crawledAt || '').slice(0, 19).replace('T', ' '))} UTC</code> · 共 ${gh.items.length} 个相似项目，已按相关度+Star 排序。<br>重新抓取：<code class="mono">npm run crawl:github</code>（脚本：scripts/crawl-github-similar.mjs → 数据：data/github-similar-projects.json）</div></div>
        <div class="grid g2">
          ${gh.items.map((it) => `
            <div class="card" style="margin:0">
              <div class="card-head">
                <div class="card-title"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.name)}</a></div>
                ${badge(it.relevance === 'high' ? '高度相关' : '相关', it.relevance === 'high' ? 'danger' : 'info')}
              </div>
              <div class="card-body">
                <div class="small text-2" style="min-height:44px">${esc(it.description || '—')}</div>
                <div class="row mt-8 wrap gap8">
                  <span class="chip">★ ${fmt(it.stars)}</span>
                  <span class="chip">🍴 ${fmt(it.forks)}</span>
                  ${it.language ? `<span class="chip">${esc(it.language)}</span>` : ''}
                  <span class="chip">🕒 更新 ${esc((it.updatedAt || '').slice(0, 10))}</span>
                  <span class="chip">创建 ${esc((it.createdAt || '').slice(0, 10))}</span>
                </div>
                <div class="small text-3 mt-8">匹配：${esc(it.match || '')}</div>
                <div class="mt-8">${(it.cap || []).map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</div>
                <div class="small mt-8"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.url)}</a></div>
              </div>
            </div>`).join('')}
        </div>`;
    } else if (state.tab === 'report') {
      body.innerHTML = `
        <div class="card">
          <div class="card-head"><div class="card-title">🧑‍💼 产品总监视角 · 战略报告</div><div class="card-sub">规则引擎生成 · 基于 ${CP.competitors.length} 个样本与 20 项能力维度</div></div>
          <div class="card-body">
            <div class="b mb-8">📌 市场洞察</div>
            ${report.insights.map((i) => `<div class="chain-step"><span class="arrow">→</span><span>${esc(i)}</span></div>`).join('')}
            ${report.strategy.map((s) => `
              <div class="mt-12"><div class="b mb-8">🎯 ${esc(s.title)}</div>
              <div class="alert info" style="margin:0"><span class="a-ico">▶</span><div>${esc(s.body)}</div></div></div>`).join('')}
          </div>
        </div>
        <div class="grid g2">
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">💪 机会（市场空白）</div></div>
            <div class="card-body">${CP.market.opportunities.map((o) => `<div class="chain-step"><span class="arrow">＋</span><span>${esc(o)}</span></div>`).join('')}</div></div>
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">⚠️ 威胁</div></div>
            <div class="card-body">${CP.market.threats.map((o) => `<div class="chain-step"><span class="arrow">！</span><span>${esc(o)}</span></div>`).join('')}</div></div>
        </div>`;
    } else if (state.tab === 'matrix') {
      const matrix = comp.compareMatrix(CP.competitors, CP.FEATURE_KEYS);
      body.innerHTML = `
        <div class="alert info"><span class="a-ico">ℹ️</span><div>✓ 完整支持 · ◐ 部分/规划中 · — 不支持。横向滚动查看全部 ${CP.FEATURE_KEYS.length} 项能力。</div></div>
        <div class="card"><div class="table-wrap"><table class="tbl matrix">
          <thead><tr><th>能力 \ 竞品</th>${CP.competitors.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr></thead>
          <tbody>
            ${matrix.map((row) => `<tr><td class="b">${esc(CP.FEATURE_LABELS[row.key] || row.key)}</td>
              ${CP.competitors.map((c) => `<td class="feat-cell ${row.cells[c.id].cls}">${row.cells[c.id].v}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table></div></div>`;
    } else if (state.tab === 'gap') {
      body.innerHTML = `
        <div class="card"><div class="card-head"><div class="card-title">🧩 市场空白带（支持者最少的 8 项能力）</div></div>
        <div class="card-body">
          ${gaps.map((g) => `
            <div class="list-item">
              <div class="grow"><div class="b">${esc(CP.FEATURE_LABELS[g.key] || g.key)}</div>
              <div class="small text-3">${g.supported}/${CP.competitors.length} 家支持 · 空白度 ${Math.round(g.gap * 100)}%</div></div>
              <span class="mini-bar" style="width:120px"><i style="width:${(1 - g.gap) * 100}%"></i></span>
              ${g.supported <= 2 ? badge('高空白', 'danger') : g.supported <= 4 ? badge('中空白', 'warn') : badge('低', 'muted')}
            </div>`).join('')}
          <div class="chain-decision"><b>结论：</b>「思维链输出 / 竞品爬取 / 多平台适配 / AI 增长顾问 / 账号情报」等能力供给稀缺，是差异化优先补齐项。</div>
        </div></div>`;
    } else {
      body.innerHTML = `
        <div class="grid g3">
          ${CP.competitors.map((c) => {
            const cov = comp.coverageScore(c, CP.FEATURE_KEYS);
            return `<div class="card" style="margin:0">
              <div class="card-head"><div class="card-title">${esc(c.name)}</div>${badge(c.sourceType === 'github' ? 'GitHub' : '网站', c.sourceType === 'github' ? 'primary' : 'outline')}</div>
              <div class="card-body">
                <div class="small text-3">${esc(c.category)} · ${esc(c.pricing)}</div>
                <div class="small mt-8" style="min-height:52px">${esc(c.desc)}</div>
                <div class="row mt-8"><span class="small text-2">覆盖率</span><span class="mini-bar grow"><i style="width:${cov}%"></i></span><span class="num b">${cov}%</span></div>
                <div class="row mt-8"><span class="small text-2">评分</span><span class="b">★ ${c.rating}</span>${c.stars ? `<span class="small text-3">· ⭐ ${(c.stars / 1000).toFixed(1)}k</span>` : ''}</div>
                <div class="alert info mt-12" style="margin-top:12px;margin-bottom:0"><span class="a-ico">🧑‍💼</span><div class="small">${esc(c.directorNote)}</div></div>
              </div></div>`;
          }).join('')}
        </div>`;
    }
  }

  async function runCrawl(el) {
    if (state.running) return;
    state.running = true;
    const runBtn = el.querySelector('#cp-run');
    runBtn.disabled = true; runBtn.textContent = '⏳ 爬取中…';
    const log = el.querySelector('#cp-log');
    log.innerHTML = '<div class="loading">正在连接数据源…</div>';

    const snapshot = { items: CP.competitors, sources: crawl.SOURCE_ADAPTERS.map((s) => s.name) };
    const res = await crawl.runPipeline(snapshot, {
      delay: 520,
      onStep: ({ step, phase, summary }) => {
        el.querySelectorAll('[data-step]').forEach((sp) => {
          sp.classList.remove('done', 'running', 'wait');
          if (!step) { sp.classList.add('done'); return; }
          if (sp.dataset.step === step.id) sp.classList.add(phase === 'running' ? 'running' : 'done');
          else sp.classList.add('wait');
        });
        if (phase === 'complete') {
          log.innerHTML = `<div class="alert success"><span class="a-ico">✅</span><div>爬取完成：入库 ${summary.items} 条 · 来源 ${summary.sources.length} 个 · 耗时 ${summary.timeMs}ms（快照模式）。有网环境执行 <code class="mono">npm run crawl</code> 抓取真实数据。</div></div>`;
        }
      },
    });
    state.running = false;
    runBtn.disabled = false; runBtn.textContent = '▶ 开始爬取';
    app.toast(`竞品情报更新完成：${res.items.length} 条`);
  }

  C.views.competitive = { render };
})(typeof window !== 'undefined' ? window : globalThis);
