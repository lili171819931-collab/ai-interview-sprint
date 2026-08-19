import type { Db } from "../db/connection";
import type { Manifest, Json } from "./types";
import { slugify } from "./types";
import { createSkill, getSkillRow } from "./skill-registry";

/**
 * GitHub Skill Importer.
 *
 * The "Skill Hub" path: a GitHub repo is a capability, not yet a Skill.
 * This module turns `https://github.com/<owner>/<repo>` into a registered
 * Lily-Skills Skill by:
 *   1. fetching repo metadata + README + package manifest,
 *   2. deterministically inferring category / tags / run command / schemas,
 *   3. generating a Manifest + a CLI/HTTP Adapter (no manual code),
 *   4. registering it into the Registry (and therefore Search + Agent Tools).
 *
 * Reuse > Wrap > Build. No network beyond the target repo / GitHub API.
 */
export interface GitHubImportResult {
  skill: ReturnType<typeof createSkill>;
  manifest: Manifest;
  source: {
    url: string;
    owner: string;
    repo: string;
    language: string | null;
    topics: string[];
    stars: number | null;
  };
}

export interface ImportOptions {
  /** Overrides for manual registration when the repo cannot be reached. */
  name?: string;
  description?: string;
  category?: string;
  execution_type?: Manifest["execution_type"];
  command?: string;
  endpoint?: string;
  tags?: string[];
}

const GH_API = "https://api.github.com";

async function fetchJson(url: string): Promise<Json | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "lily-skills-importer",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as Json;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, { headers: { "user-agent": "lily-skills-importer" }, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const m = /github\.com[/:]([^/]+)\/([^/#?]+)/i.exec(url.trim());
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

/** Deterministic topic → category inference from README / description / topics. */
function inferCategory(text: string, topics: string[]): string {
  const hay = `${text} ${topics.join(" ")}`.toLowerCase();
  const rules: [RegExp, string][] = [
    [/(pdf|ocr|document|markdown|text extract)/i, "Data Analysis"],
    [/(image|photo|vision|stable diffusion|generate image)/i, "Design"],
    [/(video|youtube|ffmpeg|transcode)/i, "Content Creation"],
    [/(scraper|crawl|spider|scraping|web data)/i, "AI & Research"],
    [/(http client|api client|sdk|library)/i, "Development"],
    [/(browser|playwright|puppeteer)/i, "Automation"],
    [/(search|rag|embedding|vector|llm|agent|chat)/i, "AI & Research"],
    [/(excel|spreadsheet|csv|table|data)/i, "Data Analysis"],
    [/(finance|invoice|accounting|stock)/i, "Finance"],
    [/(notion|notes|wiki|knowledge|second brain)/i, "Knowledge Management"],
    [/(cli|terminal|shell|dev tool|developer|code)/i, "Development"],
    [/(automation|workflow|scheduler|cron)/i, "Automation"],
    [/(social|tiktok|twitter|instagram|content|post)/i, "Social Media"],
  ];
  for (const [re, cat] of rules) if (re.test(hay)) return cat;
  return "Other";
}

/** Infer the run command for a CLI wrapper from repo signals. */
function inferCommand(
  repo: string,
  language: string | null,
  pkg: Json | null,
  pyproject: string | null,
): string {
  if (pkg && typeof pkg === "object" && pkg) {
    const bin = pkg.bin;
    if (typeof bin === "string") return `${bin} {{args}}`;
    if (bin && typeof bin === "object") {
      const first = Object.keys(bin as Json)[0];
      if (first) return `${first} {{args}}`;
    }
    const scripts = pkg.scripts as Json | undefined;
    if (scripts && typeof scripts === "object" && scripts) {
      const preferred = (scripts.start ?? scripts.cli ?? scripts.build ?? Object.values(scripts as Json)[0]) as string | undefined;
      if (preferred) return `npm run ${preferred} -- {{args}}`;
    }
  }
  if (pyproject) {
    const projectName = /\[project\]\s*name\s*=\s*["']([^"']+)["']/i.exec(pyproject);
    if (projectName) return `python -m ${projectName[1]} {{args}}`;
  }
  const lang = (language ?? "").toLowerCase();
  if (lang === "python") return `python ${slugify(repo)} {{args}}`;
  if (lang === "typescript" || lang === "javascript") return `npx ${repo} {{args}}`;
  if (lang === "go" || lang === "rust" || lang === "c" || lang === "cpp") return `./${slugify(repo)} {{args}}`;
  return `npx ${repo} {{args}}`;
}

function inferInputSchema(executionType: string): Json {
  if (executionType === "http") {
    return {
      type: "object",
      properties: {
        payload: { type: "object", description: "请求体（JSON）" },
      },
      required: [],
    };
  }
  return {
    type: "object",
    properties: {
      args: { type: "string", description: "命令行参数（空格分隔）" },
    },
    required: [],
  };
}

function buildManifest(
  repoMeta: Json,
  readme: string | null,
  pkg: Json | null,
  pyproject: string | null,
  sourceUrl: string,
  overrides: ImportOptions,
): Manifest {
  const owner = String((repoMeta.owner as Json | undefined)?.login ?? "");
  const repo = String(repoMeta.name ?? "");
  const description = overrides.description ?? String(pkg?.description ?? repoMeta.description ?? readme?.split("\n").find((l) => l.trim()) ?? repo);
  const language = repoMeta.language ? String(repoMeta.language) : null;
  const topics = Array.isArray(repoMeta.topics) ? repoMeta.topics.map(String) : [];
  const readmeText = readme ?? "";
  const isApi = /api|http|rest|server|endpoint/i.test(`${description} ${readmeText.slice(0, 2000)}`);
  const executionType: Manifest["execution_type"] = overrides.execution_type ?? (isApi ? "http" : "cli");
  const category = overrides.category ?? inferCategory(`${description} ${readmeText.slice(0, 4000)}`, topics);
  const tags = overrides.tags ?? [
    ...new Set([...topics.slice(0, 5), ...(language ? [language] : []), "github-import", "open-source"].filter(Boolean)),
  ];
  const command = executionType === "cli" ? (overrides.command ?? inferCommand(repo, language, pkg, pyproject)) : undefined;
  const endpoint = executionType === "http" ? overrides.endpoint : undefined;
  const aiDescription = overrides.description
    ? `从 GitHub 导入的开源能力：${description}`
    : `从 GitHub 导入的开源能力（${owner}/${repo}）：${description}`;

  return {
    name: overrides.name ?? (repo || slugify(repo)),
    version: "1.0.0",
    description,
    category,
    tags,
    icon: "📦",
    author: owner || "open-source",
    execution_type: executionType,
    command,
    endpoint,
    input_schema: inferInputSchema(executionType),
    output_schema: { type: "object", properties: {} },
    permissions: executionType === "http" ? ["read", "external_api", "network"] : ["read"],
    risk_level: executionType === "http" ? "medium" : "low",
    ai_description: aiDescription,
    use_cases: ["开源能力复用", "Skill Hub 导入", "Agent 调用"],
    examples: [`运行 ${repo}`],
  };
}

/** Import a GitHub repo as a Skill. Returns the registered skill + manifest. */
export async function importFromGitHub(
  db: Db,
  githubUrl: string,
  overrides: ImportOptions = {},
): Promise<GitHubImportResult> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) throw new Error(`不是有效的 GitHub 地址: ${githubUrl}`);
  const { owner, repo } = parsed;
  const sourceUrl = `https://github.com/${owner}/${repo}`;

  const repoMeta = await fetchJson(`${GH_API}/repos/${owner}/${repo}`);
  if (!repoMeta) throw new Error(`无法访问 GitHub 仓库 ${owner}/${repo}（网络受限或仓库不存在）`);

  const branch = String(repoMeta.default_branch ?? "main");
  const readme = (await fetchText(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`))
    ?? (await fetchText(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`));
  const pkg = await fetchJson(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`);
  const pyproject = await fetchText(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/pyproject.toml`);

  const manifest = buildManifest(repoMeta, readme, pkg, pyproject, sourceUrl, overrides);
  const skill = createSkill(db, manifest, { source: "import", sourcePath: sourceUrl, upsert: true });

  return {
    skill,
    manifest,
    source: {
      url: sourceUrl,
      owner,
      repo,
      language: repoMeta.language ? String(repoMeta.language) : null,
      topics: Array.isArray(repoMeta.topics) ? repoMeta.topics.map(String) : [],
      stars: typeof repoMeta.stargazers_count === "number" ? repoMeta.stargazers_count : null,
    },
  };
}

/** Parse YAML frontmatter from a SKILL.md (name + description only). */
function parseSkillFrontmatter(md: string): { name?: string; description?: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) return {};
  const fm = m[1];
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim().replace(/^["']|["']$/g, "");
  const description = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim().replace(/^["']|["']$/g, "");
  return { name, description };
}

function humanize(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export interface RepoSkillsImportResult {
  type: "collection" | "single";
  source: { url: string; owner: string; repo: string; language: string | null; topics: string[]; stars: number | null };
  skills: ReturnType<typeof createSkill>[];
  count: number;
}

/**
 * Import a GitHub repo as one or many Skills.
 * - Repos containing `SKILL.md` files (skill collections) import each skill
 *   as a `knowledge` Skill with metadata parsed from its frontmatter.
 * - Otherwise fall back to the single CLI/HTTP wrapper import.
 */
export async function importRepoSkills(
  db: Db,
  githubUrl: string,
  overrides: ImportOptions = {},
): Promise<RepoSkillsImportResult> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) throw new Error(`不是有效的 GitHub 地址: ${githubUrl}`);
  const { owner, repo } = parsed;
  const sourceUrl = `https://github.com/${owner}/${repo}`;

  const repoMeta = await fetchJson(`${GH_API}/repos/${owner}/${repo}`);
  if (!repoMeta) throw new Error(`无法访问 GitHub 仓库 ${owner}/${repo}`);
  const branch = String(repoMeta.default_branch ?? "main");

  const tree = await fetchJson(`${GH_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const treeItems = (tree?.tree ?? []) as { path?: string }[];
  const skillPaths = treeItems
    .map((t) => t.path ?? "")
    .filter((p) => p.endsWith("/SKILL.md") || p === "SKILL.md");

  if (skillPaths.length === 0) {
    const single = await importFromGitHub(db, githubUrl, overrides);
    return {
      type: "single",
      source: single.source,
      skills: [single.skill],
      count: 1,
    };
  }

  const skills: ReturnType<typeof createSkill>[] = [];
  for (const path of skillPaths) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const md = await fetchText(rawUrl);
      if (!md) continue;
      const fm = parseSkillFrontmatter(md);
      const folder = path.split("/").slice(-2, -1)[0] ?? repo;
      const body = md.replace(/^---[\s\S]*?---\s*/, "").trim();
      const description = fm.description ?? body.split("\n").find((l) => l.trim())?.replace(/^#+\s*/, "") ?? `Agent Skill from ${repo}`;
      const manifest: Manifest = {
        name: overrides.name ?? fm.name ?? humanize(folder),
        version: "1.0.0",
        description,
        category: overrides.category ?? inferCategory(`${fm.description ?? ""} ${body.slice(0, 4000)}`, []),
        tags: overrides.tags ?? [...new Set(["agent-skill", "knowledge", repo, folder.replace(/[-_]/g, " ")].filter(Boolean))],
        icon: "🧠",
        author: owner,
        execution_type: "knowledge",
        input_schema: { type: "object", properties: {} },
        output_schema: { type: "object", properties: {} },
        permissions: ["read"],
        risk_level: "low",
        ai_description: `${fm.description ?? description}（从 ${owner}/${repo} 导入的 Agent Skill，说明文档型能力，执行即返回来源供 Agent 阅读应用）`,
        use_cases: ["Agent 能力复用", "Skill Hub 导入", "工作流编排"],
        examples: [`阅读 ${fm.name ?? folder} 的 Skill 说明`],
      };
      const skill = createSkill(db, manifest, { source: "import", sourcePath: rawUrl, upsert: true });
      skills.push(skill);
    } catch (err) {
      console.warn(`[import] skip ${path}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return {
    type: "collection",
    source: {
      url: sourceUrl,
      owner,
      repo,
      language: repoMeta.language ? String(repoMeta.language) : null,
      topics: Array.isArray(repoMeta.topics) ? repoMeta.topics.map(String) : [],
      stars: typeof repoMeta.stargazers_count === "number" ? repoMeta.stargazers_count : null,
    },
    skills,
    count: skills.length,
  };
}
