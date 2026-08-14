/* ============================================================
 * CreatorOS 竞品分析引擎（纯函数 · 浏览器 / Node 共用）
 * 覆盖率 · 差距分析 · 定位象限 · 对比矩阵 · 产品总监战略报告
 * ============================================================ */
(function (global) {
  'use strict';

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function coverageScore(comp, featureKeys) {
    if (!featureKeys || !featureKeys.length) return 0;
    const supported = featureKeys.filter((f) => (comp.features || {})[f]).length;
    return Math.round((supported / featureKeys.length) * 100);
  }

  function compareMatrix(competitors, featureKeys) {
    return featureKeys.map((key) => {
      const row = { key, label: key, cells: {} };
      for (const c of competitors) {
        const v = (c.features || {})[key];
        row.cells[c.id] = v === true ? { v: '✓', cls: 'ok' } : v === false ? { v: '—', cls: 'no' } : { v: '◐', cls: 'part' };
      }
      return row;
    });
  }

  function gapAnalysis(competitors, featureKeys) {
    const n = competitors.length || 1;
    return featureKeys
      .map((key) => {
        const supported = competitors.filter((c) => (c.features || {})[key]).length;
        return { key, supported, ratio: supported / n, gap: 1 - supported / n };
      })
      .sort((a, b) => a.supported - b.supported);
  }

  /* 定位象限：x = 平台广度（多平台/多渠道 0-100），y = AI 智能深度（0-100） */
  function positioning(competitors) {
    return competitors.map((c) => {
      const x = clamp(Number(c.breadth ?? 50), 0, 100);
      const y = clamp(Number(c.aiDepth ?? 50), 0, 100);
      const quad =
        x >= 50 && y >= 50 ? '全能型增长 OS' :
        x >= 50 ? '渠道/分发平台' :
        y >= 50 ? 'AI 创作工具' : '单点效率工具';
      return { id: c.id, name: c.name, x, y, quad };
    });
  }

  function swot(comp, market) {
    return {
      strengths: comp.strengths || [],
      weaknesses: comp.weaknesses || [],
      opportunities: market.opportunities || [],
      threats: market.threats || [],
    };
  }

  /* 产品总监视角战略报告（确定性规则引擎，可测试） */
  function directorReport(competitors, featureKeys, market) {
    const matrix = compareMatrix(competitors, featureKeys);
    const gaps = gapAnalysis(competitors, featureKeys);
    const openGaps = gaps.filter((g) => g.supported <= Math.ceil(competitors.length * 0.3));
    const positions = positioning(competitors);
    const avgCoverage = competitors.length
      ? Math.round(competitors.reduce((s, c) => s + coverageScore(c, featureKeys), 0) / competitors.length)
      : 0;
    const leader = competitors.slice().sort((a, b) => coverageScore(b, featureKeys) - coverageScore(a, featureKeys))[0];

    const insights = [
      `市场样本 ${competitors.length} 个，平均功能覆盖率 ${avgCoverage}%，头部为「${leader ? leader.name : '—'}」（${coverageScore(leader, featureKeys)}%）。`,
      `最大空白带：${openGaps.slice(0, 3).map((g) => g.key).join('、') || '暂无'}（支持者 ≤${Math.ceil(competitors.length * 0.3)} 家），是差异化切入的确定性机会。`,
      `定位象限显示：全能型增长 OS 玩家较少，多数停留在「AI 创作工具」或「渠道分发平台」单点，缺少打通「热点→选题→创作→发布→复盘」闭环的产品。`,
    ];
    const strategy = [
      { title: '定位建议', body: `不做第 N 个 AI 写作工具。以「内容增长飞轮」为心智：数据→洞察→选题→创作→发布→复盘→反哺，做唯一把 5 个问题（今天做什么/对手在做什么/我该做什么/怎么做出来/效果如何）在一屏回答的增长 OS。` },
      { title: '差异化杠点', body: `优先补齐空白能力：${openGaps.slice(0, 4).map((g) => g.key).join(' / ') || '全链路数据打通'}，并叠加「完整思维链结构化输出」作为学习/信任型差异化（把黑盒 AI 决策变成可解释、可复用的方法论文档）。` },
      { title: '进入策略', body: `P0 垂直切片先跑通「热点→选题→文案→发布→复盘」最小闭环，用 Mock+Adapter 架构对外诚实标注数据状态；以「10 分钟产出 30 天增长计划」做新用户体验爆点，降低冷启动门槛。` },
      { title: '风险与对冲', body: `平台 API 政策不稳定 → 发布/数据层全部走 Provider Adapter；AI 成本不可控 → Model Router + 缓存 + Token 统计；竞品快速跟进 → 以账号数据+知识库+增长反馈沉淀 Creator Intelligence Graph 构建壁垒。` },
    ];

    return { gaps, openGaps, positions, matrix, avgCoverage, leader, insights, strategy, swot: swot(leader, market) };
  }

  const api = { clamp, coverageScore, compareMatrix, gapAnalysis, positioning, directorReport, swot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CreatorOS = global.CreatorOS || {};
  global.CreatorOS.competitor = api;
})(typeof window !== 'undefined' ? window : globalThis);
