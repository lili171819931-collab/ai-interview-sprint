import { json, handle, readBody, ctx } from "../helpers";
import { listCategories } from "@/lib/core/skill-registry";
import { newId, slugify } from "@/lib/core/types";

export async function GET() {
  return json({ categories: listCategories(ctx().db) });
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const db = ctx().db;
    const name = String(body.name ?? "");
    if (!name) throw new Error("name is required");
    const existing = db.prepare("SELECT id FROM skill_categories WHERE slug = ?").get(slugify(name));
    if (existing) throw new Error(`Category "${name}" already exists`);
    const id = newId("cat");
    db.prepare(
      "INSERT INTO skill_categories (id, name, slug, description, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(id, name, slugify(name), body.description ? String(body.description) : null, body.icon ? String(body.icon) : null, body.parentId ? String(body.parentId) : null, Number(body.sortOrder ?? 0));
    return { category: db.prepare("SELECT * FROM skill_categories WHERE id = ?").get(id), ok: true };
  });
}
