/**
 * 教学指针缩放：主进程推送光标 → 归一化到成片画布坐标
 */

export type ZoomMode = "lens" | "stretch";

export type CursorSample = {
  /** 屏幕全局坐标 */
  x: number;
  y: number;
  displayX: number;
  displayY: number;
  displayW: number;
  displayH: number;
};

export function cursorToNormalized(sample: CursorSample): { nx: number; ny: number } {
  const nx = (sample.x - sample.displayX) / Math.max(1, sample.displayW);
  const ny = (sample.y - sample.displayY) / Math.max(1, sample.displayH);
  return {
    nx: Math.max(0, Math.min(1, nx)),
    ny: Math.max(0, Math.min(1, ny)),
  };
}
