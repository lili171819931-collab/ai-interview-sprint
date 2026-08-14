/* CreatorOS 3 个核心测试用例（与浏览器「测试中心」视图共用同一断言逻辑） */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const scoring = require('../src/lib/scoring.js');
const competitor = require('../src/lib/competitor.js');
const CP = require('../src/data/competitors.js');
const seed = require('../src/data/seed.js');

export const CASES = [
  {
    id: 'TC-01', name: '热点评分引擎', target: 'scoring.hotScore / hotBand / hotBadges',
    run() {
      const asserts = [];
      const a = (name, ok, detail) => asserts.push({ name, ok, detail });
      const topics = seed.hotTopics.map((t) => ({ ...t, score: scoring.hotScore(t) }));
      a('分数均在 0-100', topics.every((t) => t.score >= 0 && t.score <= 100), `min=${Math.min(...topics.map((t) => t.score))} max=${Math.max(...topics.map((t) => t.score))}`);
      const sorted = topics.slice().sort((x, y) => y.score - x.score);
      a('高热度样本排序正确', sorted[0].id === 'ht01' && sorted[0].score >= sorted[1].score, `${sorted[0].title}(${sorted[0].score}) > ${sorted[1].title}(${sorted[1].score})`);
      a('92 分归类为爆发中', scoring.hotBand(92).key === 'burst', scoring.hotBand(92).label);
      a('45 分归类为建议观察', scoring.hotBand(45).key === 'observe', scoring.hotBand(45).label);
      const badges = scoring.hotBadges(topics[0]);
      a('高竞争/高商业触发徽章', badges.some((b) => b.label.includes('高竞争')) || badges.some((b) => b.label.includes('商业价值高')), badges.map((b) => b.label).join(' | ') || '无徽章');
      return asserts;
    },
  },
  {
    id: 'TC-02', name: '选题评分引擎', target: 'scoring.topicScore',
    run() {
      const asserts = [];
      const a = (name, ok, detail) => asserts.push({ name, ok, detail });
      const scored = seed.topics.map((t) => ({ ...t, res: scoring.topicScore(t) }));
      a('评分均在 0-100', scored.every((t) => t.res.score >= 0 && t.res.score <= 100), `范围 ${Math.min(...scored.map((t) => t.res.score))}-${Math.max(...scored.map((t) => t.res.score))}`);
      a('存在推荐制作选题', scored.some((t) => t.res.recommend), `推荐 ${scored.filter((t) => t.res.recommend).length}/${scored.length}`);
      const rec = scored.filter((t) => t.res.recommend);
      a('推荐选题得分均 ≥80', rec.every((t) => t.res.score >= 80), rec.length ? `最低 ${Math.min(...rec.map((t) => t.res.score))}` : '无推荐样本');
      a('高难度选题不误判为推荐', !scoring.topicScore({ hotness: 90, demand: 90, virality: 90, differentiation: 90, competition: 90, businessValue: 90, difficulty: 95 }).recommend, '难度 95 时评分被压制');
      a('S 级优先级仅对 ≥85 生效', scored.filter((t) => t.res.priority === 'S').every((t) => t.res.score >= 85), `S 级 ${scored.filter((t) => t.res.priority === 'S').length} 条`);
      return asserts;
    },
  },
  {
    id: 'TC-03', name: '竞品分析引擎', target: 'competitor.coverageScore / gapAnalysis / positioning / directorReport',
    run() {
      const asserts = [];
      const a = (name, ok, detail) => asserts.push({ name, ok, detail });
      const report = competitor.directorReport(CP.competitors, CP.FEATURE_KEYS, CP.market);
      a('覆盖率均在 0-100', CP.competitors.every((c) => { const v = competitor.coverageScore(c, CP.FEATURE_KEYS); return v >= 0 && v <= 100; }), `样本 ${CP.competitors.length}`);
      a('识别出高空白能力', report.openGaps.length >= 3, `空白带 ${report.openGaps.length} 项：${report.openGaps.slice(0, 3).map((g) => g.key).join('/')}`);
      a('定位象限覆盖 4 类', new Set(report.positions.map((p) => p.quad)).size >= 3, [...new Set(report.positions.map((p) => p.quad))].join(' / '));
      a('战略报告含 4 条策略', report.strategy.length === 4, `策略：${report.strategy.map((s) => s.title).join(' / ')}`);
      a('SWOT 结构完整', Array.isArray(report.swot.strengths) && Array.isArray(report.swot.threats) && report.swot.opportunities.length > 0, `机会 ${report.swot.opportunities.length} · 威胁 ${report.swot.threats.length}`);
      return asserts;
    },
  },
];
