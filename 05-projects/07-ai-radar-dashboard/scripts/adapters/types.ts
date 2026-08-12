import type { AdapterMetadata, AdapterResult, FetchContext, IntelItem } from "../../src/lib/intel/types";

export interface SourceAdapter {
  readonly meta: AdapterMetadata;
  fetch(ctx: FetchContext): Promise<unknown>;
  normalize(raw: unknown, ctx: FetchContext): Promise<IntelItem[]>;
  validate(items: IntelItem[]): IntelItem[];
  getMetadata(): AdapterMetadata;
}

export async function runAdapter(adapter: SourceAdapter, ctx: FetchContext): Promise<AdapterResult> {
  const fetchedAt = ctx.now.toISOString();
  try {
    const raw = await adapter.fetch(ctx);
    const normalized = await adapter.normalize(raw, ctx);
    const items = adapter.validate(normalized);
    return {
      adapterId: adapter.meta.id,
      ok: true,
      items,
      fetchedAt,
      rawCount: Array.isArray(raw) ? raw.length : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      adapterId: adapter.meta.id,
      ok: false,
      items: [],
      error: msg,
      fetchedAt,
    };
  }
}
