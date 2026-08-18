import type { Category, CategoryId } from "./types";

export const CATEGORIES: Category[] = [
  { id: "agent", name: "AI Agent", nameZh: "智能体", emoji: "🤖" },
  { id: "skill", name: "AI Skill", nameZh: "技能封装", emoji: "🧩" },
  { id: "mcp", name: "MCP", nameZh: "模型上下文协议", emoji: "🔌" },
  { id: "coding", name: "AI Coding", nameZh: "AI 编程", emoji: "⌨️" },
  { id: "devtools", name: "AI Developer Tools", nameZh: "开发者工具", emoji: "🛠️" },
  { id: "saas", name: "AI SaaS", nameZh: "SaaS", emoji: "☁️" },
  { id: "productivity", name: "AI Productivity", nameZh: "效率", emoji: "⚡" },
  { id: "automation", name: "AI Automation", nameZh: "自动化", emoji: "⚙️" },
  { id: "content", name: "AI Content Creation", nameZh: "内容创作", emoji: "✍️" },
  { id: "selfmedia", name: "Self Media", nameZh: "自媒体", emoji: "📱" },
  { id: "video", name: "Video", nameZh: "视频", emoji: "🎬" },
  { id: "image", name: "Image", nameZh: "图像", emoji: "🖼️" },
  { id: "audio", name: "Audio", nameZh: "音频", emoji: "🎧" },
  { id: "writing", name: "Writing", nameZh: "写作", emoji: "📝" },
  { id: "resume", name: "Resume / Career", nameZh: "简历求职", emoji: "💼" },
  { id: "sidehustle", name: "Side Hustle", nameZh: "副业", emoji: "💸" },
  { id: "money", name: "Making Money", nameZh: "赚钱", emoji: "💰" },
  { id: "ecommerce", name: "E-commerce", nameZh: "电商", emoji: "🛒" },
  { id: "marketing", name: "Marketing", nameZh: "营销", emoji: "📣" },
  { id: "data", name: "Data", nameZh: "数据", emoji: "📊" },
  { id: "rag", name: "RAG", nameZh: "检索增强", emoji: "🔍" },
  { id: "llm", name: "LLM", nameZh: "大模型", emoji: "🧠" },
  { id: "vision", name: "Computer Vision", nameZh: "计算机视觉", emoji: "👁️" },
  { id: "robotics", name: "Robotics", nameZh: "机器人", emoji: "🦾" },
  { id: "education", name: "AI Education", nameZh: "AI 教育", emoji: "🎓" },
  { id: "research", name: "AI Research", nameZh: "AI 研究", emoji: "🔬" },
  { id: "infra", name: "Open Source Infrastructure", nameZh: "基础设施", emoji: "🏗️" },
  { id: "devproductivity", name: "Developer Productivity", nameZh: "研发效能", emoji: "🚀" },
  { id: "pkm", name: "Personal Knowledge Management", nameZh: "知识管理", emoji: "🗂️" },
  { id: "life", name: "Life / Personal OS", nameZh: "生活个人 OS", emoji: "🌱" },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

export function categoryOf(id: CategoryId): Category {
  return CATEGORY_MAP[id];
}
