/* ============ 视图：商业机会中心（Creator Business Intelligence） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  function commercialScore() {
    const f = S.businessData.commercialFactors;
    const W = { fansQuality: 0.15, engagement: 0.13, influence: 0.12, professional: 0.15, resources: 0.10, ip: 0.10, conversion: 0.13, credibility: 0.12 };
    const s = Math.round(Object.keys(W).reduce((a, k) => a + (f[k] || 0) * W[k], 0));
    return { score: s, band: s >= 85 ? 'S 级商业价值' : s >= 75 ? 'A 级商业价值' : s >= 65 ? 'B 级商业价值' : '待提升' };
  }

  function render(el) {
    const cs = commercialScore();
    const radar = C.radar.chart(
      ['内容', '专业', '品牌', '资源', '用户质量', '转化', '传播', '差异化'],
      ['content', 'professional', 'brand', 'resources', 'audienceQuality', 'conversion', 'reach', 'differentiation'].map((k) => S.businessData.advantageRadar[k])
    );

    el.innerHTML = `
      <div class="view-title">💰 商业机会中心</div>
      <div class="view-desc">Creator Business Intelligence · 发现商业机会而非罗列赚钱方式：变现地图 · 品牌合作情报 · 我的商业价值。</div>

      <div class="grid g4 mb-16">
        <div class="kpi"><div class="k-label">今日商业机会</div><div class="k-value">4</div><div class="k-delta up">+2 新发现</div></div>
        <div class="kpi"><div class="k-label">高价值账号</div><div class="k-value">6</div><div class="k-delta up">含 2 个 Rising</div></div>
        <div class="kpi"><div class="k-label">品牌合作机会</div><div class="k-value">5</div><div class="k-delta up">1 个 Publicly disclosed</div></div>
        <div class="kpi"><div class="k-label">我的 Commercial Score</div><div class="k-value">${cs.score}</div><div class="k-delta up">${cs.band}</div></div>
      </div>

      <div class="grid g2">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🎯 今日商业机会（AI 自动挖掘）</div><div class="card-sub">内容/产品/合作/服务/变现五类</div></div>
          <div class="card-body">
            ${S.businessData.commercialOpportunities.map((o) => `
              <div class="list-item">
                <div class="score-ring" style="width:42px;height:42px;font-size:12px">${o.matchScore}</div>
                <div class="grow">
                  <div class="row"><div class="b">${esc(o.title)}</div>${badge(o.type, 'primary')}</div>
                  <div class="small text-3 mt-8">${esc(o.reason)}</div>
                  <div class="mt-8 small">流量 ${o.flowValue} · 涨粉 ${o.followValue} · 信任 ${o.trustValue} · 商业 <b>${o.businessValue}</b></div>
                  <div class="chain-out mt-8" style="margin-top:8px"><b>▶ 行动：</b>${esc(o.action)}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div>
          <div class="card" style="margin:0">
            <div class="card-head"><div class="card-title">📡 Creator Advantage Radar</div><div class="card-sub">我的商业优势雷达</div></div>
            <div class="card-body" style="text-align:center">${radar}
              <div class="small text-3">内容 × 专业 × 品牌 × 资源 × 用户质量 × 转化 × 传播 × 差异化</div>
            </div>
          </div>
          <div class="card mt-16" style="margin:0">
            <div class="card-head"><div class="card-title">💎 Creator Commercial Value</div></div>
            <div class="card-body">
              <div class="chain-decision"><b>Commercial Score ${cs.score}/100（${cs.band}）：</b>「粉丝少也可以值钱」——10 万精准行业粉丝可能比 100 万泛娱乐粉丝更有商业价值。你的专业影响力 90 分 > 传播能力 84 分，应优先放大「决策影响力」与「购买影响力」。</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid g2 mt-16">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🗺 Monetization Map · 头部账号盈利模式拆解</div></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>账号</th><th>变现模式</th></tr></thead>
            <tbody>${Object.entries(S.businessData.monetizationMap).map(([k, v]) => `<tr><td class="b">${esc(k)}</td><td>${v.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🤝 Brand Partnership Intelligence</div><div class="card-sub">无公开可靠报价 → 显示 Estimated / Publicly disclosed / Unknown，禁止编造</div></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>品牌</th><th>类型</th><th>形式</th><th>频率</th><th>行业</th><th>价格区间</th></tr></thead>
            <tbody>${S.businessData.brandDeals.map((d) => `
              <tr><td class="b">${esc(d.brand)}</td><td>${esc(d.type)}</td><td>${esc(d.form)}</td><td>${esc(d.frequency)}</td><td>${esc(d.industry)}</td>
              <td>${badge(d.estPrice.startsWith('Estimated') ? 'Estimated' : d.estPrice.startsWith('Publicly') ? 'Publicly disclosed' : 'Unknown', d.estPrice.startsWith('Publicly') ? 'success' : d.estPrice.startsWith('Estimated') ? 'warn' : 'muted')}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
      </div>

      <div class="grid g2 mt-16">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">📈 内容战略矩阵</div><div class="card-sub">每条内容知道为流量/涨粉/信任还是赚钱</div></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>内容</th><th>流量</th><th>涨粉</th><th>信任</th><th>商业</th><th>定位</th></tr></thead>
            <tbody>${S.businessData.contentStrategy.map((r) => `<tr>
              <td class="b">${esc(r.type)}</td><td class="num">${r.flow}</td><td class="num">${r.follow}</td>
              <td class="num">${r.trust}</td><td class="num">${r.biz}</td><td class="small text-2">${esc(r.note)}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🧺 内容投资组合（动态建议）</div></div>
          <div class="card-body">
            ${S.businessData.contentPortfolio.map((p) => `
              <div class="row mb-8"><span class="text-2" style="width:64px">${esc(p.slot)}</span>
              <span class="mini-bar grow" style="width:auto"><i style="width:${p.pct * 3}%"></i></span>
              <span class="num b" style="width:40px">${p.pct}%</span><span class="small text-3">${esc(p.why)}</span></div>`).join('')}
            <div class="chain-decision"><b>策略：</b>不要每天全部做热点。按 30% 热点 / 30% 专业 / 20% 人设 / 10% 商业 / 10% 实验 建立内容组合，比例随账号数据动态调整。</div>
          </div>
        </div>
      </div>`;
  }

  C.views.business = { render };
})(typeof window !== 'undefined' ? window : globalThis);
