export async function execute(input: Record<string, any>, ctx: any) {
  const topic = String(input.topic ?? "");
  const keywords = String(input.keywords ?? "").split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  const count = Math.min(Math.max(Number(input.count ?? 5) || 5, 1), 20);
  const angles = ["入门科普", "实战教程", "避坑指南", "案例拆解", "工具推荐", "趋势预测", "对比评测", "新手必看", "效率提升", "深度思考"];
  const audiences = ["内容创作者", "产品经理", "开发者", "运营人员", "创业者", "普通用户"];
  const topics = Array.from({ length: count }, (_: unknown, i: number) => {
    const kw = keywords[i % Math.max(keywords.length, 1)] || topic;
    return {
      title: `${topic}｜${angles[i % angles.length]}：${kw}`,
      angle: angles[i % angles.length],
      audience: audiences[i % audiences.length],
      tags: [topic, kw, angles[i % angles.length]],
      suggested_length: i % 3 === 0 ? "长文/深度" : "短文/快讯",
    };
  });
  return { topics, total: topics.length, topic };
}
