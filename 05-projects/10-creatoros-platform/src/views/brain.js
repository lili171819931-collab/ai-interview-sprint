/* ============ 视图：Creator Brain（我的创作者大脑） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  let profile = {
    identity: 'AI 产品经理 / 前咨询顾问', exp: '5 年 ToB 产品 + 2 年 AI 落地',
    specialty: '企业 AI 应用与增长方法', view: 'AI 不是替代人，而是放大人的判断',
    product: 'CreatorOS 与 AI 咨询服务', users: '职场管理者 / 一人公司', platform: '小红书 + 公众号', advantage: '能讲清「AI 如何产生收入」',
  };
  let analyzed = false;

  function render(el) {
    const radar = C.radar.chart(['专业', '内容', '人设', '资源', '商业', '差异化'], [90, 82, 78, 72, 84, 86]);
    el.innerHTML = `
      <div class="view-title">🧠 Creator Brain</div>
      <div class="view-desc">我的创作者大脑：长期保存你的知识/经历/观点/案例/品牌/产品/用户，所有 AI 创作优先调用 —— 「AI 越来越像我，而不是我越来越像 AI」。</div>

      <div class="grid g2">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">👤 My Creator Profile</div><div class="card-sub">输入后 AI 自动分析 Creator DNA</div></div>
          <div class="card-body">
            <div class="grid g2" style="gap:10px">
              <div class="field"><label>我的身份</label><input class="input" id="br-identity" value="${esc(profile.identity)}"></div>
              <div class="field"><label>我的经历</label><input class="input" id="br-exp" value="${esc(profile.exp)}"></div>
              <div class="field"><label>我的专业</label><input class="input" id="br-spec" value="${esc(profile.specialty)}"></div>
              <div class="field"><label>我的观点</label><input class="input" id="br-view" value="${esc(profile.view)}"></div>
              <div class="field"><label>我的产品</label><input class="input" id="br-prod" value="${esc(profile.product)}"></div>
              <div class="field"><label>我的目标用户</label><input class="input" id="br-users" value="${esc(profile.users)}"></div>
              <div class="field"><label>我的平台</label><input class="input" id="br-plat" value="${esc(profile.platform)}"></div>
              <div class="field"><label>我的优势</label><input class="input" id="br-adv" value="${esc(profile.advantage)}"></div>
            </div>
            <button class="btn primary" id="br-analyze">⚡ 分析我的 Creator DNA</button>
          </div>
        </div>
        <div>
          <div class="card" style="margin:0">
            <div class="card-head"><div class="card-title">📡 Creator Advantage Radar</div></div>
            <div class="card-body" style="text-align:center">${radar}
              <div class="small text-3">专业 90 · 内容 82 · 人设 78 · 资源 72 · 商业 84 · 差异化 86</div>
            </div>
          </div>
          <div class="card mt-16" style="margin:0">
            <div class="card-head"><div class="card-title">🧬 Creator DNA（分析结果）</div></div>
            <div class="card-body" id="br-dna">
              ${analyzed ? dnaHtml() : '<div class="empty">点击「分析我的 Creator DNA」生成</div>'}
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><div class="card-title">🎯 Creator Growth Blueprint</div><div class="card-sub">10 分钟内从「什么都没有」到「完整内容增长计划」</div></div>
        <div class="card-body">
          <div class="grid g3">
            ${[['账号定位', `专注「${profile.identity}」视角的 ${profile.product} 增长实战`],
               ['目标用户', profile.users],
               ['内容支柱', '① AI 落地案例 ② 增长方法论 ③ 商业变现拆解'],
               ['差异化', '把「AI 如何产生收入」讲清楚，避开工具介绍红海'],
               ['30 天选题', '4 周 × 5 条 = 20 条（热点30% + 专业30% + 人设20% + 商业20%）'],
               ['增长策略', '每周 1 篇深度 + 3 条短视频 + 1 场直播/社群']].map(([k, v]) => `
              <div class="kpi" style="margin:0"><div class="k-label">${esc(k)}</div><div class="small text-2" style="font-size:12px">${esc(v)}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><div class="card-title">📚 我的知识库（AI 创作优先调用）</div></div>
        <div class="card-body">
          <div class="grid g4">
            ${[['个人经历', profile.exp], ['专业观点', profile.view], ['产品资料', profile.product], ['用户画像', profile.users],
               ['历史内容', '12 篇 · 2 条爆款'], ['失败案例', '3 条复盘'], ['品牌表达', '禁用词 5 · 常用词 18'], ['风格偏好', '专业+故事']].map(([k, v]) => `
              <div class="kpi" style="margin:0"><div class="k-label">${esc(k)}</div><div class="small text-2" style="font-size:11.5px">${esc(v)}</div></div>`).join('')}
          </div>
        </div>
      </div>`;

    el.querySelector('#br-analyze').addEventListener('click', () => {
      profile = {
        identity: el.querySelector('#br-identity').value, exp: el.querySelector('#br-exp').value,
        specialty: el.querySelector('#br-spec').value, view: el.querySelector('#br-view').value,
        product: el.querySelector('#br-prod').value, users: el.querySelector('#br-users').value,
        platform: el.querySelector('#br-plat').value, advantage: el.querySelector('#br-adv').value,
      };
      analyzed = true;
      el.querySelector('#br-dna').innerHTML = dnaHtml();
      app.toast('Creator DNA 已分析 · 已保存到 Creator Brain');
    });
  }

  function dnaHtml() {
    const items = [
      ['专业优势', profile.specialty + '（可输出深度方法论）'],
      ['内容优势', '能把复杂「' + profile.product + '」讲成可执行步骤'],
      ['人设优势', profile.identity + ' 的真实身份带来信任背书'],
      ['资源优势', profile.exp + ' 可转化为案例与故事'],
      ['商业优势', profile.product + ' 提供自然变现路径'],
      ['差异化优势', '「' + profile.view + '」是稀缺原创观点'],
    ];
    return `<div class="grid g2" style="gap:8px">${items.map(([k, v]) => `
      <div class="chain-alt" style="border-color:var(--primary)"><b>${esc(k)}：</b>${esc(v)}</div>`).join('')}</div>`;
  }

  C.views.brain = { render };
})(typeof window !== 'undefined' ? window : globalThis);
