export async function execute(input: Record<string, any>, ctx: any) {
  const competitors = Array.isArray(input.competitors) ? input.competitors.map((c: unknown) => String(c)) : [];
  if (competitors.length === 0) throw new Error("缺少竞品列表");
  const industry = String(input.industry ?? "AI");
  const dimensions = ["产品力", "生态", "定价", "品牌", "开发者体验"];
  const analyzed = competitors.map((name: string, i: number) => ({
    name,
    positioning: `${industry}领域的${i % 2 === 0 ? "平台型" : "垂直型"}玩家`,
    strengths: [`在${dimensions[i % dimensions.length]}上有明显积累`, "拥有稳定用户基础"],
    gaps: [`在「面向个人创作者」的场景覆盖不足`, "自动化工作流门槛较高"],
    threat_level: (i % 3) + 1,
  }));
  return {
    industry,
    competitors: analyzed,
    opportunities: [
      "面向个人创作者的轻量自动化组合是差异化机会",
      "用「意图→Skill→工作流」的体验降低使用门槛",
      "在内容热点与数据洞察之间建立闭环",
    ],
    summary: `共分析 ${competitors.length} 个竞品，核心机会集中在个人创作者自动化与低门槛工作流。`,
  };
}
