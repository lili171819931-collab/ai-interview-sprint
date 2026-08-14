/* ============ 视图：配置中心 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const crawl = C.crawler, app = C.app;
  const esc = app.esc, badge = app.badge;

  function render(el) {
    const providers = [
      ['LLMProvider', 'AI 生成（文案/脚本/顾问）', '接口预留 · 规则引擎替代中', 'OpenAI / Claude / Gemini（Model Router）', 'warn'],
      ['HotTopicProvider', '实时热点', '未接入 · 快照数据', '搜索趋势 / 平台榜单 / RSS', 'muted'],
      ['DataProvider', '平台数据', '未接入', '各平台开放平台 API', 'muted'],
      ['PublishProvider', '一键发布', '未接入 · 模拟状态', '各平台 OAuth 发布 API', 'muted'],
      ['VideoProvider', 'AI 视频/数字人', '未接入', '腾讯智影 / 剪映开放能力 / Runway', 'muted'],
      ['ImageProvider', 'AI 图片/封面', '未接入', 'SD / DALL·E / 稿定', 'muted'],
      ['VoiceProvider', 'AI 配音', '未接入', 'TTS 服务', 'muted'],
      ['KnowledgeProvider', '知识库 RAG', '未接入', '向量库 + Embedding', 'muted'],
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
        <div class="card" style="margin:0">
          <div class="card-head"><div class="card-title">🛡️ 数据信任与安全</div></div>
          <div class="card-body">
            <div class="list-item"><div class="grow"><div class="b">数据四态标注</div><div class="small text-2 mt-8">真实 / 快照 / Mock / 未接入 —— 全链路 UI 可见，禁止假装成功</div></div>${badge('已启用', 'success')}</div>
            <div class="list-item"><div class="grow"><div class="b">内容合规预检</div><div class="small text-2 mt-8">广告法极限词 / 平台敏感词 / 版权风险（P1 实现）</div></div>${badge('规划中', 'warn')}</div>
            <div class="list-item"><div class="grow"><div class="b">用户数据导出/删除</div><div class="small text-2 mt-8">个保法 / GDPR 兼容设计（P1 实现）</div></div>${badge('规划中', 'warn')}</div>
            <div class="list-item"><div class="grow"><div class="b">AI 调用可追溯</div><div class="small text-2 mt-8">记录 Prompt / 模型 / 版本 / 成本（接口就绪）</div></div>${badge('接口就绪', 'primary')}</div>
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
