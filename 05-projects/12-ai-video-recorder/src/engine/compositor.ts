import type {
  Annotation,
  CropRect,
  PipRect,
  SubtitleState,
  TemplateDef,
  ZoomState,
} from "../types";

// ============ 画布合成引擎：屏幕 + 双摄像头 + 字幕 + 标注 + 裁剪/缩放 ============
export interface CompositorSources {
  screen?: MediaStream;
  camera1?: MediaStream;
  camera2?: MediaStream;
}

interface VideoSlot {
  el: HTMLVideoElement | null;
  ready: boolean;
}

function makeVideo(): HTMLVideoElement {
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.autoplay = true;
  return v;
}

export class Compositor {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fps: number;

  private screenSlot: VideoSlot = { el: null, ready: false };
  private cam1Slot: VideoSlot = { el: null, ready: false };
  private cam2Slot: VideoSlot = { el: null, ready: false };

  private screenStream: MediaStream | null = null;
  private cam1Stream: MediaStream | null = null;
  private cam2Stream: MediaStream | null = null;

  template: TemplateDef;
  crop: CropRect = { x: 0, y: 0, w: 1, h: 1 };
  zoom: ZoomState = { scale: 1, focusX: 0.5, focusY: 0.5, smooth: true };
  annotations: Annotation[] = [];
  subtitle: SubtitleState = { enabled: false, lines: [], fontSize: 46, color: "#ffffff", bg: "rgba(0,0,0,0.72)", position: "bottom", liveCaptions: false, liveText: "", timedEntries: [] };
  pipOverrides: Partial<Record<"cam1" | "cam2", Partial<PipRect>>> = {};
  watermark = "";
  showTimestamp = false;
  showGrid = false;
  backgroundImage: HTMLCanvasElement | null = null;

  private raf = 0;
  private lastT = 0;
  private currentScale = 1;
  private startTime = 0;

  constructor(canvas: HTMLCanvasElement, template: TemplateDef) {
    this.canvas = canvas;
    this.width = template.width;
    this.height = template.height;
    this.fps = template.fps;
    this.template = template;
    canvas.width = template.width;
    canvas.height = template.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  // ---------- 源 ----------
  setScreen(stream: MediaStream | null) {
    this.screenStream = stream;
    this.bindSlot(this.screenSlot, stream);
  }
  setCamera1(stream: MediaStream | null) {
    this.cam1Stream = stream;
    this.bindSlot(this.cam1Slot, stream);
  }
  setCamera2(stream: MediaStream | null) {
    this.cam2Stream = stream;
    this.bindSlot(this.cam2Slot, stream);
  }
  private bindSlot(slot: VideoSlot, stream: MediaStream | null) {
    if (!stream || stream.getVideoTracks().length === 0) {
      if (slot.el) { slot.el.srcObject = null; slot.el = null; }
      slot.ready = false;
      return;
    }
    if (!slot.el) slot.el = makeVideo();
    slot.el.srcObject = stream;
    slot.ready = false;
    slot.el.onloadedmetadata = () => {
      slot.el!.play().catch(() => {});
      slot.ready = true;
    };
    try { slot.el.play().catch(() => {}); } catch { /* noop */ }
  }

  // ---------- 控制 ----------
  start(loop = true) {
    this.startTime = performance.now();
    this.lastT = 0;
    this.currentScale = this.zoom.scale;
    if (loop) {
      cancelAnimationFrame(this.raf);
      const tick = (t: number) => {
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    } else {
      this.draw();
    }
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** 平滑缩放：每帧向目标 scale 靠近 */
  private updateScale() {
    if (!this.zoom.smooth) {
      this.currentScale = this.zoom.scale;
      return;
    }
    const k = 0.12;
    this.currentScale += (this.zoom.scale - this.currentScale) * k;
    if (Math.abs(this.zoom.scale - this.currentScale) < 0.002) this.currentScale = this.zoom.scale;
  }

  getCaptureStream(): MediaStream {
    return this.canvas.captureStream(this.fps);
  }

  // ---------- 绘制 ----------
  draw() {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 背景
    this.drawBackground(ctx);

    // 屏幕源
    const sRect = this.template.screen;
    const sX = sRect.x * W, sY = sRect.y * H, sW = sRect.w * W, sH = sRect.h * H;
    const screenVideo = this.screenSlot.el;
    if (screenVideo && this.screenSlot.ready && screenVideo.videoWidth > 0) {
      this.updateScale();
      const vw = screenVideo.videoWidth, vh = screenVideo.videoHeight;
      // 裁剪源矩形
      const cx = this.crop.x * vw, cy = this.crop.y * vh;
      const cw = Math.max(1, this.crop.w * vw), ch = Math.max(1, this.crop.h * vh);
      // 缩放：以焦点为锚点
      const z = Math.max(1, this.currentScale);
      const dw = sW / z, dh = sH / z;
      const fx = this.zoom.focusX, fy = this.zoom.focusY;
      const dx = sX + fx * (sW - dw);
      const dy = sY + fy * (sH - dh);
      ctx.save();
      this.clipRect(ctx, sX, sY, sW, sH, 0);
      // 覆盖模式：cover 到目标区域
      const cov = coverFit(cw, ch, dw, dh);
      ctx.drawImage(screenVideo, cx, cy, cw, ch, dx + cov.dx, dy + cov.dy, cov.w, cov.h);
      ctx.restore();
    } else {
      // 无屏幕源时绘制占位
      ctx.fillStyle = "rgba(15,23,42,0.85)";
      ctx.fillRect(sX, sY, sW, sH);
      ctx.fillStyle = "rgba(148,163,184,0.8)";
      ctx.font = `${Math.round(sH * 0.06)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🖥️ 未选择屏幕源", sX + sW / 2, sY + sH / 2);
    }

    // 摄像头 PiP
    this.drawPip(ctx, "cam1", this.cam1Slot, this.template.pips.cam1, this.pipOverrides.cam1);
    this.drawPip(ctx, "cam2", this.cam2Slot, this.template.pips.cam2, this.pipOverrides.cam2);

    // 网格辅助线
    if (this.showGrid) this.drawGrid(ctx);

    // 标注
    this.drawAnnotations(ctx);

    // 字幕
    this.drawSubtitle(ctx);

    // 水印/时间戳
    this.drawOverlays(ctx);

    ctx.restore();
    this.lastT = performance.now();
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const { bg, bgGradient } = this.template;
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
      return;
    }
    if (bgGradient) {
      const g = ctx.createLinearGradient(0, 0, this.width, this.height);
      g.addColorStop(0, bgGradient[0]);
      g.addColorStop(1, bgGradient[1]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawPip(
    ctx: CanvasRenderingContext2D,
    key: "cam1" | "cam2",
    slot: VideoSlot,
    base: PipRect | undefined,
    override: Partial<PipRect> | undefined,
  ) {
    if (!base) return;
    const pip: PipRect = { ...base, ...override };
    const W = this.width, H = this.height;
    const x = pip.x * W, y = pip.y * H, w = pip.w * W, h = pip.h * H;
    // 占位框（即使无源也显示）
    ctx.save();
    this.clipRect(ctx, x, y, w, h, pip.radius);
    ctx.fillStyle = "rgba(2,6,23,0.9)";
    ctx.fillRect(x, y, w, h);
    if (slot.el && slot.ready && slot.el.videoWidth > 0) {
      const vw = slot.el.videoWidth, vh = slot.el.videoHeight;
      const cov = coverFit(vw, vh, w, h);
      ctx.save();
      if (pip.mirror) {
        ctx.translate(x + w / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(x + w / 2), 0);
      }
      ctx.drawImage(slot.el, x + cov.dx, y + cov.dy, cov.w, cov.h);
      ctx.restore();
    } else {
      ctx.font = `${Math.max(14, Math.round(h * 0.22))}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(148,163,184,0.75)";
      ctx.fillText(key === "cam1" ? "🎥" : "📷", x + w / 2, y + h / 2 - h * 0.12);
      ctx.font = `${Math.max(11, Math.round(h * 0.14))}px system-ui`;
      ctx.fillText(pip.label, x + w / 2, y + h / 2 + h * 0.22);
    }
    ctx.restore();
    // 边框 + 标签
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    this.roundRectPath(ctx, x, y, w, h, pip.radius);
    ctx.stroke();
    if (pip.label) {
      ctx.font = "600 13px system-ui";
      const tw = ctx.measureText(pip.label).width + 14;
      const labelY = y - 6;
      ctx.fillStyle = "rgba(2,6,23,0.75)";
      ctx.fillRect(x, labelY - 16, tw, 20);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      this.roundRectPath(ctx, x, labelY - 16, tw, 20, 6);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(pip.label, x + 7, labelY - 1);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    const W = this.width, H = this.height;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((W / 3) * i, 0); ctx.lineTo((W / 3) * i, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (H / 3) * i); ctx.lineTo(W, (H / 3) * i);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawAnnotations(ctx: CanvasRenderingContext2D) {
    const W = this.width, H = this.height;
    for (const a of this.annotations) {
      const pts = a.points.map((p) => ({ x: p.x * W, y: p.y * H }));
      ctx.save();
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = Math.max(2, a.size * H / 400);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (a.type === "pen") {
        if (pts.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      } else if (a.type === "arrow") {
        if (pts.length < 2) continue;
        const [p1, p2] = [pts[0], pts[pts.length - 1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const sz = Math.max(14, ctx.lineWidth * 4);
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - sz * Math.cos(ang - Math.PI / 6), p2.y - sz * Math.sin(ang - Math.PI / 6));
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - sz * Math.cos(ang + Math.PI / 6), p2.y - sz * Math.sin(ang + Math.PI / 6));
        ctx.stroke();
      } else if (a.type === "rect") {
        const [p1, p2] = [pts[0], pts[pts.length - 1]];
        ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
      } else if (a.type === "ellipse") {
        const [p1, p2] = [pts[0], pts[pts.length - 1]];
        ctx.beginPath();
        ctx.ellipse((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, Math.abs(p2.x - p1.x) / 2, Math.abs(p2.y - p1.y) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (a.type === "text") {
        const p = pts[0];
        const size = Math.max(16, Math.round(a.size * H / 260));
        ctx.font = `700 ${size}px system-ui`;
        ctx.lineWidth = Math.max(4, size / 6);
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.strokeText(a.text ?? "", p.x, p.y);
        ctx.fillText(a.text ?? "", p.x, p.y);
      } else if (a.type === "blur") {
        // 敏感内容模糊：将屏幕视频按区域二次绘制并模糊
        const screenVideo = this.screenSlot.el;
        if (screenVideo && screenVideo.videoWidth > 0 && pts.length >= 2) {
          const [p1, p2] = [pts[0], pts[pts.length - 1]];
          const rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y);
          const rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
          ctx.save();
          ctx.filter = "blur(26px)";
          ctx.beginPath();
          ctx.rect(rx, ry, rw, rh);
          ctx.clip();
          const sRect = this.template.screen;
          const sX = sRect.x * this.width, sY = sRect.y * this.height, sW = sRect.w * this.width, sH = sRect.h * this.height;
          const z = Math.max(1, this.currentScale);
          const dw = sW / z, dh = sH / z;
          const fx = this.zoom.focusX, fy = this.zoom.focusY;
          const dx = sX + fx * (sW - dw), dy = sY + fy * (sH - dh);
          const cov = coverFit(screenVideo.videoWidth, screenVideo.videoHeight, dw, dh);
          const cx = this.crop.x * screenVideo.videoWidth, cy = this.crop.y * screenVideo.videoHeight;
          const cw = this.crop.w * screenVideo.videoWidth, ch = this.crop.h * screenVideo.videoHeight;
          ctx.drawImage(screenVideo, cx, cy, cw, ch, dx + cov.dx, dy + cov.dy, cov.w, cov.h);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  private drawSubtitle(ctx: CanvasRenderingContext2D) {
    if (!this.subtitle.enabled) return;
    const W = this.width, H = this.height;
    const lines = [...this.subtitle.lines];
    if (this.subtitle.liveCaptions && this.subtitle.liveText) {
      lines.push(this.subtitle.liveText);
    }
    if (lines.length === 0) return;
    const size = Math.max(18, Math.round(this.subtitle.fontSize * H / 1080));
    const font = `700 ${size}px system-ui, "PingFang SC", sans-serif`;
    ctx.font = font;
    const maxW = W * 0.9;
    const wrapped: string[] = [];
    for (const raw of lines) {
      let line = raw.trim();
      while (line && ctx.measureText(line).width > maxW) {
        let cut = line.length;
        while (cut > 0 && ctx.measureText(line.slice(0, cut)).width > maxW) cut--;
        wrapped.push(line.slice(0, cut));
        line = line.slice(cut).trim();
      }
      if (line) wrapped.push(line);
    }
    if (wrapped.length === 0) return;
    const lineH = size * 1.4;
    const padX = size * 0.6, padY = size * 0.35;
    const blockH = wrapped.length * lineH + padY * 2;
    const blockW = Math.max(...wrapped.map((l) => ctx.measureText(l).width)) + padX * 2;
    const y = this.subtitle.position === "bottom" ? H - blockH - H * 0.04 : H * 0.05;
    const x = (W - blockW) / 2;
    ctx.save();
    ctx.fillStyle = this.subtitle.bg;
    this.roundRectPath(ctx, x, y, blockW, blockH, size * 0.35);
    ctx.fill();
    ctx.fillStyle = this.subtitle.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapped.forEach((l, i) => {
      ctx.fillText(l, W / 2, y + padY + i * lineH + lineH / 2);
    });
    ctx.restore();
  }

  private drawOverlays(ctx: CanvasRenderingContext2D) {
    const W = this.width, H = this.height;
    if (this.watermark) {
      ctx.save();
      ctx.font = "600 22px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(this.watermark, W - 20, H - 16);
      ctx.restore();
    }
    if (this.showTimestamp) {
      const d = new Date();
      const str = d.toLocaleTimeString("zh-CN", { hour12: false });
      ctx.save();
      ctx.font = "600 20px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`⏱ ${str}`, 18, 16);
      ctx.restore();
    }
  }

  // ---------- 工具 ----------
  private clipRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.save();
    this.roundRectPath(ctx, x, y, w, h, r);
    ctx.clip();
  }

  private roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}

/** cover 适配：返回目标绘制矩形（dx/dy 偏移 + 宽高） */
export function coverFit(vw: number, vh: number, dw: number, dh: number) {
  const s = Math.max(dw / vw, dh / vh);
  const w = vw * s, h = vh * s;
  return { dx: (dw - w) / 2, dy: (dh - h) / 2, w, h };
}
