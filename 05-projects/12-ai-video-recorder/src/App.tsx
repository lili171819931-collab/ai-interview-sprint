import { useEffect, useState } from "react";
import { studio } from "./engine/Studio";
import { formatDuration } from "./engine/export";
import { useElapsed, useStudioEvent, useStudioState } from "./hooks";
import { SourcePanel } from "./components/SourcePanel";
import { CanvasStage } from "./components/CanvasStage";
import { EnginePanel } from "./components/EnginePanel";
import { ExportDialog } from "./components/ExportDialog";

export default function App() {
  const state = useStudioState();
  const elapsed = useElapsed();
  const status = useStudioEvent("status", "就绪 — 选择屏幕 / 摄像头开始创作");
  const recorded = useStudioEvent("recorded", null as null | { blob: Blob; url: string; duration: number });
  const [showExport, setShowExport] = useState(false);

  const recording = state === "recording" || state === "paused";

  // 键盘快捷键：空格暂停/继续，Ctrl+R 录制/停止
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state === "recording") studio.pauseRecording();
        else if (state === "paused") studio.resumeRecording();
      } else if (e.code === "KeyR" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (state === "recording" || state === "paused") studio.stopRecording();
        else studio.startRecording();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">🎥</span>
          <div>
            <h1>AI Video Recorder</h1>
            <p>智能录屏 · 多源合成 · AI 剪辑工作室</p>
          </div>
        </div>

        <div className="status-chip" data-recording={recording}>{status}</div>

        <div className="timer" data-recording={recording}>⏱ {formatDuration(elapsed)}</div>

        <div className="record-controls">
          {!recording && state !== "exporting" && (
            <button className="btn btn-record" onClick={() => studio.startRecording()} disabled={state === "recorded" && !studio.screenStream && !studio.cam1Stream && !studio.cam2Stream}>
              {state === "recorded" ? "再录一段" : "● 开始录制"}
            </button>
          )}
          {recording && (
            <>
              {state === "recording" ? (
                <button className="btn btn-pause" onClick={() => studio.pauseRecording()}>⏸ 暂停</button>
              ) : (
                <button className="btn btn-resume" onClick={() => studio.resumeRecording()}>▶ 继续</button>
              )}
              <button className="btn btn-stop" onClick={() => studio.stopRecording()}>⏹ 停止</button>
            </>
          )}
          {!recording && state === "recorded" && (
            <button className="btn btn-stop ghost" onClick={() => studio.reset()}>↺ 重新开始</button>
          )}
          <button className="btn btn-export" onClick={() => setShowExport(true)} disabled={state !== "recorded" && !recorded}>
            🚀 导出 & 发布
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="panel source-panel">
          <SourcePanel />
        </aside>

        <section className="stage-wrap">
          <CanvasStage />
        </section>

        <aside className="panel engine-panel">
          <EnginePanel />
        </aside>
      </main>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}
