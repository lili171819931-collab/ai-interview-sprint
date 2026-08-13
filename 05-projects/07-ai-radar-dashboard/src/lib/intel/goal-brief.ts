import type { HotRankItem } from "@/lib/intel/aihot-types";

/** leader（领导）七问：把今日热点收成一份可粘贴的目标任务书。 */

export function buildGoalBrief(opts: {
  idea?: string;
  hot: HotRankItem[];
}): string {
  const idea = (opts.idea || "").trim() || "根据今天最热的 AI 信号，做出一个 2 小时内能验证的产品动作";
  const top = opts.hot.slice(0, 5);
  const titles = top.map((h) => `${h.rank}. ${h.title}`).join("\n");
  const first = top[0];

  return `# 目标：把今日 AI 热点收成一个可验收的动作

这活为什么干：AI 圈一天信号太多。我们只要一件事——对着今天真实在爆的事件，做出一个能证明「看懂了、动手了」的产出，而不是又写一篇摘要。

## 我替领导拍的板
- 想法原话：「${idea}」
- 主锚点：${first ? `第 ${first.rank} 名「${first.title}」` : "当前热点榜为空，先跑 npm run aihot:sync"}
- 时间盒：2 小时。超时只交证据包，不许扩 scope。
- 默认不做：不做爬虫、不登录第三方、不把 AIHOT 数据做成对外商业镜像。

## 今日信号（只作输入，不许编造下一条）
${titles || "（空）"}

## 地界
- 只读本仓库 \`05-projects/07-ai-radar-dashboard/\` 与已同步的 \`data/aihot/\`、\`data/events/\`。
- 可以改看板文案、简报结构、\`/goal\` 与 \`/api/v1/*\`。
- 不许改评分口径假装更准；不许删测试让绿灯。
- 跑满 1 轮验收即停。

## 取舍
算得对 > 做得全 > 做得快。热点标题必须能点回真实链接。

## 任务
1. 用热点榜前 3 条核对：每条都有可打开的原文或站内页。
2. 写一份 ≤400 字「为什么现在动手」：只引用上面信号，不补训练记忆里的新闻。
3. 给出一个 2 小时动作（落地页/对比卡/Agent 问法三选一）和完成截图位。

## 完成条件
- 命令：打开 http://localhost:3010/ranking ，前 3 名标题与 \`data/aihot/hot-topics.json\` 或 \`data/events/latest.json\` 一致。
- 命令：打开 http://localhost:3010/goal ，本任务书仍能一键复制，且不含「来找我」。
- 反作弊：不许用假链接、不许把来源数写成热度、不许把 7 天精选叫正式周报。

## 未知
拿不准的信源版权或授权范围，写进 BLOCKED.md，跳过，做下一件有链接的事。

进度写 PROGRESS.md。同一验收连败 3 次换项。结果比基线差就回滚如实报告。
`;
}
