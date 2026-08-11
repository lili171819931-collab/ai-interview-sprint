/** Cap-inspired UX helpers: soft cues + formatting */

export function playCue(kind: "start" | "stop" | "pause" | "success") {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    if (kind === "start") {
      o.frequency.setValueAtTime(880, now);
      o.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    } else if (kind === "stop") {
      o.frequency.setValueAtTime(660, now);
      o.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    } else if (kind === "pause") {
      o.frequency.setValueAtTime(520, now);
    } else {
      o.frequency.setValueAtTime(740, now);
      o.frequency.exponentialRampToValueAtTime(1180, now + 0.1);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.start(now);
    o.stop(now + 0.18);
    o.onended = () => void ctx.close();
  } catch {
    // ignore autoplay / audio restrictions
  }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}

export const CAM_PRESETS = [
  { id: "s", label: "S", diameter: 140 },
  { id: "m", label: "M", diameter: 200 },
  { id: "l", label: "L", diameter: 280 },
] as const;
