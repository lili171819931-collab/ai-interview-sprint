/**
 * Live source-code intelligence — fetches README + dependency manifests via
 * raw.githubusercontent.com (CDN, no API rate limit) and the repository file
 * tree via the GitHub Contents/Git Trees API (core API, rate-limited), then
 * derives a source-aware analysis: tech stack, AI components, module map,
 * feature→code mapping. Results are cached in localStorage (24h).
 */
"use client";

import { proxyTree } from "@/lib/githubProxy";

export interface SourceIntel {
  fullName: string;
  readme?: string;
  manifest?: { file: string; text: string };
  tree?: string[];
  tagline: string;
  description: string;
  features: string[];
  techStack: string[];
  aiComponents: string[];
  moduleMap: { module: string; role: string; evidence: "Confirmed" | "Inferred" | "Hypothesis" }[];
  featureToCode: { feature: string; chain: string[] }[];
  treeSource: "tree" | "readme-only" | "none";
}

const README_PATHS = ["README.md", "README.rst", "README", "readme.md", "README.mdx"];
const MANIFEST_PATHS = ["package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml"];

const CACHE_KEY = "aioss.source.cache";
const TTL_MS = 24 * 60 * 60 * 1000;

function readCache(): Record<string, { ts: number; intel: SourceIntel }> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeCache(intel: SourceIntel) {
  try {
    const c = readCache();
    c[intel.fullName.toLowerCase()] = { ts: Date.now(), intel };
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export function getCachedSource(fullName: string): SourceIntel | null {
  const c = readCache()[fullName.toLowerCase()];
  if (c && Date.now() - c.ts < TTL_MS) return c.intel;
  return null;
}

async function fetchRaw(fullName: string, path: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${fullName}/HEAD/${path}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok || res.status === 404) return null;
    const text = await res.text();
    if (!text || text.length > 400_000) return null;
    return text;
  } catch {
    return null;
  }
}

async function fetchTree(fullName: string): Promise<string[] | null> {
  // 经服务器代理（Token + Rate Limit），失败降级直连
  const proxied = await proxyTree(fullName);
  if (proxied?.tree) {
    const paths = (proxied.tree ?? []).map((t: { path?: string }) => t.path).filter(Boolean) as string[];
    return paths.slice(0, 4000);
  }
  const url = `https://api.github.com/repos/${fullName}/git/trees/HEAD?recursive=1`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const paths = (data.tree ?? []).map((t: { path?: string }) => t.path).filter(Boolean) as string[];
    return paths.slice(0, 4000);
  } catch {
    return null;
  }
}

const DIR_ROLE: [RegExp, string][] = [
  [/^(src\/app|app|src\/pages|pages|ui|components|frontend|web|client)$/i, "Frontend/UI"],
  [/^(api|server|backend|services|src\/api)$/i, "Backend/API"],
  [/^(agents?|src\/agents?)$/i, "Agent 模块"],
  [/^(tools?|toolkits?)$/i, "工具模块"],
  [/^(prompts?|templates)$/i, "Prompt 库"],
  [/^mcp$/i, "MCP 工具"],
  [/^(rag|retrieval|src\/rag|src\/retrieval)$/i, "RAG 检索"],
  [/^(data|db|database|storage|migrations)$/i, "数据层"],
  [/^(tests?|__tests__)$/i, "测试"],
  [/^(docs?|wiki)$/i, "文档"],
  [/^(scripts|bin|tools)$/i, "脚本/工具"],
  [/^(deploy|docker|\.github|infra|helm)$/i, "部署/CI"],
];

const AI_KEYWORDS = [
  "llm", "langchain", "openai", "anthropic", "claude", "gpt", "rag", "chroma", "qdrant",
  "milvus", "agent", "mcp", "embedding", "vector", "retrieval", "prompt", "ollama", "gemini",
];

export function buildSourceIntel(repo: { fullName: string; owner: string; name: string; description: string | null; language: string | null; topics: string[] }, input?: { readme?: string; manifest?: { file: string; text: string }; tree?: string[] }): SourceIntel {
  const readme = input?.readme;
  const manifest = input?.manifest;
  const tree = input?.tree;
  const fullName = repo.fullName;

  const tagline = parseTagline(readme) ?? repo.description ?? repo.fullName;
  const features = parseFeatures(readme);
  const techStack = detectStack(manifest?.text, repo.language, tree);
  const aiComponents = detectAI(manifest?.text, repo.language, tree, readme);
  const moduleMap = buildModuleMap(tree);
  const featureToCode = buildFeatureToCode(features, tree, moduleMap);
  const treeSource = tree ? "tree" : readme || manifest ? "readme-only" : "none";

  return {
    fullName,
    readme: readme?.slice(0, 3000),
    manifest,
    tree: tree?.slice(0, 200),
    tagline,
    description: repo.description ?? tagline,
    features,
    techStack,
    aiComponents,
    moduleMap,
    featureToCode,
    treeSource,
  };
}

function parseTagline(readme?: string | null): string | null {
  if (!readme) return null;
  const m = readme.match(/^#+\s+(.+)$/m);
  if (m) return m[1].trim().replace(/[#*_`]/g, "").slice(0, 120);
  return null;
}

function parseFeatures(readme?: string | null): string[] {
  if (!readme) return [];
  const out: string[] = [];
  // headings under "## Features / ✨ Features / 功能"
  const lines = readme.split("\n");
  let inFeature = false;
  for (const line of lines) {
    const h = line.match(/^##+\s*(.+)$/);
    if (h) {
      const t = h[1].toLowerCase();
      inFeature = /feature|功能|highlights|特性|capabilities/.test(t);
      continue;
    }
    if (inFeature) {
      const item = line.replace(/^[-*•\d.\s]+/, "").trim();
      if (item && item.length > 2 && item.length < 120 && !item.startsWith("```")) out.push(item);
      if (out.length >= 10) break;
    }
  }
  if (out.length === 0) {
    // fallback: first bullets in doc
    for (const line of lines) {
      const item = line.replace(/^[-*•]\s+/, "").trim();
      if (item && item.length > 2 && item.length < 120 && !item.startsWith("#") && !item.startsWith("```")) {
        out.push(item);
        if (out.length >= 6) break;
      }
    }
  }
  return out.slice(0, 8);
}

function detectStack(manifestText?: string, language?: string | null, tree?: string[]): string[] {
  const stack = new Set<string>();
  if (manifestText) {
    if (manifestText.includes('"next"') || manifestText.includes("next@")) stack.add("Next.js");
    if (manifestText.includes('"react"')) stack.add("React");
    if (manifestText.includes('"vue"')) stack.add("Vue");
    if (manifestText.includes("fastapi")) stack.add("FastAPI");
    if (manifestText.includes("langchain")) stack.add("LangChain");
    if (manifestText.includes("openai")) stack.add("OpenAI SDK");
    if (manifestText.includes("anthropic")) stack.add("Anthropic SDK");
    if (manifestText.includes("torch") || manifestText.includes("pytorch")) stack.add("PyTorch");
    if (manifestText.includes("transformers")) stack.add("Transformers");
  }
  if (language) stack.add(language);
  if (tree) {
    if (tree.some((p) => /package\.json|node_modules\//.test(p))) stack.add("Node/JS");
    if (tree.some((p) => /pyproject\.toml|requirements\.txt|\.py$/.test(p))) stack.add("Python");
    if (tree.some((p) => /go\.mod|\.go$/.test(p))) stack.add("Go");
    if (tree.some((p) => /Cargo\.toml|\.rs$/.test(p))) stack.add("Rust");
    if (tree.some((p) => /dockerfile|docker-compose/i.test(p))) stack.add("Docker");
  }
  return [...stack].slice(0, 8);
}

function detectAI(manifestText?: string, language?: string | null, tree?: string[], readme?: string | null): string[] {
  const found = new Set<string>();
  const hay = `${manifestText ?? ""} ${(tree ?? []).join(" ")} ${readme ?? ""}`.toLowerCase();
  if (/langchain|langgraph|crewai|autogen|pydantic-ai|smolagents/.test(hay)) found.add("Agent 框架");
  if (/openai|anthropic|claude|gemini|ollama|llm/.test(hay)) found.add("LLM");
  if (/chroma|qdrant|milvus|weaviate|pinecone|faiss|vector|embedding/.test(hay)) found.add("向量检索/Embedding");
  if (/mcp|model-context-protocol/.test(hay)) found.add("MCP");
  if (/rag|retrieval|hybrid/.test(hay)) found.add("RAG");
  if (/prompt|system-instruction|template/.test(hay)) found.add("Prompt 工程");
  if (found.size === 0 && AI_KEYWORDS.some((k) => hay.includes(k))) found.add("AI 相关（关键词）");
  return [...found].slice(0, 8);
}

function buildModuleMap(tree?: string[]): SourceIntel["moduleMap"] {
  const map: SourceIntel["moduleMap"] = [];
  if (!tree) return map;
  const seen = new Set<string>();
  for (const p of tree) {
    const top = p.split("/")[0];
    if (seen.has(top)) continue;
    seen.add(top);
    for (const [re, role] of DIR_ROLE) {
      if (re.test(top)) {
        map.push({ module: top, role, evidence: "Confirmed" as const });
        break;
      }
    }
    if (map.length >= 14) break;
  }
  if (map.length === 0) map.push({ module: tree[0]?.split("/")[0] ?? "root", role: "根目录（源码结构待确认）", evidence: "Inferred" });
  return map;
}

function buildFeatureToCode(features: string[], tree?: string[], moduleMap?: SourceIntel["moduleMap"]): SourceIntel["featureToCode"] {
  const chains: SourceIntel["featureToCode"] = [];
  const roles = moduleMap ?? [];
  const pick = (role: string) => roles.find((r) => r.role.includes(role) || r.module.includes(role))?.module ?? "src/";
  const fallback = features.slice(0, 5);
  if (fallback.length === 0) fallback.push("核心功能");
  for (const f of fallback) {
    chains.push({
      feature: f.slice(0, 40),
      chain: ["Feature UI", pick("Frontend"), "Engine API", pick("Backend"), "AI Module", pick("Agent"), "Data Layer", pick("数据")].filter((v, i, a) => a.indexOf(v) === i),
    });
  }
  return chains;
}

export async function fetchRepoSource(fullName: string): Promise<{ intel: SourceIntel; degraded?: string }> {
  const cached = getCachedSource(fullName);
  if (cached) return { intel: cached };

  const [owner, name] = fullName.split("/");
  // 1. README (raw CDN — no API limit)
  let readme: string | null = null;
  for (const p of README_PATHS) {
    const t = await fetchRaw(fullName, p);
    if (t) { readme = t; break; }
  }
  // 2. Manifest (raw CDN)
  let manifest: { file: string; text: string } | undefined;
  for (const p of MANIFEST_PATHS) {
    const t = await fetchRaw(fullName, p);
    if (t) { manifest = { file: p, text: t }; break; }
  }
  // 3. File tree (API — rate limited)
  let tree: string[] | null = null;
  let degraded: string | undefined;
  try {
    tree = await fetchTree(fullName);
  } catch {
    degraded = "目录树抓取受限，已基于 README/依赖分析";
  }
  if (!tree && (readme || manifest)) degraded = "目录树未获取（限流/未公开），已基于 README/依赖分析";

  const intel = buildSourceIntel({ fullName, owner, name, description: null, language: null, topics: [] }, { readme: readme ?? undefined, manifest, tree: tree ?? undefined });
  intel.description = intel.description || fullName;
  writeCache(intel);
  return { intel, degraded };
}
