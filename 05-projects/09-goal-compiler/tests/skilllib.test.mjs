/**
 * skilllib.test.mjs — 一键导出可安装 SKILL.md 测试
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSkillMd, skillFilename } from '../public/js/skilllib.mjs';
import { compile } from '../public/js/compiler/index.mjs';

test('buildSkillMd 生成可安装 SKILL.md（frontmatter + 正文）', () => {
  const r = compile('我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈');
  const md = buildSkillMd(r, { lang: 'zh' });
  assert.ok(md.startsWith('---\nname:'), '应有 YAML frontmatter');
  assert.ok(/^description: /m.test(md), '应有 description');
  assert.ok(md.includes('# ROLE') && md.includes('# STOP CONDITIONS'), '正文应含 20 段 Goal');
  const mdEn = buildSkillMd(r, { lang: 'en' });
  assert.ok(mdEn.includes('# MISSION'), 'EN 版应有 MISSION');
  assert.ok(skillFilename(r).endsWith('-SKILL.md'), '文件名应为 <name>-SKILL.md');
});
