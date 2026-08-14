/* ============ 视图：爆款案例库（Viral Library） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  /* 共享雷达图（8 维 · 供 business/brain 复用） */
  C.radar = {
    chart(labels, values, { w = 260, h = 220 } = {}) {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 30;
      const n = labels.length;
      const pt = (i, r) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      };
      let grid = '', axes = '', poly = '';
      for (let g = 1; g <= 4; g++) {
        const rr = (R * g) / 4;
        const pts = [];
        for (let i = 0; i < n; i++) pts.push(pt(i, rr).join(','));
        grid += `<polygon points="${pts.join(' ')}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
      }
      for (let i = 0; i < n; i++) {
        const [x, y] = pt(i, R);
        axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
        const [lx, ly] = pt(i, R + 16);
        axes += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" fill="var(--text-3)">${esc(labels[i])}</text>`;
      }
      const pts = values.map((v, i) => pt(i, (R * Math.max(4, v)) / 100).join(','));
      poly = `<polygon points="${pts.join(' ')}" fill="rgba(79,125,255,.18)" stroke="var(--primary)" stroke-width="2"/>`;
      return `<svg class="chart" viewBox="0 0 ${w} ${h}">${grid}${axes}${poly}</svg>`;
    },
  };

  let state = { detail: null, tab: 'cover' };

  function render(el) {
    el.innerHTML = `
      <div class="view-title">🔥 爆款案例库</div>
      <div class="view-desc">3 个真实示范案例（知识/AI科技 · 个人IP/职场 · 商业/电商）→ 点击进入暴力拆解工作台（Cover / Copy / Script / Timeline 四视图）。</div>
      <div class="alert warn"><span class="a-ico">🛡️</span><div><b>Originality Guard：</b>参考爆款 ≠ 复制爆款。系统自动识别结构/表达/画面相似度，提醒你换角度、换案例、加入个人经验 —— <i>Learn the Formula, Not Copy the Content.</i></div></div>

      <div class="grid g3 mb-16">
        ${S.caseStudies.map((c, i) => `
          <div class="card" style="margin:0">
            <div class="card-head"><div class="card-title">CASE 0${i + 1} · ${esc(c.type)}</div>${badge(c.tier, 'primary')}</div>
            <div class="card-body">
              <div class="b" style="font-size:14px">${esc(c.name)}</div>
              <div class="small text-3 mt-8">${esc(c.creator)} · ${esc(c.platform)} · ${esc(c.stats)}</div>
              <div class="small text-2 mt-8">${esc(c.positioning)}</div>
              <div class="chain-out mt-12"><b>爆款公式：</b>${esc(c.keyTakeaways[0])}</div>
              <div class="mt-12"><button class="btn primary sm w-full" data-open="${c.id}">🔪 进入暴力拆解工作台</button></div>
            </div>
          </div>`).join('')}
      </div>
      <div id="viral-detail"></div>`;

    el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
      state.detail = state.detail === b.dataset.open ? null : b.dataset.open;
      state.tab = 'cover';
      render(el);
    }));
    if (state.detail) {
      const c = S.caseStudies.find((x) => x.id === state.detail);
      if (c) renderWorkbench(el, c);
      else state.detail = null;
    }
  }

  function renderWorkbench(el, c) {
    const div = el.querySelector('#viral-detail');
    const tabs = [
      ['cover', '🖼 Cover 封面视图'], ['copy', '✍ Copy 中英双语'], ['script', '🎬 Script 脚本视图'], ['timeline', '⏱ Timeline 时间轴'],
    ];
    div.innerHTML = `
      <div class="card">
        <div class="card-head"><div class="card-title">🔪 Viral Creator Deep Dive · ${esc(c.name)}</div>
          <div class="grow"></div>
          <button class="btn sm" data-close>收起</button></div>
        <div class="card-body">
          <div class="tabs">${tabs.map(([id, label]) => `<div class="tab ${state.tab === id ? 'active' : ''}" data-vtab="${id}">${label}</div>`).join('')}</div>
          <div id="vb-body"></div>
          <div class="row gap8 mt-16">
            <button class="btn primary" data-mine>🎬 基于此爆款生成我的版本</button>
            <span class="small text-3">重新选题 + 原创文案 + 原创脚本 + 封面 + 视频（规则引擎生成，LLM 接入后增强）</span>
          </div>
        </div>
      </div>`;
    div.querySelector('[data-close]').addEventListener('click', () => { state.detail = null; render(el); });
    div.querySelectorAll('[data-vtab]').forEach((t) => t.addEventListener('click', () => { state.tab = t.dataset.vtab; renderWorkbench(el, c); }));
    div.querySelector('[data-mine]').addEventListener('click', () => {
      try { sessionStorage.setItem('cos_studio_topic', c.name); } catch (_) {}
      location.hash = '#studio';
    });
    const body = div.querySelector('#vb-body');

    if (state.tab === 'cover') {
      body.innerHTML = `
        <div class="grid g2">
          <div>
            <div class="b mb-8">📸 原始封面结构</div>
            <div class="alert info" style="margin:0"><span class="a-ico">🎨</span><div>${esc(c.viralPost.cover)}</div></div>
            <div class="b mt-12 mb-8">标题 / Hook / 结构</div>
            <div class="chain-step"><span class="arrow">标题</span><span>${esc(c.viralPost.title)}</span></div>
            <div class="chain-step"><span class="arrow">Hook</span><span>${esc(c.viralPost.hook)}</span></div>
            <div class="chain-step"><span class="arrow">结构</span><span>${esc(c.viralPost.structure)}</span></div>
          </div>
          <div>
            <div class="b mb-8">🖼 编辑我的封面（Generate My Cover）</div>
            <div class="field"><label>标题</label><input class="input" value="${esc(c.viralPost.title)}"></div>
            <div class="grid g2" style="gap:8px">
              <div class="field"><label>字体</label><select class="input"><option>${esc(c.coverEdit.font)}</option><option>无衬线加粗</option><option>手写感</option><option>衬线体</option></select></div>
              <div class="field"><label>布局</label><select class="input"><option>${esc(c.coverEdit.layout)}</option><option>人物居中</option><option>大字居中</option></select></div>
            </div>
            <div class="field"><label>配色</label><select class="input"><option>${esc(c.coverEdit.color)}</option><option>高对比黑金</option><option>低饱和莫兰迪</option></select></div>
            <div class="row gap8"><button class="btn sm">AI 重新生成</button><button class="btn sm">替换图片</button><button class="btn primary sm">导出封面</button></div>
          </div>
        </div>`;
    } else if (state.tab === 'copy') {
      body.innerHTML = `
        <div class="grid g2">
          <div><div class="b mb-8">Original（中文）</div>
            <div class="alert info" style="margin:0"><span class="a-ico">📝</span><div>${esc(c.copyBilingual.zh)}</div></div>
            <div class="small text-3 mt-8">AI 可执行：翻译 / 改写 / 本地化 / 增强 Hook / 降低 AI 味 / 增加冲突 / 调整平台风格</div></div>
          <div><div class="b mb-8">My Version（English）</div>
            <div class="alert success" style="margin:0"><span class="a-ico">🌍</span><div>${esc(c.copyBilingual.en)}</div></div>
            <div class="row gap8 mt-8"><button class="btn sm">✍ 增强 Hook</button><button class="btn sm">🌐 跨文化重构</button><button class="btn primary sm">保存版本</button></div></div>
        </div>`;
    } else if (state.tab === 'script') {
      const segs = c.viralPost.structure.split('→').map((x) => x.trim());
      body.innerHTML = `
        <div class="b mb-8">📜 Video Script Editor · 可编辑 / 新增 / 删除 / 拖拽 / AI 优化</div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>段</th><th>时间</th><th>画面</th><th>旁白/文案</th><th>素材</th><th>音乐</th><th></th></tr></thead>
          <tbody>${segs.map((s, i) => `
            <tr><td class="b">S0${i + 1}</td><td class="mono">${esc(s.split(' ')[0] || s)}</td>
            <td><input class="input" value="${esc(c.viralPost.broll.split('/')[i] || c.viralPost.broll)}"></td>
            <td><textarea class="input" rows="2">${esc(c.viralPost.script.slice(0, 60))}…</textarea></td>
            <td><input class="input" value="素材 ${i + 1}"></td><td><input class="input" value="${esc(c.viralPost.music)}"></td>
            <td><button class="btn sm ghost">⋮⋮</button></td></tr>`).join('')}
        </tbody></table></div>
        <div class="row gap8 mt-8"><button class="btn sm">＋ 新增分镜</button><button class="btn sm">🤖 AI 优化脚本</button></div>`;
    } else {
      const tracks = ['Video Track', 'Audio Track', 'Subtitle Track', 'B-roll Track', 'Effect Track'];
      body.innerHTML = `
        <div class="b mb-8">⏱ AI Video Timeline · Auto Edit 自动剪辑（生成 Version A/B/C）</div>
        <div class="alert info"><span class="a-ico">✂️</span><div>AI 自动：识别讲话 / 删除停顿 / 删除重复 / 自动字幕 / 自动切镜头 / 自动 B-roll / 自动配乐 / 自动节奏 / 自动转场</div></div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>轨道</th><th style="min-width:360px">时间轴 0s → 60s</th></tr></thead>
          <tbody>${tracks.map((t, i) => `
            <tr><td class="b">${esc(t)}</td>
            <td><div style="height:22px;border-radius:5px;background:var(--surface-2);position:relative">
              <div style="position:absolute;left:${8 + i * 11}%;width:${30 + i * 3}%;top:3px;bottom:3px;border-radius:4px;background:rgba(79,125,255,${0.28 + i * 0.06})"></div>
            </div></td></tr>`).join('')}
        </tbody></table></div>
        <div class="row gap8 mt-8">
          <button class="btn primary sm">⚡ Auto Edit</button>
          <button class="btn sm">Version A</button><button class="btn sm">Version B</button><button class="btn sm">Version C</button>
          <span class="grow"></span><span class="chip">${esc(c.platform)} 16:9 · ${esc(c.viralPost.music)}</span>
        </div>`;
    }
  }

  C.views.viral = { render };
})(typeof window !== 'undefined' ? window : globalThis);
