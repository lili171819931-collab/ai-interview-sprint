export type CamShape = "circle" | "rect";

export type CamLayout = {
  x: number;
  y: number;
  /** 圆形：直径；长方形：高度（宽度 = diameter * aspect） */
  diameter: number;
  shape?: CamShape;
  /** 长方形宽高比，默认 4/3 */
  aspect?: number;
};

export type PointerZoomOptions = {
  enabled: boolean;
  mode: "lens" | "stretch";
  /** 0–1 相对画布坐标 */
  nx: number;
  ny: number;
  radiusPx: number;
  /** 放大倍率 1.5–3 */
  magnification: number;
};

export type ComposeOptions = {
  cameraEnabled: boolean;
  mirrored: boolean;
  layout: CamLayout;
  stroke: boolean;
  /** 已做背景虚化的摄像头帧；没有则用 cameraVideo */
  cameraFrame?: CanvasImageSource | null;
  pointerZoom?: PointerZoomOptions | null;
  /** 双指/滚轮网页放大（整屏层），1 = 无缩放 */
  screenMagnification?: number;
  screenZoomNx?: number;
  screenZoomNy?: number;
};

function camSize(layout: CamLayout): { w: number; h: number } {
  const shape = layout.shape || "circle";
  if (shape === "rect") {
    const h = Math.max(80, layout.diameter);
    const aspect = layout.aspect && layout.aspect > 0 ? layout.aspect : 4 / 3;
    return { w: Math.round(h * aspect), h };
  }
  return { w: layout.diameter, h: layout.diameter };
}

function clampLayout(layout: CamLayout, canvasW: number, canvasH: number): CamLayout {
  const shape = layout.shape || "circle";
  const aspect = layout.aspect && layout.aspect > 0 ? layout.aspect : 4 / 3;
  let diameter = layout.diameter;
  if (shape === "circle") {
    diameter = Math.max(80, Math.min(diameter, Math.min(canvasW, canvasH) * 0.5));
  } else {
    const maxH = Math.min(canvasH * 0.5, canvasW / aspect);
    diameter = Math.max(80, Math.min(diameter, maxH));
  }
  const { w: bw, h: bh } = camSize({ ...layout, diameter, shape, aspect });
  const margin = 16;
  const x = Math.max(margin, Math.min(layout.x, canvasW - bw - margin));
  const y = Math.max(margin, Math.min(layout.y, canvasH - bh - margin));
  return { x, y, diameter, shape, aspect };
}

export function snapToCorners(
  layout: CamLayout,
  canvasW: number,
  canvasH: number,
): CamLayout {
  const clamped = clampLayout(layout, canvasW, canvasH);
  const { w: bw, h: bh } = camSize(clamped);
  const margin = 24;
  const corners = [
    { x: margin, y: margin },
    { x: canvasW - bw - margin, y: margin },
    { x: margin, y: canvasH - bh - margin },
    { x: canvasW - bw - margin, y: canvasH - bh - margin },
  ];
  let best = corners[3];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of corners) {
    const d =
      (c.x - clamped.x) * (c.x - clamped.x) + (c.y - clamped.y) * (c.y - clamped.y);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return { ...clamped, x: best.x, y: best.y };
}

export function hitTestCamera(
  layout: CamLayout,
  canvasW: number,
  canvasH: number,
  px: number,
  py: number,
): boolean {
  const L = clampLayout(layout, canvasW, canvasH);
  const { w: bw, h: bh } = camSize(L);
  if ((L.shape || "circle") === "rect") {
    return px >= L.x && px <= L.x + bw && py >= L.y && py <= L.y + bh;
  }
  const r = bw / 2;
  const cx = L.x + r;
  const cy = L.y + r;
  return Math.hypot(px - cx, py - cy) <= r;
}

function sourceSize(src: CanvasImageSource): { w: number; h: number } {
  if (src instanceof HTMLVideoElement) {
    return { w: src.videoWidth, h: src.videoHeight };
  }
  if (src instanceof HTMLCanvasElement) {
    return { w: src.width, h: src.height };
  }
  if (src instanceof HTMLImageElement) {
    return { w: src.naturalWidth, h: src.naturalHeight };
  }
  if (typeof ImageBitmap !== "undefined" && src instanceof ImageBitmap) {
    return { w: src.width, h: src.height };
  }
  return { w: 0, h: 0 };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** 在已画好的屏幕层上叠加指针缩放（不糊摄像头） */
export function drawPointerZoom(
  ctx: CanvasRenderingContext2D,
  screenLayer: CanvasImageSource,
  zoom: PointerZoomOptions,
) {
  if (!zoom.enabled) return;
  const { canvas } = ctx;
  const w = canvas.width;
  const h = canvas.height;
  const cx = Math.max(0, Math.min(w, zoom.nx * w));
  const cy = Math.max(0, Math.min(h, zoom.ny * h));
  const radius = Math.max(40, Math.min(zoom.radiusPx, Math.min(w, h) * 0.35));
  const mag = Math.max(1.4, Math.min(3, zoom.magnification));

  ctx.save();
  if (zoom.mode === "lens") {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const dw = w * mag;
    const dh = h * mag;
    const dx = cx - (cx / w) * dw;
    const dy = cy - (cy / h) * dh;
    ctx.drawImage(screenLayer, dx, dy, dw, dh);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // stretch：椭圆区域轻微拉近
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.15, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const magX = mag * 0.92;
    const magY = mag * 1.08;
    const dw = w * magX;
    const dh = h * magY;
    const dx = cx - (cx / w) * dw;
    const dy = cy - (cy / h) * dh;
    ctx.drawImage(screenLayer, dx, dy, dw, dh);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.15, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,220,120,0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

let screenSnapCanvas: HTMLCanvasElement | null = null;

function getScreenSnap(w: number, h: number) {
  if (!screenSnapCanvas) screenSnapCanvas = document.createElement("canvas");
  if (screenSnapCanvas.width !== w || screenSnapCanvas.height !== h) {
    screenSnapCanvas.width = w;
    screenSnapCanvas.height = h;
  }
  return screenSnapCanvas;
}

export function drawCompositeFrame(
  ctx: CanvasRenderingContext2D,
  screenVideo: HTMLVideoElement,
  cameraVideo: HTMLVideoElement | null,
  options: ComposeOptions,
) {
  const { canvas } = ctx;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0c0f";
  ctx.fillRect(0, 0, w, h);

  let screenDrawn = false;
  if (screenVideo.readyState >= 2) {
    const sw = screenVideo.videoWidth || w;
    const sh = screenVideo.videoHeight || h;
    const mag = Math.max(1, Math.min(3, options.screenMagnification || 1));
    const nx = options.screenZoomNx ?? 0.5;
    const ny = options.screenZoomNy ?? 0.5;
    if (mag <= 1.001) {
      const scale = Math.max(w / sw, h / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(screenVideo, dx, dy, dw, dh);
    } else {
      // 以 (nx,ny) 为中心放大屏幕层
      const scale = Math.max(w / sw, h / sh) * mag;
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = w * nx - dw * nx;
      const dy = h * ny - dh * ny;
      ctx.drawImage(screenVideo, dx, dy, dw, dh);
    }
    screenDrawn = true;
  }

  if (screenDrawn && options.pointerZoom?.enabled) {
    const snap = getScreenSnap(w, h);
    const sctx = snap.getContext("2d");
    if (sctx) {
      sctx.clearRect(0, 0, w, h);
      sctx.drawImage(canvas, 0, 0);
      drawPointerZoom(ctx, snap, options.pointerZoom);
    }
  }

  const camSrc = options.cameraFrame || cameraVideo;
  const camReady =
    options.cameraEnabled &&
    camSrc &&
    (!(camSrc instanceof HTMLVideoElement) ||
      (camSrc.readyState >= 2 && camSrc.videoWidth > 0));

  if (camReady && camSrc) {
    const { w: vw, h: vh } = sourceSize(camSrc);
    if (vw > 0 && vh > 0) {
      const layout = clampLayout(options.layout, w, h);
      const shape = layout.shape || "circle";
      const { w: bw, h: bh } = camSize(layout);
      const { x, y } = layout;
      const cx = x + bw / 2;
      const cy = y + bh / 2;

      ctx.save();
      if (shape === "rect") {
        roundRectPath(ctx, x, y, bw, bh, 14);
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, bw / 2, 0, Math.PI * 2);
        ctx.closePath();
      }
      ctx.clip();

      const scale = Math.max(bw / vw, bh / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = cx - dw / 2;
      const dy = cy - dh / 2;

      if (options.mirrored) {
        ctx.translate(cx, cy);
        ctx.scale(-1, 1);
        ctx.translate(-cx, -cy);
      }
      ctx.drawImage(camSrc, dx, dy, dw, dh);
      ctx.restore();

      if (options.stroke) {
        ctx.save();
        if (shape === "rect") {
          roundRectPath(ctx, x + 1, y + 1, bw - 2, bh - 2, 13);
          ctx.strokeStyle = "rgba(255,255,255,0.72)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, bw / 2 - 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.72)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
}

export function pickMimeType(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.4d001f,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

export function isMp4Mime(mime: string | undefined): boolean {
  return Boolean(mime && /mp4|avc1|aac/i.test(mime) && !/webm/i.test(mime));
}

export { clampLayout, camSize };
