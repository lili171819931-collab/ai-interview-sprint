/**
 * Trend Scanner adapter — offline demo data source.
 * Real deployment can swap this for a live API (TikTok/YouTube) by changing
 * execution_type to "http" + endpoint, without touching the registry.
 */
const SEED: Record<string, string[]> = {
  tiktok: ["AI Agent 工作流", "AI 数字人带货", "多模态生成视频", "AI 副业变现", "AI 编程助手实测", "AI 语音克隆争议", "Agent 自动化办公", "AI 生成短剧"],
  youtube: ["Agent 框架深度解析", "AI 编程效率对比", "多智能体系统", "本地大模型部署", "RAG 实战教程", "AI 产品评测"],
  instagram: ["AI 视觉灵感", "AI 穿搭推荐", "AI 摄影后期", "AI 家居设计", "AI 健身计划"],
  general: ["AI Agent 热点", "AI 内容创作", "AI 数据分析", "AI 自动化", "AI 商业应用", "AI 教育", "AI 安全合规"],
};

export async function execute(input: Record<string, any>, ctx: any) {
  const platform = String(input.platform ?? "general").toLowerCase();
  const topic = String(input.topic ?? "");
  const count = Math.min(Math.max(Number(input.count ?? 5) || 5, 1), 20);
  const base = SEED[platform] ?? SEED.general;
  const topics = base.slice(0, count).map((t: string, i: number) => {
    const score = Math.round((100 - i * 7 + (topic ? Math.abs(hash(t + topic) % 12) : 0)) * 10) / 10;
    return {
      title: topic ? `${topic} · ${t}` : t,
      platform,
      heat_score: Math.min(99, score),
      engagement: "high",
      keywords: [topic || t, platform, "trend"],
      source: "offline-demo",
    };
  });
  return {
    topics,
    summary: `在 ${platform} 上关于「${topic || "通用"}」共发现 ${topics.length} 个热点，平均热度 ${Math.round(topics.reduce((a, b) => a + b.heat_score, 0) / topics.length)}。`,
    generated_at: new Date().toISOString(),
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
