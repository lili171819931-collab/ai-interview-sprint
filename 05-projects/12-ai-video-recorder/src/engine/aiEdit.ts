import type { EditPlan, EditSegment, TemplateDef } from "../types";

// ============ AI 智能剪辑：能量分析 -> 剪辑方案 -> 智能重渲染 ============

export interface EnergySample {
  t: number; // 起始时间
  rms: number;
}

/** 从视频/音频 blob 提取每 250ms 能量（RMS） */
export async function analyzeAudioEnergy(blob: Blob): Promise<EnergySample[]> {
  const ctx = new AudioContext();
  try {
    const buf = await blob.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const sr = audio.sampleRate;
    const win = Math.floor(sr * 0.25); // 250ms
    const out: EnergySample[] = [];
    for (let i = 0; i + win <= data.length; i += win) {
      let sum = 0;
      for (let j = 0; j < win; j++) sum += data[i + j] * data[i + j];
      const rms = Math.sqrt(sum / win);
      out.push({ t: i / sr, rms });
    }
    return out;
  } finally {
    try { await ctx.close(); } catch { /* noop */ }
  }
}

/**
 * 生成剪辑方案：
 * - 能量 > speechThr 视为人声/内容，保留
 * - 能量 > highlightThr 视为高光，标记
 * - 静音段剪除（前后各留 padding）
 * - 开头/结尾保留 intro/outro 片段
 */
export function buildEditPlan(
  energy: EnergySample[],
  duration: number,
  opts: { speechThr?: number; highlightThr?: number; minKeep?: number; padding?: number; keepIntro?: number; keepOutro?: number } = {},
): EditPlan {
  const speechThr = opts.speechThr ?? 0.02;
  const highlightThr = opts.highlightThr ?? 0.06;
  const minKeep = opts.minKeep ?? 0.8;
  const padding = opts.padding ?? 0.4;
  const keepIntro = opts.keepIntro ?? 1.2;
  const keepOutro = opts.keepOutro ?? 0.8;
  const win = energy.length > 0 ? energy[1]?.t - energy[0]?.t || 0.25 : 0.25;

  const active = (t: number) => {
    const idx = Math.min(energy.length - 1, Math.max(0, Math.floor(t / win)));
    return energy[idx]?.rms ?? 0;
  };

  // 1. 粗分活动/静音区间
  const raw: { start: number; end: number; active: boolean; peak: number }[] = [];
  let cur: { start: number; end: number; active: boolean; peak: number } | null = null;
  const step = win;
  for (let t = 0; t < duration; t += step) {
    const rms = active(t);
    const isActive = rms > speechThr;
    if (!cur || cur.active !== isActive) {
      if (cur) raw.push(cur);
      cur = { start: t, end: Math.min(t + step, duration), active: isActive, peak: rms };
    } else {
      cur.end = Math.min(t + step, duration);
      cur.peak = Math.max(cur.peak, rms);
    }
  }
  if (cur) raw.push(cur);

  // 2. 加 padding、合并过短片段
  const merged: typeof raw = [];
  for (const seg of raw) {
    let s = Math.max(0, seg.start - padding);
    let e = Math.min(duration, seg.end + padding);
    // 与上一片段合并（gap 过小）
    const prev = merged[merged.length - 1];
    if (prev && prev.active === seg.active && s - prev.end < 0.3) {
      prev.end = e;
      prev.peak = Math.max(prev.peak, seg.peak);
      continue;
    }
    if (!seg.active && e - s < 0.5) continue; // 丢弃短静音
    if (seg.active && e - s < minKeep) {
      // 过短活动段并入前后
      if (prev && !prev.active) prev.end = e;
      continue;
    }
    merged.push({ start: s, end: e, active: seg.active, peak: seg.peak });
  }

  // 3. 转成保留片段列表
  const segments: EditSegment[] = [];
  let firstActive = true;
  for (const seg of merged) {
    if (seg.active) {
      if (firstActive && seg.start > 0) {
        segments.push({ start: 0, end: Math.min(seg.start, keepIntro), keep: true, reason: "intro" });
      }
      firstActive = false;
      const reason: EditSegment["reason"] = seg.peak > highlightThr ? "highlight" : "speech";
      segments.push({ start: seg.start, end: seg.end, keep: true, reason });
    } else {
      segments.push({ start: seg.start, end: seg.end, keep: false, reason: "silence" });
    }
  }
  if (segments.length === 0) {
    segments.push({ start: 0, end: Math.min(duration, 1), keep: true, reason: "intro" });
  } else if (segments[segments.length - 1].end < duration) {
    const last = segments[segments.length - 1];
    if (last.keep) last.end = Math.min(duration, last.end + keepOutro);
    else segments.push({ start: last.end, end: Math.min(duration, last.end + keepOutro), keep: true, reason: "outro" });
  }

  let totalKeep = 0, totalTrim = 0, highlights = 0, silenceCuts = 0;
  for (const s of segments) {
    if (s.keep) { totalKeep += s.end - s.start; if (s.reason === "highlight") highlights++; }
    else { totalTrim += s.end - s.start; silenceCuts++; }
  }

  return { segments, totalKeep, totalTrim, highlights, silenceCuts };
}

/** 播放进度回调 */
export interface ReplayCallbacks {
  onProgress?: (pct: number, label: string) => void;
  onDone?: () => void;
}

/**
 * 智能重渲染：把原录像按剪辑方案回放绘制到画布并重新录制。
 * 可叠加字幕与背景音乐，输出最终视频 blob。
 */
export async function renderEditedVideo(opts: {
  videoUrl: string;
  plan: EditPlan;
  template: TemplateDef;
  subtitleText?: string;
  bgmId?: string | null;
  onProgress?: (pct: number, label: string) => void;
}): Promise<Blob> {
  const { videoUrl, plan, template, subtitleText, bgmId, onProgress } = opts;

  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  await new Promise<void>((res, rej) => {
    video.onloadedmetadata = () => res();
    video.onerror = () => rej(new Error("视频加载失败"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = canvas.getContext("2d")!;
  const W = template.width, H = template.height;

  const stream = canvas.captureStream(template.fps);

  // 音频：原声 + 可选 BGM
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  let audioSrc: MediaStreamAudioSourceNode | null = null;
  try {
    const vStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
    if (vStream && vStream.getAudioTracks().length > 0) {
      audioSrc = audioCtx.createMediaStreamSource(new MediaStream([vStream.getAudioTracks()[0]]));
      audioSrc.connect(dest);
    }
  } catch { /* 某些浏览器不支持 video.captureStream 音频 */ }

  let bgmGain: GainNode | null = null;
  if (bgmId) {
    const { synthesizeBgm } = await import("./bgm");
    const { BGM_TRACKS } = await import("./bgm");
    const track = BGM_TRACKS.find((t) => t.id === bgmId);
    if (track) {
      const buf = synthesizeBgm(audioCtx, track, 16);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      bgmGain = audioCtx.createGain();
      bgmGain.gain.value = 0.4;
      src.connect(bgmGain);
      bgmGain.connect(dest);
      src.start();
    }
  }
  stream.addTrack(dest.stream.getAudioTracks()[0]);

  const mime = pickMimeType();
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
  });
  recorder.start(200);

  const kept = plan.segments.filter((s) => s.keep);
  const total = kept.reduce((a, s) => a + (s.end - s.start), 0);
  let played = 0;

  await audioCtx.resume();

  for (const seg of kept) {
    await new Promise<void>(async (resolveSeg) => {
      video.currentTime = seg.start;
      await new Promise<void>((res) => {
        video.onseeked = () => res();
        setTimeout(() => res(), 300);
      });
      const start = performance.now();
      const stamp = video.currentTime;
      const draw = () => {
        // 绘制当前帧到画布
        ctx.fillStyle = template.bg;
        ctx.fillRect(0, 0, W, H);
        if (video.videoWidth > 0) {
          const cov = coverFitLocal(video.videoWidth, video.videoHeight, W, H);
          ctx.drawImage(video, cov.dx, cov.dy, cov.w, cov.h);
        }
        // 字幕
        if (subtitleText) {
          const size = Math.max(18, Math.round(template.subtitle.fontSize * H / 1080));
          ctx.font = `700 ${size}px system-ui, "PingFang SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const lines = wrapText(ctx, subtitleText, W * 0.88, size);
          const lineH = size * 1.4;
          const blockH = lines.length * lineH + size * 0.7;
          const y = template.subtitle.position === "bottom" ? H - blockH - H * 0.05 : H * 0.05;
          ctx.fillStyle = template.subtitle.bg;
          ctx.fillRect((W - (W * 0.88)) / 2, y, W * 0.88, blockH);
          ctx.fillStyle = template.subtitle.color;
          lines.forEach((l, i) => ctx.fillText(l, W / 2, y + size * 0.35 + i * lineH + lineH / 2));
        }
        // 进度
        const now = video.currentTime;
        const segPlayed = Math.max(0, now - stamp);
        played = Math.min(total, played + (now - stamp));
        onProgress?.(Math.round((played / total) * 100), "AI 智能剪辑渲染中…");
        if (now >= seg.end || now >= video.duration) {
          resolveSeg();
          return;
        }
        if (video.paused) video.play().catch(() => {});
        requestAnimationFrame(draw);
      };
      video.play().catch(() => {});
      requestAnimationFrame(draw);
      // 兜底：防止卡死
      setTimeout(() => resolveSeg(), (seg.end - seg.start) * 1000 + 3000);
    });
  }

  video.pause();
  recorder.stop();
  await audioCtx.close();
  return done;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number) {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    let line = raw.trim();
    while (line && ctx.measureText(line).width > maxW) {
      let cut = line.length;
      while (cut > 0 && ctx.measureText(line.slice(0, cut)).width > maxW) cut--;
      lines.push(line.slice(0, cut));
      line = line.slice(cut).trim();
    }
    if (line) lines.push(line);
  }
  return lines;
}

function coverFitLocal(vw: number, vh: number, dw: number, dh: number) {
  const s = Math.max(dw / vw, dh / vh);
  const w = vw * s, h = vh * s;
  return { dx: (dw - w) / 2, dy: (dh - h) / 2, w, h };
}

export function pickMimeType(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}
