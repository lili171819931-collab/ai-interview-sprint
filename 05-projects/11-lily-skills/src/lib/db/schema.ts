import type { Db } from "./connection";

/**
 * Lily-Skills database schema.
 *
 * Design notes:
 * - Skills are first-class capabilities with versioned manifests.
 * - Skill metadata (category, tags, permissions, dependencies) is normalized
 *   into relational tables so the registry, search and recommendation engine
 *   can query them efficiently.
 * - Execution, agent and workflow tables keep a full audit trail.
 */
export function createSchema(db: Db): void {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    avatar     TEXT,
    role       TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skill_categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    icon        TEXT,
    parent_id   TEXT REFERENCES skill_categories(id) ON DELETE SET NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skill_tags (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    version         TEXT NOT NULL DEFAULT '1.0.0',
    description     TEXT NOT NULL DEFAULT '',
    category_id     TEXT REFERENCES skill_categories(id) ON DELETE SET NULL,
    icon            TEXT,
    author          TEXT NOT NULL DEFAULT 'Lily',
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft','testing','active','deprecated','archived')),
    execution_type  TEXT NOT NULL DEFAULT 'local'
                    CHECK (execution_type IN ('local','api','cli','mcp','webhook','composite','echo','http','knowledge')),
    endpoint        TEXT,
    command         TEXT,
    input_schema    TEXT NOT NULL DEFAULT '{}',
    output_schema   TEXT NOT NULL DEFAULT '{}',
    permissions     TEXT NOT NULL DEFAULT '[]',
    ai_description  TEXT,
    use_cases       TEXT NOT NULL DEFAULT '[]',
    examples        TEXT NOT NULL DEFAULT '[]',
    risk_level      TEXT NOT NULL DEFAULT 'low'
                    CHECK (risk_level IN ('low','medium','high','critical')),
    health_status   TEXT NOT NULL DEFAULT 'healthy'
                    CHECK (health_status IN ('healthy','degraded','down','unknown')),
    health_checked_at TEXT,
    config          TEXT NOT NULL DEFAULT '{}',
    source          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual','auto','import')),
    source_path     TEXT,
    usage_count     INTEGER NOT NULL DEFAULT 0,
    success_count   INTEGER NOT NULL DEFAULT 0,
    failure_count   INTEGER NOT NULL DEFAULT 0,
    last_used_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);
  CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
  CREATE INDEX IF NOT EXISTS idx_skills_usage ON skills(usage_count DESC);

  CREATE TABLE IF NOT EXISTS skill_versions (
    id         TEXT PRIMARY KEY,
    skill_id   TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version    TEXT NOT NULL,
    changelog  TEXT,
    manifest   TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_skill_versions_skill ON skill_versions(skill_id);

  CREATE TABLE IF NOT EXISTS skill_tag_map (
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    tag_id   TEXT NOT NULL REFERENCES skill_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS skill_dependencies (
    id                   TEXT PRIMARY KEY,
    skill_id             TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    depends_on_skill_id  TEXT REFERENCES skills(id) ON DELETE SET NULL,
    name                 TEXT NOT NULL,
    kind                 TEXT NOT NULL DEFAULT 'skill'
                         CHECK (kind IN ('skill','package','api','tool')),
    version_constraint   TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_deps_skill ON skill_dependencies(skill_id);

  CREATE TABLE IF NOT EXISTS skill_permissions (
    id                TEXT PRIMARY KEY,
    skill_id          TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    permission        TEXT NOT NULL
                      CHECK (permission IN ('read','write','external_api','file','browser','social_media','email','database','payment','network')),
    scope             TEXT,
    requires_approval INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_perms_skill ON skill_permissions(skill_id);

  CREATE TABLE IF NOT EXISTS skill_executions (
    id               TEXT PRIMARY KEY,
    skill_id         TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    status           TEXT NOT NULL DEFAULT 'queued'
                     CHECK (status IN ('queued','running','completed','failed','cancelled','awaiting_approval')),
    input            TEXT NOT NULL DEFAULT '{}',
    output           TEXT,
    error            TEXT,
    trigger          TEXT NOT NULL DEFAULT 'manual'
                     CHECK (trigger IN ('manual','agent','workflow','api','composite')),
    workflow_run_id  TEXT,
    agent_session_id TEXT,
    retry_count      INTEGER NOT NULL DEFAULT 0,
    logs             TEXT NOT NULL DEFAULT '[]',
    started_at       TEXT,
    finished_at      TEXT,
    duration_ms      INTEGER,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_exec_skill ON skill_executions(skill_id);
  CREATE INDEX IF NOT EXISTS idx_exec_status ON skill_executions(status);
  CREATE INDEX IF NOT EXISTS idx_exec_created ON skill_executions(created_at DESC);

  CREATE TABLE IF NOT EXISTS skill_usage_stats (
    id                  TEXT PRIMARY KEY,
    skill_id            TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    date                TEXT NOT NULL,
    usage_count         INTEGER NOT NULL DEFAULT 0,
    success_count       INTEGER NOT NULL DEFAULT 0,
    failure_count       INTEGER NOT NULL DEFAULT 0,
    total_duration_ms   INTEGER NOT NULL DEFAULT 0,
    avg_duration_ms     INTEGER NOT NULL DEFAULT 0,
    ai_recommended_count INTEGER NOT NULL DEFAULT 0,
    ai_accepted_count   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (skill_id, date)
  );

  CREATE TABLE IF NOT EXISTS workflows (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT,
    icon         TEXT,
    status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','active','archived')),
    trigger_type TEXT NOT NULL DEFAULT 'manual'
                 CHECK (trigger_type IN ('manual','schedule','webhook')),
    schedule     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workflow_nodes (
    id          TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_key    TEXT NOT NULL,
    type        TEXT NOT NULL
                CHECK (type IN ('skill','ai','condition','loop','transform','input','output','webhook','human_approval','trigger')),
    config      TEXT NOT NULL DEFAULT '{}',
    position    TEXT NOT NULL DEFAULT '{}',
    edges       TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_wnodes_workflow ON workflow_nodes(workflow_id);

  CREATE TABLE IF NOT EXISTS workflow_runs (
    id           TEXT PRIMARY KEY,
    workflow_id  TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','running','awaiting_approval','completed','failed','cancelled')),
    current_node TEXT,
    result       TEXT,
    error        TEXT,
    logs         TEXT NOT NULL DEFAULT '[]',
    started_at   TEXT,
    finished_at  TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_wruns_workflow ON workflow_runs(workflow_id);

  CREATE TABLE IF NOT EXISTS agent_sessions (
    id         TEXT PRIMARY KEY,
    title      TEXT,
    status     TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_messages (
    id         TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user','agent','system')),
    content    TEXT NOT NULL,
    metadata   TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_amsg_session ON agent_messages(session_id);

  CREATE TABLE IF NOT EXISTS agent_plans (
    id         TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    task       TEXT NOT NULL,
    steps      TEXT NOT NULL DEFAULT '[]',
    status     TEXT NOT NULL DEFAULT 'proposed'
               CHECK (status IN ('proposed','approved','running','completed','failed','cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_tool_calls (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    plan_id     TEXT REFERENCES agent_plans(id) ON DELETE SET NULL,
    skill_id    TEXT REFERENCES skills(id) ON DELETE SET NULL,
    execution_id TEXT,
    step_index  INTEGER NOT NULL DEFAULT 0,
    input       TEXT NOT NULL DEFAULT '{}',
    output      TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_atc_session ON agent_tool_calls(session_id);

  CREATE TABLE IF NOT EXISTS recommendations (
    id         TEXT PRIMARY KEY,
    session_id TEXT,
    skill_id   TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score      REAL NOT NULL DEFAULT 0,
    reasons    TEXT NOT NULL DEFAULT '[]',
    accepted   INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    skill_id   TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (skill_id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id          TEXT PRIMARY KEY,
    actor       TEXT NOT NULL DEFAULT 'system',
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    detail      TEXT NOT NULL DEFAULT '{}',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

  CREATE TABLE IF NOT EXISTS system_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '{}'
  );
  `);
}
