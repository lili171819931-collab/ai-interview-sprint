/* ============ 视图：发布与数据 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, fmt = app.fmt, badge = app.badge;

  let tab = 'calendar';

  const STATUS_TONE = { '待发布': 'warn', '审核中': 'info', '制作中': 'primary', '已发布': 'success', '草稿': 'muted', '失败': 'danger', '文案中': 'primary', '脚本中': 'primary', '选题': 'muted' };

  function render(el) {
    el.innerHTML = `
      <div class="view-title">📤 发布与数据</div>
      <div class="view-desc">内容日历 · 发布中心 · 数据中心 · AI 复盘 —— 回答「发布以后效果怎么样」。</div>
      <div class="tabs">
        <div class="tab ${tab === 'calendar' ? 'active' : ''}" data-tab="calendar">📅 内容日历</div>
        <div class="tab ${tab === 'publish' ? 'active' : ''}" data-tab="publish">🚀 发布中心</div>
        <div class="tab ${tab === 'data' ? 'active' : ''}" data-tab="data">📊 数据中心</div>
        <div class="tab ${tab === 'pm' ? 'active' : ''}" data-tab="pm">🔁 AI 复盘</div>
      </div>
      <div id="pd-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; render(el); }));
    const body = el.querySelector('#pd-body');

    if (tab === 'calendar') {
      const days = [...new Set(S.schedule.map((s) => s.date))].sort();
      body.innerHTML = `<div class="grid g3">
        ${days.map((d) => `
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(d)}</div><div class="card-sub">${S.schedule.filter((s) => s.date === d).length} 条</div></div>
          <div class="card-body">
            ${S.schedule.filter((s) => s.date === d).map((s) => `
              <div class="list-item"><div class="mono text-3">${esc(s.time)}</div>
                <div class="grow"><div class="b" style="font-size:12px">${esc(s.title)}</div>
                <div class="small text-3">${esc(s.platform)} · ${esc(s.account)}</div></div>
                ${badge(s.status, STATUS_TONE[s.status] || 'muted')}</div>`).join('')}
          </div></div>`).join('')}
        <div class="card" style="margin:0"><div class="card-head"><div class="card-title">🤖 AI 排期建议</div></div>
          <div class="card-body">
            <div class="chain-step"><span class="arrow">→</span><span>周二至周四 12:00-13:00 / 18:00-20:00 发布互动率最高（历史 +18%）</span></div>
            <div class="chain-step"><span class="arrow">→</span><span>小红书建议 20:30-22:00 发布图文</span></div>
            <div class="chain-step"><span class="arrow">→</span><span>B站建议周五 18:00 发布长视频</span></div>
            <div class="chain-decision"><b>本周策略：</b>热点内容当天跟发（解读类 12:00），深度内容错峰（周四/五 18:00）。</div>
          </div></div>
      </div>`;
    } else if (tab === 'publish') {
      body.innerHTML = `
        <div class="alert warn"><span class="a-ico">⚠️</span><div><b>数据真实性：</b>当前发布状态为演示模拟。真实一键发布需接入各平台开放平台 API（PublishProvider · OAuth），未接入前不做假成功。</div></div>
        <div class="card"><div class="table-wrap"><table class="tbl">
          <thead><tr><th>内容</th><th>平台</th><th>账号</th><th>排期</th><th>状态</th><th>动作</th></tr></thead>
          <tbody>${S.schedule.map((s) => `
            <tr><td class="b">${esc(s.title)}</td><td>${esc(s.platform)}</td><td class="small">${esc(s.account)}</td>
            <td class="mono">${esc(s.date)} ${esc(s.time)}</td>
            <td>${badge(s.status, STATUS_TONE[s.status] || 'muted')}</td>
            <td><button class="btn sm" data-status="${esc(s.id)}">${s.status === '待发布' ? '模拟发布' : '详情'}</button></td></tr>`).join('')}
        </tbody></table></div></div>`;
      body.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => {
        const s = S.schedule.find((x) => x.id === b.dataset.status);
        if (s && s.status === '待发布') { s.status = '已发布'; app.toast('已模拟发布（Demo）· 真实发布待平台 API'); render(el); }
        else app.toast('演示数据：查看详情');
      }));
    } else if (tab === 'data') {
      const week = S.metricSeries.slice(-7);
      const labels = S.metricDays.slice(-7);
      const total = S.platformMetrics.reduce((a, p) => ({ views: a.views + p.views, likes: a.likes + p.likes, follows: a.follows + p.follows }), { views: 0, likes: 0, follows: 0 });
      body.innerHTML = `
        <div class="grid g4 mb-16">
          <div class="kpi"><div class="k-label">本周播放（万）</div><div class="k-value">${total.views}</div><div class="k-delta up">+23.1%</div></div>
          <div class="kpi"><div class="k-label">本周互动（万）</div><div class="k-value">${total.likes}</div><div class="k-delta up">+19.6%</div></div>
          <div class="kpi"><div class="k-label">本周涨粉（万）</div><div class="k-value">${total.follows}</div><div class="k-delta up">+24.3%</div></div>
          <div class="kpi"><div class="k-label">爆款（超均值 2 倍）</div><div class="k-value">16</div><div class="k-delta up">本周 +4</div></div>
        </div>
        <div class="grid g2">
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">📈 近 7 日播放趋势（万）</div></div>
            <div class="card-body">${C.chart.line(week.map((d) => ({ value: d.views })), { h: 200, labels })}</div></div>
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">📊 平台表现（本周 · 万）</div></div>
            <div class="table-wrap"><table class="tbl">
              <thead><tr><th>平台</th><th>播放</th><th>互动</th><th>分享</th><th>涨粉</th><th>爆款数</th><th>表现</th></tr></thead>
              <tbody>${S.platformMetrics.map((p) => `<tr>
                <td class="b">${esc(p.platform)}</td><td class="num">${p.views}</td><td class="num">${p.likes}</td>
                <td class="num">${p.shares}</td><td class="num">${p.follows}</td><td class="num">${p.viral}</td>
                <td><span class="mini-bar" style="width:80px"><i style="width:${Math.round((p.views / 128) * 100)}%"></i></span></td></tr>`).join('')}
            </tbody></table></div></div>
        </div>`;
    } else {
      body.innerHTML = `
        <div class="card"><div class="card-head"><div class="card-title">🔁 Content Post-Mortem · AI 复盘</div><div class="card-sub">数据分析师 Agent 自动生成</div></div>
        <div class="card-body">
          ${S.postMortem.map((p) => `
            <div class="list-item">
              <div class="grow">
                <div class="row spread"><div class="b">${esc(p.title)}</div>${badge(p.result.split(' · ')[0], 'success')}</div>
                <div class="small text-2 mt-8">${esc(p.result)}</div>
                <div class="mt-8">✅ 成功因素：${p.success.map(esc).map((x) => `<span class="tag">${x}</span>`).join('')}</div>
                <div class="mt-8">❌ 失败因素：${p.fail.map(esc).map((x) => `<span class="tag">${x}</span>`).join('')}</div>
                <div class="chain-out mt-8" style="margin-top:8px"><b>▶ 下一条怎么做：</b>${esc(p.next)}</div>
              </div>
            </div>`).join('')}
        </div></div>
        <div class="card"><div class="card-head"><div class="card-title">🤖 AI 增长顾问</div><div class="card-sub">可访问全系统数据回答问题</div></div>
        <div class="card-body">
          <div class="alert info"><span class="a-ico">💬</span><div><b>示例提问：</b>“我最近为什么流量下降？” → 顾问读取账号/内容/热点/竞品数据后给出归因。</div></div>
          <div class="chain-decision"><b>AI 顾问回答（基于本周数据）：</b>核心原因 3 项 —— ① 选题热度下降 32%（近 3 天未追热点）；② 更新频率从日更降到 3 更；③ Hook 点击率下降（标题冲突感减弱）。<br>建议：未来 7 天重点做 A「热点跟发」B「爆款衍生」C「复盘连载」三类内容。</div>
        </div></div>`;
    }
  }

  C.views.publish = { render };
})(typeof window !== 'undefined' ? window : globalThis);
