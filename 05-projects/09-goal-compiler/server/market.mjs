/**
 * market.mjs — 模板市场数据聚合
 * 1) 内置模板（data/templates.json）
 * 2) 开源 GitHub 模板/技能集合（静态精选 + 实时 GitHub 搜索，best-effort）
 * 返回按分类组织的条目。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { githubSearch } from './crawler.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export function loadCuratedTemplates() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'data', 'templates.json'), 'utf8')).templates || [];
  } catch { return []; }
}

/** 已存有的开源 GitHub 类似项目（模板/技能/提示词集合） */
export const EXTERNAL_REPOS = [
  { id: 'ext-anthropic-skills', name: 'anthropics/skills', url: 'https://github.com/anthropics/skills', category: '官方生态', description: 'Anthropic 官方 Agent Skills：文档/PPT/PDF 等生产级技能模板', stars: 12000, tags: ['official', 'skills'], source: 'GitHub 开源' },
  { id: 'ext-awesome-claude-skills', name: 'ComposioHQ/awesome-claude-skills', url: 'https://github.com/ComposioHQ/awesome-claude-skills', category: '技能库', description: '1000+ Claude Skills 精选集合（6.4 万+ Star）', stars: 64000, tags: ['skills', 'curation'], source: 'GitHub 开源' },
  { id: 'ext-travisvn-awesome', name: 'travisvn/awesome-claude-skills', url: 'https://github.com/travisvn/awesome-claude-skills', category: '技能库', description: '53K Star 的 Claude Skills 精选列表，持续更新', stars: 53000, tags: ['skills', 'curation'], source: 'GitHub 开源' },
  { id: 'ext-superpowers', name: 'obra/superpowers', url: 'https://github.com/obra/superpowers', category: '工程方法', description: 'Claude Code 黄金技能集：brainstorming / plans / TDD / subagent 开发', stars: 21000, tags: ['planning', 'tdd', 'workflow'], source: 'GitHub 开源' },
  { id: 'ext-chatgpt-prompts', name: 'f/awesome-chatgpt-prompts', url: 'https://github.com/f/awesome-chatgpt-prompts', category: '提示词库', description: 'ChatGPT 官方提示词集合（180K+ Star）', stars: 180000, tags: ['prompts'], source: 'GitHub 开源' },
  { id: 'ext-prompts-zh', name: 'PlexPt/awesome-chatgpt-prompts-zh', url: 'https://github.com/PlexPt/awesome-chatgpt-prompts-zh', category: '提示词库', description: 'ChatGPT 中文提示词大全', stars: 65000, tags: ['prompts', 'zh'], source: 'GitHub 开源' },
  { id: 'ext-khazix-skills', name: 'KKKKhazix/khazix-skills', url: 'https://github.com/KKKKhazix/khazix-skills', category: '技能库', description: 'leader 等高质量 Agent 技能（本产品参考项目）', stars: 1200, tags: ['skills', 'goal'], source: 'GitHub 开源' },
  { id: 'ext-awesome-code-skills', name: 'itgoyo/awesome-claude-code-skills', url: 'https://github.com/itgoyo/awesome-claude-code-skills', category: '技能库', description: 'Top-Starred Claude Code 工具与技能大全', stars: 8900, tags: ['skills', 'claude-code'], source: 'GitHub 开源' },
  { id: 'ext-awesome-agent-skills', name: 'JackyST0/awesome-agent-skills', url: 'https://github.com/JackyST0/awesome-agent-skills', category: '技能库', description: '适用于 Cursor / Claude Code / Copilot 的 AI Agent Skills 精选', stars: 3200, tags: ['skills', 'agent'], source: 'GitHub 开源' },
  { id: 'ext-prompt-guide', name: 'dair-ai/Prompt-Engineering-Guide', url: 'https://github.com/dair-ai/Prompt-Engineering-Guide', category: '提示词库', description: '提示工程方法论与指南（46K+ Star）', stars: 46000, tags: ['guide', 'prompt-engineering'], source: 'GitHub 开源' },
];

let liveCache = { at: 0, items: [] };

/** 聚合市场数据：内置模板 + 开源集合 + 实时 GitHub 检索（缓存 10 分钟） */
export async function marketData({ q = '' } = {}) {
  const curated = loadCuratedTemplates();
  let live = [];
  if (Date.now() - liveCache.at > 10 * 60 * 1000) {
    try {
      const items = await githubSearch('claude skills template OR prompt collection', 8);
      live = items.map((it) => ({
        id: `live-${it.name}`, name: it.name, url: it.url, category: 'GitHub 实时',
        description: (it.description || '').slice(0, 160), stars: it.stars,
        tags: it.topics || [], source: 'GitHub 实时',
      }));
      liveCache = { at: Date.now(), items: live };
    } catch {
      live = liveCache.items;
    }
  } else {
    live = liveCache.items;
  }

  const all = [
    ...curated.map((t) => ({ ...t, kind: 'template', source: '内置模板' })),
    ...EXTERNAL_REPOS.map((r) => ({ ...r, kind: 'repo' })),
    ...live,
  ];
  // 分类聚合
  const groups = new Map();
  for (const it of all) {
    const cat = it.category || '通用';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(it);
  }
  const byCategory = [...groups.entries()].map(([name, items]) => ({ name, items }))
    .sort((a, b) => b.items.length - a.items.length);

  // 关键词过滤
  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? all.filter((it) => `${it.name} ${it.description} ${it.title || ''} ${(it.tags || []).join(' ')} ${it.domain || ''}`.toLowerCase().includes(kw))
    : all;

  return { total: all.length, byCategory, filtered, fetchedAt: new Date().toISOString() };
}
