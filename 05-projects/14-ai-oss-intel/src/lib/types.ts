/**
 * Core domain types for the AI Open Source Intelligence Platform.
 * TypeScript strict — every data shape is explicit.
 */

export type CategoryId =
  | "agent" | "skill" | "mcp" | "coding" | "devtools" | "saas" | "productivity"
  | "automation" | "content" | "selfmedia" | "video" | "image" | "audio"
  | "writing" | "resume" | "sidehustle" | "money" | "ecommerce" | "marketing"
  | "data" | "rag" | "llm" | "vision" | "robotics" | "education" | "research"
  | "infra" | "devproductivity" | "pkm" | "life";

export interface Category {
  id: CategoryId;
  name: string;
  nameZh: string;
  emoji: string;
}

/** 0-10 intelligence attributes used by the scoring engine. */
export interface ProjectProfile {
  innovation: number;
  productValue: number;
  userDemand: number;
  commercialPotential: number;
  ecosystem: number;
  personalDevValue: number;
  /** Lower = less competition (10 = very crowded). */
  competition: number;
  sideHustleFit: number;
  skillFit: number;
  resumeFit: number;
  contentFit: number;
  startupFit: number;
  moneyFit: number;
}

export interface GrowthPoint {
  date: string; // YYYY-MM-DD
  stars: number;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  owner: string;
  fullName: string;
  tagline: string;
  description: string;
  homepage?: string;
  language: string;
  license?: string;
  stars: number;
  forks: number;
  contributors: number;
  openIssues: number;
  releases: number;
  createdAt: string;
  updatedAt: string;
  categories: CategoryId[];
  topics: string[];
  /** stars gained in last 7 / 30 / 90 days */
  growth7d: number;
  growth30d: number;
  growth90d: number;
  profile: ProjectProfile;
  /** weekly star history (>= 14 points) used for charts */
  growthHistory: GrowthPoint[];
  /** per-agent notes used by report generator (optional overrides) */
  notes?: Partial<Record<AgentId, string>>;
}

export type AgentId =
  | "discovery" | "classification" | "repo" | "product" | "business"
  | "growth" | "startup" | "content" | "portfolio" | "chief";

export interface ProjectScores {
  aiScore: number;          // 0-100 AI Project Score
  technical: number;
  product: number;
  growth: number;
  commercial: number;
  sideHustle: number;
  skill: number;
  resume: number;
  content: number;
  startup: number;
  opportunity: number;      // core Opportunity Score
  money: number;
  health: number;           // Open Source Health Score
}

export interface OpportunityIdea {
  name: string;
  targetUsers: string;
  painPoint: string;
  coreFeatures: string;
  aiCapabilities: string;
  mvp: string;
  businessModel: string;
  moat: string;
  devDifficulty: "低" | "中" | "高";
  devTime: string;
  potential: number; // 0-100
}

export interface ReportSection {
  title: string;
  body: string;
}

export interface VerdictRating {
  key: string;
  label: string;
  stars: number; // 1-5
}

export interface ProjectReport {
  projectId: string;
  generatedAt: string;
  sections: ReportSection[];
  verdict: VerdictRating[];
  oneLiner: string;
  opportunities: OpportunityIdea[];
  onePersonStartup: {
    developerReq: string;
    aiReq: string;
    designReq: string;
    operationReq: string;
    mvpTime: string;
    cost: "Low" | "Medium" | "High";
    monetization: "Easy" | "Medium" | "Hard";
    score: number;
  };
  copyPath: { step: string; detail: string }[];
  dna: { label: string; value: string }[];
  recommendedActions: { action: string; why: string; effort: "低" | "中" | "高" }[];
}

export type RankKind =
  | "stars" | "growth" | "opportunity" | "money" | "sidehustle"
  | "skills" | "resume" | "content" | "new";

export interface RankedItem {
  project: Project;
  scores: ProjectScores;
  rank: number;
  delta: number; // rank movement vs previous (positive = up)
}
