// ============ 导出与分享工具 ============

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m % 60)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export interface TimedCaption {
  start: number; // 秒
  end: number;
  text: string;
}

/** 生成 SRT 字幕文件 */
export function toSrt(captions: TimedCaption[]): string {
  const fmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  };
  return captions
    .filter((c) => c.text.trim())
    .map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text.trim()}\n`)
    .join("\n");
}

/** 生成 WebVTT 字幕文件 */
export function toVtt(captions: TimedCaption[]): string {
  const fmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  };
  return "WEBVTT\n\n" + captions
    .filter((c) => c.text.trim())
    .map((c) => `${fmt(c.start)} --> ${fmt(c.end)}\n${c.text.trim()}\n`)
    .join("\n");
}

export interface PlatformTarget {
  id: string;
  name: string;
  emoji: string;
  uploadUrl: string;
  /** 是否支持通过剪贴板复制视频（Chromium） */
  clipboard?: boolean;
}

export const PLATFORMS: PlatformTarget[] = [
  { id: "tiktok", name: "TikTok", emoji: "🎵", uploadUrl: "https://www.tiktok.com/upload", clipboard: true },
  { id: "youtube", name: "YouTube", emoji: "▶️", uploadUrl: "https://studio.youtube.com", clipboard: true },
  { id: "xiaohongshu", name: "小红书", emoji: "📕", uploadUrl: "https://creator.xiaohongshu.com/publish/publish", clipboard: true },
  { id: "douyin", name: "抖音", emoji: "🎶", uploadUrl: "https://creator.douyin.com/creator-micro/content/upload", clipboard: true },
];

export const platformById = (id: string): PlatformTarget | undefined => PLATFORMS.find((p) => p.id === id);

/** 复制视频文件到剪贴板（Chromium 支持粘贴到上传页） */
export async function copyVideoToClipboard(blob: Blob): Promise<boolean> {
  try {
    const item = new ClipboardItem({ [blob.type || "video/webm"]: blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

export function openPlatform(id: string) {
  const p = platformById(id);
  if (p) window.open(p.uploadUrl, "_blank", "noopener");
}
