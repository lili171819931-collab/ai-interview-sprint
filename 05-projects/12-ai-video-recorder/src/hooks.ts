import { useEffect, useState } from "react";
import type { RecordState, StudioEventMap } from "./types";
import { studio } from "./engine/Studio";

export function useStudioState(): RecordState {
  const [s, setS] = useState<RecordState>(studio.getState());
  useEffect(() => studio.on("state", (v) => setS(v)), []);
  return s;
}

export function useStudioEvent<K extends keyof StudioEventMap>(ev: K, initial: StudioEventMap[K] | null) {
  const [v, setV] = useState<StudioEventMap[K] | null>(initial);
  useEffect(() => studio.on(ev, (p) => setV(p)), [ev]);
  return v;
}

export function useElapsed(): number {
  const [ms, setMs] = useState(0);
  useEffect(() => studio.on("tick", ({ elapsed }) => setMs(elapsed)), []);
  return ms;
}

/** 强制刷新（用于源变化等） */
export function useForceUpdate() {
  const [, setN] = useState(0);
  return () => setN((n) => n + 1);
}
