import type { PipRect, PipShape, TemplateDef } from "../types";

// ============ 分屏模式（浮窗式录制布局预设） ============
export type SplitMode = "pip" | "split-v" | "split-h" | "dual" | "circle";

export interface SplitLayout {
  screen: { x: number; y: number; w: number; h: number };
  pips: { cam1?: Partial<PipRect>; cam2?: Partial<PipRect> };
  shape?: PipShape;
}

export const SPLIT_MODES: { id: SplitMode; label: string; emoji: string; desc: string }[] = [
  { id: "pip", label: "画中画", emoji: "🖼️", desc: "摄像头小窗悬浮在角落（默认）" },
  { id: "split-v", label: "上下分屏", emoji: "↕️", desc: "页面在上，摄像头小窗在下" },
  { id: "split-h", label: "左右分屏", emoji: "↔️", desc: "页面在左，摄像头小窗在右" },
  { id: "dual", label: "双摄并排", emoji: "🎥🎥", desc: "页面在上，两路摄像头并排在下" },
  { id: "circle", label: "圆形浮窗", emoji: "⭕", desc: "摄像头以圆形浮窗显示" },
];

/** 根据分屏模式生成布局（相对输出画布，归一化 0..1） */
export function splitLayoutFor(mode: SplitMode): SplitLayout | null {
  switch (mode) {
    case "pip":
      return null; // 使用模板默认布局
    case "split-v":
      return {
        screen: { x: 0, y: 0, w: 1, h: 0.66 },
        pips: {
          cam1: { x: 0.03, y: 0.7, w: 0.94, h: 0.26, radius: 16, label: "Camera 1" },
          cam2: undefined,
        },
      };
    case "split-h":
      return {
        screen: { x: 0, y: 0, w: 0.64, h: 1 },
        pips: {
          cam1: { x: 0.68, y: 0.06, w: 0.29, h: 0.55, radius: 16, label: "Camera 1" },
          cam2: { x: 0.68, y: 0.65, w: 0.29, h: 0.3, radius: 16, label: "Camera 2" },
        },
      };
    case "dual":
      return {
        screen: { x: 0, y: 0, w: 1, h: 0.68 },
        pips: {
          cam1: { x: 0.03, y: 0.72, w: 0.46, h: 0.25, radius: 16, label: "Camera 1" },
          cam2: { x: 0.51, y: 0.72, w: 0.46, h: 0.25, radius: 16, label: "Camera 2" },
        },
      };
    case "circle":
      return {
        screen: { x: 0, y: 0, w: 1, h: 1 },
        pips: {
          cam1: { x: 0.74, y: 0.05, w: 0.24, h: 0.24, radius: 9999, label: "" },
          cam2: undefined,
        },
        shape: "circle",
      };
  }
}
