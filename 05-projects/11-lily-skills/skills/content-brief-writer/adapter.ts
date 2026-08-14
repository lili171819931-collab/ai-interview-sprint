export async function execute(input: Record<string, any>, ctx: any) {
  const title = String(input.title ?? "");
  const format = String(input.format ?? "article");
  const structures: Record<string, string[]> = {
    article: ["引言：为什么现在关注", "核心概念拆解", "3 个关键要点", "案例与数据", "总结与行动建议"],
    video_script: ["开场钩子（0-5s）", "痛点引入", "干货主体", "案例演示", "CTA 结尾"],
    social_post: ["钩子句", "价值点", "细节展开", "互动提问"],
    email: ["主题行", "开场", "价值说明", "行动号召", "署名"],
  };
  const structure = structures[format] ?? structures.article;
  return {
    title,
    format,
    hook: `为什么「${title}」值得你现在就了解？`,
    structure: structure.map((s: string, i: number) => ({ section: i + 1, content: s })),
    key_points: [`围绕「${title}」提炼 3 个核心观点`, "加入 1 个真实案例", "结尾给出可执行建议"],
    cta: format === "email" ? "点击回复获取完整资料" : "评论区聊聊你的看法",
    estimated_read_minutes: format === "article" ? 6 : 2,
  };
}
