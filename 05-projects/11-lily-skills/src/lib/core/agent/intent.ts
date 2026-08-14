import { tokenize } from "../search";

export interface Intent {
  category: string;
  actions: string[];
  entities: string[];
  keywords: string[];
  isSkillRequest: boolean;
  skillMention: string | null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "AI & Research": ["ai", "人工智能", "research", "研究", "trend", "趋势", "热点", "情报", "分析", "调查", "洞察", "市场", "market", "竞品", "competitor", "行业", "industry", "报告", "report"],
  "Content Creation": ["content", "内容", "文案", "脚本", "script", "文章", "article", "标题", "选题", "topic", "创作", "generate", "生成", "写作", "写", "视频", "video", "短视频", "shorts"],
  Marketing: ["marketing", "营销", "推广", "投放", "campaign", "品牌", "brand", "增长", "growth", "获客"],
  "Social Media": ["tiktok", "抖音", "instagram", "小红书", "xhs", "twitter", "x", "youtube", "bilibili", "b站", "weibo", "微博", "social", "社交媒体", "海外", "发布", "publish", "涨粉", "粉丝", "followers"],
  "Data Analysis": ["data", "数据", "统计", "analysis", "分析", "excel", "图表", "chart", "可视化", "dashboard", "爬取", "crawl", "collect", "采集"],
  Productivity: ["效率", "整理", "总结", "summarize", "汇总", "笔记", "note", "todo", "待办", "日程", "schedule", "提醒", "reminder", "自动化", "automate"],
  Business: ["business", "商业", "商业模式", "创业", "startup", "bp", "融资", "财务模型", "定价", "pricing", "战略", "strategy"],
  Career: ["career", "职业", "求职", "面试", "interview", "简历", "resume", "cv", "晋升", "个人品牌", "linkedin"],
  "Knowledge Management": ["知识", "knowledge", "文档", "document", "检索", "rag", "知识库", "wiki", "收藏", "阅读"],
  Design: ["design", "设计", "ui", "ux", "海报", "poster", "封面", "cover", "品牌视觉", "figma"],
  Development: ["development", "开发", "代码", "code", "编程", "api", "部署", "deploy", "bug", "测试", "test", "github", "数据库", "database"],
  Automation: ["automation", "自动化", "workflow", "工作流", "流程", "定时", "cron", "批量", "batch", "脚本"],
  Finance: ["finance", "财务", "报销", "invoice", "记账", "预算", "股票", "stock", "投资", "投资"],
  Travel: ["travel", "旅行", "旅游", "机票", "酒店", "行程", "itinerary"],
  "Personal Life": ["健康", "健身", "食谱", "阅读", "兴趣", "habit", "习惯"],
};

const ACTION_KEYWORDS: Record<string, string[]> = {
  analyze: ["分析", "analyze", "研究", "调查", "评估", "评估", "评测"],
  generate: ["生成", "create", "制作", "写", "产出", "生成", "generate", "创作"],
  search: ["找", "搜索", "查找", "search", "查", "看看", "发现", "discover"],
  summarize: ["总结", "汇总", "摘要", "summarize", "概括"],
  compare: ["对比", "比较", "compare", "对照"],
  execute: ["运行", "执行", "run", "启动", "执行"],
  schedule: ["定时", "每周", "每天", "定期", "schedule", "cron"],
  extract: ["提取", "抓取", "爬", "extract", "crawl", "collect", "采集"],
  translate: ["翻译", "translate", "翻译成"],
  monitor: ["监控", "监测", "跟踪", "monitor", "track", "follow"],
};

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on", "for", "and", "or", "with",
  "我", "你", "他", "她", "它", "的", "了", "吗", "呢", "吧", "啊", "是", "在", "和", "与", "或", "为", "从", "到",
]);

export function understandIntent(message: string): Intent {
  const lower = message.toLowerCase();
  const tokens = tokenize(lower).filter((t) => !STOP_WORDS.has(t) && t.length > 1);
  const categories = Object.entries(CATEGORY_KEYWORDS)
    .map(([cat, kws]) => ({ cat, hits: kws.filter((k) => lower.includes(k) || tokens.includes(k)).length }))
    .sort((a, b) => b.hits - a.hits);
  const category = categories.length && categories[0].hits > 0 ? categories[0].cat : "Other";

  const actions = Object.entries(ACTION_KEYWORDS)
    .filter(([, kws]) => kws.some((k) => lower.includes(k)))
    .map(([action]) => action);

  // Entities: platforms and common subjects
  const platforms = [
    "tiktok", "抖音", "instagram", "小红书", "xhs", "twitter", "x ", "youtube", "bilibili", "b站", "weibo", "微博",
    "linkedin", "facebook", "github", "notion", "excel", "ppt", "pdf",
  ];
  const entities = platforms.filter((p) => lower.includes(p.trim()));

  // Skill mention: does the message reference an existing skill by name? (checked by caller)
  return {
    category,
    actions: actions.length ? actions : ["search"],
    entities,
    keywords: tokens.slice(0, 8),
    isSkillRequest: false,
    skillMention: null,
  };
}
