export type FeedItem = {
  title: string;
  url?: string;
  publishedAt?: string;
  summary?: string;
};

export type FetchResult =
  | { ok: true; items: FeedItem[]; fetchedAt: string }
  | { ok: false; error: string; fetchedAt: string };

const UA = "ai-radar-dashboard/0.1 (+https://github.com/lili171819931-collab/ai-interview-sprint; research day-refresh)";

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function tag(block: string, name: string): string | undefined {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i");
  const m = block.match(re);
  if (!m) return undefined;
  // CDATA must be unwrapped before stripping tags, or titles become empty
  const text = decodeXml(m[1])
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

function attr(block: string, el: string, attrName: string): string | undefined {
  const re = new RegExp(`<${el}[^>]*\\s${attrName}=["']([^"']+)["'][^>]*\\/?>`, "i");
  const m = block.match(re);
  return m?.[1];
}

export function parseRssOrAtom(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  const rssBlocks = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  for (const block of rssBlocks) {
    const title = tag(block, "title");
    if (!title) continue;
    const link = tag(block, "link") || attr(block, "link", "href");
    const publishedAt = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published");
    const summary = tag(block, "description") || tag(block, "summary");
    items.push({ title, url: link, publishedAt, summary: summary?.slice(0, 240) });
  }

  if (items.length) return items;

  const atomBlocks = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  for (const block of atomBlocks) {
    const title = tag(block, "title");
    if (!title) continue;
    const link = attr(block, "link", "href") || tag(block, "link");
    const publishedAt = tag(block, "updated") || tag(block, "published");
    const summary = tag(block, "summary") || tag(block, "content");
    items.push({ title, url: link, publishedAt, summary: summary?.slice(0, 240) });
  }

  return items;
}

/** Best-effort public changelog HTML → first headings (Cursor etc.) */
export function parseChangelogHtml(html: string, baseUrl: string): FeedItem[] {
  const items: FeedItem[] = [];
  const headingRe = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) && items.length < 5) {
    const title = decodeXml(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    if (!title || title.length < 3) continue;
    if (/changelog|cursor/i.test(title) && title.length < 20) continue;
    items.push({ title, url: baseUrl, publishedAt: undefined });
  }
  return items;
}

export async function fetchText(
  url: string,
  timeoutMs = 12000,
): Promise<{ status: number; body: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
      },
      redirect: "follow",
    });
    const body = await res.text();
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFeed(url: string, kind: "rss" | "html-changelog"): Promise<FetchResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const { status, body } = await fetchText(url);
    if (status >= 400) {
      return { ok: false, error: `HTTP ${status}`, fetchedAt };
    }
    const items =
      kind === "html-changelog" ? parseChangelogHtml(body, url) : parseRssOrAtom(body);
    if (!items.length) {
      return { ok: false, error: "no items parsed", fetchedAt };
    }
    return { ok: true, items, fetchedAt };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg, fetchedAt };
  }
}

export function toIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function shanghaiDay(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
