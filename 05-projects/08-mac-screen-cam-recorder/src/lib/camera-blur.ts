/**
 * 人像完全清晰 + 仅背景虚化（MediaPipe Selfie Segmenter）
 * 合成：模糊背景 → 清晰人像按 mask 盖上；人像像素绝不走 blur filter
 */

export type BlurPipelineStatus = "idle" | "loading" | "ready" | "failed";

type CategoryMask = {
  width: number;
  height: number;
  getAsUint8Array: () => Uint8Array;
  close?: () => void;
};

type ConfidenceMask = {
  width: number;
  height: number;
  getAsFloat32Array: () => Float32Array;
  close?: () => void;
};

type SegmenterLike = {
  segmentForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => {
    categoryMask?: CategoryMask | null;
    confidenceMasks?: ConfidenceMask[] | null;
  };
  close?: () => void;
};

export class CameraBlurPipeline {
  status: BlurPipelineStatus = "idle";
  lastError: string | null = null;

  private segmenter: SegmenterLike | null = null;
  private out = document.createElement("canvas");
  private sharp = document.createElement("canvas");
  private blurred = document.createElement("canvas");
  private person = document.createElement("canvas");
  private maskSmall = document.createElement("canvas");
  private maskFull = document.createElement("canvas");
  private frame = 0;
  private invertMask = false;

  async ensureReady(): Promise<boolean> {
    if (this.status === "ready" && this.segmenter) return true;
    if (this.status === "failed") return false;
    if (this.status === "loading") {
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const s = this.status as BlurPipelineStatus;
        if (s === "ready" && this.segmenter) return true;
        if (s === "failed") return false;
        if (s !== "loading") break;
      }
      return (this.status as BlurPipelineStatus) === "ready";
    }
    this.status = "loading";
    this.lastError = null;
    try {
      const mod = await import("@mediapipe/tasks-vision");
      const vision = await mod.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",
      );
      const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
      const opts = {
        runningMode: "VIDEO" as const,
        outputCategoryMask: true,
        outputConfidenceMasks: true,
      };
      try {
        this.segmenter = (await mod.ImageSegmenter.createFromOptions(vision, {
          ...opts,
          baseOptions: { modelAssetPath, delegate: "GPU" },
        })) as unknown as SegmenterLike;
      } catch {
        this.segmenter = (await mod.ImageSegmenter.createFromOptions(vision, {
          ...opts,
          baseOptions: { modelAssetPath, delegate: "CPU" },
        })) as unknown as SegmenterLike;
      }
      this.status = "ready";
      return true;
    } catch (e) {
      this.status = "failed";
      this.segmenter = null;
      this.lastError = e instanceof Error ? e.message : String(e);
      return false;
    }
  }

  dispose() {
    try {
      this.segmenter?.close?.();
    } catch {
      // ignore
    }
    this.segmenter = null;
    this.status = "idle";
  }

  /**
   * @param strength 0–100 只控制背景模糊强度
   */
  process(
    video: HTMLVideoElement,
    strength: number,
    timestampMs: number,
  ): HTMLCanvasElement | null {
    if (!video || video.readyState < 2 || video.videoWidth < 2) return null;
    if (!this.segmenter || this.status !== "ready") return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    this.ensureSize(this.out, vw, vh);
    this.ensureSize(this.sharp, vw, vh);
    this.ensureSize(this.blurred, vw, vh);
    this.ensureSize(this.person, vw, vh);
    this.ensureSize(this.maskFull, vw, vh);

    const sharpCtx = this.sharp.getContext("2d");
    const blurCtx = this.blurred.getContext("2d");
    const outCtx = this.out.getContext("2d");
    const personCtx = this.person.getContext("2d");
    const maskFullCtx = this.maskFull.getContext("2d");
    if (!sharpCtx || !blurCtx || !outCtx || !personCtx || !maskFullCtx) return null;

    // A. 全分辨率清晰源（人脸最终只从这里取）
    sharpCtx.clearRect(0, 0, vw, vh);
    sharpCtx.drawImage(video, 0, 0, vw, vh);

    this.frame += 1;
    if (this.frame % 2 === 0 || this.maskSmall.width < 2) {
      try {
        const result = this.segmenter.segmentForVideo(video, timestampMs);
        const ok = this.updateMaskCanvas(result);
        result.categoryMask?.close?.();
        result.confidenceMasks?.forEach((m) => m.close?.());
        if (!ok && this.maskSmall.width < 2) return null;
      } catch {
        if (this.maskSmall.width < 2) return null;
      }
    }
    if (this.maskSmall.width < 2) return null;

    // B. 背景模糊（整帧 blur，稍后用清晰人像盖住脸部）
    const t = Math.min(100, Math.max(0, strength)) / 100;
    const radius = Math.max(6, Math.round(8 + t * 20));
    blurCtx.clearRect(0, 0, vw, vh);
    blurCtx.filter = `blur(${radius}px)`;
    const pad = radius * 2;
    blurCtx.drawImage(this.sharp, -pad, -pad, vw + pad * 2, vh + pad * 2);
    blurCtx.filter = "none";

    // C. 人像 mask → 全分辨率 + 高斯羽化，弱化人景硬边
    maskFullCtx.clearRect(0, 0, vw, vh);
    maskFullCtx.imageSmoothingEnabled = true;
    // 先略放大再羽化：过渡带宽约 8–12px，避免刀切边缘
    const feather = Math.max(6, Math.round(Math.min(vw, vh) * 0.012));
    maskFullCtx.filter = `blur(${feather}px)`;
    const grow = 1.02;
    const gw = vw * grow;
    const gh = vh * grow;
    maskFullCtx.drawImage(this.maskSmall, (vw - gw) / 2, (vh - gh) / 2, gw, gh);
    maskFullCtx.filter = "none";

    // D. person = 清晰帧 ∩ 羽化 mask（脸部主体仍清晰，边缘柔和融入虚化背景）
    personCtx.clearRect(0, 0, vw, vh);
    personCtx.globalCompositeOperation = "source-over";
    personCtx.drawImage(this.sharp, 0, 0);
    personCtx.globalCompositeOperation = "destination-in";
    personCtx.drawImage(this.maskFull, 0, 0);
    personCtx.globalCompositeOperation = "source-over";

    // E. out = 模糊背景 + 羽化清晰人像
    outCtx.clearRect(0, 0, vw, vh);
    outCtx.drawImage(this.blurred, 0, 0);
    outCtx.drawImage(this.person, 0, 0);
    return this.out;
  }

  private updateMaskCanvas(result: {
    categoryMask?: CategoryMask | null;
    confidenceMasks?: ConfidenceMask[] | null;
  }): boolean {
    let w = 0;
    let h = 0;
    let alpha: Float32Array | null = null;

    const conf = result.confidenceMasks?.[0];
    if (conf) {
      w = conf.width;
      h = conf.height;
      const f = conf.getAsFloat32Array();
      alpha = new Float32Array(f.length);
      for (let i = 0; i < f.length; i++) alpha[i] = Math.max(0, Math.min(1, f[i]));
    } else if (result.categoryMask) {
      const cat = result.categoryMask;
      w = cat.width;
      h = cat.height;
      const bits = cat.getAsUint8Array();
      alpha = new Float32Array(bits.length);
      let maxV = 0;
      for (let i = 0; i < bits.length; i++) if (bits[i] > maxV) maxV = bits[i];
      const thr = maxV > 1 ? 127 : 0;
      for (let i = 0; i < bits.length; i++) alpha[i] = bits[i] > thr ? 1 : 0;
    }
    if (!alpha || w < 2 || h < 2) return false;

    this.invertMask = this.centerLooksLikeBackground(alpha, w, h);
    this.ensureSize(this.maskSmall, w, h);
    const ctx = this.maskSmall.getContext("2d");
    if (!ctx) return false;
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < alpha.length; i++) {
      let a = alpha[i];
      if (this.invertMask) a = 1 - a;
      // 宽过渡带：内部实、边缘缓入，避免刀切轮廓
      const lo = 0.18;
      const hi = 0.78;
      if (a <= lo) a = 0;
      else if (a >= hi) a = 1;
      else {
        const t = (a - lo) / (hi - lo);
        a = t * t * (3 - 2 * t);
      }
      const p = i * 4;
      img.data[p] = 255;
      img.data[p + 1] = 255;
      img.data[p + 2] = 255;
      img.data[p + 3] = Math.round(a * 255);
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  /** 画面中心应是人脸；若中心 alpha 偏低说明 mask 极性反了 */
  private centerLooksLikeBackground(alpha: Float32Array, w: number, h: number): boolean {
    const x0 = Math.floor(w * 0.35);
    const x1 = Math.floor(w * 0.65);
    const y0 = Math.floor(h * 0.28);
    const y1 = Math.floor(h * 0.72);
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        sum += alpha[y * w + x] ?? 0;
        n++;
      }
    }
    return n > 0 ? sum / n < 0.4 : false;
  }

  private ensureSize(c: HTMLCanvasElement, w: number, h: number) {
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
  }
}
