/* ============================================================
 * CreatorOS 应用壳：导航 / 路由 / 渲染调度 / 通用工具
 * ============================================================ */
(function (global) {
  'use strict';
  const C = global.CreatorOS = global.CreatorOS || {};
  C.views = C.views || {};

  const NAV = [
    { group: 'COMMAND CENTER', items: [
      { id: 'dashboard', icon: '🎛️', label: '指挥中心' },
    ]},
    { group: 'INTELLIGENCE', items: [
      { id: 'hotspot', icon: '📡', label: '全球热点雷达' },
      { id: 'accounts', icon: '🎯', label: '创作者情报' },
      { id: 'viral', icon: '🔥', label: '爆款案例库' },
      { id: 'competitive', icon: '🔍', label: '竞品情报' },
    ]},
    { group: 'CONTENT', items: [
      { id: 'topics', icon: '💡', label: '选题中心' },
      { id: 'studio', icon: '✍️', label: 'AI 内容工厂' },
    ]},
    { group: 'PUBLISH', items: [
      { id: 'publish', icon: '📅', label: '发布与数据' },
    ]},
    { group: 'GROWTH', items: [
      { id: 'brain', icon: '🧠', label: 'Creator Brain' },
      { id: 'growth', icon: '📈', label: '增长系统' },
    ]},
    { group: 'BUSINESS', items: [
      { id: 'business', icon: '💰', label: '商业机会中心' },
    ]},
    { group: 'SYSTEM', items: [
      { id: 'chain', icon: '🧭', label: '完整思维链' },
      { id: 'prompts', icon: '📝', label: 'Prompt 优化' },
      { id: 'tests', icon: '🧪', label: '测试中心' },
      { id: 'docs', icon: '📚', label: '项目文档' },
      { id: 'settings', icon: '⚙️', label: '配置中心' },
    ]},
  ];

  const TITLES = {
    dashboard: ['指挥中心', 'Creator Command Center · 全球热点 / 商业机会 / AI 建议一屏'],
    hotspot: ['全球热点雷达', 'Real-time Trend Radar · 全球+国内 · Opportunity Score · Live/Mock 标注'],
    accounts: ['创作者情报', 'Creator Intelligence · 账号分层 · 8 维暴力拆解'],
    viral: ['爆款案例库', 'Viral Library · 3 大真实案例 · Cover/Copy/Script/Timeline 四视图工作台'],
    topics: ['选题中心', 'AI 选题工厂 · 内容战略矩阵 · Commercial Potential'],
    studio: ['AI 内容工厂', '中英双语文案 · 变体改写 · 分镜/Timeline · 多平台重构'],
    publish: ['发布与数据', 'Omnichannel Publishing · TikTok/Instagram/抖音/小红书/B站/视频号 · 数据回收'],
    brain: ['Creator Brain', '我的创作者大脑 · Creator DNA · 优势雷达 · 知识库'],
    growth: ['增长系统', 'AI 增长顾问 · 12 Agent + Creator Orchestrator · 工作流'],
    business: ['商业机会中心', 'Creator Business Intelligence · 变现地图 · 品牌合作 · 商业价值'],
    chain: ['完整思维链', '结构化输出搭建本产品的完整思维链条 · 学习型差异化'],
    competitive: ['竞品情报', '多平台 Skill/产品爬取 · 真实 GitHub 相似项目（含链接+时间）'],
    prompts: ['Prompt 优化', '原始诉求 V2 → 自动补充优化 · 对照清单'],
    tests: ['测试中心', '3 个可运行测试用例 · Node 与浏览器双端'],
    docs: ['项目文档', '产品分析 · 项目管理 · 开发测试 · 商业价值 · 完成报告'],
    settings: ['配置中心', 'Platform Adapter · Compliance 合规中心 · Model Router'],
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
