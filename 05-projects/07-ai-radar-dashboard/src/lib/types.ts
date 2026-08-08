export type SourceLevel = "official" | "first_hand" | "secondary" | "inferred";

export type Category = "assistant" | "platform" | "agent" | "vertical";

export type Audience = "consumer" | "developer" | "enterprise";

export type Region = "cn" | "global" | "restricted";

export type Integration = "web" | "api" | "ide" | "plugin" | "private";

export type ScoreKey =
  | "breadth"
  | "quality"
  | "cost"
  | "speed"
  | "ecosystem"
  | "compliance"
  | "ease";

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export type Scores = Record<ScoreKey, ScoreValue>;

export type SourceRef = {
  title: string;
  url?: string;
  level: SourceLevel;
  accessedAt: string;
};

export type ToolRecord = {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  oneLiner: string;
  description: string;
  audience: Audience[];
  capabilities: string[];
  pricingSummary: string;
  regions: Region[];
  integration: Integration[];
  pros: string[];
  cons: string[];
  scores: Scores;
  scoreEvidence: Partial<Record<ScoreKey, string>>;
  sources: SourceRef[];
  changelogSummary?: string;
  updatedAt: string;
  status: "active" | "stale" | "deprecated";
  website?: string;
};

export type LiveFetchItem = {
  sourceId: string;
  label: string;
  toolIds: string[];
  status: "ok" | "fail";
  title?: string;
  url?: string;
  publishedAt?: string;
  error?: string;
};

export type LiveFetchReport = {
  fetchedAt: string;
  offline: boolean;
  successCount: number;
  failureCount: number;
  items: LiveFetchItem[];
};

export type DailyBundle = {
  generatedAt: string;
  timezone: "Asia/Shanghai";
  tools: ToolRecord[];
  highlights: { toolId: string; note: string }[];
  methodNote: string;
  liveFetch?: LiveFetchReport;
};

export const SCORE_LABELS: Record<ScoreKey, string> = {
  breadth: "能力广度",
  quality: "质量上限",
  cost: "成本划算",
  speed: "速度可用",
  ecosystem: "生态集成",
  compliance: "数据合规",
  ease: "上手成本",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  assistant: "通用助手",
  platform: "开发者平台",
  agent: "Agent / 工作流",
  vertical: "垂直工具",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  consumer: "个人创作",
  developer: "工程师",
  enterprise: "企业采购",
};
