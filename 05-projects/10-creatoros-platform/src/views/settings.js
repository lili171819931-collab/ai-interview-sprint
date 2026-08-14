/* ============ 视图：配置中心 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const crawl = C.crawler, app = C.app;
  const esc = app.esc, badge = app.badge;

  function render(el) {
    const providers = [
      ['LLMProvider', 'AI 生成（文案/脚本/顾问）', '接口预留 · 规则引擎替代中', 'OpenAI / Claude / Gemini（Model Router）', 'warn'],
      ['HotTopicProvider', '实时热点（全球+国内）', '未接入 · 快照数据', '搜索趋势 / 平台榜单 / RSS / Streaming', 'muted'],
      ['DataProvider', '平台数据', '未接入', '各平台开放平台 API', 'muted'],
      ['PlatformAdapter', '一键发布（6 平台）', '未接入 · 模拟状态', 'TikTok/Instagram/YouTube/抖音/小红书/视频号 OAuth', 'muted'],
      ['VideoProvider', 'AI 视频/数字人', '未接入', '腾讯智影 / Runway / 剪映开放能力', 'muted'],
      ['ImageProvider', 'AI 图片/封面', '未接入', 'SD / DALL·E / 稿定', 'muted'],
      ['VoiceProvider', 'AI 配音', '未接入', 'TTS 服务', 'muted'],
      ['KnowledgeProvider', 'Creator Brain RAG', '未接入', '向量库 + Embedding', 'muted'],
    ];
    const adapters = [
      ['TikTokAdapter', 'TikTok', 'Mock', '官方 API / 合规第三方'],
      ['InstagramAdapter', 'Instagram/Reels', 'Mock', 'Graph API'],
      ['YouTubeAdapter', 'YouTube/Shorts', 'Mock', 'YouTube Data API v3'],
      ['DouyinAdapter', '抖音', 'Mock', '开放平台 API'],
      ['XiaohongshuAdapter', '小红书', 'Mock', '开放平台 API'],
      ['WechatVideoAdapter', '视频号', 'Mock', '微信开放平台'],
      ['BilibiliAdapter', 'B站', 'Mock', '开放平台 API'],
    ];
    const router = [
      ['标题/标签/改写', '低成本模型（如 mini）', '低', '缓存 + 批量'],
      ['文案/脚本生成', '中成本模型', '中', 'Prompt 模板 + 缓存'],
      ['暴力拆解/复盘/战略', '高能力模型', '高', '重试 + Fallback'],
      ['Embedding', 'Embedding 模型', '低', '批量 + 缓存'],
      ['视频/图像', '视频/图像模型', '高', '额度控制'],
    ];
    const quota = [
      ['今日 AI 调用', '128 次', '限额 300 · 42%'],
      ['本月 Token', '86 万', '预算 300 万 · 29%'],
      ['本月估算成本', '¥ 42.5', '预算 ¥200'],
      ['缓存命中率', '38%', '目标 ≥50%'],
    ];

    el.innerHTML = `
      <div class="view-title">⚙️ 配置中心</div>
      <div class="view-desc">Provider Adapter 体系 · Model Router · 额度计量 · 数据信任 —— 为真实商业化 SaaS 预留的配置骨架。</div>

      <div class="grid g4 mb-16">
        ${quota.map(([k, v, d]) => `<div class="kpi"><div class="k-label">${esc(k)}</div><div class="k-value" style="font-size:18px">${esc(v)}</div><div class="k-delta text-3">${esc(d)}</div></div>`).join('')}
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">🔌 Provider Adapter（外部能力接入层）</div><div class="card-sub">一切外部能力走 Adapter，可无痛替换 · 数据真实性四态：真实/快照/Mock/未接入</div></div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Provider</th><th>能力</th><th>状态</th><th>接入方式</th></tr></thead>
          <tbody>${providers.map(([n, cap, st, way, tone]) => `
            <tr><td class="b mono">${esc(n)}</td><td>${esc(cap)}</td><td>${badge(st, tone)}</td><td class="small text-2">${esc(way)}</td></tr>`).join('')}
        </tbody></table></div>
      </div>

      <div class="grid g2">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🧭 Model Router（AI 成本控制）</div></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>任务类型</th><th>推荐模型档</th><th>成本</th><th>策略</th></tr></thead>
            <tbody>${router.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num">${esc(r[2])}</td><td class="small">${esc(r[3])}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🛡️ Compliance Center · 版权与合规（一级能力）</div><div class="card-sub">高风险不直接发布 → Risk Alert</div></div>
          <div class="card-body">
            <div class="list-item"><div class="grow"><div class="b">版权 / 素材授权 / 音乐版权</div><div class="small text-2 mt-8">生成素材自动记录授权来源（AssetLicense）</div></div>${badge('已启用', 'success')}</div>
            <div class="list-item"><div class="grow"><div class="b">Content Quality Score</div><div class="small text-2 mt-8">Hook/价值/逻辑/原创度/可传播/平台适配/视觉/商业 → 发布前评分</div></div>${badge('89/100', 'primary')}</div>
            <div class="list-item"><div class="grow"><div class="b">Pre-Publish Check</div><div class="small text-2 mt-8">标题/封面/文案/视频/字幕/音乐/版权/敏感词/平台规范/CTA 一键检查</div></div>${badge('已启用', 'success')}</div>
            <div class="list-item"><div class="grow"><div class="b">AI 内容风险</div><div class="small text-2 mt-8">Copyright / Similarity / Brand / Platform / Sensitive · Low/Medium/High</div></div>${badge('Medium', 'warn')}</div>
            <div class="list-item"><div class="grow"><div class="b">用户数据导出/删除</div><div class="small text-2 mt-8">个保法 / GDPR 兼容设计（P1 实现）</div></div>${badge('规划中', 'warn')}</div>
            <div class="list-item"><div class="grow"><div class="b">AI 调用可追溯</div><div class="small text-2 mt-8">记录 Prompt / 模型 / 版本 / 成本（接口就绪）</div></div>${badge('接口就绪', 'primary')}</div>
          </div>
        </div>
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🔌 Platform Adapter（6 平台发布/数据）</div></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>Adapter</th><th>平台</th><th>状态</th><th>接入方式</th></tr></thead>
            <tbody>${adapters.map(([n, pl, st, way]) => `<tr><td class="mono b">${esc(n)}</td><td>${esc(pl)}</td><td>${badge(st, 'warn')}</td><td class="small text-2">${esc(way)}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><div class="card-title">🧭 演进路线</div></div>
        <div class="card-body">
          <div class="steps">
            ${['Tool（本期）', 'Assistant（P1）', 'Agent（P2）', 'Autonomous Creator（远期）'].map((s, i) => `<span class="step-pill ${i === 0 ? 'done' : 'wait'}">${esc(s)}</span>`).join(' <span class="text-3">→</span> ')}
          </div>
          <div class="small text-3">人从「亲自做每一步」→「定义目标 + 关键决策 + 审核结果」。</div>
        </div>
      </div>`;
  }

  C.views.settings = { render };
})(typeof window !== 'undefined' ? window : globalThis);
