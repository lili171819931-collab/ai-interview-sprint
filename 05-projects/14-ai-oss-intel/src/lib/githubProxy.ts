/**
 * Client-side proxy to the server GitHub API client.
 * All browser requests go through /api/github/* so the token never leaves the
 * server and rate limiting/retry/cache/queue are managed server-side.
 * Returns null on failure so callers can fall back to direct fetch.
 */
"use client";

export async function proxySearch(q: string, sort = "stars"): Promise<any | null> {
  try {
    const res = await fetch(`/api/github/search?q=${encodeURIComponent(q)}&sort=${encodeURIComponent(sort)}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function proxyRepo(fullName: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/github/repos/${encodeURIComponent(fullName)}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function proxyTree(fullName: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/github/trees/${encodeURIComponent(fullName)}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function proxyStarred(user: string): Promise<any[] | null> {
  try {
    const res = await fetch(`/api/github/starred?user=${encodeURIComponent(user)}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    }
  } catch {}
  return null;
}

export async function proxyHealth(): Promise<any | null> {
  try {
    const res = await fetch(`/api/github/health`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function proxyQueue(): Promise<any | null> {
  try {
    const res = await fetch(`/api/github/queue`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}
