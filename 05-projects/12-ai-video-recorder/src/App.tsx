import { useEffect, useRef, useState } from "react";
import { studio } from "./engine/Studio";
import { formatDuration } from "./engine/export";
import { useElapsed, useStudioEvent, useStudioState } from "./hooks";
import { SourcePanel } from "./components/SourcePanel";
import { CanvasStage } from "./components/CanvasStage";
import { EnginePanel } from "./components/EnginePanel";
import { ExportDialog } from "./components/ExportDialog";
import { OBSConsole } from "./components/OBSConsole";

export default function App() {
  const state = useStudioState();
  const elapsed = useElapsed();
  const status = useStudioEvent("status", "就绪 — 选择屏幕 / 摄像头开始创作");
  const recorded = useStudioEvent("recorded", null as null | { blob: Blob; url: string; duration: number });
  const [showExport, setShowExport] = useState(false);
  const [countdownSec, setCountdownSec] = useState(3);
  const [countdownActive, setCountdownActive] = useState<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const clearCountdown = () => {
    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
    setCountdownActive(null);
  };

  // StrictMode 安全：副作用放在 effect 中，避免 state updater 被双调用导致重复 startRecording
  const cdFired = useRef(false);
  useEffect(() => {
    if (countdownActive === null) { cdFired.current = false; return; }
    if (countdownActive > 0) { studio.beep(660, 0.12); return; }
    if (cdFired.current) return;
    cdFired.current = true;
    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
    studio.beep(990, 0.2);
    studio.startRecording();
  }, [countdownActive]);

  const startRecord = () => {
    if (state === "recording" || state === "paused") return;
    const n = countdownSec;
    if (n <= 0) { studio.startRecording(); return; }
    setCountdownActive(n);
    countdownTimer.current = window.setInterval(() => {
      setCountdownActive((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (studio.recordedUrl) URL.revokeObjectURL(studio.recordedUrl);
    studio.recordedBlob = f;
    studio.recordedUrl = url;
    studio.recordedDuration = 0;
    studio.setState("recorded");
    studio.setStatus(`✅ 已导入本地视频「${f.name}」— 可 AI 剪辑 / 导出 / 发布`);
  };

  const recording = state === "recording" || state === "paused";

  // 初始化 OBS 场景（恢复上次会话）
  useEffect(() => {
    studio.initScenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 键盘快捷键：空格暂停/继续，Ctrl+R 录制/停止
  useEffect(() => {
    if (state === "recording") clearCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => () => clearCountdown(), []);

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
        else startRecord();
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
          <select className="countdown-select" value={countdownSec} onChange={(e) => setCountdownSec(+e.target.value)} disabled={recording} title="开始录制前倒计时">
            <option value="0">⏱ 无</option>
            <option value="3">⏱ 3 秒</option>
            <option value="5">⏱ 5 秒</option>
            <option value="10">⏱ 10 秒</option>
          </select>
          {!recording && state !== "exporting" && (
            <button className="btn btn-record" onClick={startRecord} disabled={state === "recorded" && !studio.screenStream && !studio.cam1Stream && !studio.cam2Stream}>
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
          {!recording && state !== "exporting" && (
            <>
              <input ref={importRef} type="file" accept="video/*" hidden onChange={handleImport} />
              <button className="btn ghost" onClick={() => importRef.current?.click()} title="导入本地视频继续剪辑（配合浏览器扩展录制）">📥 导入视频</button>
            </>
          )}
          <button className="btn btn-export" onClick={() => setShowExport(true)} disabled={state !== "recorded" && !recorded}>
            🚀 导出 & 发布
          </button>
        </div>
      </header>

      {countdownActive !== null && (
        <div className="countdown-mask">
          <div className="countdown-num" key={countdownActive}>{countdownActive}</div>
          <div className="countdown-label">即将开始录制…</div>
        </div>
      )}

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

      <OBSConsole />

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}
