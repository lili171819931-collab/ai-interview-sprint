import { useEffect, useMemo, useRef, useState } from "react";
import { studio } from "../engine/Studio";
import { useForceUpdate, useStudioState } from "../hooks";

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

export function SourcePanel() {
  const state = useStudioState();
  const force = useForceUpdate();
  const [cams, setCams] = useState<DeviceInfo[]>([]);
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [micVol, setMicVol] = useState(1);
  const [sysVol, setSysVol] = useState(1);
  const [micOn, setMicOn] = useState(false);
  const [cam1Id, setCam1Id] = useState("");
  const [cam2Id, setCam2Id] = useState("");
  const cam1Preview = useRef<HTMLVideoElement>(null);
  const cam2Preview = useRef<HTMLVideoElement>(null);

  const refreshDevices = async () => {
    try {
      const { cams, mics } = await listDevices();
      setCams(cams);
      setMics(mics);
      if (!cam1Id && cams[0]) setCam1Id(cams[0].deviceId);
      if (!cam2Id && cams[1]) setCam2Id(cams[1].deviceId);
      else if (!cam2Id && cams[0]) setCam2Id(cams[0].deviceId);
    } catch { /* 权限拒绝时忽略 */ }
  };

  useEffect(() => {
    refreshDevices();
    const timer = window.setInterval(refreshDevices, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (cam1Preview.current && studio.cam1Stream) {
      cam1Preview.current.srcObject = studio.cam1Stream;
    }
    if (cam2Preview.current && studio.cam2Stream) {
      cam2Preview.current.srcObject = studio.cam2Stream;
    }
  }, [studio.cam1Stream, studio.cam2Stream, state, force]);

  const pickScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: true,
      });
      await studio.setScreen(stream);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => studio.setScreen(null));
    } catch (e) {
      console.warn("屏幕选择取消", e);
    }
  };

  const pickCamera = async (slot: "cam1" | "cam2", deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (slot === "cam1") await studio.setCamera1(stream);
      else await studio.setCamera2(stream);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (slot === "cam1") studio.setCamera1(null);
        else studio.setCamera2(null);
      });
    } catch (e) {
      console.warn("摄像头打开失败", e);
      alert("无法打开该摄像头，请检查权限。");
    }
  };

  const toggleMic = async () => {
    if (micOn) {
      if (studio.micStream) studio.micStream.getTracks().forEach((t) => t.stop());
      await studio.setMic(null);
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        await studio.setMic(stream);
        setMicOn(true);
      } catch {
        alert("无法访问麦克风，请检查权限。");
      }
    }
  };

  const hasScreen = !!studio.screenStream;
  const hasCam1 = !!studio.cam1Stream;
  const hasCam2 = !!studio.cam2Stream;

  return (
    <div className="source-panel-inner">
      <h2 className="panel-title">🎛️ 音视频源</h2>

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
        </div>
      </div>

      <CameraCard
        title="Camera 1"
        emoji="🎥"
        devices={cams}
        selected={cam1Id}
        onSelect={(id) => { setCam1Id(id); pickCamera("cam1", id); }}
        onConnect={() => pickCamera("cam1", cam1Id)}
        onDisconnect={() => { if (studio.cam1Stream) studio.cam1Stream.getTracks().forEach((t) => t.stop()); studio.setCamera1(null); }}
        connected={hasCam1}
        previewRef={cam1Preview}
        disabled={state === "recording"}
      />

      <CameraCard
        title="Camera 2"
        emoji="📷"
        devices={cams}
        selected={cam2Id}
        onSelect={(id) => { setCam2Id(id); pickCamera("cam2", id); }}
        onConnect={() => pickCamera("cam2", cam2Id)}
        onDisconnect={() => { if (studio.cam2Stream) studio.cam2Stream.getTracks().forEach((t) => t.stop()); studio.setCamera2(null); }}
        connected={hasCam2}
        previewRef={cam2Preview}
        disabled={state === "recording"}
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
        空格键暂停 / 继续 · ⌘R 开始 / 停止
      </div>
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
}) {
  const { title, emoji, devices, selected, onSelect, onConnect, onDisconnect, connected, previewRef, disabled } = props;
  return (
    <div className="source-card" data-on={connected}>
      <div className="source-head">
        <span className="source-emoji">{emoji}</span>
        <div className="source-info">
          <strong>{title}</strong>
          <small>{connected ? "已连接 ✓" : "未连接"}</small>
        </div>
      </div>
      <select
        className="device-select"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled || connected}
      >
        {devices.length === 0 && <option value="">检测设备中…</option>}
        {devices.map((d, i) => (
          <option key={d.deviceId + i} value={d.deviceId}>{d.label || `${title} 设备 ${i + 1}`}</option>
        ))}
      </select>
      <div className="source-actions">
        {!connected ? (
          <button className="btn small" onClick={onConnect} disabled={disabled || devices.length === 0}>打开摄像头</button>
        ) : (
          <button className="btn small danger" onClick={onDisconnect} disabled={disabled}>断开</button>
        )}
      </div>
      {connected && <video ref={previewRef} className="cam-preview" muted playsInline autoPlay />}
    </div>
  );
}
