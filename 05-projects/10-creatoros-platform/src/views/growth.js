/* ============ 视图：增长系统 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  const AGENTS_V2 = [
    { name: 'Trend Agent', role: '热点监测/趋势识别', status: '在线', metrics: '全球+国内 46 热点' },
    { name: 'Competitor Agent', role: '竞品账号监控', status: '在线', metrics: '监控 8 账号' },
    { name: 'Viral Analysis Agent', role: '爆款拆解/规律提取', status: '在线', metrics: '拆解 6 爆款' },
    { name: 'Topic Agent', role: '选题生成/评分', status: '在线', metrics: '生成 12 选题' },
    { name: 'Copy Agent', role: '中英文文案/Hook', status: '在线', metrics: '6 篇 + 变体 18' },
    { name: 'Script Agent', role: '脚本/分镜', status: '在线', metrics: '脚本 3 条' },
    { name: 'Creative Agent', role: '创意/原创度守卫', status: '在线', metrics: 'Originality Guard' },
    { name: 'Video Agent', role: '视频/剪辑/字幕', status: 'Mock', metrics: 'Adapter 待接入' },
    { name: 'Publishing Agent', role: '平台适配/排期/发布', status: '在线', metrics: '6 平台排期' },
    { name: 'Analytics Agent', role: '数据回收/归因', status: '在线', metrics: '复盘 3 条' },
    { name: 'Business Agent', role: '商业机会/品牌合作', status: '在线', metrics: '机会 4 · 合作 5' },
    { name: 'Growth Agent', role: '增长策略/综合决策', status: '在线', metrics: '今日建议 3 条' },
  ];

  function render(el) {
    const pipeline = ['Trend', 'Competitor', 'Viral', 'Topic', 'Copy', 'Script', 'Creative', 'Video', 'Publishing', 'Analytics', 'Business', 'Growth'];

    el.innerHTML = `
      <div class="view-title">📈 增长系统</div>
      <div class="view-desc">AI Agent 体系 · Creator Orchestrator 统一调度 · 工作流 —— 从 Tool 到 Assistant 到 Autonomous Creator。</div>

      <div class="card">
        <div class="card-head"><div class="card-title">🤖 AI Agent 体系（12 Agent + Orchestrator）</div><div class="card-sub">Creator Orchestrator 统一调度 · 用户只需「设定目标 + 审核结果」</div></div>
        <div class="card-body">
          <div class="chain-decision"><b>🎛 Creator Orchestrator：</b>输入「帮我找今天适合我的 3 个爆款选题，并直接生成其中一个的视频」→ 自动执行 热点→筛选→竞品→选题→文案→脚本→素材→视频→审核，最终只需你确认。</div>
          <div class="steps mb-12" style="margin-top:12px">
            ${pipeline.map((p, i) => `<span class="step-pill done">${esc(p)}</span>${i < pipeline.length - 1 ? '<span class="text-3">→</span>' : ''}`).join('')}
          </div>
          <div class="grid g3">
            ${AGENTS_V2.map((a) => `
              <div class="kpi" style="margin:0">
                <div class="row spread"><div class="b">${esc(a.name)}</div>
                ${badge(a.status === '在线' ? '在线' : 'Mock', a.status === '在线' ? 'success' : 'warn')}</div>
                <div class="small text-2 mt-8">${esc(a.role)}</div>
                <div class="small text-3 mt-8">${esc(a.metrics)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="grid g3">
        ${S.workflows.map((w) => `
          <div class="card" style="margin:0">
            <div class="card-head"><div class="card-title">⚙️ ${esc(w.name)}</div>${badge(w.status === '已启用' ? '已启用' : 'Mock', w.status === '已启用' ? 'success' : 'warn')}</div>
            <div class="card-body">
              <div class="small text-3 mb-8">Trigger：${esc(w.trigger)} · 运行 ${w.runs} 次</div>
              <div class="steps">${w.steps.map((s) => `<span class="step-pill done">${esc(s)}</span>`).join('')}</div>
              <div class="mt-8"><button class="btn sm" data-run-wf="${esc(w.name)}">▶ 运行一次</button></div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card mt-16">
        <div class="card-head"><div class="card-title">📚 Creator Knowledge Base</div><div class="card-sub">AI 创作时自动调用的私有知识</div></div>
        <div class="card-body">
          <div class="grid g4">
            ${[['品牌资料','品牌色/字体/Logo/表达规范'], ['个人经历','我的身份/经历/观点/案例'], ['行业知识','赛道术语/数据/方法论'], ['用户画像','目标用户/需求/痛点'],
               ['爆款案例','历史爆款/公式/复盘'], ['竞品资料','竞品账号/内容/策略'], ['历史内容','文案/脚本/视频资产'], ['禁用词','广告法极限词/平台敏感词']].map(([k, v]) => `
              <div class="kpi" style="margin:0"><div class="k-label">${esc(k)}</div><div class="small text-2" style="font-size:11.5px">${esc(v)}</div>
              <div class="mt-8"><span class="chip">${Math.floor(Math.random() * 20) + 8} 条</span></div></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-head"><div class="card-title">🧠 个人 IP 大脑（愿景）</div><div class="card-sub">AI 越来越像我，而不是我越来越像 AI</div></div>
        <div class="card-body">
          <div class="chain-decision"><b>Autonomous Creator 演进路径：</b>Tool（单点工具）→ Assistant（主动建议）→ Agent（自动执行）→ Autonomous Creator（人只做「定义目标 + 关键决策 + 审核结果」）。</div>
          <div class="small text-3 mt-8">本期已实现 Agent 团队与工作流的「编排视图 + 规则引擎」；LLM/执行层接入后自动升级为真正自主运行。</div>
        </div>
      </div>`;

    el.querySelectorAll('[data-run-wf]').forEach((b) => b.addEventListener('click', () => {
      b.disabled = true; b.textContent = '⏳ 运行中…';
      setTimeout(() => { b.disabled = false; b.textContent = '▶ 运行一次'; app.toast(`工作流「${b.dataset.runWf}」已执行（Demo）`); }, 900);
    }));
  }

  C.views.growth = { render };
})(typeof window !== 'undefined' ? window : globalThis);
