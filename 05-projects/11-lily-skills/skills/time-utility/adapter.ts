export async function execute(input: Record<string, any>, ctx: any) {
  const now = new Date();
  const format = String(input.format ?? "iso");
  const iso = now.toISOString();
  const local = now.toString();
  const date = iso.slice(0, 10);
  const datetime = iso.slice(0, 19).replace("T", " ");
  const timestamp = now.getTime();
  const out = { iso, local, date, datetime, timestamp, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  if (format === "date") return { value: date, format };
  if (format === "datetime") return { value: datetime, format };
  if (format === "timestamp") return { value: timestamp, format };
  return { ...out, format: "iso" };
}
