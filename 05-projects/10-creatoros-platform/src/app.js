/* ============================================================
 * CreatorOS 应用壳：导航 / 路由 / 渲染调度 / 通用工具
 * ============================================================ */
(function (global) {
  'use strict';
  const C = global.CreatorOS = global.CreatorOS || {};
  C.views = C.views || {};

  const NAV = [
    { group: '业务系统', items: [
      { id: 'dashboard', icon: '🎛️', label: '指挥中心' },
      { id: 'hotspot', icon: '📡', label: '热点雷达' },
      { id: 'accounts', icon: '🎯', label: '对标研究' },
      { id: 'topics', icon: '✏️', label: '选题中心' },
      { id: 'studio', icon: '🏭', label: 'AI 内容工厂' },
      { id: 'publish', icon: '📤', label: '发布与数据' },
      { id: 'growth', icon: '🚀', label: '增长系统' },
    ]},
    { group: '差异化能力', items: [
      { id: 'chain', icon: '🧠', label: '完整思维链' },
      { id: 'competitive', icon: '🔍', label: '竞品情报雷达' },
    ]},
    { group: '项目制交付', items: [
      { id: 'prompts', icon: '📝', label: 'Prompt 优化' },
      { id: 'tests', icon: '🧪', label: '测试中心' },
      { id: 'docs', icon: '📚', label: '项目文档' },
      { id: 'settings', icon: '⚙️', label: '配置中心' },
    ]},
  ];

  const TITLES = {
    dashboard: ['指挥中心', '自媒体增长操作系统 · 今日 5 问一屏'],
    hotspot: ['热点雷达', '今天什么值得做 · Hot Score 评分与内容机会'],
    accounts: ['对标研究', '账号情报 · 暴力拆解 · 对标矩阵'],
    topics: ['选题中心', 'AI 选题工厂 · 7 维 Topic Score'],
    studio: ['AI 内容工厂', '文案生成 · 变体改写 · 视频脚本与分镜'],
    publish: ['发布与数据', '内容日历 · 发布中心 · 数据中心 · AI 复盘'],
    growth: ['增长系统', 'AI 增长顾问 · Agent 团队 · 工作流 · 知识库'],
    chain: ['完整思维链', '结构化输出搭建本产品的完整思维链条 · 学习型差异化'],
    competitive: ['竞品情报雷达', '多平台 Skill/产品爬取 · 对比矩阵 · 产品总监视角'],
    prompts: ['Prompt 优化', '原始诉求 → 自动补充优化 · 对照清单'],
    tests: ['测试中心', '3 个可运行测试用例 · Node 与浏览器双端'],
    docs: ['项目文档', '产品分析 · 项目管理 · 开发测试 · 商业价值 · 完成报告'],
    settings: ['配置中心', 'Provider Adapter · Model Router · 数据信任 · 额度'],
  };

  /* ---------- 通用工具 ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => { n = Number(n || 0); if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿'; if (n >= 1e4) return (n / 1e4).toFixed(1) + '万'; return String(n); };
  const badge = (label, tone) => `<span class="badge ${tone}">${label}</span>`;

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function h(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /* ---------- 路由 ---------- */
  function currentView() {
    const id = (location.hash || '#dashboard').replace('#', '');
    return C.views[id] ? id : 'dashboard';
  }

  function renderShell() {
    const cur = currentView();
    const sb = document.getElementById('sidebar');
    let html = `
      <div class="brand">
        <div class="brand-logo">C</div>
        <div><div class="brand-name">CreatorOS</div><div class="brand-sub">AI 自媒体增长操作系统</div></div>
      </div><nav class="nav">`;
    for (const g of NAV) {
      html += `<div class="nav-group">${esc(g.group)}</div>`;
      for (const it of g.items) {
        html += `<div class="nav-item ${cur === it.id ? 'active' : ''}" data-nav="${it.id}">
          <span class="ico">${it.icon}</span><span>${esc(it.label)}</span></div>`;
      }
    }
    html += `</nav><div class="sidebar-foot">v1.0 · 商务高效简约<br>数据四态：真实/快照/Mock/未接入</div>`;
    sb.innerHTML = html;
    sb.querySelectorAll('.nav-item').forEach((el) => el.addEventListener('click', () => {
      location.hash = '#' + el.dataset.nav;
      renderShell();
      window.scrollTo(0, 0);
    }));

    const [title, sub] = TITLES[cur] || ['', ''];
    const tb = document.getElementById('topbar');
    tb.innerHTML = `
      <div class="topbar-title">${esc(title)}</div>
      <div class="topbar-sub">${esc(sub)}</div>
      <div class="topbar-spacer"></div>
      <div class="search-box">🔍 <input id="global-search" placeholder="搜索热点 / 选题 / 竞品…"></div>
      <span class="trust-pill"><span class="dot amber"></span>Demo 快照 · 非实时</span>
      <div class="avatar">我</div>`;
    const inp = document.getElementById('global-search');
    if (inp) inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && inp.value.trim()) {
        location.hash = '#hotspot';
        toast('已跳转热点雷达：演示数据支持按标题/标签检索');
        setTimeout(() => { const i2 = document.querySelector('[data-nav="hotspot"]'); if (i2) i2.click(); }, 30);
      }
    });
  }

  function renderView() {
    const cur = currentView();
    const el = document.getElementById('view');
    const v = C.views[cur];
    if (!v) { el.innerHTML = '<div class="empty">视图不存在</div>'; return; }
    try {
      v.render(el);
    } catch (err) {
      el.innerHTML = `<div class="alert warn"><span class="a-ico">⚠️</span><div>视图渲染异常：${esc(err.message)}<br><code class="mono">${esc(err.stack || '')}</code></div></div>`;
    }
  }

  function init() {
    window.addEventListener('hashchange', () => { renderShell(); renderView(); window.scrollTo(0, 0); });
    renderShell();
    renderView();
  }

  C.app = { NAV, TITLES, esc, fmt, badge, toast, h, init };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})(typeof window !== 'undefined' ? window : globalThis);
