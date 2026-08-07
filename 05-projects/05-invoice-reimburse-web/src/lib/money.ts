/** Money helpers: store integer cents to avoid float errors. */

export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

export function centsToYuan(cents: number): number {
  return cents / 100;
}

export function formatCNY(cents: number): string {
  return `¥${centsToYuan(cents).toFixed(2)}`;
}

export function nearlyEqualCents(a: number, b: number, tol = 1): boolean {
  return Math.abs(a - b) <= tol;
}

export function parseYuanInput(raw: string | number): number {
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[,¥\s]/g, ""));
  if (Number.isNaN(n)) return 0;
  return yuanToCents(n);
}
