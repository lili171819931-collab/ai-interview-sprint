import { useEffect, useMemo, useRef, useState } from "react";
import { studio } from "../engine/Studio";
import type { Annotation, AnnotationType, CropRect } from "../types";
import { useStudioState } from "../hooks";

type Tool = "none" | AnnotationType;

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "none", label: "🖱 选择", hint: "拖动画中画、点击设聚焦" },
  { id: "pen", label: "✏️ 画笔", hint: "按住拖动绘制" },
  { id: "arrow", label: "➡️ 箭头", hint: "按住拖动指向" },
  { id: "rect", label: "▭ 方框", hint: "按住拖出矩形" },
  { id: "ellipse", label: "◯ 圆圈", hint: "按住拖出椭圆" },
  { id: "text", label: "🔤 文字", hint: "点击输入文字" },
  { id: "blur", label: "🧊 模糊", hint: "框选敏感内容" },
];

let annoSeq = 0;

export function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useStudioState();
  const [tool, setTool] = useState<Tool>("none");
  const [color, setColor] = useState("#ff3b30");
  const [size, setSize] = useState(6);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const [pip, setPip] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const [bgImg, setBgImg] = useState<string | null>(null);
  const [split, setSplit] = useState<string>("pip");
  const drag = useRef<{ kind: string; id?: string; startX: number; startY: number; orig: unknown; handle?: string } | null>(null);
  const recording = state === "recording" || state === "paused";

  const tpl = studio.getTemplate();

  // 挂载画布
  useEffect(() => {
    if (canvasRef.current) studio.attach(canvasRef.current);
  }, []);

  // 模板切换时重建
  useEffect(() => {
    const off = studio.on("sources", () => {
      setSplit(studio.compositor?.splitMode ?? "pip");
      setPip({
        cam1: tpl.pips.cam1 ? { x: tpl.pips.cam1.x, y: tpl.pips.cam1.y, w: tpl.pips.cam1.w, h: tpl.pips.cam1.h } : undefined as never,
        cam2: tpl.pips.cam2 ? { x: tpl.pips.cam2.x, y: tpl.pips.cam2.y, w: tpl.pips.cam2.w, h: tpl.pips.cam2.h } : undefined as never,
      });
    });
    return off;
  }, [tpl]);

  // 背景图片上传
  const onBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !studio.compositor) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = studio.compositor!.width;
      c.height = studio.compositor!.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      studio.compositor!.backgroundImage = c;
      setBgImg(url);
    };
    img.src = url;
  };

  // ---------- 画布指针交互 ----------
  const toNorm = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const comp = studio.compositor;
    if (!canvas || !comp) return;
    if (e.button !== 0) return;
    const p = toNorm(e);
    if (tool === "none") {
      if (cropMode) return;
      // 点击屏幕区域设置缩放焦点 + 点击特效 + 自动聚焦缩放
      const s = comp.template.screen;
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) {
        comp.zoom.focusX = (p.x - s.x) / s.w;
        comp.zoom.focusY = (p.y - s.y) / s.h;
        if (comp.autoZoomOnClick) {
          comp.zoom.scale = Math.max(comp.zoom.scale, 1.6);
        }
        if (comp.clickFxEnabled) {
          comp.clickEffects.push({ x: p.x, y: p.y, t: performance.now() });
        }
      }
      return;
    }
    if (tool === "text") {
      const text = window.prompt("输入标注文字：", "");
      if (text) {
        comp.annotations.push({ id: `a${annoSeq++}`, type: "text", color, size, points: [p], text });
      }
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    const id = `a${annoSeq++}`;
    const anno: Annotation = { id, type: tool, color, size, points: [p] };
    comp.annotations.push(anno);
    drag.current = { kind: "annotate", id, startX: p.x, startY: p.y, orig: anno };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const comp = studio.compositor;
    const d = drag.current;
    if (!comp || !d) return;
    const p = toNorm(e);
    if (d.kind === "annotate") {
      const anno = comp.annotations.find((a) => a.id === d.id);
      if (anno) anno.points.push(p);
    } else if (d.kind === "pip" && d.id) {
      const key = d.id;
      const orig = d.orig as { x: number; y: number };
      const cur = pip[key] ?? { x: 0, y: 0, w: 0.2, h: 0.2 };
      const nx = Math.min(1 - cur.w, Math.max(0, orig.x + (p.x - d.startX)));
      const ny = Math.min(1 - cur.h, Math.max(0, orig.y + (p.y - d.startY)));
      const next = { ...cur, x: nx, y: ny };
      setPip((prev) => ({ ...prev, [key]: next }));
      comp.pipOverrides[key as "cam1" | "cam2"] = next;
    }
  };

  const onPointerUp = () => { drag.current = null; };

  // ---------- 裁剪框交互 ----------
  const screen = tpl.screen;
  const cropStyle = useMemo(() => ({
    left: `${crop.x * screen.w * 100}%`,
    top: `${crop.y * screen.h * 100}%`,
    width: `${crop.w * screen.w * 100}%`,
    height: `${crop.h * screen.h * 100}%`,
  }), [crop, screen]);

  const startCropDrag = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const p = toNorm(e);
    drag.current = { kind: "crop", startX: p.x, startY: p.y, orig: { ...crop }, handle };
  };

  const onCropMove = (e: React.PointerEvent) => {
    if (drag.current?.kind !== "crop") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toNorm(e);
    const orig = drag.current.orig as CropRect;
    const dx = (p.x - drag.current.startX) / screen.w;
    const dy = (p.y - drag.current.startY) / screen.h;
    const h = drag.current.handle;
    let next: CropRect = { ...orig };
    const min = 0.05;
    if (h === "move") {
      next.x = Math.min(1 - orig.w, Math.max(0, orig.x + dx));
      next.y = Math.min(1 - orig.h, Math.max(0, orig.y + dy));
    } else if (h === "se") {
      next.w = Math.min(1 - next.x, Math.max(min, orig.w + dx));
      next.h = Math.min(1 - next.y, Math.max(min, orig.h + dy));
    } else if (h === "nw") {
      next.x = Math.min(orig.x + orig.w - min, Math.max(0, orig.x + dx));
      next.y = Math.min(orig.y + orig.h - min, Math.max(0, orig.y + dy));
      next.w = orig.w + (orig.x - next.x);
      next.h = orig.h + (orig.y - next.y);
    }
    setCrop(next);
    if (studio.compositor) studio.compositor.crop = next;
  };

  const cropReset = () => {
    const c = { x: 0, y: 0, w: 1, h: 1 };
    setCrop(c);
    if (studio.compositor) studio.compositor.crop = c;
  };

  const clearAnnotations = () => {
    if (studio.compositor) studio.compositor.annotations = [];
  };

  return (
    <div className="stage">
      <div className="stage-header">
        <div className="template-badge">{tpl.emoji} {tpl.name} · {tpl.width}×{tpl.height}@{tpl.fps}fps</div>
        <div className="stage-tools">
          <div className="tool-group">
            {TOOLS.map((t) => (
              <button key={t.id} className={`tool-btn ${tool === t.id ? "active" : ""}`} title={t.hint} onClick={() => setTool(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} title="标注颜色" />
          <input type="range" min="2" max="20" value={size} onChange={(e) => setSize(+e.target.value)} title="线宽" className="size-slider" />
          <button className="btn small ghost" onClick={clearAnnotations} disabled={!studio.compositor?.annotations.length}>清空标注</button>
          <button className={`btn small ${cropMode ? "active" : ""}`} onClick={() => setCropMode(!cropMode)} title="裁剪屏幕区域">✂️ 裁剪</button>
          <label className="btn small ghost file-btn">🖼 背景
            <input type="file" accept="image/*" hidden onChange={onBgFile} />
          </label>
          {bgImg && <button className="btn small danger" onClick={() => { studio.compositor!.backgroundImage = null; setBgImg(null); }}>清除背景</button>}
        </div>
        <div className="stage-hint">
          {TOOLS.find((t) => t.id === tool)?.hint}
        </div>
      </div>

      <div className="canvas-frame">
        <canvas ref={canvasRef} className="stage-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={(e) => { onPointerMove(e); onCropMove(e); }}
          onPointerUp={onPointerUp}
        />

        {/* 裁剪框 */}
        {cropMode && !recording && (
          <div className="crop-overlay" style={cropStyle}>
            <div className="crop-shade" style={{ left: `-${crop.x * screen.w * 100}%`, top: `-${crop.y * screen.h * 100}%`, width: `${screen.w * 100}%`, height: `${screen.h * 100}%` }} />
            <div className="crop-box">
              <div className="crop-handle nw" onPointerDown={(e) => startCropDrag(e, "nw")} />
              <div className="crop-handle se" onPointerDown={(e) => startCropDrag(e, "se")} />
              <div className="crop-move" onPointerDown={(e) => startCropDrag(e, "move")} />
            </div>
          </div>
        )}
        {cropMode && !recording && (
          <div className="crop-bar">
            <span>✂️ 裁剪区域：x {Math.round(crop.x * 100)}% y {Math.round(crop.y * 100)}% w {Math.round(crop.w * 100)}% h {Math.round(crop.h * 100)}%</span>
            <button className="btn small ghost" onClick={cropReset}>重置</button>
          </div>
        )}

        {/* 画中画拖动（未录制 + 画中画分屏模式） */}
        {!recording && split === "pip" && (
          <>
            {tpl.pips.cam1 && (
              <PipOverlay key="cam1" label="Camera 1" pip={pip.cam1 ?? tpl.pips.cam1}
                onDrag={(next) => {
                  setPip((prev) => ({ ...prev, cam1: next }));
                  if (studio.compositor) studio.compositor.pipOverrides.cam1 = next;
                }} />
            )}
            {tpl.pips.cam2 && (
              <PipOverlay key="cam2" label="Camera 2" pip={pip.cam2 ?? tpl.pips.cam2}
                onDrag={(next) => {
                  setPip((prev) => ({ ...prev, cam2: next }));
                  if (studio.compositor) studio.compositor.pipOverrides.cam2 = next;
                }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PipOverlay(props: { label: string; pip: { x: number; y: number; w: number; h: number }; onDrag: (p: { x: number; y: number; w: number; h: number }) => void }) {
  const { label, pip, onDrag } = props;
  const d = useRef<{ sx: number; sy: number; orig: { x: number; y: number; w: number; h: number }; resize: boolean } | null>(null);

  const down = (e: React.PointerEvent, resize = false) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.current = { sx: e.clientX, sy: e.clientY, orig: { ...pip }, resize };
  };
  const move = (e: React.PointerEvent) => {
    if (!d.current) return;
    const dx = e.clientX - d.current.sx;
    const dy = e.clientY - d.current.sy;
    const frame = (e.currentTarget as HTMLElement).closest(".canvas-frame")!.getBoundingClientRect();
    const nx = dx / frame.width, ny = dy / frame.height;
    if (d.current.resize) {
      const w = Math.min(0.6, Math.max(0.12, d.current.orig.w + nx));
      const h = Math.min(0.6, Math.max(0.1, d.current.orig.h + ny));
      onDrag({ ...d.current.orig, w, h });
    } else {
      const x = Math.min(1 - d.current.orig.w, Math.max(0, d.current.orig.x + nx));
      const y = Math.min(1 - d.current.orig.h, Math.max(0, d.current.orig.y + ny));
      onDrag({ ...d.current.orig, x, y });
    }
  };
  const up = () => { d.current = null; };

  return (
    <div className="pip-overlay" style={{ left: `${pip.x * 100}%`, top: `${pip.y * 100}%`, width: `${pip.w * 100}%`, height: `${pip.h * 100}%` }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} title={`拖动调整 ${label}`}>
      <span className="pip-label">{label} · 拖动</span>
      <div className="pip-resize" onPointerDown={(e) => down(e, true)}>◢</div>
    </div>
  );
}
