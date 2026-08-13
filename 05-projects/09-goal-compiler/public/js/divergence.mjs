/**
 * divergence.mjs — 需求发散式分析引擎（思维链「场景化 + 发散」）
 * 针对具体需求（对象/领域/意图）生成：
 *  推荐添加的功能 / 可扩展场景 / 潜在用户变体 / 落地建议与边界
 * 纯函数，可测试。
 */
import { _internal } from './compiler/analyzer.mjs';

const { DOMAIN_SUGGESTIONS } = _internal;

const SCENARIO_MAP = {
  '软件/产品': ['网页端 → 小程序/App 多端形态', '团队版/企业版协作', '开放 API 与插件生态', '模板市场/预设场景', '数据看板与报表'],
  '数据/AI': ['自动化报表定时推送', '异常预警与告警', '多数据源融合', 'AI 问答式交互', '模型评测与迭代闭环'],
  '内容/创作': ['多平台一键分发', '协作审稿与版本管理', '素材库与版权管理', '阅读/播放数据分析', 'AI 选题与润色'],
  '学习/成长': ['打卡与激励机制', '社群共学小组', '阶段性测评报告', 'AI 教练式对话', '学习数据可视化'],
  '商业/创业': ['定价与付费实验', '渠道分发矩阵', 'MVP 快速迭代', '投资人/汇报材料', '成本与现金流看板'],
  '运营/增长': ['用户分层与标签', '自动化用户旅程', '裂变与活动工具', '实时数据看板', 'A/B 实验平台'],
  '效率/自动化': ['定时任务与调度', '异常告警与人工兜底', '与主流工具链集成', '移动端/IM 通知', '执行日志与审计'],
  '硬件/IoT': ['固件 OTA 升级', '设备远程诊断', '多设备联动', '能耗与状态看板', '售后工单系统'],
  '设计/体验': ['设计规范组件库', '用户研究与可用性测试', '跨端一致性', '无障碍与国际化', '设计评审工作流'],
  '通用/未分类': ['商业化与定价', '多语言国际化', '开放 API', '数据埋点与分析', '用户反馈闭环'],
};

const VARIANT_MAP = {
  '软件/产品': ['个人版 / 团队版 / 企业版分层', '行业定制版（按垂直行业）', '开源版引流 + Pro 版变现'],
  '数据/AI': ['分析师自助版 / 决策者简报版', '数据提供方合作模式', '白标/私有化部署'],
  '内容/创作': ['个人创作者版 / 机构协作版', '内容电商/知识付费变体', '多语言内容变体'],
  '学习/成长': ['求职者版 / 在职提升版 / 教师班级版', '企业培训版', '家长/学员双端'],
  '商业/创业': ['SaaS 订阅版 / 咨询交付版', '面向投资人的演示版', '本地化区域版'],
  '运营/增长': ['小微团队版 / 增长中台版', '电商/教育/工具行业模板', '代理/服务商版'],
  '效率/自动化': ['个人效率版 / 团队自动化版', '行业工作流模板（财务/HR/客服）', 'API 嵌入第三方产品'],
  '通用/未分类': ['免费版 / 专业版 / 企业版', '多语言与多地区版本', '开放平台/开发者版'],
};

const PITFALLS = [
  '范围蔓延：只做与核心目标强相关的扩展，其余进 P2/P3',
  '过度设计：先用最简形态验证，再逐项加功能',
  '数据合规：涉及用户/财务/医疗数据时先做隐私与安全评估',
  '维护成本：每个新功能都是长期负债，评估投入产出',
  '依赖锁定：避免绑定单一供应商，预留替换路径',
];

export function buildDivergence(analysis) {
  const { entities, domains, intent, keywords } = analysis;
  const subject = entities.object || '目标对象';
  const domain = domains.primary;
  const domainName = domain;

  const features = (DOMAIN_SUGGESTIONS[domainName] || []).slice(0, 6).map((s) => ({
    tag: '推荐功能',
    title: s,
    detail: `针对「${subject}」（${domainName} · ${intent.label}），建议补充：${s}。纳入 P1/P2 规划，先完成 P0 核心闭环再评估。`,
  }));

  const scenarios = (SCENARIO_MAP[domainName] || SCENARIO_MAP['通用/未分类']).slice(0, 5).map((s) => ({
    tag: '扩展场景',
    title: s,
    detail: `「${subject}」可延伸的应用场景：${s}。评估用户需求强度与实现成本后决定是否纳入路线图。`,
  }));

  const variants = (VARIANT_MAP[domainName] || VARIANT_MAP['通用/未分类']).slice(0, 4).map((s) => ({
    tag: '用户变体',
    title: s,
    detail: `「${subject}」面向不同人群的变体：${s}。用于扩展目标用户边界或寻找更高付费意愿的细分市场。`,
  }));

  const pitfalls = PITFALLS.map((s, i) => ({
    tag: '边界提醒',
    title: s.split('：')[0],
    detail: s,
  }));

  const summary = `针对「${subject}」的发散式分析：${domainName}场景下推荐补充 ${features.length} 项功能、可扩展 ${scenarios.length} 类场景、覆盖 ${variants.length} 类用户变体，并给出 ${pitfalls.length} 条边界提醒。建议：P0 聚焦核心闭环，从「${features[0] ? features[0].title : '核心功能'}」开始逐步扩展。`;

  return { subject, domain: domainName, intent: intent.label, features, scenarios, variants, pitfalls, summary };
}

export default { buildDivergence };
