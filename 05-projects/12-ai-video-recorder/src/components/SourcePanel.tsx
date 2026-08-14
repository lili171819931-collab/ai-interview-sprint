import { useCallback, useEffect, useRef, useState } from "react";
import { studio } from "../engine/Studio";
import { useForceUpdate, useStudioState } from "../hooks";
import { DeviceDiagnostics } from "./DeviceDiagnostics";

interface DeviceInfo {
  deviceId: string;
  label: string;
}

async function listDevices(): Promise<{ cams: DeviceInfo[]; mics: DeviceInfo[] }> {
  const d = await navigator.mediaDevices.enumerateDevices();
  return {
    cams: d.filter((x) => x.kind === "videoinput").map((x) => ({ deviceId: x.deviceId, label: x.label || "摄像头" })),
    mics: d.filter((x) => x.kind === "audioinput").map((x) => ({ deviceId: x.deviceId, label: x.label || "麦克风" })),
  };
}

function describeError(e: unknown): string {
  const err = e as DOMException;
  const map: Record<string, string> = {
    NotAllowedError: "权限被拒绝——请在浏览器地址栏左侧允许摄像头；若仍失败，检查 macOS 系统设置 → 隐私与安全性 → 摄像头 → 允许 Chrome（改后需重启 Chrome）",
    NotFoundError: "未找到可用摄像头——请检查摄像头是否被其他应用占用或已断开",
    NotReadableError: "摄像头正被其他应用/页面占用——请关闭占用后重试",
    OverconstrainedError: "无法满足所选设备要求——请尝试「自动（默认摄像头）」",
    SecurityError: "浏览器安全限制——请通过 http://127.0.0.1 或 HTTPS 访问",
    AbortError: "请求被中断，请重试",
  };
  return map[err?.name] ?? `打开摄像头失败（${err?.name ?? "未知错误"}）：${err?.message ?? ""}`;
}

export function SourcePanel() {
  const state = useStudioState();
  const force = useForceUpdate();
  const [cams, setCams] = useState<DeviceInfo[]>([]);
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [micVol, setMicVol] = useState(1);
  const [sysVol, setSysVol] = useState(1);
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [cam1Id, setCam1Id] = useState("");
  const [cam2Id, setCam2Id] = useState("");
  const [cam1Error, setCam1Error] = useState<string | null>(null);
  const [cam2Error, setCam2Error] = useState<string | null>(null);
  const [busy, setBusy] = useState<"cam1" | "cam2" | null>(null);
  const [showDiag, setShowDiag] = useState(false);
  const [devChecked, setDevChecked] = useState(false);
  const [vis, setVis] = useState({ screen: true, cam1: true, cam2: true });
  const cam1Preview = useRef<HTMLVideoElement>(null);
  const cam2Preview = useRef<HTMLVideoElement>(null);

  const mediaSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const refreshDevices = useCallback(async () => {
    if (!mediaSupported) return;
    try {
      const { cams, mics } = await listDevices();
      setCams(cams);
      setMics(mics);
      setDevChecked(true);
      // 默认选中第一个设备（保持用户已选的不变）
      setCam1Id((prev) => prev || cams[0]?.deviceId || "");
      setCam2Id((prev) => prev || cams[0]?.deviceId || "");
    } catch { /* 权限拒绝时忽略 */ }
  }, [mediaSupported]);

  useEffect(() => {
    refreshDevices();
    const timer = window.setInterval(refreshDevices, 3000);
    return () => clearInterval(timer);
  }, [refreshDevices]);

  useEffect(() => {
    if (cam1Preview.current && studio.cam1Stream) cam1Preview.current.srcObject = studio.cam1Stream;
    if (cam2Preview.current && studio.cam2Stream) cam2Preview.current.srcObject = studio.cam2Stream;
  }, [studio.cam1Stream, studio.cam2Stream, state, force]);

  const pickScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 60 }, audio: true });
      await studio.setScreen(stream);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => studio.setScreen(null));
    } catch (e) {
      console.warn("屏幕选择取消", e);
    }
  };

  /**
   * 打开摄像头。
   * - 使用 ideal（非 exact）设备匹配，设备变动时自动降级到默认摄像头
   * - Camera 2 与 Camera 1 共用同一摄像头时（单摄像头设备），自动复用 Camera 1 画面
   */
  const pickCamera = async (slot: "cam1" | "cam2", deviceId: string) => {
    setBusy(slot);
    if (slot === "cam1") setCam1Error(null);
    else setCam2Error(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { ideal: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: false,
        });
      } catch (e) {
        // 单摄像头被 Camera 1 占用时，Camera 2 复用 Camera 1 的画面
        const name = (e as DOMException)?.name;
        if (slot === "cam2" && studio.cam1Stream && (name === "NotReadableError" || name === "OverconstrainedError" || name === "NotFoundError")) {
          const track = studio.cam1Stream.getVideoTracks()[0];
          if (track) {
            stream = new MediaStream([track.clone()]);
            setCam2Error("ℹ️ 检测到单摄像头：Camera 2 已自动复用 Camera 1 的画面");
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      if (slot === "cam1") await studio.setCamera1(stream);
      else await studio.setCamera2(stream);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (slot === "cam1") { studio.setCamera1(null); setCam1Error(null); }
        else { studio.setCamera2(null); setCam2Error(null); }
      });
    } catch (e) {
      console.warn("摄像头打开失败", e);
      const msg = describeError(e);
      if (slot === "cam1") setCam1Error(msg);
      else setCam2Error(msg);
    } finally {
      setBusy(null);
    }
  };

  const toggleMic = async () => {
    if (micOn) {
      if (studio.micStream) studio.micStream.getTracks().forEach((t) => t.stop());
      await studio.setMic(null);
      setMicOn(false);
      setMicError(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        await studio.setMic(stream);
        setMicOn(true);
        setMicError(null);
      } catch (e) {
        setMicError("无法访问麦克风：" + describeError(e));
      }
    }
  };

  const toggleVis = (key: "screen" | "cam1" | "cam2") => {
    setVis((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (studio.compositor) {
        if (key === "screen") studio.compositor.enabled.screen = next.screen;
        if (key === "cam1") studio.compositor.enabled.camera1 = next.cam1;
        if (key === "cam2") studio.compositor.enabled.camera2 = next.cam2;
      }
      return next;
    });
  };

  const hasScreen = !!studio.screenStream;
  const hasCam1 = !!studio.cam1Stream;
  const hasCam2 = !!studio.cam2Stream;

  return (
    <div className="source-panel-inner">
      <div className="panel-title-row">
        <h2 className="panel-title">🎛️ 音视频源</h2>
        <div className="panel-title-actions">
          <button className="btn small ghost" onClick={() => setShowDiag(true)} title="运行设备自检">🔬 自检</button>
          <button className="btn small ghost" onClick={refreshDevices} title="重新检测设备">🔄 重新检测</button>
        </div>
      </div>

      <div className="ext-card">
        <div className="ext-head">🧩 网页内录制（浏览器扩展）</div>
        <div className="ext-body">
          在任意网页上直接录屏 + 摄像头小窗（形状/美颜/背景模糊），无需打开本页面。
          <ol>
            <li>打开 Chrome 扩展页：<code>chrome://extensions</code></li>
            <li>右上角开启「开发者模式」→「加载已解压的扩展程序」</li>
            <li>选择文件夹：<code>…/12-ai-video-recorder/extension</code></li>
            <li>任意网页右上角出现 🎥 悬浮工具栏，点「● 录制」即可</li>
          </ol>
        </div>
      </div>

      {!mediaSupported && (
        <div className="source-warning">
          ⚠️ 当前浏览器不支持摄像头 / 麦克风（需要 getUserMedia）。<br />
          请使用 <b>Chrome / Edge</b>，并通过 <b>http://127.0.0.1</b> 或 HTTPS 访问本应用。
        </div>
      )}

      {mediaSupported && devChecked && cams.length === 0 && (
        <div className="source-warning">
          ⚠️ <b>未检测到任何摄像头设备。</b><br />
          可能原因：macOS 系统权限未开启 / 摄像头被其他应用占用 / 无摄像头。<br />
          <button className="btn small" onClick={() => setShowDiag(true)} style={{ marginTop: 6 }}>🔬 一键自检定位原因</button>
        </div>
      )}

      <div className="source-card" data-on={hasScreen}>
        <div className="source-head">
          <span className="source-emoji">🖥️</span>
          <div className="source-info">
            <strong>屏幕 / 窗口</strong>
            <small>{hasScreen ? "已连接 ✓" : "未连接"}</small>
          </div>
        </div>
        <div className="source-actions">
          <button className="btn small" onClick={pickScreen} disabled={state === "recording"}>
            {hasScreen ? "切换屏幕" : "选择屏幕 / 窗口"}
          </button>
          {hasScreen && <button className="btn small ghost" onClick={() => studio.setScreen(null)} disabled={state === "recording"}>断开</button>}
          <button className={`btn small ${vis.screen ? "" : "dim"}`} onClick={() => toggleVis("screen")} title="屏幕源可见性（OBS 风格）">
            {vis.screen ? "👁 可见" : "🚫 隐藏"}
          </button>
        </div>
      </div>

      <CameraCard
        title="Camera 1"
        emoji="🎥"
        devices={cams}
        selected={cam1Id}
        onSelect={(id) => setCam1Id(id)}
        onConnect={() => pickCamera("cam1", cam1Id)}
        onDisconnect={() => { if (studio.cam1Stream) studio.cam1Stream.getTracks().forEach((t) => t.stop()); studio.setCamera1(null); setCam1Error(null); }}
        connected={hasCam1}
        previewRef={cam1Preview}
        disabled={state === "recording"}
        error={cam1Error}
        busy={busy === "cam1"}
        visible={vis.cam1}
        onToggleVis={() => toggleVis("cam1")}
      />

      <CameraCard
        title="Camera 2"
        emoji="📷"
        devices={cams}
        selected={cam2Id}
        onSelect={(id) => setCam2Id(id)}
        onConnect={() => pickCamera("cam2", cam2Id)}
        onDisconnect={() => { if (studio.cam2Stream) studio.cam2Stream.getTracks().forEach((t) => t.stop()); studio.setCamera2(null); setCam2Error(null); }}
        connected={hasCam2}
        previewRef={cam2Preview}
        disabled={state === "recording"}
        error={cam2Error}
        busy={busy === "cam2"}
        visible={vis.cam2}
        onToggleVis={() => toggleVis("cam2")}
      />

      <div className="source-card" data-on={micOn}>
        <div className="source-head">
          <span className="source-emoji">🎙️</span>
          <div className="source-info">
            <strong>麦克风</strong>
            <small>{micOn ? "已开启 ✓" : "关闭"}</small>
          </div>
        </div>
        <div className="source-actions">
          <button className={`btn small ${micOn ? "danger" : ""}`} onClick={toggleMic} disabled={state === "recording"}>
            {micOn ? "关闭麦克风" : "开启麦克风"}
          </button>
        </div>
        {micError && <p className="source-error">{micError}</p>}
        {micOn && (
          <div className="slider-row">
            <label>麦克风音量</label>
            <input type="range" min="0" max="1" step="0.01" value={micVol}
              onChange={(e) => { const v = +e.target.value; setMicVol(v); studio.setMicVolume(v); }} />
            <span>{Math.round(micVol * 100)}%</span>
          </div>
        )}
      </div>

      {studio.systemAudioStream && (
        <div className="source-card" data-on>
          <div className="source-head">
            <span className="source-emoji">🔊</span>
            <div className="source-info">
              <strong>系统声音</strong>
              <small>已随屏幕捕获 ✓</small>
            </div>
          </div>
          <div className="slider-row">
            <label>系统音量</label>
            <input type="range" min="0" max="1" step="0.01" value={sysVol}
              onChange={(e) => { const v = +e.target.value; setSysVol(v); studio.setSystemVolume(v); }} />
            <span>{Math.round(sysVol * 100)}%</span>
          </div>
        </div>
      )}

      <div className="tips">
        💡 提示：录制前先连接好源。<br />
        · 打不开摄像头？先点「🔬 自检」查看详细原因（含系统权限/设备占用），再点「🔄 重新检测」<br />
        · 只有 1 个摄像头时，Camera 2 会自动复用 Camera 1 画面<br />
        空格键暂停 / 继续 · ⌘R 开始 / 停止
      </div>

      {showDiag && <DeviceDiagnostics onClose={() => setShowDiag(false)} />}
    </div>
  );
}

function CameraCard(props: {
  title: string;
  emoji: string;
  devices: DeviceInfo[];
  selected: string;
  onSelect: (id: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connected: boolean;
  previewRef: React.RefObject<HTMLVideoElement | null>;
  disabled?: boolean;
  error?: string | null;
  busy?: boolean;
  visible?: boolean;
  onToggleVis?: () => void;
}) {
  const { title, emoji, devices, selected, onSelect, onConnect, onDisconnect, connected, previewRef, disabled, error, busy, visible, onToggleVis } = props;
  return (
    <div className="source-card" data-on={connected}>
      <div className="source-head">
        <span className="source-emoji">{emoji}</span>
        <div className="source-info">
          <strong>{title}</strong>
          <small>{connected ? "已连接 ✓" : busy ? "连接中…" : "未连接"}</small>
        </div>
      </div>
      <select
        className="device-select"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled || connected}
      >
        <option value="">✨ 自动（默认摄像头）</option>
        {devices.map((d, i) => (
          <option key={d.deviceId + i} value={d.deviceId}>{d.label || `${title} 设备 ${i + 1}`}</option>
        ))}
      </select>
      <div className="source-actions">
        {!connected ? (
          <button className="btn small" onClick={onConnect} disabled={disabled || busy}>
            {busy ? "⏳ 连接中…" : "打开摄像头"}
          </button>
        ) : (
          <button className="btn small danger" onClick={onDisconnect} disabled={disabled}>断开</button>
        )}
        {onToggleVis && (
          <button className={`btn small ${visible ? "" : "dim"}`} onClick={onToggleVis} title="来源可见性（OBS 风格）">
            {visible ? "👁 可见" : "🚫 隐藏"}
          </button>
        )}
      </div>
      {error && <p className="source-error">{error}</p>}
      {connected && <video ref={previewRef} className="cam-preview" muted playsInline autoPlay />}
    </div>
  );
}
