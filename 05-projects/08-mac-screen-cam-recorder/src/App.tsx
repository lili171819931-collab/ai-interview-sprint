import { useCallback, useEffect, useRef, useState } from "react";
import {
  CamLayout,
  CamShape,
  camSize,
  drawCompositeFrame,
  hitTestCamera,
  pickMimeType,
  snapToCorners,
} from "./lib/compose";
import { CameraBlurPipeline } from "./lib/camera-blur";
import { cursorToNormalized } from "./lib/pointer-zoom";
import {
  CAM_PRESETS,
  formatBytes,
  formatRelativeTime,
  playCue,
} from "./lib/ux";

type SourceInfo = {
  id: string;
  name: string;
  display_id: string;
  thumbnailDataUrl: string;
};

type DeviceInfo = { deviceId: string; label: string };
type RecState = "idle" | "countdown" | "preparing" | "recording" | "paused";

const DEFAULT_DIAMETER = 200;

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

function isPhoneOrContinuityCamera(label: string): boolean {
  const l = (label || "").toLowerCase();
  return (
    /iphone|ipad|ipod/.test(l) ||
    /continuity/.test(l) ||
    /desk\s*view/.test(l) ||
    /连.?互通|接续|随航|手机/.test(label) ||
    /iphone\s*摄像头|iPad\s*摄像头/.test(label)
  );
}

function rankMacCamera(label: string): number {
  const l = (label || "").toLowerCase();
  if (/facetime|built-?in|内建|内置|macbook|studio\s*display/.test(l)) return 0;
  if (/hd\s*camera|webcam|usb|logitech|c9\d{2}/.test(l)) return 1;
  return 2;
}

/** 只保留电脑摄像头，绝不回退到 Continuity / iPhone */
function pickComputerCameras(
  all: Array<{ deviceId: string; label: string }>,
): Array<{ deviceId: string; label: string }> {
  return all
    .filter((c) => !isPhoneOrContinuityCamera(c.label))
    .sort((a, b) => rankMacCamera(a.label) - rankMacCamera(b.label));
}

function stampShotName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-screenshot.png`;
}

function stampName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-screen-cam.mp4`;
}

export default function App() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const composeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);
  const composeTimerRef = useRef<number>(0);
  const levelRafRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  /** 墙钟：给操作条本地计时用，避免主窗口隐藏后节流 */
  const recStartedAtWallRef = useRef<number>(0);
  const recStateRef = useRef<RecState>("idle");
  const countdownCancelRef = useRef(false);
  const finalElapsedRef = useRef(0);
  const camerasRef = useRef<DeviceInfo[]>([]);
  const cameraIdRef = useRef("");
  const cameraEnabledRef = useRef(false);
  const readyPreviewRef = useRef(false);
  const trayHandlersRef = useRef<{
    startWithCountdown: () => void | Promise<void>;
    stopRecording: () => void | Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    takeScreenshot: () => void | Promise<void>;
  }>({
    startWithCountdown: () => undefined,
    stopRecording: () => undefined,
    pauseRecording: () => undefined,
    resumeRecording: () => undefined,
    takeScreenshot: () => undefined,
  });
  const blurPipelineRef = useRef(new CameraBlurPipeline());
  const blurWarnedRef = useRef(false);

  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [sourceFilter] = useState<"screen" | "window">("screen");
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [camShape, setCamShape] = useState<CamShape>("circle");
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [zoomMode, setZoomMode] = useState<"lens" | "stretch">("lens");
  const [magnification, setMagnification] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);
  const cursorNormRef = useRef({ nx: 0.5, ny: 0.5 });
  const pinchRef = useRef<{ lastDist: number } | null>(null);
  const camPointerRef = useRef<{
    ox: number;
    oy: number;
    lx: number;
    ly: number;
    moved: boolean;
    hit: boolean;
  } | null>(null);
  const pipClickTimerRef = useRef<number | null>(null);
  const lastPipTapRef = useRef(0);
  const [blurEnabled, setBlurEnabled] = useState(
    () => localStorage.getItem("macRecorder.blurEnabled") !== "0",
  );
  const [blurStrength, setBlurStrength] = useState(() => {
    const v = Number(localStorage.getItem("macRecorder.blurStrength") || "65");
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 65;
  });
  const [blurStatus, setBlurStatus] = useState<string>("idle");
  const [cameraLive, setCameraLive] = useState(false);
  const [countdownOn, setCountdownOn] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [layout, setLayout] = useState<CamLayout>({
    x: 1280 - DEFAULT_DIAMETER - 24,
    y: 720 - DEFAULT_DIAMETER - 24,
    diameter: DEFAULT_DIAMETER,
    shape: "circle",
    aspect: 4 / 3,
  });
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const [recState, setRecState] = useState<RecState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [perm, setPerm] = useState({ camera: "unknown", microphone: "unknown", screen: "unknown" });
  const [canvasSize, setCanvasSize] = useState({ w: 1280, h: 720 });
  const canvasSizeRef = useRef({ w: 1280, h: 720 });
  const [readyPreview, setReadyPreview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [minimizeOnRecord, setMinimizeOnRecord] = useState(
    () => localStorage.getItem("macRecorder.minimizeOnRecord") !== "0",
  );
  const [showTip, setShowTip] = useState(
    () => localStorage.getItem("macRecorder.tipDismissed") !== "1",
  );
  const [recents, setRecents] = useState<
    Array<{
      name: string;
      filePath: string;
      sizeBytes: number;
      createdAt: number;
      kind: "recording" | "screenshot";
    }>
  >([]);
  const [exportDir, setExportDir] = useState("~/Desktop/Mac录屏");
  const [copied, setCopied] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "recording" | "screenshot">(
    "all",
  );
  const [quickAccess, setQuickAccess] = useState<{
    kind: "recording" | "screenshot";
    filePath: string;
  } | null>(null);
  const [autoCopyPath, setAutoCopyPath] = useState(
    () => localStorage.getItem("macRecorder.autoCopyPath") === "1",
  );
  const [autoCopyImage, setAutoCopyImage] = useState(
    () => localStorage.getItem("macRecorder.autoCopyImage") !== "0",
  );

  const refreshPermissions = useCallback(async () => {
    if (!window.macRecorder) return;
    const [camera, microphone, screenRaw] = await Promise.all([
      window.macRecorder.getMediaAccessStatus("camera"),
      window.macRecorder.getMediaAccessStatus("microphone"),
      window.macRecorder.getMediaAccessStatus("screen"),
    ]);
    let screen = screenRaw;
    // 用户曾成功选过屏幕，或本地确认过：覆盖 Electron 对 screen 的误报
    if (
      screen !== "granted" &&
      (localStorage.getItem("macRecorder.screenGranted") === "1" ||
        Boolean(screenStreamRef.current))
    ) {
      screen = "granted";
    }
    setPerm({ camera, microphone, screen });
  }, []);

  const refreshSources = useCallback(async () => {
    if (!window.macRecorder) return;
    setRefreshing(true);
    try {
      const list = await window.macRecorder.getSources([sourceFilter]);
      setSources(list);
      setSelectedSourceId((prev) => {
        if (list.some((s) => s.id === prev)) return prev;
        return list[0]?.id || "";
      });
      if (!list.length) {
        setError(
          "未拿到屏幕源。macOS 要求：打开屏幕录制权限后，必须完全退出 Electron 再重新打开本 App，然后点「刷新」。",
        );
      } else {
        setError(null);
      }
    } catch (e) {
      setError(
        `无法获取屏幕源：${e instanceof Error ? e.message : String(e)}。请确认已授权屏幕录制，并完全退出后重启 App。`,
      );
    } finally {
      setRefreshing(false);
    }
  }, [sourceFilter]);

  const refreshDevices = useCallback(async () => {
    try {
      // 只预热麦克风权限；不要用 facingMode 打开视频（macOS 常误开 Continuity）
      const warmAudio = await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .catch(() => null);
      warmAudio?.getTracks().forEach((t) => t.stop());

      let devices = await navigator.mediaDevices.enumerateDevices();
      let rawCams = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `摄像头 ${i + 1}`,
        }));

      // 标签为空时逐个 exact 打开再关掉，解锁真实 label（仍可筛 Continuity）
      const labelsBlank = rawCams.every(
        (c) => !c.label || /^摄像头\s*\d+$/.test(c.label),
      );
      if (labelsBlank && rawCams.length) {
        for (const c of rawCams.slice(0, 6)) {
          try {
            const s = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: { deviceId: { exact: c.deviceId } },
            });
            const lab = s.getVideoTracks()[0]?.label || "";
            s.getTracks().forEach((t) => t.stop());
            if (isPhoneOrContinuityCamera(lab)) continue;
            break;
          } catch {
            // try next
          }
        }
        devices = await navigator.mediaDevices.enumerateDevices();
        rawCams = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `摄像头 ${i + 1}`,
          }));
      }

      const cams = pickComputerCameras(rawCams);
      const micsList = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `麦克风 ${i + 1}`,
        }));
      camerasRef.current = cams;
      setCameras(cams);
      setMics(micsList);
      setCameraId((prev) => {
        const stillOk =
          prev &&
          cams.some((c) => c.deviceId === prev) &&
          !isPhoneOrContinuityCamera(cams.find((c) => c.deviceId === prev)?.label || "");
        const next = stillOk ? prev : cams[0]?.deviceId || "";
        cameraIdRef.current = next;
        return next;
      });
      setMicId((prev) =>
        micsList.some((m) => m.deviceId === prev) ? prev : micsList[0]?.deviceId || "",
      );
      if (rawCams.length > 0 && cams.length === 0) {
        setError("未找到电脑摄像头（已排除 iPhone/iPad Continuity）。请检查本机 FaceTime 摄像头。");
      }
      await refreshPermissions();
    } catch (e) {
      setError(`无法枚举设备：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [refreshPermissions]);

  useEffect(() => {
    void refreshDevices();
    void refreshPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecents = useCallback(async () => {
    if (!window.macRecorder?.listRecordings) return;
    const res = await window.macRecorder.listRecordings();
    setExportDir(res.dir);
    setRecents(res.items);
  }, []);

  useEffect(() => {
    void loadRecents();
  }, [loadRecents]);

  useEffect(() => {
    if (!window.macRecorder?.onTrayAction) return;
    return window.macRecorder.onTrayAction((action) => {
      const h = trayHandlersRef.current;
      if (action === "stop") {
        if (
          recStateRef.current === "countdown" ||
          recStateRef.current === "preparing"
        ) {
          countdownCancelRef.current = true;
          setCountdown(null);
          setRecState("idle");
          setElapsedMs(0);
          void window.macRecorder?.pushControlBarState?.({
            recState: "idle",
            elapsedMs: 0,
            baseElapsedMs: 0,
            cameraEnabled: cameraEnabledRef.current,
            error: null,
          });
          return;
        }
        void h.stopRecording();
        return;
      }
      if (action === "screenshot") void h.takeScreenshot();
      if (action === "toggle-record") {
        if (recStateRef.current === "idle") void h.startWithCountdown();
        else if (
          recStateRef.current === "recording" ||
          recStateRef.current === "paused"
        ) {
          void h.stopRecording();
        }
      }
      if (action === "toggle-pause") {
        if (recStateRef.current === "recording") h.pauseRecording();
        else if (recStateRef.current === "paused") h.resumeRecording();
      }
      if (action === "toggle-camera") {
        setCameraEnabled((v) => !v);
      }
      if (action === "toggle-mirror") {
        setMirrored((v) => !v);
      }
      if (action === "toggle-shape") {
        setCamShape((s) => (s === "circle" ? "rect" : "circle"));
      }
      if (action === "reset-zoom" || action === "toggle-zoom") {
        setMagnification(1);
        setZoomEnabled(false);
      }
    });
  }, []);

  useEffect(() => {
    recStateRef.current = recState;
  }, [recState]);

  useEffect(() => {
    cameraEnabledRef.current = cameraEnabled;
  }, [cameraEnabled]);

  useEffect(() => {
    cameraIdRef.current = cameraId;
  }, [cameraId]);

  useEffect(() => {
    camerasRef.current = cameras;
  }, [cameras]);

  useEffect(() => {
    readyPreviewRef.current = readyPreview;
  }, [readyPreview]);

  useEffect(() => {
    if (!window.macRecorder?.onCursorPos) return;
    return window.macRecorder.onCursorPos((pos) => {
      cursorNormRef.current = cursorToNormalized(pos);
    });
  }, []);

  useEffect(() => {
    void window.macRecorder?.setCursorTracking?.(zoomEnabled);
    return () => {
      void window.macRecorder?.setCursorTracking?.(false);
    };
  }, [zoomEnabled]);

  const pushBarState = useCallback(() => {
    const recording = recState === "recording";
    // 录制中不把 elapsedMs 推进去，避免每 200ms 重置操作条墙钟导致时长漂移
    void window.macRecorder?.pushControlBarState?.({
      recState,
      elapsedMs: recording ? undefined : elapsedMs,
      baseElapsedMs: accumulatedRef.current,
      recStartedAt: recording ? recStartedAtWallRef.current || undefined : undefined,
      countdown: recState === "countdown" ? countdown : null,
      cameraEnabled,
      camShape,
      mirrored,
      zoomEnabled,
      magnification,
    });
  }, [
    recState,
    countdown,
    cameraEnabled,
    camShape,
    mirrored,
    zoomEnabled,
    magnification,
    // idle/paused 时需要同步一次冻结的 elapsed
    recState === "recording" ? 0 : elapsedMs,
  ]);

  useEffect(() => {
    pushBarState();
  }, [pushBarState]);

  useEffect(() => {
    // sourceFilter 仅影响「尝试列出源」，不自动刷
  }, [sourceFilter]);

  useEffect(() => {
    setLayout((prev) => ({ ...prev, shape: camShape }));
  }, [camShape]);

  useEffect(() => {
    void window.macRecorder?.setShellExpanded?.(moreOpen);
  }, [moreOpen]);

  // Timer
  useEffect(() => {
    if (recState !== "recording") return;
    const id = window.setInterval(() => {
      setElapsedMs(accumulatedRef.current + (performance.now() - startedAtRef.current));
    }, 200);
    return () => window.clearInterval(id);
  }, [recState]);

  // Level meter
  useEffect(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      if (analyser && micEnabled) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
      } else {
        setLevel(0);
      }
      levelRafRef.current = requestAnimationFrame(tick);
    };
    levelRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(levelRafRef.current);
  }, [micEnabled]);

  const stopTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  const releaseAllMedia = useCallback(async () => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {
      // ignore
    }
    recorderRef.current = null;
    cancelAnimationFrame(rafRef.current);
    if (composeTimerRef.current) {
      window.clearInterval(composeTimerRef.current);
      composeTimerRef.current = 0;
    }
    stopTracks(screenStreamRef.current);
    stopTracks(cameraStreamRef.current);
    stopTracks(micStreamRef.current);
    screenStreamRef.current = null;
    cameraStreamRef.current = null;
    micStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    if (selfieVideoRef.current) selfieVideoRef.current.srcObject = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    setCameraEnabled(false);
    setCameraLive(false);
    setMicEnabled(false);
    setReadyPreview(false);
    await window.macRecorder?.setCameraPip?.({ visible: false });
    await window.macRecorder?.setCursorTracking?.(false);
    await window.macRecorder?.setRecordingState?.(false);
    // 操作条启动后常驻，退出时由主进程关闭
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      void releaseAllMedia();
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    const unsub = window.macRecorder?.onReleaseMedia?.(() => {
      void releaseAllMedia();
    });
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      unsub?.();
    };
  }, [releaseAllMedia]);

  // 启动只显示主录制壳，不拉起第二悬浮条（录制且主窗隐藏时再开）
  useEffect(() => {
    void window.macRecorder?.setControlBar?.({
      visible: false,
      state: {
        recState: "idle",
        elapsedMs: 0,
        cameraEnabled: false,
        camShape: "circle",
        mirrored: true,
        zoomEnabled: false,
      },
    });
  }, []);

  const ensureComposeCanvas = (w: number, h: number) => {
    if (!composeCanvasRef.current) {
      composeCanvasRef.current = document.createElement("canvas");
    }
    const c = composeCanvasRef.current;
    // 录制中禁止改 canvas 尺寸，否则 captureStream 会停在首帧
    const recording =
      recorderRef.current &&
      (recorderRef.current.state === "recording" || recorderRef.current.state === "paused");
    if (!recording && (c.width !== w || c.height !== h)) {
      c.width = w;
      c.height = h;
    }
    return c;
  };

  const composeOptsRef = useRef({
    cameraEnabled: false,
    blurEnabled: true,
    blurStrength: 55,
    mirrored: true,
    camShape: "circle" as CamShape,
    zoomEnabled: false,
    zoomMode: "lens" as "lens" | "stretch",
    magnification: 1,
    layout: {
      x: 0,
      y: 0,
      diameter: DEFAULT_DIAMETER,
      shape: "circle" as CamShape,
      aspect: 4 / 3,
    },
  });
  composeOptsRef.current = {
    cameraEnabled,
    blurEnabled,
    blurStrength,
    mirrored,
    camShape,
    zoomEnabled,
    zoomMode,
    magnification,
    layout: { ...layout, shape: camShape, aspect: layout.aspect ?? 4 / 3 },
  };

  const stopComposeLoop = () => {
    cancelAnimationFrame(rafRef.current);
    if (composeTimerRef.current) {
      window.clearInterval(composeTimerRef.current);
      composeTimerRef.current = 0;
    }
  };

  const paintComposeFrame = () => {
    const screenVideo = screenVideoRef.current;
    const cameraVideo = cameraVideoRef.current;
    const preview = previewCanvasRef.current;
    const opts = composeOptsRef.current;

    if (screenVideo && screenVideo.paused) {
      void screenVideo.play().catch(() => undefined);
    }
    if (cameraVideo && cameraVideo.paused && opts.cameraEnabled) {
      void cameraVideo.play().catch(() => undefined);
    }

    // 强制屏幕轨保持 live
    const track = screenStreamRef.current?.getVideoTracks()?.[0];
    if (track && track.readyState === "live" && track.muted) {
      // muted track still may deliver frames; nothing to do
    }

    if (screenVideo && preview) {
      const sw = screenVideo.videoWidth || 1280;
      const sh = screenVideo.videoHeight || 720;
      let cw = sw;
      let ch = sh;
      const maxEdge = 1920;
      if (Math.max(cw, ch) > maxEdge) {
        const scale = maxEdge / Math.max(cw, ch);
        cw = Math.round(cw * scale);
        ch = Math.round(ch * scale);
      }

      const recording =
        recorderRef.current &&
        (recorderRef.current.state === "recording" || recorderRef.current.state === "paused");
      if (!recording) {
        const prev = canvasSizeRef.current;
        if (prev.w !== cw || prev.h !== ch) {
          canvasSizeRef.current = { w: cw, h: ch };
          setCanvasSize({ w: cw, h: ch });
        }
      } else {
        cw = canvasSizeRef.current.w || cw;
        ch = canvasSizeRef.current.h || ch;
      }

      const compose = ensureComposeCanvas(cw, ch);
      const composeCtx = compose.getContext("2d", { alpha: false });

      let cameraFrame: CanvasImageSource | null = null;
      if (
        opts.cameraEnabled &&
        opts.blurEnabled &&
        blurPipelineRef.current.status === "ready" &&
        cameraVideo &&
        cameraVideo.readyState >= 2
      ) {
        cameraFrame = blurPipelineRef.current.process(
          cameraVideo,
          opts.blurStrength,
          performance.now(),
        );
      }

      const zoom =
        opts.zoomEnabled && opts.magnification <= 1.02
          ? {
              enabled: true,
              mode: opts.zoomMode,
              nx: cursorNormRef.current.nx,
              ny: cursorNormRef.current.ny,
              radiusPx: Math.round(Math.min(cw, ch) * 0.14),
              magnification: 2,
            }
          : null;

      if (composeCtx) {
        drawCompositeFrame(composeCtx, screenVideo, cameraVideo, {
          cameraEnabled: opts.cameraEnabled && Boolean(cameraVideo?.srcObject),
          mirrored: opts.mirrored,
          layout: { ...opts.layout, shape: opts.camShape },
          stroke: true,
          cameraFrame,
          pointerZoom: zoom,
          screenMagnification: opts.magnification,
          screenZoomNx: cursorNormRef.current.nx,
          screenZoomNy: cursorNormRef.current.ny,
        });
      }
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(1, Math.floor(preview.clientWidth * dpr));
      const targetH = Math.max(1, Math.floor(preview.clientHeight * dpr));
      if (preview.width !== targetW || preview.height !== targetH) {
        preview.width = targetW;
        preview.height = targetH;
      }
      const pctx = preview.getContext("2d");
      if (pctx) {
        pctx.clearRect(0, 0, preview.width, preview.height);
        pctx.fillStyle = "#0b0c0f";
        pctx.fillRect(0, 0, preview.width, preview.height);
        const scale = Math.min(preview.width / cw, preview.height / ch);
        const dw = cw * scale;
        const dh = ch * scale;
        const dx = (preview.width - dw) / 2;
        const dy = (preview.height - dh) / 2;
        pctx.drawImage(compose, dx, dy, dw, dh);
      }
    }
  };

  const startPreviewLoop = useCallback(() => {
    stopComposeLoop();
    paintComposeFrame();
    // 以定时器为主：隐藏窗口时也不依赖 RAF（避免静帧）
    composeTimerRef.current = window.setInterval(() => {
      paintComposeFrame();
    }, 33);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    canvasSizeRef.current = canvasSize;
  }, [canvasSize]);

  useEffect(() => {
    if (readyPreview) startPreviewLoop();
    return () => stopComposeLoop();
  }, [readyPreview, startPreviewLoop]);

  // 背景虚化模型按需加载
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cameraEnabled || !blurEnabled) {
        setBlurStatus(blurPipelineRef.current.status);
        return;
      }
      setBlurStatus("loading");
      const ok = await blurPipelineRef.current.ensureReady();
      if (cancelled) return;
      if (ok) {
        setBlurStatus("ready");
        blurWarnedRef.current = false;
      } else {
        setBlurStatus("failed");
        if (!blurWarnedRef.current) {
          blurWarnedRef.current = true;
          setError(
            `背景虚化模型加载失败，已降级为清晰出镜：${blurPipelineRef.current.lastError || "unknown"}`,
          );
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [blurEnabled, cameraEnabled]);

  // Default layout bottom-right when canvas size known（用户拖过则不重置）
  const userMovedCamRef = useRef(false);
  useEffect(() => {
    if (userMovedCamRef.current) return;
    setLayout((prev) => ({
      diameter: prev.diameter,
      x: Math.max(24, canvasSize.w - prev.diameter - 24),
      y: Math.max(24, canvasSize.h - prev.diameter - 24),
    }));
  }, [canvasSize.w, canvasSize.h]);

  const mountHiddenVideo = (existing: HTMLVideoElement | null) => {
    if (existing && document.body.contains(existing)) return existing;
    const video = existing || document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("autoplay", "true");
    video.className = "hidden-media-video";
    if (!document.body.contains(video)) document.body.appendChild(video);
    return video;
  };

  const attachScreenSource = async (sourceId: string) => {
    stopTracks(screenStreamRef.current);
    screenStreamRef.current = null;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // @ts-expect-error Electron constraint
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          maxWidth: 1920,
          maxHeight: 1080,
          maxFrameRate: 30,
          minFrameRate: 15,
        },
      },
    });
    screenStreamRef.current = stream;
    const video = mountHiddenVideo(screenVideoRef.current);
    screenVideoRef.current = video;
    video.srcObject = stream;
    await video.play();
    const vtrack = stream.getVideoTracks()[0];
    try {
      await vtrack?.applyConstraints({
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, min: 15 },
      });
    } catch {
      // ignore
    }
    setReadyPreview(true);
  };

  const pickScreenWithSystemPicker = async () => {
    setError(null);
    setRefreshing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      stopTracks(screenStreamRef.current);
      screenStreamRef.current = stream;
      const video = mountHiddenVideo(screenVideoRef.current);
      screenVideoRef.current = video;
      video.srcObject = stream;
      await video.play();
      const vtrack = stream.getVideoTracks()[0];
      try {
        await vtrack?.applyConstraints({
          frameRate: { ideal: 30, min: 15 },
        });
      } catch {
        // ignore
      }
      setSelectedSourceId("display-media");
      setSources([
        {
          id: "display-media",
          name: "已选：系统选择器中的屏幕/窗口",
          display_id: "",
          thumbnailDataUrl: "",
        },
      ]);
      setReadyPreview(true);
      localStorage.setItem("macRecorder.screenGranted", "1");
      setPerm((p) => ({ ...p, screen: "granted" }));
      if (cameraEnabled && cameraId) {
        void attachCamera(cameraId);
      }
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setReadyPreview(false);
        setError("屏幕共享已停止。请重新点击「选择屏幕/窗口」。");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Permission denied|NotAllowedError|cancel/i.test(msg) || (e as { name?: string })?.name === "NotAllowedError") {
        setError("已取消或拒绝屏幕选择。请再点「选择屏幕/窗口」。");
      } else {
        setError(`选择屏幕失败：${msg}`);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const attachCamera = async (deviceId: string) => {
    stopTracks(cameraStreamRef.current);
    cameraStreamRef.current = null;
    setCameraLive(false);
    if (!deviceId) return;
    const list = camerasRef.current.length ? camerasRef.current : cameras;
    const camMeta = list.find((c) => c.deviceId === deviceId);
    if (camMeta && isPhoneOrContinuityCamera(camMeta.label)) {
      const fallback = pickComputerCameras(list)[0];
      if (fallback && fallback.deviceId !== deviceId) {
        setCameraId(fallback.deviceId);
        cameraIdRef.current = fallback.deviceId;
        setError("已跳过手机 Continuity 摄像头，改用电脑摄像头。");
        return;
      }
      setError("当前选中的是手机摄像头，请改选电脑 FaceTime / 内置摄像头。");
      setCameraEnabled(false);
      return;
    }
    const tryIds = [
      deviceId,
      ...pickComputerCameras(list).map((c) => c.deviceId).filter((id) => id !== deviceId),
    ];
    let lastErr: unknown = null;
    for (const id of tryIds) {
      const meta = list.find((c) => c.deviceId === id);
      if (meta && isPhoneOrContinuityCamera(meta.label)) continue;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: id },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
        const trackLabel = stream.getVideoTracks()[0]?.label || "";
        if (isPhoneOrContinuityCamera(trackLabel)) {
          stream.getTracks().forEach((t) => t.stop());
          continue;
        }
        cameraStreamRef.current = stream;
        cameraIdRef.current = id;
        if (id !== deviceId) setCameraId(id);
        const video = mountHiddenVideo(cameraVideoRef.current);
        cameraVideoRef.current = video;
        video.srcObject = stream;
        await video.play();
        setCameraLive(true);
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
          void selfieVideoRef.current.play().catch(() => undefined);
        }
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    setError(
      `摄像头打开失败：${lastErr instanceof Error ? lastErr.message : String(lastErr || "无可用电脑摄像头")}。请检查「系统设置 → 隐私与安全性 → 摄像头」，并确认未占用 FaceTime。`,
    );
    setCameraEnabled(false);
    setCameraLive(false);
  };

  const attachMic = async (deviceId: string) => {
    stopTracks(micStreamRef.current);
    micStreamRef.current = null;
    if (audioCtxRef.current) {
      await audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    if (!deviceId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { ideal: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const gain = ctx.createGain();
      gain.gain.value = 1;
      micGainRef.current = gain;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(gain);
      gain.connect(analyser);
      const silent = ctx.createGain();
      silent.gain.value = 0;
      analyser.connect(silent);
      silent.connect(ctx.destination);
    } catch (e) {
      setError(
        `麦克风打开失败：${e instanceof Error ? e.message : String(e)}。请检查「系统设置 → 隐私与安全性 → 麦克风」。`,
      );
      setMicEnabled(false);
    }
  };

  useEffect(() => {
    if (selectedSourceId && selectedSourceId !== "display-media") {
      void attachScreenSource(selectedSourceId).catch((e) => {
        setError(
          `屏幕采集失败：${e instanceof Error ? e.message : String(e)}。请改用「选择屏幕/窗口」。`,
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSourceId]);

  useEffect(() => {
    if (cameraEnabled && cameraId) {
      void attachCamera(cameraId);
    } else {
      stopTracks(cameraStreamRef.current);
      cameraStreamRef.current = null;
      setCameraLive(false);
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
      if (selfieVideoRef.current) selfieVideoRef.current.srcObject = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraEnabled, cameraId]);

  // 录屏时（及摄像头开启时）显示可拖动摄像头小窗；contentProtection 保证不进成片
  useEffect(() => {
    if (!window.macRecorder?.setCameraPip) return;
    const show = cameraEnabled && cameraLive;
    void window.macRecorder.setCameraPip({
      visible: show,
      deviceId: cameraId || undefined,
      shape: camShape,
      mirrored,
    });
    return () => {
      void window.macRecorder?.setCameraPip?.({ visible: false });
    };
  }, [cameraEnabled, cameraLive, cameraId, camShape, mirrored]);

  useEffect(() => {
    if (!window.macRecorder?.onCameraPipMoved) return;
    return window.macRecorder.onCameraPipMoved((pos) => {
      userMovedCamRef.current = true;
      const cw = canvasSizeRef.current.w || 1;
      const ch = canvasSizeRef.current.h || 1;
      const cx = pos.x + pos.width / 2;
      const cy = pos.y + pos.height / 2;
      const nx = (cx - pos.displayX) / Math.max(1, pos.displayW);
      const ny = (cy - pos.displayY) / Math.max(1, pos.displayH);
      setLayout((prev) => {
        const { w, h } = camSize(prev);
        return snapToCorners(
          {
            ...prev,
            x: nx * cw - w / 2,
            y: ny * ch - h / 2,
          },
          cw,
          ch,
        );
      });
    });
  }, []);

  useEffect(() => {
    if (micEnabled && micId) {
      void attachMic(micId);
    } else {
      stopTracks(micStreamRef.current);
      micStreamRef.current = null;
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => undefined);
        audioCtxRef.current = null;
      }
      micGainRef.current = null;
      analyserRef.current = null;
      setLevel(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micEnabled, micId]);

  useEffect(() => {
    if (micGainRef.current) {
      micGainRef.current.gain.value = micEnabled ? 1 : 0;
    }
  }, [micEnabled]);

  // 自拍监视器跟随摄像头流
  useEffect(() => {
    const el = selfieVideoRef.current;
    if (!el) return;
    if (cameraEnabled && cameraStreamRef.current) {
      el.srcObject = cameraStreamRef.current;
      el.muted = true;
      void el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [cameraEnabled, cameraLive]);

  const clientToCompose = (clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cw = canvasSize.w || 1;
    const ch = canvasSize.h || 1;
    const scale = Math.min(rect.width / cw, rect.height / ch);
    const dw = cw * scale;
    const dh = ch * scale;
    const ox = (rect.width - dw) / 2;
    const oy = (rect.height - dh) / 2;
    const px = (clientX - rect.left - ox) / scale;
    const py = (clientY - rect.top - oy) / scale;
    if (px < 0 || py < 0 || px > cw || py > ch) return null;
    return { px, py };
  };

  const toggleCamShape = () => {
    setCamShape((s) => (s === "circle" ? "rect" : "circle"));
  };

  const toggleMirror = () => {
    setMirrored((v) => !v);
  };

  /** 单击切形状，双击反转；拖动不触发 */
  const handlePipGesture = (kind: "click" | "dblclick") => {
    if (pipClickTimerRef.current) {
      window.clearTimeout(pipClickTimerRef.current);
      pipClickTimerRef.current = null;
    }
    if (kind === "dblclick") {
      lastPipTapRef.current = 0;
      toggleMirror();
      return;
    }
    const now = performance.now();
    if (now - lastPipTapRef.current < 320) {
      lastPipTapRef.current = 0;
      toggleMirror();
      return;
    }
    lastPipTapRef.current = now;
    pipClickTimerRef.current = window.setTimeout(() => {
      pipClickTimerRef.current = null;
      lastPipTapRef.current = 0;
      toggleCamShape();
    }, 280);
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!previewCanvasRef.current) return;
    const pt = clientToCompose(e.clientX, e.clientY);
    if (!pt) {
      camPointerRef.current = null;
      return;
    }
    const { px, py } = pt;
    cursorNormRef.current = {
      nx: Math.max(0, Math.min(1, px / Math.max(1, canvasSize.w))),
      ny: Math.max(0, Math.min(1, py / Math.max(1, canvasSize.h))),
    };
    const hit =
      cameraEnabled &&
      hitTestCamera({ ...layout, shape: camShape }, canvasSize.w, canvasSize.h, px, py);
    camPointerRef.current = {
      ox: px,
      oy: py,
      lx: layout.x,
      ly: layout.y,
      moved: false,
      hit: Boolean(hit),
    };
    if (hit) previewCanvasRef.current.setPointerCapture(e.pointerId);
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!camPointerRef.current?.hit) return;
    const pt = clientToCompose(e.clientX, e.clientY);
    if (!pt) return;
    const { px, py } = pt;
    const dx = px - camPointerRef.current.ox;
    const dy = py - camPointerRef.current.oy;
    if (Math.hypot(dx, dy) > 6) camPointerRef.current.moved = true;
    if (!camPointerRef.current.moved) return;
    setLayout((prev) => ({
      ...prev,
      x: camPointerRef.current!.lx + dx,
      y: camPointerRef.current!.ly + dy,
    }));
  };

  const onCanvasPointerUp = () => {
    const p = camPointerRef.current;
    camPointerRef.current = null;
    if (!p?.hit) return;
    if (!p.moved) {
      handlePipGesture("click");
      return;
    }
    userMovedCamRef.current = true;
    setLayout((prev) => snapToCorners(prev, canvasSize.w, canvasSize.h));
  };

  const onPreviewWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // 触控板捏合在 Chromium 常表现为 ctrl+wheel；⌘/⌥+滚轮为降级
    if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
    e.preventDefault();
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      cursorNormRef.current = {
        nx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        ny: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      };
    }
    const delta = -e.deltaY;
    const factor = Math.exp(delta * 0.0018);
    setMagnification((m) => Math.max(1, Math.min(3, m * factor)));
  };

  const onPreviewTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { lastDist: dist };
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mx = (a.clientX + b.clientX) / 2;
        const my = (a.clientY + b.clientY) / 2;
        cursorNormRef.current = {
          nx: Math.max(0, Math.min(1, (mx - rect.left) / rect.width)),
          ny: Math.max(0, Math.min(1, (my - rect.top) / rect.height)),
        };
      }
    }
  };

  const onPreviewTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const ratio = dist / Math.max(1, pinchRef.current.lastDist);
    pinchRef.current.lastDist = dist;
    setMagnification((m) => Math.max(1, Math.min(3, m * ratio)));
  };

  const onPreviewTouchEnd = () => {
    if (!pinchRef.current) return;
    pinchRef.current = null;
  };

  const takeScreenshot = async () => {
    setError(null);
    try {
      const compose = composeCanvasRef.current;
      const screenVideo = screenVideoRef.current;
      let canvas = compose;
      if (!canvas || canvas.width < 2) {
        if (!screenVideo || screenVideo.readyState < 2) {
          setError("请先「选择屏幕/窗口」再截图（Snapzy 风格：基于当前画面快拍）。");
          return;
        }
        canvas = document.createElement("canvas");
        canvas.width = screenVideo.videoWidth || 1280;
        canvas.height = screenVideo.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas!.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) {
        setError("截图失败：无法编码 PNG。");
        return;
      }
      const buffer = await blob.arrayBuffer();
      const result = await window.macRecorder.saveScreenshot({
        buffer,
        fileName: stampShotName(),
        copyToClipboard: autoCopyImage,
      });
      if (result?.ok && result.filePath) {
        playCue("success");
        setLastFile(result.filePath);
        setQuickAccess({ kind: "screenshot", filePath: result.filePath });
        if (autoCopyPath) await window.macRecorder.copyText(result.filePath);
        void loadRecents();
      }
    } catch (e) {
      setError(`截图失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const pushBarNotice = (msg: string | null, extra: Record<string, unknown> = {}) => {
    void window.macRecorder?.pushControlBarState?.({
      recState: recStateRef.current,
      elapsedMs: 0,
      baseElapsedMs: accumulatedRef.current,
      cameraEnabled: cameraEnabledRef.current,
      error: msg,
      ...extra,
    });
  };

  const beginRecording = async () => {
    setError(null);
    setLastFile(null);
    if (!composeCanvasRef.current) {
      ensureComposeCanvas(canvasSizeRef.current.w || 1280, canvasSizeRef.current.h || 720);
    }
    if (!screenStreamRef.current || !composeCanvasRef.current) {
      const msg = "请先选择屏幕/窗口，再点启动录像。";
      setError(msg);
      setRecState("idle");
      recStateRef.current = "idle";
      await window.macRecorder?.setMainWindowVisible(true);
      pushBarNotice(msg, { recState: "idle" });
      // 自动拉起系统选择器，选完后用户可再点启动
      try {
        await pickScreenWithSystemPicker();
      } catch {
        // ignore
      }
      if (!screenStreamRef.current) {
        return;
      }
    }

    // 摄像头：以 stream ref 为准（避免操作条闭包里 cameraLive 过期导致误拦）
    if (cameraEnabledRef.current && !cameraStreamRef.current) {
      const macId =
        cameraIdRef.current ||
        pickComputerCameras(camerasRef.current)[0]?.deviceId ||
        "";
      if (macId) {
        await attachCamera(macId);
      }
      if (!cameraStreamRef.current) {
        setCameraEnabled(false);
        cameraEnabledRef.current = false;
        setError("电脑摄像头未就绪，已先开始纯屏幕录制。");
        pushBarNotice("摄像头未就绪，已录屏幕");
      }
    }

    if (micEnabled && !micStreamRef.current && micId) {
      await attachMic(micId);
    }
    if (window.macRecorder) {
      if (!screenStreamRef.current) {
        const screenStatus = await window.macRecorder.getMediaAccessStatus("screen");
        if (screenStatus === "denied") {
          const msg = "屏幕录制权限被拒绝。请到系统设置授权后，完全退出 App 再重试。";
          setError(msg);
          setRecState("idle");
          recStateRef.current = "idle";
          pushBarNotice(msg, { recState: "idle" });
          return;
        }
      }
    }

    const compose = composeCanvasRef.current;
    if (!compose || !screenStreamRef.current) {
      const msg = "屏幕源未就绪，无法开始录制。";
      setError(msg);
      setRecState("idle");
      recStateRef.current = "idle";
      pushBarNotice(msg, { recState: "idle" });
      return;
    }

    // 锁定当前成片尺寸，避免录制中改尺寸导致画面静止
    const lockW = canvasSizeRef.current.w || compose.width || 1280;
    const lockH = canvasSizeRef.current.h || compose.height || 720;
    if (compose.width !== lockW || compose.height !== lockH) {
      compose.width = lockW;
      compose.height = lockH;
    }
    canvasSizeRef.current = { w: lockW, h: lockH };
    setCanvasSize({ w: lockW, h: lockH });

    // 确保屏幕轨在播，并连续把合成帧送进 MediaRecorder
    const screenVideo = screenVideoRef.current;
    if (screenVideo?.paused) await screenVideo.play().catch(() => undefined);

    const videoStream = compose.captureStream(30);
    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
    for (const t of tracks) {
      try {
        t.contentHint = "motion";
      } catch {
        // ignore
      }
    }

    // Mix mic into destination stream
    const audioCtx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = audioCtx;
    if (audioCtx.state === "suspended") await audioCtx.resume();
    const dest = audioCtx.createMediaStreamDestination();
    if (micStreamRef.current && micEnabled) {
      const src = audioCtx.createMediaStreamSource(micStreamRef.current);
      const gain = audioCtx.createGain();
      gain.gain.value = 1;
      micGainRef.current = gain;
      src.connect(gain);
      gain.connect(dest);
    }
    if (dest.stream.getAudioTracks().length) {
      tracks.push(...dest.stream.getAudioTracks());
    }

    const mixed = new MediaStream(tracks);
    const mimeType = pickMimeType();
    chunksRef.current = [];
    const recorder = new MediaRecorder(mixed, {
      mimeType,
      videoBitsPerSecond: 6_000_000,
      audioBitsPerSecond: 128_000,
    });
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorderRef.current = recorder;
    // 先打点墙钟，再 start，保证操作条与 MediaRecorder 同源
    accumulatedRef.current = 0;
    startedAtRef.current = performance.now();
    recStartedAtWallRef.current = Date.now();
    finalElapsedRef.current = 0;
    setElapsedMs(0);
    recorder.start(250);
    setRecState("recording");
    recStateRef.current = "recording";
    playCue("start");
    await window.macRecorder?.setRecordingState(true);
    // 仅在录制中且会隐藏主窗时显示悬浮条；平时操作都在主壳里完成（只 1 个窗）
    const showFloatBar = Boolean(minimizeOnRecord);
    await window.macRecorder?.setControlBar?.({
      visible: showFloatBar,
      state: {
        recState: "recording",
        elapsedMs: 0,
        baseElapsedMs: 0,
        recStartedAt: recStartedAtWallRef.current,
        cameraEnabled: cameraEnabledRef.current,
        camShape,
        mirrored,
        zoomEnabled,
        magnification,
        error: null,
      },
    });
    if (minimizeOnRecord) {
      setTimeout(() => {
        void window.macRecorder?.setMainWindowVisible(false);
      }, 400);
    }
  };

  const startWithCountdown = async () => {
    if (recStateRef.current !== "idle") return;
    countdownCancelRef.current = false;

    // 先确保屏幕源，避免倒计时结束才失败
    if (!screenStreamRef.current) {
      await window.macRecorder?.setMainWindowVisible(true);
      pushBarNotice("请选择要录制的屏幕…", { recState: "preparing" });
      setRecState("preparing");
      recStateRef.current = "preparing";
      try {
        await pickScreenWithSystemPicker();
      } catch {
        // ignore
      }
      if (!screenStreamRef.current) {
        setRecState("idle");
        recStateRef.current = "idle";
        pushBarNotice("未选择屏幕，已取消录制", { recState: "idle" });
        return;
      }
      pushBarNotice(null, { recState: "idle" });
      setRecState("idle");
      recStateRef.current = "idle";
    }

    if (countdownOn) {
      setRecState("countdown");
      recStateRef.current = "countdown";
      for (let i = 3; i >= 1; i--) {
        if (countdownCancelRef.current) {
          setCountdown(null);
          setRecState("idle");
          recStateRef.current = "idle";
          void window.macRecorder?.pushControlBarState?.({
            recState: "idle",
            elapsedMs: 0,
            baseElapsedMs: 0,
            cameraEnabled: cameraEnabledRef.current,
            camShape,
            mirrored,
            zoomEnabled,
            magnification,
            error: null,
          });
          return;
        }
        setCountdown(i);
        void window.macRecorder?.pushControlBarState?.({
          recState: "countdown",
          countdown: i,
          elapsedMs: 0,
          baseElapsedMs: 0,
          cameraEnabled: cameraEnabledRef.current,
          camShape,
          mirrored,
          zoomEnabled,
          magnification,
          error: null,
        });
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(null);
    }
    if (countdownCancelRef.current) {
      setRecState("idle");
      recStateRef.current = "idle";
      return;
    }
    setRecState("preparing");
    recStateRef.current = "preparing";
    void window.macRecorder?.pushControlBarState?.({
      recState: "preparing",
      elapsedMs: 0,
      baseElapsedMs: 0,
      cameraEnabled: cameraEnabledRef.current,
      camShape,
      mirrored,
      zoomEnabled,
      magnification,
      error: null,
    });
    await beginRecording();
  };

  const pauseRecording = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") return;
    rec.pause();
    accumulatedRef.current += performance.now() - startedAtRef.current;
    setElapsedMs(accumulatedRef.current);
    setRecState("paused");
    recStateRef.current = "paused";
    playCue("pause");
    void window.macRecorder?.pushControlBarState?.({
      recState: "paused",
      elapsedMs: accumulatedRef.current,
      baseElapsedMs: accumulatedRef.current,
      cameraEnabled: cameraEnabledRef.current,
      camShape,
      mirrored,
      zoomEnabled,
      magnification,
      error: null,
    });
  };

  const resumeRecording = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "paused") return;
    rec.resume();
    startedAtRef.current = performance.now();
    recStartedAtWallRef.current = Date.now();
    setRecState("recording");
    recStateRef.current = "recording";
    playCue("start");
    void window.macRecorder?.pushControlBarState?.({
      recState: "recording",
      baseElapsedMs: accumulatedRef.current,
      recStartedAt: recStartedAtWallRef.current,
      cameraEnabled: cameraEnabledRef.current,
      camShape,
      mirrored,
      zoomEnabled,
      magnification,
      error: null,
    });
  };

  const stopRecording = async () => {
    const rec = recorderRef.current;
    if (!rec || (rec.state !== "recording" && rec.state !== "paused")) {
      setRecState("idle");
      recStateRef.current = "idle";
      await window.macRecorder?.setRecordingState(false);
      return;
    }
    // 在 stop 前锁定时长，与 MediaRecorder 会话对齐（不含倒计时）
    let sessionElapsed = accumulatedRef.current;
    if (rec.state === "recording") {
      sessionElapsed += performance.now() - startedAtRef.current;
    }
    finalElapsedRef.current = Math.max(0, Math.round(sessionElapsed));
    setElapsedMs(finalElapsedRef.current);
    try {
      rec.requestData();
    } catch {
      // ignore
    }

    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" }));
      };
    });
    rec.stop();
    const blob = await done;
    recorderRef.current = null;
    setRecState("idle");
    recStateRef.current = "idle";
    playCue("stop");
    await window.macRecorder?.setRecordingState(false);
    // 恢复主壳并收起悬浮条 → 始终只留 1 个操作窗
    await window.macRecorder?.setMainWindowVisible(true);
    await window.macRecorder?.setControlBar?.({
      visible: false,
      state: {
        recState: "idle",
        elapsedMs: finalElapsedRef.current,
        baseElapsedMs: finalElapsedRef.current,
        cameraEnabled: cameraEnabledRef.current,
        camShape,
        mirrored,
        zoomEnabled,
        magnification,
        error: null,
      },
    });

    const buffer = await blob.arrayBuffer();
    const fileName = stampName();
    const mimeType = blob.type || rec.mimeType || "video/webm";
    setError(null);
    // 短暂提示转码中（MP4 固定写入桌面/Mac录屏）
    setLastFile("正在转码为 MP4…");
    const sidecar = {
      createdAt: new Date().toISOString(),
      platform: "macos",
      durationMs: finalElapsedRef.current,
      width: canvasSize.w,
      height: canvasSize.h,
      fps: 30,
      camera: {
        enabled: cameraEnabled,
        mirrored,
        shape: camShape,
        blurEnabled,
        blurStrength,
        blurStatus,
        diameterPx: layout.diameter,
        x: Math.round(layout.x),
        y: Math.round(layout.y),
      },
      pointerZoom: { enabled: zoomEnabled, mode: zoomMode },
      audio: { mic: micEnabled, system: false },
      sourceType: sourceFilter,
      appVersion: "0.1.0",
      exportDirHint: "~/Desktop/Mac录屏",
      format: "mp4",
      sourceMime: mimeType,
      note: "导出为 H.264 MP4（QuickTime 可播），保存在桌面「Mac录屏」。",
    };

    const result = await window.macRecorder?.saveRecording({
      fileName,
      buffer,
      mimeType,
      sidecar,
    });
    if (result?.ok && result.filePath && /\.mp4$/i.test(result.filePath)) {
      setLastFile(result.filePath);
      setQuickAccess({ kind: "recording", filePath: result.filePath });
      playCue("success");
      if (result.warning) setError(result.warning);
      if (autoCopyPath) await window.macRecorder.copyText?.(result.filePath);
      void loadRecents();
    } else if (result?.canceled) {
      setError("已取消保存。录制数据未写入磁盘。");
      setLastFile(null);
    } else {
      setLastFile(null);
      setError(
        result?.error ||
          "保存失败：未能写入桌面/Mac录屏 的 MP4。请确认已安装 ffmpeg（brew install ffmpeg）。",
      );
    }
  };

  trayHandlersRef.current = {
    startWithCountdown,
    stopRecording,
    pauseRecording,
    resumeRecording,
    takeScreenshot,
  };

  // Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (recState === "idle") void startWithCountdown();
        else if (recState === "recording" || recState === "paused") void stopRecording();
      }
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setMicEnabled((v) => !v);
      }
      if (e.key === "c" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setCameraEnabled((v) => !v);
      }
    if (e.key === "s" && (e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey) {
        e.preventDefault();
        void takeScreenshot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, countdownOn]);

  const busy =
    recState === "recording" ||
    recState === "paused" ||
    recState === "countdown" ||
    recState === "preparing";

  return (
    <div className={`app ${moreOpen ? "shell-expanded" : "compact-shell"}`}>
      <header className="topbar">
        <div>
          <div className="brand">Mac Screen Cam</div>
          <div className="sub">
            {moreOpen
              ? "本地录屏 · 桌面/Mac录屏 · 单击切圆/方 · 双击反转 · 双指捏合放大"
              : "单一录制壳 · 预览内摄像头小窗 · 录制中才出悬浮条"}
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreOpen ? "收起" : "更多"}
          </button>
          <div className={`rec-pill ${recState}`}>
            <span className="dot" />
            {recState === "idle" && "就绪"}
            {recState === "countdown" && `倒计时 ${countdown}`}
            {recState === "preparing" && "准备录制…"}
            {recState === "recording" && `录制中 ${formatDuration(elapsedMs)}`}
            {recState === "paused" && `已暂停 ${formatDuration(elapsedMs)}`}
          </div>
        </div>
      </header>

      <div className="shell-rec-bar">
        <span className={`shell-time ${recState === "recording" ? "live" : ""}`}>
          {formatDuration(elapsedMs)}
        </span>
        {recState === "idle" || recState === "countdown" || recState === "preparing" ? (
          <button
            type="button"
            className="shell-act primary"
            disabled={recState !== "idle" || !readyPreview}
            onClick={() => void startWithCountdown()}
          >
            {recState === "countdown"
              ? `${countdown}…`
              : recState === "preparing"
                ? "准备中"
                : "启动录像"}
          </button>
        ) : (
          <button
            type="button"
            className="shell-act rec"
            disabled
          >
            {recState === "paused" ? "已暂停" : "录制中"}
          </button>
        )}
        <button
          type="button"
          className="shell-act danger"
          disabled={recState === "idle" || recState === "preparing"}
          onClick={() => {
            if (recState === "countdown") {
              countdownCancelRef.current = true;
              setCountdown(null);
              setRecState("idle");
              return;
            }
            void stopRecording();
          }}
        >
          停止
        </button>
        <button
          type="button"
          className="shell-act"
          disabled={recState !== "recording" && recState !== "paused"}
          onClick={() => {
            if (recState === "recording") pauseRecording();
            else if (recState === "paused") resumeRecording();
          }}
        >
          {recState === "paused" ? "继续" : "暂停"}
        </button>
        <span className="shell-sep" />
        <button
          type="button"
          className={`shell-act ${cameraEnabled ? "on" : ""}`}
          onClick={() => setCameraEnabled((v) => !v)}
        >
          {cameraEnabled ? "摄像头·开" : "摄像头"}
        </button>
        <button
          type="button"
          className={`shell-act ${mirrored ? "on" : ""}`}
          onClick={() => setMirrored((v) => !v)}
        >
          {mirrored ? "反转·开" : "反转"}
        </button>
      </div>

      {showTip && (
        <div className="banner tip">
          <span>
            ① 开摄像头/麦 → ② 选屏幕 → ③ 小窗可拖动；单击切圆/方、双击反转 → ④ 本页「启动录像」。录制中悬浮摄像头小窗可继续操作；成片 MP4 进桌面/Mac录屏。
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("macRecorder.tipDismissed", "1");
              setShowTip(false);
            }}
          >
            知道了
          </button>
        </div>
      )}

      {error && (
        <div className="banner error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            关闭
          </button>
        </div>
      )}

      {quickAccess && (
        <div className="quick-access">
          <div className="qa-left">
            <div className="qa-badge">
              {quickAccess.kind === "screenshot" ? "截图" : "录屏"} · Quick Access
            </div>
            <div className="qa-path">{quickAccess.filePath}</div>
          </div>
          <div className="qa-actions">
            <button
              type="button"
              className="primary"
              onClick={() => void window.macRecorder.openCapture?.(quickAccess.filePath)}
            >
              打开
            </button>
            <button
              type="button"
              onClick={() => void window.macRecorder.showInFolder(quickAccess.filePath)}
            >
              Finder
            </button>
            <button
              type="button"
              onClick={async () => {
                if (quickAccess.kind === "screenshot") {
                  await window.macRecorder.copyImageFile?.(quickAccess.filePath);
                } else {
                  await window.macRecorder.copyText?.(quickAccess.filePath);
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied
                ? "已复制"
                : quickAccess.kind === "screenshot"
                  ? "复制图片"
                  : "复制路径"}
            </button>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                await window.macRecorder.deleteCapture?.(quickAccess.filePath);
                setQuickAccess(null);
                setLastFile(null);
                void loadRecents();
              }}
            >
              删除
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setQuickAccess(null);
                setLastFile(null);
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {!quickAccess && lastFile && (
        <div className="success-sheet">
          <div className="success-title">已保存</div>
          <div className="success-path">{lastFile}</div>
        </div>
      )}

      <main className="workspace">
        <aside className="panel left">
          <div className="steps">
            <div className={`step ${readyPreview ? "done" : "active"}`}>1 选屏幕</div>
            <div className={`step ${readyPreview ? "active" : ""}`}>2 调设备</div>
            <div className="step">3 开录</div>
          </div>

          <div className="panel-title">屏幕源</div>
          <button
            type="button"
            className="primary-block"
            disabled={busy || refreshing}
            onClick={() => void pickScreenWithSystemPicker()}
          >
            {refreshing ? "等待系统选择器…" : readyPreview ? "重新选择屏幕/窗口" : "选择屏幕/窗口"}
          </button>
          <button
            type="button"
            className="primary-block secondary-block"
            disabled={refreshing || !readyPreview}
            onClick={() => void takeScreenshot()}
            style={{ marginTop: 8 }}
          >
            截图当前画面
          </button>
          <p className="hint">
            灵感来自{" "}
            <a href="https://github.com/duongductrong/Snapzy" target="_blank" rel="noreferrer">
              Snapzy
            </a>
            ：截图默认存桌面/Mac录屏，并可复制到剪贴板。全局快捷键 ⌘⇧⌥S 截图 · ⌘⇧⌥R 录制开关。
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="ghost"
              disabled={refreshing}
              onClick={() => void refreshSources()}
            >
              {refreshing ? "刷新中…" : "尝试列出源"}
            </button>
          </div>
          <div className="source-list">
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                className={selectedSourceId === s.id ? "source active" : "source"}
                disabled={busy || s.id === "display-media"}
                onClick={() => setSelectedSourceId(s.id)}
              >
                {s.thumbnailDataUrl ? <img src={s.thumbnailDataUrl} alt="" /> : <div className="thumb-ph" />}
                <span>{s.name}</span>
              </button>
            ))}
            {!sources.length && (
              <div className="empty">点上方「选择屏幕/窗口」开始（推荐）。</div>
            )}
          </div>

          <div className="history-block">
          <div className="panel-title">捕获历史</div>
          <div className="row" style={{ marginBottom: 8 }}>
            <button
              type="button"
              className={historyFilter === "all" ? "seg active" : "seg"}
              onClick={() => setHistoryFilter("all")}
            >
              全部
            </button>
            <button
              type="button"
              className={historyFilter === "recording" ? "seg active" : "seg"}
              onClick={() => setHistoryFilter("recording")}
            >
              录屏
            </button>
            <button
              type="button"
              className={historyFilter === "screenshot" ? "seg active" : "seg"}
              onClick={() => setHistoryFilter("screenshot")}
            >
              截图
            </button>
          </div>
          <input
            className="search"
            placeholder="搜索文件名…"
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
          />
          <div className="recents">
            {recents
              .filter((item) => (historyFilter === "all" ? true : item.kind === historyFilter))
              .filter((item) =>
                historyQuery.trim()
                  ? item.name.toLowerCase().includes(historyQuery.trim().toLowerCase())
                  : true,
              )
              .slice(0, 10)
              .map((item) => (
                <div key={item.filePath} className="recent-row">
                  <button
                    type="button"
                    className="recent-item"
                    onClick={() => void window.macRecorder.openCapture?.(item.filePath)}
                  >
                    <div className="recent-name">
                      <span className="kind-tag">
                        {item.kind === "screenshot" ? "图" : "视"}
                      </span>{" "}
                      {item.name}
                    </div>
                    <div className="recent-meta">
                      {formatRelativeTime(item.createdAt)} · {formatBytes(item.sizeBytes)}
                    </div>
                  </button>
                  <div className="recent-ops">
                    <button
                      type="button"
                      className="ghost"
                      title="Finder"
                      onClick={() => void window.macRecorder.showInFolder(item.filePath)}
                    >
                      显
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      title="删除"
                      onClick={async () => {
                        await window.macRecorder.deleteCapture?.(item.filePath);
                        void loadRecents();
                      }}
                    >
                      删
                    </button>
                  </div>
                </div>
              ))}
            {recents.length === 0 && <div className="empty">还没有捕获，先截图或录一条。</div>}
          </div>
          <button type="button" className="ghost" onClick={() => void loadRecents()}>
            刷新列表
          </button>
          </div>

          <div className="panel-title">设备开关（自主选择）</div>
          <label className="toggle big switch-card">
            <input
              type="checkbox"
              checked={cameraEnabled}
              onChange={(e) => setCameraEnabled(e.target.checked)}
            />
            <span>
              摄像头出镜
              <small>{cameraEnabled ? (cameraLive ? "画面已接入" : "开启中…") : "已关闭"}</small>
            </span>
          </label>
          <label className="toggle big switch-card">
            <input
              type="checkbox"
              checked={micEnabled}
              onChange={(e) => setMicEnabled(e.target.checked)}
            />
            <span>
              麦克风声音
              <small>{micEnabled ? "已开启" : "已关闭"}</small>
            </span>
          </label>
          <label className="toggle big switch-card">
            <input
              type="checkbox"
              checked={blurEnabled}
              disabled={!cameraEnabled}
              onChange={(e) => {
                setBlurEnabled(e.target.checked);
                localStorage.setItem("macRecorder.blurEnabled", e.target.checked ? "1" : "0");
              }}
            />
            <span>
              圆窗背景虚化
              <small>
                {!cameraEnabled
                  ? "需先开摄像头"
                  : blurStatus === "ready"
                    ? "人像全清晰 · 仅背景虚化"
                    : blurStatus === "loading"
                      ? "模型加载中"
                      : blurStatus === "failed"
                        ? "失败已降级清晰"
                        : "可开启"}
              </small>
            </span>
          </label>
          <p className="hint">默认关闭。打开摄像头后，中间预览与成片都会出现可拖动的圆形小窗。</p>

          <div className="panel-title">系统权限（只读状态）</div>
          <div className="perm-grid">
            <PermRow
              label="屏幕录制"
              status={perm.screen}
              hint="系统 API 常误报。设置里 Electron 已打开时，点「已开启」同步状态，或直接「选择屏幕/窗口」"
              onOpen={() => void window.macRecorder.openPrivacySettings("screen")}
              onRecheck={() => void refreshPermissions()}
              onMarkGranted={
                perm.screen !== "granted"
                  ? () => {
                      localStorage.setItem("macRecorder.screenGranted", "1");
                      setPerm((p) => ({ ...p, screen: "granted" }));
                    }
                  : undefined
              }
            />
            <PermRow
              label="摄像头"
              status={perm.camera}
              onOpen={() => void window.macRecorder.openPrivacySettings("camera")}
              onRecheck={() => void refreshPermissions()}
            />
            <PermRow
              label="麦克风"
              status={perm.microphone}
              onOpen={() => void window.macRecorder.openPrivacySettings("microphone")}
              onRecheck={() => void refreshPermissions()}
            />
          </div>
        </aside>

        <section className="preview-wrap">
          <canvas
            ref={previewCanvasRef}
            className="preview"
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onWheel={onPreviewWheel}
            onTouchStart={onPreviewTouchStart}
            onTouchMove={onPreviewTouchMove}
            onTouchEnd={onPreviewTouchEnd}
          />
          {cameraEnabled && (
            <div
              className={`selfie-monitor ${mirrored ? "mirror" : ""}`}
              title="单击：圆形/方形 · 双击：摄像头反转"
              onClick={(e) => {
                e.stopPropagation();
                if (e.detail >= 2) handlePipGesture("dblclick");
                else handlePipGesture("click");
              }}
            >
              <video ref={selfieVideoRef} autoPlay muted playsInline />
              <div className="selfie-label">
                {cameraLive
                  ? `单击切${camShape === "circle" ? "方" : "圆"} · 双击反转`
                  : "开启中…"}
              </div>
            </div>
          )}
          {countdown !== null && <div className="countdown">{countdown}</div>}
          <div className="preview-meta">
            成片画布 {canvasSize.w}×{canvasSize.h}
            {cameraEnabled
              ? cameraLive
                ? ` · 小窗已合成（单击切${camShape === "circle" ? "方" : "圆"} / 双击反转，可拖）`
                : " · 等待摄像头画面"
              : " · 摄像头关闭（成片无小窗）"}
            {micEnabled ? " · 麦开" : " · 麦关"}
            {magnification > 1.02 ? ` · 放大 ${magnification.toFixed(1)}x` : ""}
          </div>
        </section>

        <aside className="panel right">
          <div className="panel-title">出镜与收音（同左侧开关）</div>
          <label className="toggle big">
            <input
              type="checkbox"
              checked={cameraEnabled}
              onChange={(e) => setCameraEnabled(e.target.checked)}
            />
            摄像头出镜 → 预览与成片同步圆窗
          </label>
          <label className="field">
            摄像头设备（仅电脑，已排除手机 Continuity）
            <select
              value={cameraId}
              disabled={!cameraEnabled}
              onChange={(e) => setCameraId(e.target.value)}
            >
              {cameras.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">优先 FaceTime / 内置摄像头；不会调用 iPhone Continuity。</p>
          <label className="toggle big">
            <input
              type="checkbox"
              checked={micEnabled}
              onChange={(e) => setMicEnabled(e.target.checked)}
            />
            麦克风收音
          </label>
          <label className="field">
            麦克风设备
            <select
              value={micId}
              disabled={!micEnabled}
              onChange={(e) => setMicId(e.target.value)}
            >
              {mics.map((m) => (
                <option key={m.deviceId} value={m.deviceId}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <div className="level">
            <div className="level-fill" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>

          <div className="panel-title">小窗形态与虚化</div>
          <p className="hint">
            单击摄像头小窗切换圆形 / 长方形；双击切换水平反转；拖动可改成片位置。当前：
            {camShape === "rect" ? "长方形" : "圆形"}
            {magnification > 1.02 ? ` · 网页放大 ${magnification.toFixed(1)}x` : ""}
          </p>
          <label className="toggle big">
            <input
              type="checkbox"
              checked={mirrored}
              disabled={!cameraEnabled}
              onChange={(e) => setMirrored(e.target.checked)}
            />
            水平反转（镜像）
          </label>
          <label className="toggle big">
            <input
              type="checkbox"
              checked={blurEnabled}
              disabled={!cameraEnabled}
              onChange={(e) => {
                setBlurEnabled(e.target.checked);
                localStorage.setItem("macRecorder.blurEnabled", e.target.checked ? "1" : "0");
              }}
            />
            背景虚化（人像清晰）
          </label>
          <p className="hint">
            虚化状态：
            {blurStatus === "ready"
              ? "已就绪"
              : blurStatus === "loading"
                ? "加载模型中…"
                : blurStatus === "failed"
                  ? "失败已降级"
                  : "未启用"}
          </p>
          <label className="field">
            虚化强度 {blurStrength}
            <input
              type="range"
              min={0}
              max={100}
              value={blurStrength}
              disabled={!cameraEnabled || !blurEnabled || blurStatus === "failed"}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBlurStrength(v);
                localStorage.setItem("macRecorder.blurStrength", String(v));
              }}
            />
          </label>
          <div className="preset-row">
            {CAM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={layout.diameter === p.diameter ? "seg active" : "seg"}
                disabled={!cameraEnabled}
                onClick={() => setLayout((prev) => ({ ...prev, diameter: p.diameter }))}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="field">
            圆窗直径 {layout.diameter}px
            <input
              type="range"
              min={120}
              max={360}
              value={layout.diameter}
              disabled={!cameraEnabled}
              onChange={(e) =>
                setLayout((prev) => ({ ...prev, diameter: Number(e.target.value) }))
              }
            />
          </label>
          <p className="hint">预览中拖动小窗改位置；成片小窗无人像字；人景边缘已羽化。顶部操作条启动后常驻。</p>

          <div className="panel-title">教学网页放大</div>
          <p className="hint">
            触控板双指捏合，或按住 ⌘ / ⌥ 滚轮缩放；操作条「复位缩放」恢复 1x。当前{" "}
            {magnification.toFixed(2)}x
          </p>
          <button
            type="button"
            className="ghost"
            disabled={magnification <= 1.02}
            onClick={() => setMagnification(1)}
          >
            复位缩放
          </button>
          <label className="toggle big">
            <input
              type="checkbox"
              checked={zoomEnabled}
              onChange={(e) => setZoomEnabled(e.target.checked)}
            />
            额外：指针放大镜（仅在未捏合放大时）
          </label>
          <div className="preset-row">
            <button
              type="button"
              className={zoomMode === "lens" ? "seg active" : "seg"}
              disabled={!zoomEnabled}
              onClick={() => setZoomMode("lens")}
            >
              放大镜
            </button>
            <button
              type="button"
              className={zoomMode === "stretch" ? "seg active" : "seg"}
              disabled={!zoomEnabled}
              onClick={() => setZoomMode("stretch")}
            >
              拉伸
            </button>
          </div>
          <p className="hint">捏合放大优先；不影响人像清晰度。</p>

          <div className="panel-title">录制选项</div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={countdownOn}
              disabled={busy}
              onChange={(e) => setCountdownOn(e.target.checked)}
            />
            开始前 3 秒倒计时
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={minimizeOnRecord}
              disabled={busy}
              onChange={(e) => {
                setMinimizeOnRecord(e.target.checked);
                localStorage.setItem(
                  "macRecorder.minimizeOnRecord",
                  e.target.checked ? "1" : "0",
                );
              }}
            />
            开始后隐藏主窗口（顶部操作条仍可用）
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoCopyImage}
              onChange={(e) => {
                setAutoCopyImage(e.target.checked);
                localStorage.setItem(
                  "macRecorder.autoCopyImage",
                  e.target.checked ? "1" : "0",
                );
              }}
            />
            截图后复制到剪贴板
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoCopyPath}
              onChange={(e) => {
                setAutoCopyPath(e.target.checked);
                localStorage.setItem(
                  "macRecorder.autoCopyPath",
                  e.target.checked ? "1" : "0",
                );
              }}
            />
            保存后复制文件路径
          </label>
          <p className="hint">保存目录：{exportDir}</p>

          <div className="actions">
            {recState === "idle" ||
            recState === "countdown" ||
            recState === "preparing" ? (
              <>
                <button
                  type="button"
                  className="primary"
                  disabled={
                    recState === "countdown" ||
                    recState === "preparing" ||
                    !readyPreview
                  }
                  onClick={() => void startWithCountdown()}
                >
                  {!readyPreview ? "请先选择屏幕" : "开始录制"}
                </button>
                <button
                  type="button"
                  disabled={!readyPreview}
                  onClick={() => void takeScreenshot()}
                >
                  截图
                </button>
              </>
            ) : null}
            {recState === "recording" ? (
              <>
                <button type="button" onClick={() => void takeScreenshot()}>
                  快拍截图
                </button>
                <button type="button" onClick={pauseRecording}>
                  暂停
                </button>
                <button type="button" className="danger" onClick={() => void stopRecording()}>
                  停止并保存
                </button>
              </>
            ) : null}
            {recState === "paused" ? (
              <>
                <button type="button" className="primary" onClick={resumeRecording}>
                  继续
                </button>
                <button type="button" className="danger" onClick={() => void stopRecording()}>
                  停止并保存
                </button>
              </>
            ) : null}
          </div>
          <p className="hint">
            快捷键：⌘R 录制 · ⌘⇧S 截图 · ⌘M 麦克风 · ⌘⇧C 摄像头 · 全局 ⌘⇧⌥R/S
          </p>
        </aside>
      </main>

      {(recState === "recording" || recState === "paused") && (
        <div className={`float-bar ${recState}`}>
          <span className="float-dot" />
          <span className="float-time">{formatDuration(elapsedMs)}</span>
          <div className="float-level">
            <div style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
          <button
            type="button"
            className="ghost"
            onClick={() => void takeScreenshot()}
            title="快拍"
          >
            截图
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setMicEnabled((v) => !v)}
            title="麦克风"
          >
            {micEnabled ? "麦开" : "麦关"}
          </button>
          {recState === "recording" ? (
            <button type="button" onClick={pauseRecording}>
              暂停
            </button>
          ) : (
            <button type="button" onClick={resumeRecording}>
              继续
            </button>
          )}
          <button type="button" className="danger" onClick={() => void stopRecording()}>
            停止
          </button>
        </div>
      )}
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "granted":
      return "已开启";
    case "denied":
      return "未开启";
    case "restricted":
      return "受限制";
    case "not-determined":
      return "待验证";
    case "unknown":
      return "未知";
    default:
      return status;
  }
}

function PermRow({
  label,
  status,
  hint,
  onOpen,
  onRecheck,
  onMarkGranted,
}: {
  label: string;
  status: string;
  hint?: string;
  onOpen: () => void;
  onRecheck?: () => void;
  onMarkGranted?: () => void;
}) {
  const ok = status === "granted";
  const pending = status === "not-determined" || status === "unknown";
  return (
    <div className="perm-row">
      <div>
        <div>{label}</div>
        <small className={ok ? "ok" : pending ? "warn" : "warn"}>{statusLabel(status)}</small>
        {hint && !ok ? <div className="perm-hint">{hint}</div> : null}
      </div>
      <div className="perm-actions">
        {onMarkGranted ? (
          <button type="button" className="ghost" onClick={onMarkGranted}>
            已开启
          </button>
        ) : null}
        {onRecheck ? (
          <button type="button" className="ghost" onClick={onRecheck}>
            重检
          </button>
        ) : null}
        <button type="button" className="ghost" onClick={onOpen}>
          打开设置
        </button>
      </div>
    </div>
  );
}
