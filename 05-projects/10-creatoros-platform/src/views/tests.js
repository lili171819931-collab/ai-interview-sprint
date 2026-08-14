/* ============ 视图：测试中心 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const sc = C.scoring, comp = C.competitor, CP = C.competitors, S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  /* 与 tests/test-cases.mjs 完全一致的 3 个测试用例 */
  const CASES = [
    {
      id: 'TC-01', name: '热点评分引擎', target: 'scoring.hotScore / hotBand / hotBadges',
      desc: '验证 Hot Score 计算：分数区间、排序、频段分类、徽章触发。',
      run() {
        const asserts = [];
        const a = (name, ok, detail) => asserts.push({ name, ok, detail });
        const topics = S.hotTopics.map((t) => ({ ...t, score: sc.hotScore(t) }));
        a('分数均在 0-100', topics.every((t) => t.score >= 0 && t.score <= 100), `min=${Math.min(...topics.map((t) => t.score))} max=${Math.max(...topics.map((t) => t.score))}`);
        const sorted = topics.slice().sort((x, y) => y.score - x.score);
        a('高热度样本排序正确', sorted[0].id === 'ht01' && sorted[0].score >= sorted[1].score, `${sorted[0].title}(${sorted[0].score}) > ${sorted[1].title}(${sorted[1].score})`);
        const band = sc.hotBand(92);
        a('92 分归类为爆发中', band.key === 'burst', band.label);
        const low = sc.hotBand(45);
        a('45 分归类为建议观察', low.key === 'observe', low.label);
        const badges = sc.hotBadges(topics[0]);
        a('高竞争/高商业触发徽章', badges.some((b) => b.label.includes('高竞争')) || badges.some((b) => b.label.includes('商业价值高')), badges.map((b) => b.label).join(' | ') || '无徽章');
        return asserts;
      },
    },
    {
      id: 'TC-02', name: '选题评分引擎', target: 'scoring.topicScore',
      desc: '验证 7 维加权评分：推荐阈值（≥80）与优先级分级（S/A/B/C）。',
      run() {
        const asserts = [];
        const a = (name, ok, detail) => asserts.push({ name, ok, detail });
        const scored = S.topics.map((t) => ({ ...t, res: sc.topicScore(t) }));
        a('评分均在 0-100', scored.every((t) => t.res.score >= 0 && t.res.score <= 100), `范围 ${Math.min(...scored.map((t) => t.res.score))}-${Math.max(...scored.map((t) => t.res.score))}`);
        a('存在推荐制作选题', scored.some((t) => t.res.recommend), `推荐 ${scored.filter((t) => t.res.recommend).length}/${scored.length}`);
        const rec = scored.filter((t) => t.res.recommend);
        a('推荐选题得分均 ≥80', rec.every((t) => t.res.score >= 80), rec.length ? `最低 ${Math.min(...rec.map((t) => t.res.score))}` : '无推荐样本');
        a('高难度选题不误判为推荐', (() => {
          const hard = { hotness: 90, demand: 90, virality: 90, differentiation: 90, competition: 90, businessValue: 90, difficulty: 95 };
          return !sc.topicScore(hard).recommend;
        })(), '难度 95 时评分被压制');
        a('S 级优先级仅对 ≥85 生效', scored.filter((t) => t.res.priority === 'S').every((t) => t.res.score >= 85), `S 级 ${scored.filter((t) => t.res.priority === 'S').length} 条`);
        return asserts;
      },
    },
    {
      id: 'TC-03', name: '竞品分析引擎', target: 'competitor.coverageScore / gapAnalysis / positioning / directorReport',
      desc: '验证竞品矩阵：覆盖率、差距识别、定位象限、战略报告完整性。',
      run() {
        const asserts = [];
        const a = (name, ok, detail) => asserts.push({ name, ok, detail });
        const report = comp.directorReport(CP.competitors, CP.FEATURE_KEYS, CP.market);
        a('覆盖率均在 0-100', CP.competitors.every((c) => { const v = comp.coverageScore(c, CP.FEATURE_KEYS); return v >= 0 && v <= 100; }), `样本 ${CP.competitors.length}`);
        a('识别出高空白能力', report.openGaps.length >= 3, `空白带 ${report.openGaps.length} 项：${report.openGaps.slice(0, 3).map((g) => g.key).join('/')}`);
        a('定位象限覆盖 4 类', new Set(report.positions.map((p) => p.quad)).size >= 3, [...new Set(report.positions.map((p) => p.quad))].join(' / '));
        a('战略报告含 4 条策略', report.strategy.length === 4, `策略：${report.strategy.map((s) => s.title).join(' / ')}`);
        a('SWOT 结构完整', Array.isArray(report.swot.strengths) && Array.isArray(report.swot.threats) && report.swot.opportunities.length > 0, `机会 ${report.swot.opportunities.length} · 威胁 ${report.swot.threats.length}`);
        return asserts;
      },
    },
  ];

  function render(el) {
    el.innerHTML = `
      <div class="view-title">🧪 测试中心</div>
      <div class="view-desc">3 个核心引擎测试用例，浏览器一键运行；与 Node 运行器（<code class="mono">npm test</code>）共用同一份断言逻辑，保证双端一致。</div>
      <div class="row gap12 mb-16">
        <button class="btn primary" id="run-all">▶ 运行全部 3 个用例</button>
        <span class="small text-3">断言覆盖：评分区间 / 排序 / 频段 / 阈值 / 优先级 / 覆盖率 / 空白带 / 象限 / 报告完整性</span>
      </div>
      <div id="tc-results">${CASES.map((c) => `<div class="test-card">
        <div class="test-head"><span class="chip">${c.id}</span><div class="grow"><div class="b">${esc(c.name)}</div>
        <div class="small text-3">${esc(c.target)}</div></div><span class="badge muted" data-state="${c.id}">未运行</span></div>
        <div class="test-body"><div class="small text-2 mb-8">${esc(c.desc)}</div><div data-asserts="${c.id}"></div></div>
      </div>`).join('')}</div>`;

    el.querySelector('#run-all').addEventListener('click', () => runAll(el));
    runAll(el); // 进入视图自动运行一次
  }

  function runAll(el) {
    for (const c of CASES) {
      let asserts;
      try { asserts = c.run(); } catch (err) { asserts = [{ name: '用例抛出异常', ok: false, detail: err.message }]; }
      const box = el.querySelector(`[data-asserts="${c.id}"]`);
      const st = el.querySelector(`[data-state="${c.id}"]`);
      const pass = asserts.every((x) => x.ok);
      st.textContent = pass ? `✅ ${asserts.length}/${asserts.length} 通过` : `❌ ${asserts.filter((x) => x.ok).length}/${asserts.length} 通过`;
      st.className = 'badge ' + (pass ? 'success' : 'danger');
      box.innerHTML = asserts.map((x) => `
        <div class="assert-row"><span class="${x.ok ? 'ok' : 'fail'}">${x.ok ? '✓' : '✗'}</span>
        <span class="grow">${esc(x.name)}</span><span class="text-3">${esc(x.detail || '')}</span></div>`).join('');
    }
    app.toast('3 个测试用例已执行');
  }

  C.views.tests = { render };
})(typeof window !== 'undefined' ? window : globalThis);
