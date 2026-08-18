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

/* ── AI PM Learning & Content Intelligence OS ─────────────────────────── */

export type LearningLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface HiddenNeeds {
  surface: string;
  functional: string;
  deep: string;
  latent: string;
}

export interface RequirementNode {
  question: string;
  answer: string;
  children: RequirementNode[];
}

export interface JTBD {
  when: string;
  want: string;
  soThat: string;
  functional: string;
  emotional: string;
  social: string;
}

export interface EvidenceItem {
  type: "Evidence" | "Inference" | "Hypothesis";
  source: string;
  claim: string;
}

export interface FiveLayers {
  userProblem: string;
  productExperience: string;
  aiCapability: string;
  agentWorkflow: string;
  businessModel: string;
}

export interface AiNativeAnalysis {
  before: string;
  after: string;
  native: string;
}

export interface DnaChainNode {
  label: string;
  value: string;
}

export interface PmVsUser {
  userView: string;
  pmView: string;
}

export interface ChallengeOption {
  id: string;
  text: string;
  best: boolean;
}

export interface Challenge {
  id: string;
  level: LearningLevel;
  question: string;
  hint: string;
  skill: string;
  options: ChallengeOption[];
  expertReview: { bestAnswer: string; why: string; keyInsight: string };
}

export interface InterviewQuestion {
  id: string;
  category: "Product Sense" | "User Research" | "AI Product" | "Metrics" | "Growth" | "Business" | "Technical" | "Strategy";
  question: string;
  modelAnswer: string;
}

export interface OpinionFrame {
  biggestInnovation: string;
  biggestFlaw: string;
  ifPmSteps: string[];
  futureOpportunity: string;
}

export interface ContentScore {
  hook: number;
  information: number;
  originality: number;
  productInsight: number;
  practicalValue: number;
  shareability: number;
  total: number;
}

export interface ContentPlatform {
  platform: string;
  title: string;
  body: string;
  hashtags: string[];
}

export interface VideoScriptSegment {
  label: string;
  text: string;
}

export interface VideoScript {
  title: string;
  segments: VideoScriptSegment[];
  cta: string;
}

export interface PrdDraft {
  productBrief: string;
  problem: string;
  users: string;
  prd: string;
  userFlow: string[];
  features: string[];
  mvp: string;
  aiArchitecture: string;
  dataArchitecture: string;
  metrics: string[];
  gtm: string;
}

export interface CaseStudy {
  id: string;
  projectId: string;
  projectName: string;
  category: string;
  title: string;
  problem: string;
  user: string;
  productLogic: string;
  aiArchitecture: string;
  businessModel: string;
  myDecision: string;
  improvement: string;
}

export interface AbilityScores {
  productThinking: number;
  aiUnderstanding: number;
  userResearch: number;
  requirementAnalysis: number;
  featureDesign: number;
  aiAgent: number;
  businessModel: number;
  growth: number;
  dataAnalysis: number;
  communication: number;
}

export interface LearningStep {
  id: string;
  label: string;
}

export const LEARNING_STEPS: LearningStep[] = [
  { id: "overview", label: "Overview" },
  { id: "user", label: "User" },
  { id: "problem", label: "Problem" },
  { id: "feature", label: "Feature" },
  { id: "aiLogic", label: "AI Logic" },
  { id: "architecture", label: "Architecture" },
  { id: "business", label: "Business" },
  { id: "opinion", label: "Opinion" },
  { id: "challenge", label: "Challenge" },
];
