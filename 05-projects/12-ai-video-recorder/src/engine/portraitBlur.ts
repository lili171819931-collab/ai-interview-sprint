// ============ 人像抠图（MediaPipe Selfie Segmentation）：人像清晰 + 背景模糊 ============

/**
 * 加载 legacy UMD 脚本（支持 locateFile 指向本地资源，完全离线）。
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`加载失败: ${src}`));
    document.head.appendChild(s);
  });
}

export type PortraitQuality = "low" | "medium" | "high";

const QUALITY: Record<PortraitQuality, number> = { low: 0.35, medium: 0.6, high: 1 };

export class PortraitBlur {
  private seg: SelfieSegmentationInstance | null = null;
  private ready = false;
  private initPromise: Promise<void> | null = null;
  private assetBase: string;
  quality: PortraitQuality = "medium";
  strength = 0.7; // 背景模糊强度
  private lastSend = 0;
  private intervalMs = 100; // ~10fps 推理
  private latest: HTMLCanvasElement | null = null;
  private outCanvas: HTMLCanvasElement | null = null;
  private bgCanvas: HTMLCanvasElement | null = null;
  private fgCanvas: HTMLCanvasElement | null = null;

  constructor(assetBase = "/mediapipe/") {
    this.assetBase = assetBase.endsWith("/") ? assetBase : assetBase + "/";
  }

  get isReady() { return this.ready; }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        await loadScript(`${this.assetBase}selfie_segmentation.js`);
        const Ctor = window.SelfieSegmentation;
        if (!Ctor) throw new Error("SelfieSegmentation 全局对象不存在");
        const seg = new Ctor({ locateFile: (f) => this.assetBase + f });
        seg.setOptions({ modelSelection: 0, selfieMode: false });
        seg.onResults = (res) => this.onResults(res);
        await seg.initialize();
        this.seg = seg;
        this.ready = true;
      } catch (e) {
        this.initPromise = null;
        throw e;
      }
    })();
    return this.initPromise;
  }

  setVideo(video: HTMLVideoElement | null) {
    // 惰性：每次 send 传入 video
  }

  /** 供合成器调用：返回最新人像画布（无则 null） */
  processFrame(video: HTMLVideoElement): HTMLCanvasElement | null {
    if (!this.ready || !this.seg) return this.latest;
    const now = performance.now();
    if (now - this.lastSend < this.intervalMs) return this.latest;
    this.lastSend = now;
    try {
      this.seg.send({ image: video }).catch(() => {});
    } catch { /* 忽略单帧失败 */ }
    return this.latest;
  }

  private onResults(res: SelfieSegmentationResults) {
    try {
      const W = res.image.width, H = res.image.height;
      const out = this.outCanvas ?? (this.outCanvas = document.createElement("canvas"));
      const bg = this.bgCanvas ?? (this.bgCanvas = document.createElement("canvas"));
      const fg = this.fgCanvas ?? (this.fgCanvas = document.createElement("canvas"));
      out.width = W; out.height = H;
      bg.width = W; bg.height = H;
      fg.width = W; fg.height = H;
      const octx = out.getContext("2d")!;
      const bctx = bg.getContext("2d")!;
      const fctx = fg.getContext("2d")!;

      // 1) 背景 = 原帧模糊
      bctx.clearRect(0, 0, W, H);
      bctx.filter = `blur(${Math.round(8 + this.strength * 22)}px) brightness(0.92)`;
      bctx.drawImage(res.image, 0, 0, W, H);
      bctx.filter = "none";

      // 2) 前景 = 原帧，仅保留人像区域（mask 作为 alpha）
      fctx.clearRect(0, 0, W, H);
      fctx.drawImage(res.image, 0, 0, W, H);
      fctx.globalCompositeOperation = "destination-in";
      fctx.drawImage(res.segmentationMask, 0, 0, W, H);
      fctx.globalCompositeOperation = "source-over";

      // 3) 合成
      octx.clearRect(0, 0, W, H);
      octx.drawImage(bg, 0, 0, W, H);
      octx.drawImage(fg, 0, 0, W, H);

      // 质量降采样（省性能）
      if (this.quality !== "high") {
        const q = QUALITY[this.quality];
        const small = document.createElement("canvas");
        small.width = Math.max(2, Math.round(W * q));
        small.height = Math.max(2, Math.round(H * q));
        const sctx = small.getContext("2d")!;
        sctx.drawImage(out, 0, 0, small.width, small.height);
        out.width = W; out.height = H;
        octx.drawImage(small, 0, 0, W, H);
      }
      this.latest = out;
    } catch { /* 忽略合成错误 */ }
  }

  dispose() {
    this.seg = null;
    this.ready = false;
    this.initPromise = null;
    this.latest = null;
  }
}
