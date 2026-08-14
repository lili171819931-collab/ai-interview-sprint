/* ============ 视图：创作者情报（Creator Intelligence） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  const TIER_TONE = { Mega: 'danger', Top: 'primary', Mid: 'info', Rising: 'success', Breakout: 'warn', Emerging: 'muted' };
  let state = { detail: null, mine: 'acc01', compare: ['ga01', 'ga03'], tier: '全部' };

  function allAccounts() {
    return S.accounts.map((a) => ({ ...a, region: 'CN' })).concat(S.globalAccounts.map((a) => ({ ...a, region: 'Global' })));
  }

  function render(el) {
    const list = allAccounts().filter((a) => state.tier === '全部' || a.tier === state.tier);
    const tiers = ['全部', 'Mega', 'Top', 'Mid', 'Rising'];

    el.innerHTML = `
      <div class="view-title">🎯 创作者情报</div>
      <div class="view-desc">Creator Intelligence · 按平台/国家/语言/赛道/粉丝/增速/互动率/爆款率/商业化筛选 · 账号分层 Mega/Top/Mid/Rising/Breakout/Emerging。</div>

      <div class="card">
        <div class="card-body">
          <div class="row wrap gap8">
            <div class="tabs" style="border:0;margin:0">
              ${tiers.map((t) => `<div class="tab ${state.tier === t ? 'active' : ''}" data-tier="${t}">${t}</div>`).join('')}
            </div>
            <div class="grow"></div>
            <span class="chip">共 ${list.length} 个账号</span>
          </div>
        </div>
      </div>

      <div class="grid g4 mb-16">
        ${list.map((a) => `
          <div class="card" style="margin:0">
            <div class="card-body">
              <div class="row spread"><div class="b">${esc(a.name)}</div>${badge(a.tier || 'Mid', TIER_TONE[a.tier] || 'info')}</div>
              <div class="small text-3 mt-8">${a.region === 'Global' ? '🌍' : '🇨🇳'} ${esc(a.platform)} · ${esc(a.track)} · ${esc(a.bizType)}</div>
              <div class="grid g3 mt-12" style="gap:6px;text-align:center">
                <div><div class="b" style="font-size:13px">${esc(a.fans)}</div><div class="small text-3">粉丝</div></div>
                <div><div class="b" style="font-size:13px">${a.viralRate}%</div><div class="small text-3">爆款率</div></div>
                <div><div class="b" style="font-size:13px">+${a.growthRate}%</div><div class="small text-3">月增</div></div>
              </div>
              <div class="small text-3 mt-12">${esc(a.positioning)}</div>
              <div class="mt-12"><button class="btn sm w-full" data-teardown="${a.id}">🔪 一键暴力拆解（8 维）</button></div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card" id="bench">
        <div class="card-head"><div class="card-title">⚔️ 对标矩阵（对标 → 自我）</div><div class="card-sub">值得复制什么 / 不适合复制什么 / 你的差异化机会</div></div>
        <div class="card-body">
          <div class="row wrap gap12 mb-12">
            <div class="field" style="margin:0"><label>我的账号</label>
              <select class="input" id="bm-mine" style="width:210px">${allAccounts().map((a) => `<option value="${a.id}" ${state.mine === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
            <div class="field" style="margin:0"><label>对标 A</label>
              <select class="input" id="bm-a" style="width:210px">${allAccounts().map((a) => `<option value="${a.id}" ${state.compare[0] === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
            <div class="field" style="margin:0"><label>对标 B</label>
              <select class="input" id="bm-b" style="width:210px">${allAccounts().map((a) => `<option value="${a.id}" ${state.compare[1] === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
          </div>
          <div id="bm-table"></div>
          <div class="chain-decision mt-12" id="bm-verdict"></div>
        </div>
      </div>
      <div id="teardown"></div>`;

    const find = (id) => allAccounts().find((x) => x.id === id);
    const m = find(state.mine), a = find(state.compare[0]), b = find(state.compare[1]);
    const rows = [
      ['定位', m.positioning, a.positioning, b.positioning],
      ['人设', m.persona, a.persona, b.persona],
      ['粉丝', m.fans, a.fans, b.fans],
      ['更新频率', m.updateFreq, a.updateFreq, b.updateFreq],
      ['爆款率', m.viralRate + '%', a.viralRate + '%', b.viralRate + '%'],
      ['标题能力', m.titleFormulas.join('/'), a.titleFormulas.join('/'), b.titleFormulas.join('/')],
      ['商业化', m.bizType, a.bizType, b.bizType],
    ];
    el.querySelector('#bm-table').innerHTML = `
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>维度</th><th>我的账号（${esc(m.name)}）</th><th>A（${esc(a.name)}）</th><th>B（${esc(b.name)}）</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td class="text-2 b">${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody>
      </table></div>`;
    el.querySelector('#bm-verdict').innerHTML = `<b>🤖 对标→自我分析：</b><br>✅ 值得复制：①「${esc(a.titleFormulas[0])}」标题 ②「${esc(a.viralFormula.split('×')[0])}」选题 ③「${esc(b.videoStructure.split('→')[1] || '节奏')}」结构。<br>🚫 不适合复制：${esc(a.name)} 的高成本制作、${esc(b.name)} 的无专业背书泛内容。<br>🎯 你的差异化机会：${esc(m.positioning)} —— 用「${esc(m.viralFormula.split('×')[0])}」切入，做「${esc(m.track)}」赛道里唯一「${esc(m.persona)}」人设。`;

    el.querySelector('#bm-mine').addEventListener('change', (e) => { state.mine = e.target.value; render(el); });
    el.querySelector('#bm-a').addEventListener('change', (e) => { state.compare[0] = e.target.value; render(el); });
    el.querySelector('#bm-b').addEventListener('change', (e) => { state.compare[1] = e.target.value; render(el); });
    el.querySelectorAll('[data-tier]').forEach((t) => t.addEventListener('click', () => { state.tier = t.dataset.tier; render(el); }));
    el.querySelectorAll('[data-teardown]').forEach((b) => b.addEventListener('click', () => {
      state.detail = state.detail === b.dataset.teardown ? null : b.dataset.teardown;
      render(el);
    }));

    if (state.detail) {
      const acc = allAccounts().find((x) => x.id === state.detail);
      if (acc) renderTeardown(el, acc);
      else state.detail = null;
    }
  }

  function renderTeardown(el, acc) {
    const div = el.querySelector('#teardown');
    const mix = Object.entries(acc.contentMix || {});
    div.innerHTML = `
      <div class="card">
        <div class="card-head"><div class="card-title">🔪 Viral Creator Deep Dive · 8 维拆解 · ${esc(acc.name)}</div>
          <div class="grow"></div>${badge(acc.tier || 'Mid', TIER_TONE[acc.tier] || 'info')}<button class="btn sm" data-close style="margin-left:8px">收起</button></div>
        <div class="card-body">
          <div class="grid g3 mb-12" style="gap:14px;align-items:start">
            <div style="grid-column: span 1; max-width:230px">
              <div class="b small mb-8">🖼 封面（图片预览）</div>
              <img class="cover-preview" src="${C.cover.url({ title: acc.name + ' 爆款拆解', hook: acc.viralFormula, author: acc.platform + ' · ' + acc.track, tag: 'DEEP DIVE', accent: '#4f7dff', bg: '#0e1420' })}" alt="封面预览">
            </div>
            <div style="grid-column: span 2">
              <div class="b mb-8">📝 图文视频文案拆解（完整 · 不止标题）</div>
              <div class="chain-step"><span class="arrow">开头</span><span>${esc(acc.copyBreakdown ? acc.copyBreakdown.opening : '以「' + acc.titleFormulas[0] + '」式反常识/身份共鸣开场，0-3 秒抛出' + acc.viralFormula.split('×')[0] + '核心钩子')}</span></div>
              <div class="chain-step"><span class="arrow">中段</span><span>${esc(acc.copyBreakdown ? acc.copyBreakdown.middle : '用 ' + (acc.videoStructure.split('→')[1] || '').trim() + ' 承接，先给结论再给证据，保持信息密度与情绪推进')}</span></div>
              <div class="chain-step"><span class="arrow">结尾</span><span>${esc(acc.copyBreakdown ? acc.copyBreakdown.closing : '以金句/行动指令收尾，配合 ' + acc.titleFormulas.slice(-1)[0] + ' 式引导评论与关注')}</span></div>
              <div class="chain-step"><span class="arrow">情绪线</span><span>${esc(acc.copyBreakdown ? acc.copyBreakdown.emotion : '好奇 → 认同 → 惊讶 → 行动（情绪节奏与镜头切换同步）')}</span></div>
              <div class="chain-step"><span class="arrow">关键词</span><span>${(acc.copyBreakdown ? acc.copyBreakdown.keywords : ['选题', 'Hook', '信息密度', '人设', '节奏', 'CTA']).map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</span></div>
              <div class="chain-step"><span class="arrow">结构</span><span>${esc(acc.videoStructure)}</span></div>
            </div>
          </div>
          <div class="grid g2">
            <div>
              <div class="b mb-8">01 人设 · 02 定位</div>
              <div class="chain-step"><span class="arrow">身份</span><span>${esc(acc.persona)}</span></div>
              <div class="chain-step"><span class="arrow">定位</span><span>${esc(acc.positioning)}</span></div>
              <div class="chain-step"><span class="arrow">用户</span><span>${esc(acc.track)} 赛道 · ${esc(acc.platform)} · ${acc.region === 'Global' ? '全球' : '国内'}</span></div>
              <div class="chain-step"><span class="arrow">商业</span><span>${esc(acc.bizType)}</span></div>
              <div class="b mt-12 mb-8">03 内容拆解（类型占比）</div>
              ${mix.map(([k, v]) => `<div class="row mb-8"><span class="text-2" style="width:70px">${esc(k)}</span><span class="mini-bar"><i style="width:${v}%"></i></span><span class="num">${v}%</span></div>`).join('')}
            </div>
            <div>
              <div class="b mb-8">04 爆款 · 05 Hook · 06 视频结构</div>
              <div class="chain-step"><span class="arrow">爆款率</span><span>${acc.viralRate}% · 平均播放 ${esc(acc.avgViews)}</span></div>
              <div class="chain-step"><span class="arrow">标题</span><span>${acc.titleFormulas.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</span></div>
              <div class="chain-step"><span class="arrow">结构</span><span>${esc(acc.videoStructure)}</span></div>
              <div class="b mt-12 mb-8">07 视觉 · 08 商业</div>
              <div class="chain-step"><span class="arrow">视觉</span><span>${esc(acc.coverNote || '高对比封面 + 大字标题 + 人物情绪特写')}</span></div>
              <div class="chain-step"><span class="arrow">商业</span><span>${esc(acc.bizType)}</span></div>
              <div class="alert success mt-12" style="margin-top:12px;margin-bottom:0"><span class="a-ico">🏆</span><div class="b">爆款公式：${esc(acc.viralFormula)}</div></div>
            </div>
          </div>
          <div class="chain-out mt-12"><b>📌 可复用到我的账号：</b>采纳「${esc(acc.titleFormulas[0])}」标题模板 + 「${esc(acc.videoStructure.split('→')[0].trim())}」开场，先跑 3 条验证互动率。</div>
        </div>
      </div>`;
    div.querySelector('[data-close]').addEventListener('click', () => { state.detail = null; render(el); });
  }

  C.views.accounts = { render };
})(typeof window !== 'undefined' ? window : globalThis);
