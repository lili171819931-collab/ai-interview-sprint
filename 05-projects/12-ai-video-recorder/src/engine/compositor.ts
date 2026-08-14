import type {
  Annotation,
  BeautyState,
  ClickEffect,
  ColorFilter,
  CropRect,
  ImageOverlay,
  PipBlurMode,
  PipRect,
  PipShape,
  SplitMode,
  SubtitleState,
  TemplateDef,
  TextOverlay,
  TransitionKind,
  ZoomState,
} from "../types";
import type { PortraitBlur } from "./portraitBlur";
import { splitLayoutFor, type SplitLayout } from "./splitModes";

// ============ 画布合成引擎：屏幕 + 双摄像头 + 字幕 + 标注 + 裁剪/缩放 ============
const FILTER_PRESETS: Record<ColorFilter, string | null> = {
  none: null,
  warm: "sepia(0.22) saturate(1.3) brightness(1.05)",
  cool: "hue-rotate(155deg) saturate(0.9) brightness(1.03)",
  bw: "grayscale(1) contrast(1.12)",
  retro: "sepia(0.5) contrast(1.05) brightness(0.94) saturate(0.75)",
};
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

  /** OBS 风格来源开关（录制中可切换） */
  enabled = { screen: true, camera1: true, camera2: true };
  /** 小窗形状 */
  pipShape: PipShape = "rounded";
  /** 简单美颜参数 */
  beauty: BeautyState = { smooth: 0, bright: 0, rosy: 0, sharp: 0 };
  /** 背景模糊模式（none/screen/soft/portrait） */
  blurMode: PipBlurMode = "none";
  /** 人像抠图引擎（人像清晰 + 背景模糊） */
  portrait: PortraitBlur | null = null;
  /** 分屏模式 */
  splitMode: SplitMode = "pip";
  /** 点击特效（录制中显示点击位置） */
  clickEffects: ClickEffect[] = [];
  clickFxEnabled = true;
  autoZoomOnClick = false;

  /** OBS 来源：文字 / 图片叠加层 */
  textSources: TextOverlay[] = [];
  imageSources: ImageOverlay[] = [];
  private imageEls = new Map<string, HTMLImageElement>();
  /** OBS 摄像头颜色滤镜 */
  filter: ColorFilter = "none";
  /** 场景转场效果 */
  transition: { kind: TransitionKind; start: number; dur: number } | null = null;
  private blurCanvas: HTMLCanvasElement | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;

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

  // ---------- 分屏布局 ----------
  private splitLayout(): SplitLayout | null {
    return splitLayoutFor(this.splitMode);
  }

  get screenRect() {
    return this.splitLayout()?.screen ?? this.template.screen;
  }

  private pipRectFor(key: "cam1" | "cam2", base: PipRect | undefined, override: Partial<PipRect> | undefined): PipRect | undefined {
    if (!base) return undefined;
    const layout = this.splitLayout();
    if (layout && layout.pips && key in layout.pips) {
      const sp = layout.pips[key];
      if (sp === undefined) return undefined;
      return { ...base, ...sp, ...override };
    }
    return { ...base, ...override };
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
    const sRect = this.screenRect;
    const sX = sRect.x * W, sY = sRect.y * H, sW = sRect.w * W, sH = sRect.h * H;
    const screenVideo = this.screenSlot.el;
    if (this.enabled.screen && screenVideo && this.screenSlot.ready && screenVideo.videoWidth > 0) {
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
    if (this.enabled.camera1) this.drawPip(ctx, "cam1", this.cam1Slot, this.template.pips.cam1, this.pipOverrides.cam1);
    if (this.enabled.camera2) this.drawPip(ctx, "cam2", this.cam2Slot, this.template.pips.cam2, this.pipOverrides.cam2);

    // 点击特效
    this.drawClickEffects(ctx);

    // 网格辅助线
    if (this.showGrid) this.drawGrid(ctx);

    // 标注
    this.drawAnnotations(ctx);

    // OBS 文字/图片来源
    this.drawOverlaySources(ctx);

    // 字幕
    this.drawSubtitle(ctx);

    // 水印/时间戳
    this.drawOverlays(ctx);

    // 场景转场
    this.drawTransition(ctx);

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
    const pip = this.pipRectFor(key, base, override);
    if (!pip) return;
    const W = this.width, H = this.height;
    const x = pip.x * W, y = pip.y * H, w = pip.w * W, h = pip.h * H;
    const shape = this.splitMode === "circle" ? "circle" : this.pipShape;
    const radius = pip.radius;

    // 背景模糊（屏幕内容）：小窗背后显示模糊的页面内容
    if (this.blurMode === "screen" && this.enabled.screen && this.screenSlot.el && this.screenSlot.ready && this.screenSlot.el.videoWidth > 0) {
      ctx.save();
      this.clipPip(ctx, x, y, w, h, radius, shape);
      const v = this.screenSlot.el;
      const sRect = this.template.screen;
      const sX = sRect.x * W, sY = sRect.y * H, sW = sRect.w * W, sH = sRect.h * H;
      const z = Math.max(1, this.currentScale);
      const dw = sW / z, dh = sH / z;
      const dx = sX + this.zoom.focusX * (sW - dw), dy = sY + this.zoom.focusY * (sH - dh);
      const cov = coverFit(v.videoWidth, v.videoHeight, dw, dh);
      const cx = this.crop.x * v.videoWidth, cy = this.crop.y * v.videoHeight;
      const cw = this.crop.w * v.videoWidth, ch = this.crop.h * v.videoHeight;
      ctx.filter = "blur(20px) brightness(0.5)";
      ctx.drawImage(v, cx, cy, cw, ch, dx + cov.dx, dy + cov.dy, cov.w, cov.h);
      ctx.filter = "none";
      ctx.restore();
    }

    ctx.save();
    this.clipPip(ctx, x, y, w, h, radius, shape);
    ctx.fillStyle = "rgba(2,6,23,0.9)";
    ctx.fillRect(x, y, w, h);
    if (slot.el && slot.ready && slot.el.videoWidth > 0) {
      this.drawCameraVideo(ctx, slot.el, x, y, w, h, pip.mirror, radius, shape);
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

    // 边框
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    this.strokePip(ctx, x, y, w, h, radius, shape);
    ctx.stroke();
    ctx.restore();

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

  /** 绘制摄像头视频（含镜像 + 美颜 + 柔焦背景） */
  private drawCameraVideo(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    x: number, y: number, w: number, h: number,
    mirror: boolean, radius: number, shape: PipShape,
  ) {
    const vw = video.videoWidth, vh = video.videoHeight;
    const cov = coverFit(vw, vh, w, h);
    const b = this.beauty;
    ctx.save();
    if (mirror) {
      ctx.translate(x + w / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(x + w / 2), 0);
    }
    const parts: string[] = [];
    const preset = FILTER_PRESETS[this.filter];
    if (preset) parts.push(preset);
    if (b.bright > 0 || b.rosy > 0 || b.sharp > 0) {
      parts.push(`brightness(${(1 + b.bright * 0.45).toFixed(3)}) contrast(${(1 + b.sharp * 0.4).toFixed(3)}) saturate(${(1 + b.rosy * 0.5).toFixed(3)})`);
    }
    if (parts.length > 0) ctx.filter = parts.join(" ");
    // 人像抠图：人像清晰 + 背景模糊（MediaPipe 本地分割）
    let portraitFrame: HTMLCanvasElement | null = null;
    if (this.blurMode === "portrait" && this.portrait?.isReady) {
      portraitFrame = this.portrait.processFrame(video);
    }
    if (portraitFrame) {
      const pcov = coverFit(portraitFrame.width, portraitFrame.height, w, h);
      ctx.drawImage(portraitFrame, x + pcov.dx, y + pcov.dy, pcov.w, pcov.h);
    } else {
      ctx.drawImage(video, x + cov.dx, y + cov.dy, cov.w, cov.h);
    }
    ctx.filter = "none";
    // 磨皮：叠一层轻微模糊
    if (b.smooth > 0.02) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.6, b.smooth * 0.55);
      ctx.filter = `blur(${(2 + b.smooth * 9).toFixed(1)}px)`;
      ctx.drawImage(video, x + cov.dx, y + cov.dy, cov.w, cov.h);
      ctx.restore();
    }
    ctx.restore();

    // 柔焦背景：中心清晰、边缘虚化（人像柔焦）
    if (this.blurMode === "soft") {
      const blur = this.getBlurCanvas(vw, vh);
      const bctx = blur.getContext("2d")!;
      bctx.clearRect(0, 0, blur.width, blur.height);
      bctx.save();
      if (mirror) {
        bctx.translate(blur.width / 2, 0);
        bctx.scale(-1, 1);
        bctx.translate(-(blur.width / 2), 0);
      }
      bctx.filter = "blur(13px) brightness(1.04)";
      bctx.drawImage(video, 0, 0, blur.width, blur.height);
      bctx.restore();
      bctx.filter = "none";
      const off = this.getMaskCanvas(w, h);
      const octx = off.getContext("2d")!;
      octx.clearRect(0, 0, w, h);
      octx.drawImage(blur, 0, 0, w, h);
      const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.26, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.55, "rgba(0,0,0,0.25)");
      grad.addColorStop(1, "rgba(0,0,0,0.92)");
      ctx.save();
      this.clipPip(ctx, x, y, w, h, radius, shape);
      octx.globalCompositeOperation = "destination-in";
      octx.fillStyle = grad;
      octx.fillRect(0, 0, w, h);
      octx.globalCompositeOperation = "source-over";
      ctx.drawImage(off, x, y);
      ctx.restore();
    }
  }

  private getBlurCanvas(w: number, h: number): HTMLCanvasElement {
    if (!this.blurCanvas) this.blurCanvas = document.createElement("canvas");
    this.blurCanvas.width = Math.max(2, Math.round(w / 2));
    this.blurCanvas.height = Math.max(2, Math.round(h / 2));
    return this.blurCanvas;
  }

  private getMaskCanvas(w: number, h: number): HTMLCanvasElement {
    if (!this.maskCanvas) this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = Math.max(2, Math.round(w));
    this.maskCanvas.height = Math.max(2, Math.round(h));
    return this.maskCanvas;
  }

  /** 按形状裁剪小窗 */
  private clipPip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, shape: PipShape) {
    ctx.save();
    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    } else if (shape === "ellipse") {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else if (shape === "square") {
      ctx.rect(x, y, w, h);
    } else if (shape === "diamond") {
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
    } else {
      this.roundRectPath(ctx, x, y, w, h, radius);
    }
    ctx.clip();
  }

  private strokePip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, shape: PipShape) {
    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    } else if (shape === "ellipse") {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else if (shape === "square") {
      ctx.rect(x, y, w, h);
    } else if (shape === "diamond") {
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
    } else {
      this.roundRectPath(ctx, x, y, w, h, radius);
    }
  }

  /** 点击特效：扩散圆环 */
  private drawClickEffects(ctx: CanvasRenderingContext2D) {
    const now = performance.now();
    this.clickEffects = this.clickEffects.filter((c) => now - c.t < 650);
    if (this.clickEffects.length === 0) return;
    for (const c of this.clickEffects) {
      const p = Math.min(1, (now - c.t) / 650);
      const r = 12 + p * 52;
      const x = c.x * this.width, y = c.y * this.height;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = "#ffd76a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffd76a";
      ctx.beginPath();
      ctx.arc(x, y, 3 + p * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** OBS 文字 / 图片来源 */
  private drawOverlaySources(ctx: CanvasRenderingContext2D) {
    const W = this.width, H = this.height;
    for (const t of this.textSources) {
      const size = Math.max(12, Math.round((t.size * H) / 1000));
      ctx.save();
      ctx.font = `700 ${size}px system-ui, "PingFang SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.lineWidth = Math.max(2, size / 8);
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.lineJoin = "round";
      ctx.strokeText(t.text, t.x * W, t.y * H);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x * W, t.y * H);
      ctx.restore();
    }
    for (const im of this.imageSources) {
      const img = this.imageEls.get(im.id);
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      const iw = im.w * W;
      const ih = im.h > 0 ? im.h * H : iw * (img.naturalHeight / img.naturalWidth);
      ctx.drawImage(img, im.x * W, im.y * H, iw, ih);
    }
  }

  /** 加载图片来源 */
  setImageOverlay(id: string, src: string) {
    const img = new Image();
    img.onload = () => { this.imageEls.set(id, img); };
    img.src = src;
    this.imageEls.set(id, img);
  }

  removeImageOverlay(id: string) {
    this.imageEls.delete(id);
    this.imageSources = this.imageSources.filter((s) => s.id !== id);
  }

  /** 场景转场 */
  playTransition(kind: TransitionKind, dur = 450) {
    this.transition = { kind, start: performance.now(), dur };
  }

  private drawTransition(ctx: CanvasRenderingContext2D) {
    if (!this.transition) return;
    const p = (performance.now() - this.transition.start) / this.transition.dur;
    if (p >= 1) { this.transition = null; return; }
    const W = this.width, H = this.height;
    if (this.transition.kind === "fade") {
      const alpha = Math.sin(p * Math.PI) * 0.9;
      ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    } else if (this.transition.kind === "wipe") {
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fillRect(0, 0, W * p, H);
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
