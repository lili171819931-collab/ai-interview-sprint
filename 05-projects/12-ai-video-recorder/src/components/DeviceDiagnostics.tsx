import { useEffect, useRef, useState } from "react";

// ============ 设备自检：逐项定位摄像头/麦克风为何不可用 ============

type Line = { level: "ok" | "err" | "info" | "warn"; text: string };

async function waitForFrame(video: HTMLVideoElement, timeoutMs = 4000): Promise<boolean> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (video.videoWidth > 0 && video.readyState >= 2) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

function trackSummary(track: MediaStreamTrack): string {
  const s = track.getSettings() as Record<string, unknown>;
  const parts = [`label=${track.label}`];
  if (s.width && s.height) parts.push(`${s.width}×${s.height}`);
  if (s.frameRate) parts.push(`${s.frameRate}fps`);
  if (s.deviceId) parts.push(`device=${String(s.deviceId).slice(0, 12)}…`);
  if (s.facingMode) parts.push(`facing=${s.facingMode}`);
  return parts.join(" · ");
}

export async function runDeviceDiagnostics(onLine: (l: Line) => void): Promise<void> {
  const line = (level: Line["level"], text: string) => onLine({ level, text });
  const ua = navigator.userAgent;
  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua);
  const isEdge = /Edg\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);

  // 1. 环境
  line("info", `浏览器: ${isChrome ? "Chrome ✓" : isEdge ? "Edge ✓" : isSafari ? "Safari ⚠️（部分功能受限）" : "其他"}`);
  line("info", `UA: ${ua.slice(0, 120)}`);
  line("info", `安全上下文(HTTPS/localhost): ${window.isSecureContext ? "是 ✓" : "否 ✗（媒体权限可能被禁）"}`);

  // 2. API 支持
  if (!navigator.mediaDevices?.getUserMedia) {
    line("err", "浏览器不支持 getUserMedia —— 请换用 Chrome / Edge");
    return;
  }
  line("ok", "mediaDevices.getUserMedia 可用 ✓");

  // 3. 权限查询
  const permName = navigator.permissions?.query as ((d: { name: PermissionName }) => Promise<PermissionStatus>) | undefined;
  if (permName) {
    for (const name of ["camera", "microphone"] as PermissionName[]) {
      try {
        const st = await permName.call(navigator.permissions, { name });
        line(st.state === "granted" ? "ok" : st.state === "denied" ? "err" : "warn",
          `权限 camera/microphone: ${name} = ${st.state}${st.state === "denied" ? "（浏览器已拒绝）" : ""}`);
      } catch {
        line("info", `权限查询不支持: ${name}（Firefox 等）`);
      }
    }
  }

  // 4. 设备枚举
  let devices: MediaDeviceInfo[] = [];
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    const mics = devices.filter((d) => d.kind === "audioinput");
    line(cams.length > 0 ? "ok" : "err", `enumerateDevices: 共 ${devices.length} 个设备（视频 ${cams.length} / 音频 ${mics.length}）`);
    for (const d of devices) {
      const kind = d.kind === "videoinput" ? "🎥" : d.kind === "audioinput" ? "🎙️" : "🔈";
      line("info", `  ${kind} ${d.kind}: ${d.label || "（无标签——未授权或系统未暴露）"} id=${d.deviceId.slice(0, 12)}…`);
    }
    if (cams.length === 0) {
      line("err", "⚠️ 系统未暴露任何摄像头设备。常见原因：");
      line("info", "  1) macOS 系统设置 → 隐私与安全性 → 摄像头 → 允许 Chrome 使用摄像头");
      line("info", "  2) 摄像头被其他应用独占（微信/视频会议等），或外接摄像头未连接");
      line("info", "  3) 虚拟机/远程桌面未映射摄像头");
    }
  } catch (e) {
    line("err", `enumerateDevices 异常: ${(e as Error).message}`);
  }

  // 5. getUserMedia 实测
  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  const tests: { name: string; constraints: MediaStreamConstraints }[] = [
    { name: "前置摄像头 facingMode=user", constraints: { video: { facingMode: "user" }, audio: false } },
    { name: "无约束（系统默认）", constraints: { video: true, audio: false } },
    ...videoDevices.slice(0, 3).map((d) => ({
      name: `指定设备「${d.label || "摄像头"}」`,
      constraints: { video: { deviceId: { exact: d.deviceId } }, audio: false } as MediaStreamConstraints,
    })),
  ];

  let anyVideoOk = false;
  for (const t of tests) {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(t.constraints);
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error("没有视频轨道");
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      await video.play().catch(() => {});
      const gotFrame = await waitForFrame(video);
      if (gotFrame) {
        anyVideoOk = true;
        line("ok", `✅ ${t.name}: 成功，有画面输出 —— ${trackSummary(track)}`);
      } else {
        line("warn", `⚠️ ${t.name}: 轨道已建立但 4s 内无画面帧 —— ${trackSummary(track)}（可能是虚拟摄像头/黑屏）`);
      }
      stream.getTracks().forEach((x) => x.stop());
    } catch (e) {
      const err = e as DOMException;
      line("err", `✗ ${t.name}: ${err?.name ?? "Error"} — ${err?.message ?? String(e)}`);
    } finally {
      stream?.getTracks().forEach((x) => x.stop());
    }
  }

  if (!anyVideoOk) {
    line("err", "\n▶ 结论：摄像头无法输出画面。请依次检查：");
    line("info", "  1) macOS 系统设置 → 隐私与安全性 → 摄像头 → 打开 Chrome 开关（改完需重启 Chrome）");
    line("info", "  2) 关闭占用摄像头的应用后重试");
    line("info", "  3) 用「相机」App 测试摄像头本身是否正常");
  } else {
    line("ok", "\n▶ 结论：摄像头可用 ✓ 如果面板仍显示未连接，请点击「🔄 重新检测」后再打开摄像头");
  }
}

export function DeviceDiagnostics({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setRunning(true);
    setLines([]);
    await runDeviceDiagnostics((l) => setLines((prev) => [...prev, l]));
    setRunning(false);
  };

  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      run();
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyReport = async () => {
    const text = lines.map((l) => `[${l.level.toUpperCase()}] ${l.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal diag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>🔬 设备自检报告</h2>
          <div className="modal-head-actions">
            {lines.length > 0 && (
              <button className="btn small ghost" onClick={copyReport}>{copied ? "✅ 已复制" : "📋 复制报告"}</button>
            )}
            <button className="btn small" onClick={run} disabled={running}>{running ? "⏳ 检测中…" : "↺ 重新检测"}</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="diag-body">
          {lines.length === 0 && <p className="diag-wait">{running ? "正在逐项检测…" : ""}</p>}
          {lines.map((l, i) => (
            <p key={i} className={`diag-line ${l.level}`}>{l.text}</p>
          ))}
        </div>
        <p className="diag-hint">💡 如果报告显示系统层面没有摄像头，请把这份报告复制发给我，我帮你进一步排查。</p>
      </div>
    </div>
  );
}
