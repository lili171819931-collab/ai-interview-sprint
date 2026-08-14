/* ============================================================
 * CreatorOS 评分引擎（纯函数 · 浏览器 / Node 共用）
 * Hot Score · Topic Score · 频段/徽章 判定
 * ============================================================ */
(function (global) {
  'use strict';

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const round1 = (v) => Math.round(v * 10) / 10;

  /* ---------- Hot Score ----------
   * 基础分 = Σ(信号×权重)（权重和=1，满分 100）
   * 惩罚 = 竞争×0.15 + 生命周期风险×0.10（竞争/风险越高，得分越保守） */
  const HOT_WEIGHTS = {
    heat: 0.20, growth: 0.20, discussion: 0.10, virality: 0.10,
    attention: 0.10, relevance: 0.15, businessValue: 0.15,
  };
  const HOT_COMPETITION_PENALTY = 0.15;
  const HOT_RISK_PENALTY = 0.10;

  function hotScore(topic) {
    const base = Object.keys(HOT_WEIGHTS).reduce((sum, k) => {
      const v = Number(topic[k] ?? 0);
      return sum + clamp(v, 0, 100) * HOT_WEIGHTS[k];
    }, 0);
    const competition = clamp(Number(topic.competition ?? 0), 0, 100);
    const risk = clamp(Number(topic.lifecycleRisk ?? 0), 0, 100);
    const score = round1(clamp(base - competition * HOT_COMPETITION_PENALTY - risk * HOT_RISK_PENALTY, 0, 100));
    return score;
  }

  function hotBand(score) {
    if (score >= 85) return { key: 'burst', label: '🔥 爆发中', tone: 'danger' };
    if (score >= 70) return { key: 'grow', label: '📈 快速增长', tone: 'success' };
    if (score >= 55) return { key: 'watch', label: '👀 值得追踪', tone: 'info' };
    if (score >= 40) return { key: 'observe', label: '🔭 建议观察', tone: 'warn' };
    return { key: 'low', label: '⚪ 低优先级', tone: 'muted' };
  }

  function hotBadges(topic) {
    const badges = [];
    if (Number(topic.competition ?? 0) >= 75) badges.push({ label: '⚠️ 高竞争', tone: 'warn' });
    if (Number(topic.businessValue ?? 0) >= 80) badges.push({ label: '💰 商业价值高', tone: 'success' });
    if (Number(topic.growth ?? 0) >= 80) badges.push({ label: '🚀 增速极快', tone: 'danger' });
    if (Number(topic.lifecycle ?? 0) >= 3) badges.push({ label: '⏳ 长生命周期', tone: 'info' });
    return badges;
  }

  /* ---------- Topic Score（7 维加权 · 竞争与难度取反向） ---------- */
  const TOPIC_WEIGHTS = {
    hotness: 0.22, demand: 0.20, virality: 0.18, differentiation: 0.12,
    competition: 0.04, businessValue: 0.12, difficulty: 0.12,
  };

  function topicScore(topic) {
    const mapped = {
      hotness: topic.hotness, demand: topic.demand, virality: topic.virality,
      differentiation: topic.differentiation,
      competition: 100 - topic.competition,
      businessValue: topic.businessValue,
      difficulty: 100 - topic.difficulty,
    };
    const score = round1(clamp(
      Object.keys(TOPIC_WEIGHTS).reduce((s, k) => s + clamp(Number(mapped[k] ?? 0), 0, 100) * TOPIC_WEIGHTS[k], 0),
      0, 100
    ));
    const recommend = score >= 80;
    const priority = score >= 85 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C';
    return { score, recommend, priority };
  }

  /* ---------- 通用格式化 ---------- */
  function fmt(n) {
    n = Number(n || 0);
    if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
    return String(n);
  }
  function pct(n) { return Math.round(Number(n || 0)) + '%'; }

  const api = { clamp, round1, hotScore, hotBand, hotBadges, topicScore, fmt, pct, HOT_WEIGHTS, TOPIC_WEIGHTS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CreatorOS = global.CreatorOS || {};
  global.CreatorOS.scoring = api;
})(typeof window !== 'undefined' ? window : globalThis);
