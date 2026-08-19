import fs from "node:fs";
import path from "node:path";
import type { Db } from "../db/connection";
import type {
  Json,
  Manifest,
  SkillRow,
  SkillDetail,
  CategoryRow,
  TagRow,
  SkillStatus,
  ExecutionType,
  RiskLevel,
} from "./types";
import { newId, nowIso, parseJson, slugify } from "./types";

export interface RegisterOptions {
  source?: "manual" | "auto" | "import";
  sourcePath?: string | null;
  /** Replace existing record (by slug) instead of erroring. */
  upsert?: boolean;
}

export interface ListSkillFilters {
  categoryId?: string | null;
  tag?: string | null;
  status?: string | null;
  executionType?: string | null;
  q?: string | null;
  favorite?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

const DEFAULT_CATEGORIES: { name: string; icon: string; description: string }[] = [
  { name: "AI & Research", icon: "🤖", description: "AI 研究与情报" },
  { name: "Content Creation", icon: "✍️", description: "内容创作" },
  { name: "Marketing", icon: "📣", description: "市场营销" },
  { name: "Social Media", icon: "📱", description: "社交媒体" },
  { name: "Data Analysis", icon: "📊", description: "数据分析" },
  { name: "Productivity", icon: "⚡", description: "效率工具" },
  { name: "Business", icon: "💼", description: "商业" },
  { name: "Career", icon: "🚀", description: "职业发展" },
  { name: "Knowledge Management", icon: "🧠", description: "知识管理" },
  { name: "Design", icon: "🎨", description: "设计" },
  { name: "Development", icon: "💻", description: "开发" },
  { name: "Automation", icon: "🔁", description: "自动化" },
  { name: "Finance", icon: "💰", description: "财务" },
  { name: "Travel", icon: "✈️", description: "旅行" },
  { name: "Personal Life", icon: "🌱", description: "个人生活" },
  { name: "Other", icon: "📦", description: "其他" },
];

export function ensureDefaultCategories(db: Db): void {
  const existing = db.prepare("SELECT COUNT(*) AS c FROM skill_categories").get() as { c: number };
  if (existing.c > 0) return;
  DEFAULT_CATEGORIES.forEach((cat, i) => {
    db.prepare(
      "INSERT INTO skill_categories (id, name, slug, description, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(newId("cat"), cat.name, slugify(cat.name), cat.description, cat.icon, i);
  });
}

export function ensureDefaultUser(db: Db): void {
  const user = db.prepare("SELECT id FROM users LIMIT 1").get();
  if (!user) {
    db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)").run(
      newId("user"),
      "Lily",
      "lily@lily-skills.local",
      "owner",
    );
  }
}

export function listSkills(db: Db, filters: ListSkillFilters = {}): SkillDetail[] {
  const where: string[] = [];
  const params: (string | number | null)[] = [];
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  if (filters.categoryId) {
    where.push("s.category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.status) {
    where.push("s.status = ?");
    params.push(filters.status);
  } else {
    where.push("s.status != 'archived'");
  }
  if (filters.executionType) {
    where.push("s.execution_type = ?");
    params.push(filters.executionType);
  }
  if (filters.favorite) {
    where.push("EXISTS (SELECT 1 FROM favorites f WHERE f.skill_id = s.id)");
  }
  if (filters.tag) {
    where.push(
      "EXISTS (SELECT 1 FROM skill_tag_map tm JOIN skill_tags t ON t.id = tm.tag_id WHERE tm.skill_id = s.id AND (t.name = ? OR t.slug = ?))",
    );
    params.push(filters.tag, filters.tag);
  }
  if (filters.q) {
    where.push(
      `(s.name LIKE ? OR s.description LIKE ? OR s.ai_description LIKE ?
        OR EXISTS (SELECT 1 FROM skill_tag_map tm2 JOIN skill_tags t2 ON t2.id = tm2.tag_id WHERE tm2.skill_id = s.id AND t2.name LIKE ?)
        OR EXISTS (SELECT 1 FROM skill_categories c2 WHERE c2.id = s.category_id AND c2.name LIKE ?))`,
    );
    const like = `%${filters.q}%`;
    params.push(like, like, like, like, like);
  }

  const orderBy: Record<string, string> = {
    relevance: "s.updated_at DESC",
    usage: "s.usage_count DESC",
    newest: "s.created_at DESC",
    success: "CASE WHEN s.usage_count = 0 THEN 0 ELSE s.success_count * 1.0 / s.usage_count END DESC",
    name: "s.name ASC",
  };
  const order = orderBy[filters.sort ?? "relevance"] ?? orderBy.relevance;

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT s.* FROM skills s ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as unknown as SkillRow[];
  return rows.map((r) => toDetail(db, r));
}

export function getSkill(db: Db, idOrSlug: string): SkillDetail | null {
  const row = db
    .prepare("SELECT * FROM skills WHERE id = ? OR slug = ?")
    .get(idOrSlug, idOrSlug) as SkillRow | undefined;
  return row ? toDetail(db, row) : null;
}

export function getSkillRow(db: Db, idOrSlug: string): SkillRow | null {
  const row = db
    .prepare("SELECT * FROM skills WHERE id = ? OR slug = ?")
    .get(idOrSlug, idOrSlug) as SkillRow | undefined;
  return row ?? null;
}

export function toDetail(db: Db, row: SkillRow): SkillDetail {
  const category = row.category_id
    ? (db.prepare("SELECT * FROM skill_categories WHERE id = ?").get(row.category_id) as CategoryRow | undefined)
    : undefined;
  const tags = (
    db
      .prepare(
        `SELECT t.name FROM skill_tag_map tm JOIN skill_tags t ON t.id = tm.tag_id WHERE tm.skill_id = ? ORDER BY t.name`,
      )
      .all(row.id) as { name: string }[]
  ).map((r) => r.name);
  const permissions_list = (
    db
      .prepare("SELECT permission FROM skill_permissions WHERE skill_id = ? ORDER BY permission")
      .all(row.id) as { permission: string }[]
  ).map((r) => r.permission);
  const dependencies_list = (
    db
      .prepare(
        "SELECT name, kind, version_constraint FROM skill_dependencies WHERE skill_id = ? ORDER BY name",
      )
      .all(row.id) as { name: string; kind: string; version_constraint: string | null }[]
  ).map((r) => ({
    name: r.name,
    kind: r.kind,
    version_constraint: r.version_constraint ?? null,
  }));
  return {
    ...row,
    category: category ?? null,
    tags,
    use_cases: parseJson<string[]>(row.use_cases, []),
    examples: parseJson<string[]>(row.examples, []),
    permissions_list: [...new Set([...permissions_list, ...parseJson<string[]>(row.permissions, [])])],
    dependencies_list,
  };
}

/** Create a skill from a manifest (manual or import). */
export function createSkill(db: Db, manifest: Manifest, opts: RegisterOptions = {}): SkillDetail {
  const slug = slugify(manifest.name);
  if (getSkillRow(db, slug)) {
    if (!opts.upsert) throw new Error(`Skill "${manifest.name}" already exists`);
    return updateFromManifest(db, slug, manifest, opts);
  }
  return insertSkill(db, manifest, opts);
}

/** Update an existing skill from a manifest (upsert path). */
export function updateFromManifest(db: Db, slug: string, manifest: Manifest, opts: RegisterOptions = {}): SkillDetail {
  const existing = getSkillRow(db, slug);
  if (!existing) throw new Error(`Skill ${slug} not found`);
  const categoryId = resolveCategoryId(db, manifest.category);
  const now = nowIso();
  db.prepare(
    `UPDATE skills SET name=?, version=?, description=?, category_id=?, icon=?, status=?, execution_type=?,
       endpoint=?, command=?, input_schema=?, output_schema=?, permissions=?, ai_description=?, use_cases=?,
       examples=?, risk_level=?, config=?, source=?, source_path=?, updated_at=? WHERE id=?`,
  ).run(
    manifest.name,
    manifest.version,
    manifest.description,
    categoryId,
    manifest.icon ?? existing.icon,
    (manifest.status ?? "active") as SkillStatus,
    manifest.execution_type as ExecutionType,
    manifest.endpoint ?? existing.endpoint,
    manifest.command ?? existing.command,
    JSON.stringify(manifest.input_schema ?? {}),
    JSON.stringify(manifest.output_schema ?? {}),
    JSON.stringify(manifest.permissions ?? []),
    manifest.ai_description ?? null,
    JSON.stringify(manifest.use_cases ?? []),
    JSON.stringify(manifest.examples ?? []),
    (manifest.risk_level ?? inferRisk(existing)) as RiskLevel,
    JSON.stringify(manifest.config ?? {}),
    opts.source ?? existing.source,
    opts.sourcePath ?? existing.source_path,
    now,
    existing.id,
  );
  syncTags(db, existing.id, manifest.tags ?? []);
  syncPermissions(db, existing.id, manifest.permissions ?? []);
  syncDependencies(db, existing.id, manifest.dependencies ?? []);
  recordVersion(db, existing.id, manifest);
  return getSkill(db, existing.id)!;
}

function insertSkill(db: Db, manifest: Manifest, opts: RegisterOptions): SkillDetail {
  const id = manifest.id && !getSkillRow(db, manifest.id) ? manifest.id : newId("skill");
  const categoryId = resolveCategoryId(db, manifest.category);
  const risk = manifest.risk_level ?? inferRisk(manifest);
  db.prepare(
    `INSERT INTO skills (id, name, slug, version, description, category_id, icon, author, status, execution_type,
       endpoint, command, input_schema, output_schema, permissions, ai_description, use_cases, examples, risk_level,
       config, source, source_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    manifest.name,
    slugify(manifest.name),
    manifest.version,
    manifest.description,
    categoryId,
    manifest.icon ?? null,
    manifest.author ?? "Lily",
    (manifest.status ?? "active") as SkillStatus,
    manifest.execution_type as ExecutionType,
    manifest.endpoint ?? null,
    manifest.command ?? null,
    JSON.stringify(manifest.input_schema ?? {}),
    JSON.stringify(manifest.output_schema ?? {}),
    JSON.stringify(manifest.permissions ?? []),
    manifest.ai_description ?? null,
    JSON.stringify(manifest.use_cases ?? []),
    JSON.stringify(manifest.examples ?? []),
    risk,
    JSON.stringify(manifest.config ?? {}),
    opts.source ?? "manual",
    opts.sourcePath ?? null,
  );
  syncTags(db, id, manifest.tags ?? []);
  syncPermissions(db, id, manifest.permissions ?? []);
  syncDependencies(db, id, manifest.dependencies ?? []);
  recordVersion(db, id, manifest);
  return getSkill(db, id)!;
}

export function updateSkill(db: Db, id: string, patch: Partial<Manifest> & { status?: SkillStatus }): SkillDetail {
  const existing = getSkillRow(db, id);
  if (!existing) throw new Error(`Skill ${id} not found`);
  const merged: Manifest = {
    name: patch.name ?? existing.name,
    version: patch.version ?? existing.version,
    description: patch.description ?? existing.description,
    category: patch.category ?? "",
    tags: patch.tags ?? [],
    icon: patch.icon ?? existing.icon ?? undefined,
    status: patch.status ?? existing.status,
    execution_type: patch.execution_type ?? existing.execution_type,
    endpoint: patch.endpoint ?? existing.endpoint ?? undefined,
    command: patch.command ?? existing.command ?? undefined,
    input_schema: patch.input_schema ?? parseJson(existing.input_schema, {}),
    output_schema: patch.output_schema ?? parseJson(existing.output_schema, {}),
    permissions: patch.permissions ?? [],
    ai_description: patch.ai_description ?? existing.ai_description ?? undefined,
    use_cases: patch.use_cases ?? parseJson(existing.use_cases, []),
    examples: patch.examples ?? parseJson(existing.examples, []),
    risk_level: patch.risk_level ?? existing.risk_level,
    dependencies: patch.dependencies ?? [],
  };
  // Preserve category when patch doesn't include one
  const categoryId = patch.category
    ? resolveCategoryId(db, patch.category)
    : existing.category_id;
  const now = nowIso();
  db.prepare(
    `UPDATE skills SET name=?, version=?, description=?, category_id=?, icon=?, status=?, execution_type=?,
       endpoint=?, command=?, input_schema=?, output_schema=?, permissions=?, ai_description=?, use_cases=?,
       examples=?, risk_level=?, updated_at=? WHERE id=?`,
  ).run(
    merged.name,
    merged.version,
    merged.description,
    categoryId,
    merged.icon ?? null,
    merged.status as SkillStatus,
    merged.execution_type as ExecutionType,
    merged.endpoint ?? null,
    merged.command ?? null,
    JSON.stringify(merged.input_schema),
    JSON.stringify(merged.output_schema),
    JSON.stringify(merged.permissions),
    merged.ai_description ?? null,
    JSON.stringify(merged.use_cases),
    JSON.stringify(merged.examples),
    merged.risk_level as RiskLevel,
    now,
    existing.id,
  );
  if (patch.tags) syncTags(db, existing.id, patch.tags);
  if (patch.permissions) syncPermissions(db, existing.id, patch.permissions);
  if (patch.dependencies) syncDependencies(db, existing.id, patch.dependencies);
  return getSkill(db, existing.id)!;
}

export function deleteSkill(db: Db, id: string): void {
  const existing = getSkillRow(db, id);
  if (!existing) throw new Error(`Skill ${id} not found`);
  db.prepare("DELETE FROM skills WHERE id = ?").run(id);
  db.prepare("INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, detail) VALUES (?, 'system', 'skill:delete', 'skill', ?, ?)")
    .run(newId("audit"), id, JSON.stringify({ name: existing.name }));
}

function resolveCategoryId(db: Db, name: string | undefined): string | null {
  if (!name) return null;
  const slug = slugify(name);
  const existing = db.prepare("SELECT id FROM skill_categories WHERE slug = ? OR name = ?").get(slug, name) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = newId("cat");
  db.prepare("INSERT INTO skill_categories (id, name, slug, description) VALUES (?, ?, ?, ?)").run(
    id,
    name,
    slug,
    `自动创建分类: ${name}`,
  );
  return id;
}

function syncTags(db: Db, skillId: string, tags: string[]): void {
  db.prepare("DELETE FROM skill_tag_map WHERE skill_id = ?").run(skillId);
  for (const raw of tags) {
    const name = raw.trim();
    if (!name) continue;
    const slug = slugify(name);
    let tag = db.prepare("SELECT id FROM skill_tags WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!tag) {
      const id = newId("tag");
      db.prepare("INSERT INTO skill_tags (id, name, slug) VALUES (?, ?, ?)").run(id, name, slug);
      tag = { id };
    } else {
      db.prepare("UPDATE skill_tags SET name = ?, usage_count = usage_count + 1 WHERE id = ?").run(name, tag.id);
    }
    db.prepare("INSERT OR IGNORE INTO skill_tag_map (skill_id, tag_id) VALUES (?, ?)").run(skillId, tag.id);
  }
}

function syncPermissions(db: Db, skillId: string, permissions: string[]): void {
  db.prepare("DELETE FROM skill_permissions WHERE skill_id = ?").run(skillId);
  for (const permission of permissions) {
    db.prepare(
      "INSERT INTO skill_permissions (id, skill_id, permission, requires_approval) VALUES (?, ?, ?, ?)",
    ).run(newId("perm"), skillId, permission, permission === "write" ? 1 : 0);
  }
}

function syncDependencies(
  db: Db,
  skillId: string,
  deps: { name: string; kind?: string; version_constraint?: string }[],
): void {
  db.prepare("DELETE FROM skill_dependencies WHERE skill_id = ?").run(skillId);
  for (const dep of deps) {
    db.prepare(
      "INSERT INTO skill_dependencies (id, skill_id, name, kind, version_constraint) VALUES (?, ?, ?, ?, ?)",
    ).run(newId("dep"), skillId, dep.name, dep.kind ?? "skill", dep.version_constraint ?? null);
  }
}

function recordVersion(db: Db, skillId: string, manifest: Manifest): void {
  const existing = db
    .prepare("SELECT version FROM skill_versions WHERE skill_id = ? AND version = ?")
    .get(skillId, manifest.version) as { version: string } | undefined;
  if (!existing) {
    db.prepare(
      "INSERT INTO skill_versions (id, skill_id, version, manifest) VALUES (?, ?, ?, ?)",
    ).run(newId("ver"), skillId, manifest.version, JSON.stringify(manifest));
  }
}

function inferRisk(manifest: Manifest | SkillRow): RiskLevel {
  const perms = "permissions" in manifest && Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const endpoint = "endpoint" in manifest ? manifest.endpoint : undefined;
  if (perms.includes("payment") || perms.includes("social_media") || perms.includes("email")) return "high";
  if (perms.includes("write") || perms.includes("database")) return "medium";
  if (endpoint || manifest.execution_type === "http" || manifest.execution_type === "api" || manifest.execution_type === "cli") {
    return "medium";
  }
  return "low";
}

export function listCategories(db: Db): CategoryRow[] {
  return db
    .prepare("SELECT * FROM skill_categories ORDER BY sort_order ASC, name ASC")
    .all() as unknown as CategoryRow[];
}

export function listTags(db: Db, limit = 100): TagRow[] {
  return db.prepare("SELECT * FROM skill_tags ORDER BY usage_count DESC LIMIT ?").all(limit) as unknown as TagRow[];
}

/**
 * Scan a skills folder for `<name>/skill.json` manifests and register every
 * package found (idempotent upsert by slug). Returns the registered skills.
 */
export function scanSkillFolder(db: Db, folder: string): SkillDetail[] {
  if (!fs.existsSync(folder)) return [];
  const results: SkillDetail[] = [];
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(folder, entry.name, "skill.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
      const detail = createSkill(db, manifest, {
        source: "auto",
        sourcePath: path.relative(process.cwd(), path.join(folder, entry.name)),
        upsert: true,
      });
      results.push(detail);
    } catch (err) {
      console.warn(`[scan] skip ${entry.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return results;
}
