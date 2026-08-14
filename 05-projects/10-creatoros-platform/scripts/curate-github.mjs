/* 从 data/github-similar-projects.json 筛选相关项目 → src/data/github-live.js（浏览器内嵌） */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(path.join(ROOT, 'data/github-similar-projects.json'), 'utf8'));

/* 人工筛选：与 CreatorOS 功能高度相关的项目（含匹配能力标签） */
const RELEVANT = {
  'easychen/opc-methodology': { rel: 'high', match: '一人企业/自媒体副业方法论', cap: ['战略','知识库'] },
  'dreammis/social-auto-upload': { rel: 'high', match: '多平台自动发布（抖音/小红书/视频号/TikTok/YouTube/B站）', cap: ['发布中心','PlatformAdapter'] },
  'chatfire-AI/huobao-drama': { rel: 'high', match: 'AI 一站式短剧生成（剧本→成片）', cap: ['AI内容工厂','AI视频'] },
  'HBAI-Ltd/Toonflow-app': { rel: 'high', match: '开源 AI 短剧创作（AI编剧/分镜/角色/动画）', cap: ['AI视频','分镜','素材'] },
  'TeamWiseFlow/xiaobei': { rel: 'high', match: '自媒体获客智能体（OPC/中小微企业）', cap: ['Agent','获客'] },
  'Anil-matcha/AI-Youtube-Shorts-Generator': { rel: 'high', match: 'AI YouTube Shorts 生成（Opus Clip 开源替代）', cap: ['内容再利用','AI视频'] },
  'OStudi/short-video-generator-AI': { rel: 'high', match: 'YouTube 视频转 AI 短视频', cap: ['内容再利用','AI剪辑'] },
  'xixihhhh/clipforge': { rel: 'high', match: 'AI 带货短视频（商品图→成片）', cap: ['AI视频','电商带货'] },
  'Anil-matcha/Open-AI-Micro-Drama-Generator': { rel: 'high', match: 'AI 微短剧生成', cap: ['AI视频','剧本'] },
  'ayrshare/social-media-api': { rel: 'high', match: '社媒发布+分析 API（多平台）', cap: ['发布中心','PlatformAdapter'] },
  'AgriciDaniel/claude-repurpose': { rel: 'high', match: 'Claude 内容再利用引擎（1 内容→多形态）', cap: ['内容再利用','Repurpose'] },
  'davide97l/ai-video-generator': { rel: 'high', match: 'AI agent 自动生成并发布短视频', cap: ['Agent','AI视频','发布'] },
  'yubowen123/AIYOU_open-ai-video-drama-generator': { rel: 'high', match: 'AI 短剧平台（36 天 VibeCoding）', cap: ['AI视频','剧本'] },
  'AOSSIE-Org/InPactAI': { rel: 'high', match: '开源 AI 影响者营销平台（品牌↔创作者）', cap: ['商业机会','BrandDeals'] },
  'mkz0930/douyin-viral-analysis': { rel: 'high', match: '抖音爆款视频分析系统（数据驱动爆款建议）', cap: ['爆款分析','暴力拆解'] },
  'social-media-skills/skills': { rel: 'high', match: '106 个社媒 AI Agent Skills（战略/写作/视频）', cap: ['Skills生态','Agent'] },
  'sharon-laicc/viral-video-decomposer': { rel: 'high', match: '爆款短视频拆解 Skill（镜头级拉片/爆款机制/AI 生产蓝图）', cap: ['暴力拆解','爆款库'] },
  'Upload-Post/viraloop': { rel: 'med', match: 'OpenClaw agent skill 自动 TikTok/Instagram 内容', cap: ['Agent','海外平台'] },
  'leamsigc/ShortsGenerator': { rel: 'med', match: 'Shorts 内容本地自动化', cap: ['内容再利用'] },
  'SaarD00/AI-Youtube-Shorts-Generator': { rel: 'med', match: '全自动 Shorts 工厂（零手动编辑）', cap: ['内容再利用','AI视频'] },
  'nexscope-ai/eCommerce-Skills': { rel: 'med', match: 'AI Agent 电商技能（产品研究/营销）', cap: ['Skills生态','商业'] },
  'AOSSIE-Org/InPactAI': { rel: 'med', match: '影响者营销', cap: ['BrandDeals'] },
  'RianNegreiros/AiShortsVideosGenerator': { rel: 'med', match: 'ASP.NET+Next.js AI Shorts 生成', cap: ['AI视频'] },
  'nicknochnack/TikTokAnalytics': { rel: 'med', match: 'TikTok 数据分析', cap: ['数据中心','海外平台'] },
  'mvkro1/Social-Media-Analytics': { rel: 'med', match: '多平台互动指标追踪', cap: ['数据中心'] },
  'MerlinStacks/socaliseit': { rel: 'med', match: '社媒管理平台（多渠道）', cap: ['数据中心','发布'] },
  'keven798/NexusTik': { rel: 'med', match: 'TikTok AI 分析平台', cap: ['数据中心','海外平台'] },
  'Yacineooak/clippy-ai-agent': { rel: 'med', match: '长视频转短视频自主 Agent', cap: ['内容再利用','Agent'] },
  'el-frontend/video-wizard': { rel: 'med', match: 'AI 视频分析、爆款片段识别', cap: ['爆款分析'] },
  'ZOORO-NEW/qianjin-content-repurposer': { rel: 'med', match: '一篇文章→6 平台（AI 再利用引擎）', cap: ['多平台适配','Repurpose'] },
  'MuhammadTanveerAbbas/Repurpose': { rel: 'med', match: '视频再利用平台', cap: ['内容再利用'] },
  'meuwebsite/Stat-gram': { rel: 'med', match: 'Instagram 商业/影响者微服务', cap: ['数据中心','商业'] },
  'Dev-derah/simple-content-ai': { rel: 'med', match: '抓取 TikTok 等平台视频做 AI 内容', cap: ['竞品爬取','数据'] },
  'gdemos01/yttresearch-machine-learning-algorithms-analysis': { rel: 'med', match: 'YouTube 视频爆款预测（ML）', cap: ['爆款预测'] },
  'enzoemir1/autoflow-n8n-workflows': { rel: 'med', match: 'n8n 内容再利用自动化工作流', cap: ['工作流'] },
  'Frontiersugame/OpusClip-Pro-Plan-Unlimited': { rel: 'med', match: 'OpusClip Pro（长视频再利用）开源替代', cap: ['内容再利用'] },
  'dds14/nano': { rel: 'med', match: '影响者营销平台（品牌↔创作者）', cap: ['商业机会'] },
  'oagbolade/viralget': { rel: 'med', match: '影响者营销平台', cap: ['商业机会'] },
  'Mozellegambian177/kol-claw': { rel: 'med', match: 'KOL 定价与触达分析', cap: ['Creator Value'] },
  'udaysrinu/viral-video-analyzer': { rel: 'med', match: 'TikTok/Instagram 爆款逆向工程管线', cap: ['爆款分析'] },
  'BusyBee3333/viral-video-edit-skills': { rel: 'med', match: '卡点剪辑 Claude/Codex skills', cap: ['Skills生态','AI剪辑'] },
  'xAPIs-dev/YouTube-viral-video-analysis-tool': { rel: 'med', match: 'YouTube 官方 API 爆款查询工具', cap: ['爆款分析','海外平台'] },
  'pocat-dev/pocat-web': { rel: 'med', match: 'AI 视频剪辑前端', cap: ['AI剪辑'] },
};

const items = [];
for (const it of raw.items) {
  const meta = RELEVANT[it.id];
  if (!meta) continue;
  items.push({ ...it, relevance: meta.rel, match: meta.match, cap: meta.cap });
}
items.sort((a, b) => (a.relevance === b.relevance ? b.stars - a.stars : a.relevance === 'high' ? -1 : 1));

const payload = {
  crawledAt: raw.crawledAt,
  trust: 'live',
  source: 'GitHub Search API（真实联网抓取）',
  total: items.length,
  items,
};

const js = `/* 自动生成：真实联网爬取的 GitHub 相似项目（scripts/curate-github.mjs） */\n(function (global) {\n  'use strict';\n  const data = ${JSON.stringify(payload, null, 2)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = data;\n  global.CreatorOS = global.CreatorOS || {};\n  global.CreatorOS.githubLive = data;\n})(typeof window !== 'undefined' ? window : globalThis);\n`;
writeFileSync(path.join(ROOT, 'src/data/github-live.js'), js, 'utf8');
console.log(`✅ 已筛选 ${items.length} 个相关项目 → src/data/github-live.js`);
console.log(`   抓取时间：${payload.crawledAt}`);
