/* ============ 视图：个人创作（全流程设计） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, sc = C.scoring, app = C.app;
  const esc = app.esc, badge = app.badge;

  let mode = 'self';            // self | viral
  let viralCase = 'cs01';
  let topic = 'AI 数字人直播新规下，普通人还有机会吗？';
  let openStep = 1;
  let generated = false;

  const STEPS = [
    { id: 1, name: '选题', icon: '💡', desc: '输入方向/热点 → AI 生成并评分选题' },
    { id: 2, name: '封面', icon: '🖼', desc: '生成封面图（图片预览）· 可编辑' },
    { id: 3, name: '标题', icon: '🏷', desc: '多风格标题 + Hook' },
    { id: 4, name: '文案', icon: '✍', desc: '中英双语文案 + CTA + 标签' },
    { id: 5, name: '视频剪辑', icon: '🎬', desc: '分镜脚本 + Timeline + Auto Edit' },
  ];

  function copyGen(t) {
    return {
      title: `「${t}」全解读：3 个关键判断与行动清单`,
      hook: '一个被 90% 的人忽略的信号正在出现——',
      body: `围绕「${t}」，先讲背景与数据变化，再给出 3 个关键判断，最后落到可执行清单。`,
      bodyEn: `A full breakdown of "${t}" with 3 key judgments and an action checklist.`,
      cta: '关注我，每周 1 篇 AI 增长实操复盘。',
      tags: ['#AI', '#增长', '#CreatorOS', '#实操'],
    };
  }
  function scriptGen(t) {
    return [
      { t: '0-3s', visual: '热点画面+大字', voice: `「${t}」最近刷屏，但 90% 的人理解错了。`, sub: 'Hook' },
      { t: '3-10s', visual: '口播中景', voice: '先说结论：机会窗口只有 2-4 周。', sub: '判断' },
      { t: '10-30s', visual: '演示/对比', voice: '3 个关键信号：规则、头部布局、供给缺口。', sub: '信号' },
      { t: '30-50s', visual: '案例清单', voice: '普通人怎么切？先出 1 分钟解读，再出 5 分钟流程。', sub: '方案' },
      { t: '50-60s', visual: 'CTA', voice: '关注我，评论区扣“流程”发模板。', sub: 'CTA' },
    ];
  }

  function viralFormula() {
    const c = S.caseStudies.find((x) => x.id === viralCase) || S.caseStudies[0];
    return { name: c.name, formula: c.keyTakeaways[0] || c.viralPost.structure, author: c.creator };
  }

  function render(el) {
    const vf = viralFormula();
    el.innerHTML = `
      <div class="view-title">🎬 个人创作</div>
      <div class="view-desc">全流程设计：选题 → 封面 → 标题 → 文案 → 视频剪辑。支持「自创」与「复用爆款拆解逻辑」两种模式，最终生成可直接进入发布的内容。</div>

      <div class="card">
        <div class="card-body">
          <div class="row wrap gap12">
            <div class="tabs" style="border:0;margin:0">
              <div class="tab ${mode === 'self' ? 'active' : ''}" data-mode="self">🎨 自创</div>
              <div class="tab ${mode === 'viral' ? 'active' : ''}" data-mode="viral">🔥 基于爆款拆解</div>
            </div>
            ${mode === 'viral' ? `<div class="field" style="margin:0;width:300px"><label>选择爆款案例（复用拆解逻辑生成类似视频）</label>
              <select class="input" id="cr-case">${S.caseStudies.map((c) => `<option value="${c.id}" ${viralCase === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>` : ''}
            <div class="grow"></div>
            <button class="btn primary" id="cr-run">⚡ 一键全流程生成</button>
          </div>
          ${mode === 'viral' ? `<div class="alert info mt-12"><span class="a-ico">🧬</span><div><b>复用拆解逻辑：</b>${esc(vf.name)} 的爆款公式「${esc(vf.formula)}」将作为选题/标题/文案/封面的生成基因 —— <i>Learn the Formula, Not Copy the Content.</i></div></div>` : ''}
        </div>
      </div>

      <div class="row gap8 mb-12 wrap">
        ${STEPS.map((st, i) => `<span class="step-pill ${generated || i < openStep ? 'done' : 'wait'}">${st.icon} ${esc(st.name)}${i < openStep - 1 ? ' ✓' : ''}</span>${i < STEPS.length - 1 ? '<span class="text-3">→</span>' : ''}`).join('')}
      </div>

      <div id="cr-flow">
        ${STEPS.map((st) => stepHtml(st, vf)).join('')}
      </div>`;

    el.querySelectorAll('[data-mode]').forEach((t) => t.addEventListener('click', () => { mode = t.dataset.mode; generated = false; openStep = 1; render(el); }));
    if (mode === 'viral') el.querySelector('#cr-case').addEventListener('change', (e) => { viralCase = e.target.value; render(el); });
    el.querySelectorAll('[data-step-toggle]').forEach((h) => h.addEventListener('click', () => {
      openStep = openStep === Number(h.dataset.stepToggle) ? openStep : Number(h.dataset.stepToggle);
      render(el);
    }));
    const topicInput = el.querySelector('#cr-topic');
    if (topicInput) topicInput.addEventListener('input', (e) => { topic = e.target.value; });
    el.querySelectorAll('[data-apply-topic]').forEach((b) => b.addEventListener('click', () => {
      const v = (el.querySelector('#cr-topic')?.value || '').trim();
      if (v) { topic = v; app.toast('已应用选题：' + topic); }
    }));
    el.querySelector('#cr-run').addEventListener('click', () => {
      generated = true;
      openStep = 5;
      app.toast(mode === 'viral' ? '已基于爆款拆解逻辑生成完整创作流程' : '已生成完整创作流程');
      render(el);
    });
    el.querySelectorAll('[data-regenerate]').forEach((b) => b.addEventListener('click', () => { app.toast('已用 AI 重新生成（Demo 规则版）'); render(el); }));
    el.querySelectorAll('[data-cover-gen]').forEach((b) => b.addEventListener('click', () => {
      const img = document.getElementById('cr-cover');
      if (img) img.src = C.cover.url({ title: topic, hook: copyGen(topic).hook, author: mode === 'viral' ? vf.author : '我的版本', tag: mode === 'viral' ? 'V2 · VIRAL' : 'MY COVER', accent: ['#4f7dff', '#f0a33c', '#3ecf7a', '#f45b5b'][Math.floor(Math.random() * 4)] });
      app.toast('封面已重新生成');
    }));
    el.querySelectorAll('[data-to-publish]').forEach((b) => b.addEventListener('click', () => { location.hash = '#publish'; }));
  }

  function stepHtml(st, vf) {
    const isOpen = openStep === st.id || generated;
    const body = [];
    if (st.id === 1) {
      body.push(`
        <div class="field"><label>选题方向 / 关联热点</label><input class="input" id="cr-topic" value="${esc(topic)}"></div>
        <div class="row gap8">
          <button class="btn sm primary" data-apply-topic>应用为我的选题</button>
          <span class="small text-3">AI 生成 5 个选题 + Topic Score（≥80 推荐制作）</span>
        </div>
        <div class="grid g3 mt-12" id="cr-topics">
          ${[['AI 数字人直播合规解读', 86], ['DeepSeek 本地部署 30 分钟教程', 84], ['县城 48 小时反向旅游', 82], ['一人公司收支公开', 85], ['短剧上瘾公式拆解', 78]].map(([t, s2]) => `
            <div class="kpi" style="margin:0"><div class="b" style="font-size:12px">${esc(t)}</div>
            <div class="row spread mt-8"><span class="score-ring" style="width:32px;height:32px;font-size:12px">${s2}</span>${badge(s2 >= 80 ? '推荐制作' : '观察', s2 >= 80 ? 'success' : 'muted')}</div></div>`).join('')}
        </div>`);
    } else if (st.id === 2) {
      body.push(`
        <div class="grid g2" style="align-items:start">
          <div><div class="b small mb-8">封面（图片预览）</div>
            <img id="cr-cover" class="cover-preview" style="max-width:300px" src="${C.cover.url({ title: topic, hook: copyGen(topic).hook, author: mode === 'viral' ? vf.author : '我的版本', tag: mode === 'viral' ? 'V2 · VIRAL' : 'MY COVER' })}" alt="我的封面">
            <div class="row gap8 mt-8"><button class="btn sm" data-cover-gen>🔄 AI 重新生成</button><span class="small text-3">图片形式 · 可导出</span></div>
          </div>
          <div>
            <div class="b small mb-8">设计要素（来自${mode === 'viral' ? '爆款拆解' : '自创'}）</div>
            <div class="chain-step"><span class="arrow">构图</span><span>${mode === 'viral' ? esc(vf.name.split('《')[0] + ' 大字+人物') : '大字标题 + 人物右置'}</span></div>
            <div class="chain-step"><span class="arrow">字体</span><span>无衬线加粗 · 高对比</span></div>
            <div class="chain-step"><span class="arrow">色彩</span><span>深色底 + 品牌色高亮</span></div>
            <div class="chain-step"><span class="arrow">CTA</span><span>「立即观看 →」</span></div>
          </div>
        </div>`);
    } else if (st.id === 3) {
      const titles = mode === 'viral'
        ? [`【基于${vf.name}】${topic} · 3 个关键判断`, `关于${topic}，我劝你先别急着冲`, `${topic}，这 3 个选题现在做正好`]
        : [`「${topic}」全解读：3 个关键判断与行动清单`, `关于${topic}，我劝你先别急着冲`, `${topic}：5 条可直接抄的执行清单`];
      body.push(`
        <div class="flow-pills">${titles.map((t, i) => `<span class="flow-pill ${i === 0 ? 'active' : ''}">${esc(t)}</span>`).join('')}</div>
        <div class="chain-decision"><b>Hook：</b>${esc(copyGen(topic).hook)}</div>
        <div class="row gap8 mt-8"><button class="btn sm" data-regenerate>🔀 换一组标题</button><span class="small text-3">标题公式：数字型 / 冲突型 / 结果型</span></div>`);
    } else if (st.id === 4) {
      const cp = copyGen(topic);
      body.push(`
        <div class="grid g2" style="gap:14px">
          <div><div class="b small mb-8">🇨🇳 中文</div>
            <div class="field"><label>正文</label><div style="line-height:1.8">${esc(cp.body)}</div></div>
            <div class="field"><label>CTA</label><div class="text-2">${esc(cp.cta)}</div></div></div>
          <div><div class="b small mb-8">🌍 English</div>
            <div class="field"><label>Body</label><div style="line-height:1.8">${esc(cp.bodyEn)}</div></div>
            <div class="field"><label>标签</label>${cp.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
        </div>
        <div class="row gap8"><button class="btn sm" data-regenerate>🔀 换一组文案</button></div>`);
    } else {
      const scenes = scriptGen(topic);
      body.push(`
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Scene</th><th>时间</th><th>画面</th><th>旁白</th><th>字幕</th></tr></thead>
          <tbody>${scenes.map((scn, i) => `<tr><td class="b">S0${i + 1}</td><td class="mono">${esc(scn.t)}</td><td>${esc(scn.visual)}</td><td>${esc(scn.voice)}</td><td>${esc(scn.sub)}</td></tr>`).join('')}</tbody>
        </table></div>
        <div class="row gap8 mt-8">
          <button class="btn primary sm">⚡ Auto Edit（Version A/B/C）</button>
          <button class="btn sm">生成素材</button>
          <span class="grow"></span>
          <button class="btn primary" data-to-publish>🚀 进入发布中心</button>
        </div>`);
    }
    return `
      <div class="flow-step ${isOpen ? 'open' : ''}">
        <div class="flow-head" data-step-toggle="${st.id}">
          <div class="idx">${st.id}</div>
          <div class="t">${st.icon} ${esc(st.name)}</div>
          <div class="small text-3">${esc(st.desc)}</div>
          <span class="chev">▶</span>
        </div>
        <div class="flow-body">${body.join('')}</div>
      </div>`;
  }

  C.views.creation = { render };
})(typeof window !== 'undefined' ? window : globalThis);
