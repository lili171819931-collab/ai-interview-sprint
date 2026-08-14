/* ============ 视图：选题中心 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, sc = C.scoring, app = C.app;
  const esc = app.esc, badge = app.badge;

  let state = { from: null, generated: false, mode: 'all' };

  function render(el) {
    const fromHot = (() => { try { return sessionStorage.getItem('cos_gen_from') || null; } catch (_) { return null; } })();
    if (fromHot && !state.generated) { state.from = fromHot; state.generated = true; }

    const hotOpts = S.hotTopics.map((t) => `<option value="${esc(t.title)}">${esc(t.title)}</option>`).join('');
    const accOpts = S.accounts.map((a) => `<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');

    const scored = S.topics.map((t) => ({ ...t, res: sc.topicScore(t) }))
      .filter((t) => state.mode === 'all' || (state.mode === 'rec' && t.res.recommend));
    const recCount = S.topics.filter((t) => sc.topicScore(t).recommend).length;

    el.innerHTML = `
      <div class="view-title">✏️ 选题中心</div>
      <div class="view-desc">AI Topic Factory：输入方向/热点/账号/赛道 → 生成选题并 7 维评分（Topic Score ≥80 推荐制作）。</div>

      <div class="card">
        <div class="card-body">
          <div class="grid g4">
            <div class="field"><label>内容方向</label><input class="input" id="tp-dir" value="AI 增长实操" placeholder="如：AI 副业 / 县城旅行"></div>
            <div class="field"><label>关联热点（可选）</label><select class="input" id="tp-hot"><option value="">— 不关联 —</option>${hotOpts}</select></div>
            <div class="field"><label>对标账号（可选）</label><select class="input" id="tp-acc"><option value="">— 不关联 —</option>${accOpts}</select></div>
            <div class="field"><label>生成数量</label><select class="input" id="tp-n"><option>5</option><option selected>10</option><option>20</option></select></div>
          </div>
          <div class="row gap8">
            <button class="btn primary" id="tp-gen">⚡ AI 生成选题</button>
            <span class="small text-3">规则引擎生成 · LLM Provider 接入后自动增强</span>
          </div>
          <div id="tp-result"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">📋 选题库</div><div class="card-sub">${S.topics.length} 条 · 推荐制作 ${recCount} 条</div>
          <div class="grow"></div>
          <div class="tabs" style="border:0;margin:0">
            <div class="tab ${state.mode === 'all' ? 'active' : ''}" data-mode="all">全部</div>
            <div class="tab ${state.mode === 'rec' ? 'active' : ''}" data-mode="rec">推荐制作</div>
          </div>
        </div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>选题</th><th>赛道</th><th>来源</th><th>热点性</th><th>需求</th><th>差异化</th><th>竞争</th><th>商业</th><th>难度</th><th>Topic Score</th><th>优先级</th><th></th></tr></thead>
          <tbody>
            ${scored.map((t) => `
              <tr>
                <td style="min-width:260px"><div class="b">${esc(t.title)}</div></td>
                <td>${esc(t.track)}</td><td class="small text-3">${esc(t.source)}</td>
                <td class="num">${t.hotness}</td><td class="num">${t.demand}</td><td class="num">${t.differentiation}</td>
                <td class="num">${t.competition}</td><td class="num">${t.businessValue}</td><td class="num">${t.difficulty}</td>
                <td><div class="row"><span class="score-ring" style="width:38px;height:38px;font-size:13px;">${t.res.score}</span></div></td>
                <td>${badge(t.res.recommend ? `S${t.res.priority === 'S' ? '' : ''} 推荐制作` : 'B/C 观察', t.res.recommend ? 'success' : 'muted')}</td>
                <td><button class="btn sm" data-copy-to-studio="${esc(t.title)}">去创作 →</button></td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>`;

    if (state.from) {
      el.querySelector('#tp-dir').value = state.from;
      el.querySelector('#tp-gen').click();
    }
    el.querySelector('#tp-gen').addEventListener('click', () => {
      const dir = el.querySelector('#tp-dir').value.trim() || 'AI 增长实操';
      const hot = el.querySelector('#tp-hot').value;
      const acc = el.querySelector('#tp-acc').value;
      const n = Number(el.querySelector('#tp-n').value);
      const box = el.querySelector('#tp-result');
      box.innerHTML = '<div class="loading">⚙️ 选题专家 Agent 正在生成…</div>';
      setTimeout(() => {
        const base = S.topics.slice(0, 8);
        const generated = Array.from({ length: n }, (_, i) => {
          const b = base[i % base.length];
          const jitter = (v) => Math.max(30, Math.min(98, v + ((i * 7 + 3) % 9) - 4));
          return {
            id: 'gen' + i, title: `【生成】${dir}｜${b.title.replace(/^.*?：/, '')}${i % 3 === 0 ? '（进阶篇）' : ''}`,
            track: b.track, source: hot || acc || 'AI 生成',
            hotness: jitter(b.hotness), demand: jitter(b.demand), virality: jitter(b.virality),
            differentiation: jitter(b.differentiation), competition: jitter(b.competition),
            businessValue: jitter(b.businessValue), difficulty: jitter(b.difficulty),
          };
        }).map((t) => ({ ...t, res: sc.topicScore(t) }));
        box.innerHTML = `
          <div class="alert success mt-12"><span class="a-ico">✅</span><div>已生成 ${n} 个选题（方向：${esc(dir)}${hot ? ' · 热点：' + esc(hot) : ''}${acc ? ' · 对标：' + esc(acc) : ''}）</div></div>
          <div class="grid g3">${generated.map((t) => `
            <div class="kpi" style="margin:0">
              <div class="k-label">${esc(t.source)} · ${esc(t.track)}</div>
              <div class="b" style="font-size:12.5px;min-height:38px">${esc(t.title)}</div>
              <div class="row mt-8 spread"><span class="score-ring" style="width:34px;height:34px;font-size:12px;">${t.res.score}</span>
              ${badge(t.res.recommend ? '推荐制作 ' + t.res.priority : '观察', t.res.recommend ? 'success' : 'muted')}</div>
              <div class="small text-3 mt-8">7 维评分：${t.hotness}/${t.demand}/${t.virality}/${t.differentiation}/${t.competition}/${t.businessValue}/${t.difficulty}</div>
            </div>`).join('')}</div>`;
        app.toast(`已生成 ${n} 个选题`);
      }, 450);
    });
    el.querySelectorAll('[data-mode]').forEach((t) => t.addEventListener('click', () => { state.mode = t.dataset.mode; render(el); }));
    el.querySelectorAll('[data-copy-to-studio]').forEach((b) => b.addEventListener('click', () => {
      try { sessionStorage.setItem('cos_studio_topic', b.dataset.copyToStudio); } catch (_) {}
      location.hash = '#studio';
    }));
  }

  C.views.topics = { render };
})(typeof window !== 'undefined' ? window : globalThis);
