export async function execute(input: Record<string, any>, ctx: any) {
  const numbers = Array.isArray(input.numbers) ? input.numbers.filter((n: unknown) => typeof n === "number") : [];
  if (numbers.length === 0) return { error: "no numeric data", report: null };
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((a: number, b: number) => a + b, 0);
  const mean = sum / numbers.length;
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const variance = numbers.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / numbers.length;
  const buckets = [0, 0, 0];
  for (const n of numbers) {
    if (n < mean - Math.sqrt(variance) / 2) buckets[0]++;
    else if (n > mean + Math.sqrt(variance) / 2) buckets[2]++;
    else buckets[1]++;
  }
  return {
    label: input.label ?? "dataset",
    count: numbers.length,
    sum: Math.round(sum * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev: Math.round(Math.sqrt(variance) * 100) / 100,
    distribution: { low: buckets[0], middle: buckets[1], high: buckets[2] },
    report: `「${input.label ?? "dataset"}」共 ${numbers.length} 条，均值 ${Math.round(mean * 100) / 100}，中位数 ${median}，范围 [${sorted[0]}, ${sorted[sorted.length - 1]}]，标准差 ${Math.round(Math.sqrt(variance) * 100) / 100}。`,
  };
}
