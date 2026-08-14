/* ============ 视图：Prompt 优化 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const md = C.renderMd, app = C.app;
  const esc = app.esc;

  let tab = 'compare';

  const ADDITIONS = [
    ['1', '完整思维链输出', '新增独立功能模块，结构化输出搭建产品的完整思维链条（问题→思考→备选→决策→产物→复盘），学习型差异化'],
    ['2', '竞品情报雷达', '多平台（GitHub/Awesome/导航站/Product Hunt/行业网站）爬取类似 Skill/产品，对比矩阵 + 产品总监战略报告'],
    ['3', '数据真实性强化', '真实/快照/Mock/未接入四态标注全链路落地，从原则变成可追溯机制'],
    ['4', '内容合规审核', '广告法极限词、平台敏感词、版权风险、强监管类目预检'],
    ['5', '平台政策风险管理', '数字人标识、营销内容报备、限流规则变化预警'],
    ['6', '用户数据安全', '加密/导出/删除权、个保法与 GDPR 兼容设计'],
    ['7', '商业化体系细化', '五档定价、计费维度、额度计量、成本控制、留存指标'],
    ['8', '技术架构增强', '可观测性、灰度/A-B、Skill/MCP 兼容、浏览器插件、多端预留'],
    ['9', '决策日志机制', '产品决策自动追加为思维链节点，让系统自己长出方法论'],
    ['10', '工作流可观测', '运行记录/成本/重跑/回滚'],
    ['11', '平台原生适配矩阵', '一个内容多平台原生改写的工程化方案'],
    ['12', '项目制交付', '产品分析→项目管理→开发测试→商业价值→完成报告→GitHub 打包'],
    ['13', '测试体系', '核心引擎可运行测试用例 + 浏览器端测试中心'],
    ['14', '热点去重与可信度', '跨平台同事件合并，来源可信度标注'],
  ];

  function render(el) {
    el.innerHTML = `
      <div class="view-title">📝 Prompt 优化（自动补充说明）</div>
      <div class="view-desc">基于原始「AI 自媒体全平台增长操作系统」诉求，自动补充未考虑到的方向与功能，形成可直接复投的增强版 Prompt。</div>
      <div class="tabs">
        <div class="tab ${tab === 'compare' ? 'active' : ''}" data-tab="compare">🧾 补充对照清单（14 项）</div>
        <div class="tab ${tab === 'full' ? 'active' : ''}" data-tab="full">📄 优化版全文</div>
        <div class="tab ${tab === 'original' ? 'active' : ''}" data-tab="original">📜 原始需求摘要</div>
      </div>
      <div id="pm-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; render(el); }));
    const body = el.querySelector('#pm-body');

    if (tab === 'compare') {
      body.innerHTML = `
        <div class="card">
          <div class="card-head"><div class="card-title">本次自动补充的方向与功能</div>
            <div class="grow"></div>
            <button class="btn sm" id="pm-dl">⬇ 下载优化版 Prompt</button></div>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>#</th><th>补充方向</th><th>补充内容</th></tr></thead>
            <tbody>${ADDITIONS.map(([n, k, v]) => `<tr><td class="num b">${n}</td><td class="b">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="chain-decision"><b>一句话总结：</b>原始 Prompt 强在「产品深度」，本次补充补齐「学习传播（思维链）、市场感知（竞品雷达）、合规安全、商业化工程、项目管理交付」五个短板。</div>`;
      body.querySelector('#pm-dl').addEventListener('click', async () => {
        try {
          const res = await fetch('docs/05-优化版Prompt.md');
          const text = await res.text();
          const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'CreatorOS-优化版Prompt.md'; a.click();
          URL.revokeObjectURL(a.href);
          app.toast('优化版 Prompt 已下载');
        } catch (_) { app.toast('请通过 npm start 访问后下载'); }
      });
    } else if (tab === 'full') {
      body.innerHTML = '<div class="loading">加载中…</div>';
      fetch('docs/05-优化版Prompt.md')
        .then((r) => r.text())
        .then((t) => { body.innerHTML = '<div class="card"><div class="card-body doc">' + md.render(t) + '</div></div>'; })
        .catch(() => { body.innerHTML = '<div class="alert warn"><span class="a-ico">⚠️</span><div>请运行 <code class="mono">npm start</code> 后查看；原始文件：<code class="mono">docs/05-优化版Prompt.md</code></div></div>'; });
    } else {
      body.innerHTML = `
        <div class="card"><div class="card-body doc">
          <h2>原始需求摘要（关键骨架）</h2>
          <ul>
            <li><b>产品</b>：AI 自媒体全平台增长操作系统（CreatorOS），可演进为商业 SaaS</li>
            <li><b>核心公式</b>：热点→趋势→赛道→账号→竞品→爆款拆解→选题→策略→文案→脚本→视觉→素材→制作→审核→多平台适配→发布→数据→复盘→反哺</li>
            <li><b>飞轮</b>：数据→洞察→选题→创作→发布→数据→复盘→策略优化→下一轮</li>
            <li><b>信息架构</b>：22 个一级模块（Dashboard…设置）</li>
            <li><b>差异化</b>：一键暴力拆解 / 爆款公式 / 对标矩阵 / AI Agent 团队 / 工作流 / 知识库 / 个人 IP 大脑</li>
            <li><b>原则</b>：先闭环再堆功能；AI 是核心不是装饰；数据打通；诚实（禁止假数据/假成功）</li>
            <li><b>验收</b>：进入→建号→选赛道→热点→竞品→拆解→选题→文案→脚本→内容→发布→数据→AI 复盘→下一轮建议</li>
          </ul>
          <h2>原始需求的关键缺失（本次已补）</h2>
          <ul>
            <li>❌ 没有「让用户学会搭建过程」的能力 → 补：完整思维链结构化输出</li>
            <li>❌ 没有「持续感知外部 Skill 生态」的能力 → 补：竞品情报雷达</li>
            <li>❌ 没有合规/安全/平台政策风险 → 补：合规审核与政策预警</li>
            <li>❌ 商业化只提了定价档位，缺计量/留存/成本工程 → 补：额度计量与成本控制</li>
            <li>❌ 没有可观测性/灰度/插件生态 → 补：技术架构增强</li>
            <li>❌ 没有项目制交付要求 → 补：全项目流程管理与打包上传</li>
          </ul>
        </div></div>`;
    }
  }

  C.views.prompts = { render };
})(typeof window !== 'undefined' ? window : globalThis);
