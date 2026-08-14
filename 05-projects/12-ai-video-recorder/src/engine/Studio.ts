import type {
  ColorFilter,
  ImageOverlay,
  PipShape,
  RecordState,
  SceneSnapshot,
  SplitMode,
  StudioEventMap,
  StudioListener,
  SubtitleState,
  TemplateDef,
  TextOverlay,
  TransitionKind,
} from "../types";
import { AudioEngine } from "./audioEngine";
import { Compositor } from "./compositor";
import { templateById } from "./templates";
import { pickMimeType } from "./aiEdit";
import { PortraitBlur } from "./portraitBlur";

// ============ 工作室中枢：源管理 / 合成 / 录制状态机 ============
class Studio {
  private canvas: HTMLCanvasElement | null = null;
  compositor: Compositor | null = null;
  audio: AudioEngine | null = null;

  private state: RecordState = "idle";
  private listeners = new Map<string, Set<(p: unknown) => void>>();

  // 源
  screenStream: MediaStream | null = null;
  cam1Stream: MediaStream | null = null;
  cam2Stream: MediaStream | null = null;
  micStream: MediaStream | null = null;
  systemAudioStream: MediaStream | null = null;

  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private timerHandle: number | null = null;
  private startTs = 0;
  private elapsedMs = 0;
  private pausedAt = 0;

  recordedBlob: Blob | null = null;
  recordedUrl: string | null = null;
  recordedDuration = 0;

  templateId = "youtube";

  // ---------- OBS 场景 ----------
  private scenes: SceneSnapshot[] = [];
  private currentSceneId = "";
  transitionKind: TransitionKind = "fade";
  private readonly STORAGE_KEY = "ai-recorder-obs-scenes-v1";

  // ---------- 事件 ----------
  on<K extends keyof StudioEventMap>(ev: K, fn: StudioListener<K>) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set());
    this.listeners.get(ev)!.add(fn as (p: unknown) => void);
    return () => this.off(ev, fn);
  }
  off<K extends keyof StudioEventMap>(ev: K, fn: StudioListener<K>) {
    this.listeners.get(ev)?.delete(fn as (p: unknown) => void);
  }
  private emit<K extends keyof StudioEventMap>(ev: K, payload: StudioEventMap[K]) {
    this.listeners.get(ev)?.forEach((fn) => (fn as (p: StudioEventMap[K]) => void)(payload));
  }

  getState(): RecordState { return this.state; }
  getElapsed(): number { return this.elapsedMs; }

  setState(s: RecordState) {
    this.state = s;
    this.emit("state", s);
  }

  setStatus(msg: string) { this.emit("status", msg); }

  // ---------- 画布 ----------
  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.rebuildCompositor();
  }

  private rebuildCompositor() {
    if (!this.canvas) return;
    const tpl = templateById(this.templateId);
    this.compositor = new Compositor(this.canvas, tpl);
    this.compositor.setScreen(this.screenStream);
    this.compositor.setCamera1(this.cam1Stream);
    this.compositor.setCamera2(this.cam2Stream);
    if (this.state === "recording" || this.state === "preview") this.compositor.start(true);
  }

  setTemplate(id: string) {
    this.templateId = id;
    if (this.compositor) this.rebuildCompositor();
    this.emit("sources", undefined);
  }

  getTemplate(): TemplateDef { return templateById(this.templateId); }

  // ---------- 源设置 ----------
  async ensureAudio(): Promise<AudioEngine> {
    if (!this.audio) {
      this.audio = new AudioEngine();
      await this.audio.resume();
    }
    return this.audio;
  }

  async setMic(stream: MediaStream | null) {
    this.micStream = stream;
    const audio = await this.ensureAudio();
    audio.setMic(stream);
    this.emit("sources", undefined);
  }

  async setScreen(stream: MediaStream | null) {
    this.screenStream = stream;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.systemAudioStream = new MediaStream([audioTracks[0]]);
        const audio = await this.ensureAudio();
        audio.setSystem(this.systemAudioStream);
      }
    } else {
      this.systemAudioStream = null;
      const audio = await this.ensureAudio();
      audio.setSystem(null);
    }
    this.compositor?.setScreen(stream);
    this.emit("sources", undefined);
    this.emit("devices", undefined);
  }

  async setCamera1(stream: MediaStream | null) {
    this.cam1Stream = stream;
    this.compositor?.setCamera1(stream);
    this.emit("sources", undefined);
  }

  async setCamera2(stream: MediaStream | null) {
    this.cam2Stream = stream;
    this.compositor?.setCamera2(stream);
    this.emit("sources", undefined);
  }

  private portrait: PortraitBlur | null = null;

  /** 初始化人像抠图引擎（懒加载，离线模型） */
  async ensurePortrait(): Promise<boolean> {
    if (this.compositor?.portrait?.isReady) return true;
    if (!this.portrait) this.portrait = new PortraitBlur("/mediapipe/");
    try {
      await this.portrait.init();
      if (this.compositor) this.compositor.portrait = this.portrait;
      return true;
    } catch (e) {
      console.warn("人像抠图初始化失败", e);
      return false;
    }
  }

  /** 通知布局/源变化（分屏模式切换等） */
  notifyLayout() { this.emit("sources", undefined); }

  /** 倒计时提示音（只进扬声器，不进录制） */
  async beep(freq = 660, dur = 0.12) {
    try {
      const audio = await this.ensureAudio();
      const ctx = audio.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch { /* noop */ }
  }

  setMicVolume(v: number) { this.audio?.setMicVolume(v); }
  setSystemVolume(v: number) { this.audio?.setSystemVolume(v); }
  setBgm(trackId: string | null, volume?: number) { this.audio?.setBgm(trackId, volume); }
  setBgmVolume(v: number) { this.audio?.setBgmVolume(v); }
  setDucking(enabled: boolean) { this.audio?.setDucking(enabled); }
  setMasterVolume(v: number) { this.audio?.setMasterVolume(v); }
  getMixerLevels() { return this.audio?.getLevels() ?? { mic: 0, sys: 0, bgm: 0, master: 0 }; }

  // ---------- OBS 场景 ----------
  private uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

  private persistScenes() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ scenes: this.scenes, current: this.currentSceneId }));
    } catch { /* noop */ }
  }

  initScenes() {
    let loaded: { scenes?: SceneSnapshot[]; current?: string } | null = null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch { /* noop */ }
    if (loaded?.scenes?.length) {
      this.scenes = loaded.scenes;
      this.currentSceneId = loaded.current && this.scenes.some((sc) => sc.id === loaded.current)
        ? loaded.current
        : this.scenes[0].id;
      const snap = this.scenes.find((sc) => sc.id === this.currentSceneId);
      if (snap) this.applySceneSnapshot(snap, false);
    } else {
      const snap = this.captureSnapshot("场景 1");
      if (snap) { this.scenes = [snap]; this.currentSceneId = snap.id; }
    }
    this.persistScenes();
    this.emit("scenes", undefined);
  }

  /** 捕获当前工作区配置为场景快照 */
  captureSnapshot(name?: string): SceneSnapshot | null {
    const c = this.compositor;
    if (!c) return null;
    return {
      id: this.uid(),
      name: name ?? `场景 ${this.scenes.length + 1}`,
      createdAt: Date.now(),
      templateId: this.templateId,
      splitMode: c.splitMode,
      pipShape: c.pipShape,
      beauty: { ...c.beauty },
      blurMode: c.blurMode,
      filter: c.filter,
      crop: { ...c.crop },
      zoom: { ...c.zoom },
      subtitle: { ...c.subtitle, liveText: "", timedEntries: [] },
      bgmId: this.audio?.currentBgmId ?? null,
      bgmVol: this.audio?.bgmVolume ?? 0.5,
      watermark: c.watermark,
      enabled: { ...c.enabled },
      textSources: c.textSources.map((t) => ({ ...t })),
      imageSources: c.imageSources.map((i) => ({ ...i })),
    };
  }

  /** 应用场景快照（切换场景时把配置写入合成器） */
  applySceneSnapshot(snap: SceneSnapshot, withTransition: boolean) {
    this.setTemplate(snap.templateId);
    const c = this.compositor;
    if (!c) return;
    c.splitMode = snap.splitMode;
    c.pipShape = snap.pipShape;
    c.beauty = { ...snap.beauty };
    c.blurMode = snap.blurMode;
    c.filter = snap.filter;
    c.crop = { ...snap.crop };
    c.zoom = { ...snap.zoom };
    c.subtitle = { ...snap.subtitle };
    c.watermark = snap.watermark;
    c.enabled = { ...snap.enabled };
    c.textSources = snap.textSources.map((t) => ({ ...t }));
    c.imageSources = snap.imageSources.map((i) => ({ ...i }));
    for (const im of c.imageSources) c.setImageOverlay(im.id, im.src);
    if (this.portrait) c.portrait = this.portrait;
    this.audio?.setBgm(snap.bgmId, snap.bgmVol);
    this.templateId = snap.templateId;
    if (withTransition && this.transitionKind !== "cut") c.playTransition(this.transitionKind);
    this.emit("sources", undefined);
  }

  getScenes(): SceneSnapshot[] { return [...this.scenes]; }
  getCurrentSceneId(): string { return this.currentSceneId; }

  /** 把当前实时配置写回当前场景（供切换前保存） */
  private syncCurrentToSnapshot() {
    const snap = this.captureSnapshot(this.scenes.find((sc) => sc.id === this.currentSceneId)?.name);
    if (!snap) return;
    const idx = this.scenes.findIndex((sc) => sc.id === this.currentSceneId);
    if (idx >= 0) {
      snap.id = this.currentSceneId;
      snap.createdAt = this.scenes[idx].createdAt;
      this.scenes[idx] = snap;
    }
  }

  switchScene(id: string, withTransition = true) {
    const target = this.scenes.find((sc) => sc.id === id);
    if (!target || id === this.currentSceneId) return;
    this.syncCurrentToSnapshot();
    this.currentSceneId = id;
    this.applySceneSnapshot(target, withTransition);
    this.persistScenes();
    this.emit("scenes", undefined);
  }

  newScene() {
    this.syncCurrentToSnapshot();
    const snap = this.captureSnapshot();
    if (!snap) return;
    this.scenes.push(snap);
    this.currentSceneId = snap.id;
    this.persistScenes();
    this.emit("scenes", undefined);
  }

  duplicateScene(id: string) {
    const src = this.scenes.find((sc) => sc.id === id);
    if (!src) return;
    const copy: SceneSnapshot = { ...src, id: this.uid(), name: `${src.name} 副本`, createdAt: Date.now() };
    this.scenes.push(copy);
    this.persistScenes();
    this.emit("scenes", undefined);
  }

  renameScene(id: string, name: string) {
    const sc = this.scenes.find((s) => s.id === id);
    if (sc) { sc.name = name || sc.name; this.persistScenes(); this.emit("scenes", undefined); }
  }

  deleteScene(id: string) {
    if (this.scenes.length <= 1) return;
    const idx = this.scenes.findIndex((sc) => sc.id === id);
    if (idx < 0) return;
    this.scenes.splice(idx, 1);
    if (this.currentSceneId === id) {
      const next = this.scenes[Math.min(idx, this.scenes.length - 1)];
      this.currentSceneId = next.id;
      this.applySceneSnapshot(next, false);
    }
    this.persistScenes();
    this.emit("scenes", undefined);
  }

  setTransitionKind(k: TransitionKind) { this.transitionKind = k; }

  // ---------- OBS 来源：文字 / 图片 ----------
  addTextSource(text: string): TextOverlay {
    const t: TextOverlay = { id: this.uid(), text, x: 0.08, y: 0.06, size: 42, color: "#ffffff" };
    this.compositor?.textSources.push(t);
    this.emit("sources", undefined);
    return t;
  }
  updateTextSource(id: string, patch: Partial<TextOverlay>) {
    const t = this.compositor?.textSources.find((x) => x.id === id);
    if (t) Object.assign(t, patch);
    this.emit("sources", undefined);
  }
  removeTextSource(id: string) {
    if (this.compositor) this.compositor.textSources = this.compositor.textSources.filter((t) => t.id !== id);
    this.emit("sources", undefined);
  }
  addImageSource(src: string): ImageOverlay | null {
    if (!this.compositor) return null;
    const im: ImageOverlay = { id: this.uid(), src, x: 0.06, y: 0.06, w: 0.18, h: 0 };
    this.compositor.imageSources.push(im);
    this.compositor.setImageOverlay(im.id, src);
    this.emit("sources", undefined);
    return im;
  }
  removeImageSource(id: string) {
    this.compositor?.removeImageOverlay(id);
    this.emit("sources", undefined);
  }
  setColorFilter(f: ColorFilter) {
    if (this.compositor) this.compositor.filter = f;
    this.emit("sources", undefined);
  }

  // ---------- 录制 ----------
  async startRecording() {
    if (this.state === "recording" || this.state === "exporting") return;
    const audio = await this.ensureAudio();
    await audio.resume();
    if (!this.compositor) this.rebuildCompositor();
    if (!this.compositor) return;
    this.compositor.start(true);
    audio.startEnergySampling();

    const canvasStream = this.compositor.getCaptureStream();
    const audioStream = audio.stream;
    for (const t of audioStream.getAudioTracks()) canvasStream.addTrack(t);

    const mime = pickMimeType();
    this.chunks = [];
    try {
      this.recorder = new MediaRecorder(canvasStream, { mimeType: mime || undefined, videoBitsPerSecond: 10_000_000 });
    } catch {
      this.recorder = new MediaRecorder(canvasStream);
    }
    this.recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) this.chunks.push(e.data); };
    this.recorder.onstop = () => this.onRecordingStopped();
    this.recorder.start(200);

    this.startTs = performance.now() - this.elapsedMs;
    this.timerHandle = window.setInterval(() => {
      this.elapsedMs = performance.now() - this.startTs;
      this.emit("tick", { elapsed: this.elapsedMs });
    }, 200);

    this.setState("recording");
    this.setStatus("● 录制中 — 所有源、裁剪、缩放、字幕、模板、BGM 已合成进视频");
  }

  pauseRecording() {
    if (this.state !== "recording" || !this.recorder) return;
    if (this.recorder.state === "recording") {
      this.recorder.pause();
      this.pausedAt = performance.now();
      if (this.timerHandle) { clearInterval(this.timerHandle); this.timerHandle = null; }
      this.setState("paused");
      this.setStatus("⏸ 已暂停");
    }
  }

  resumeRecording() {
    if (this.state !== "paused" || !this.recorder) return;
    if (this.recorder.state === "paused") {
      this.recorder.resume();
      this.startTs += performance.now() - this.pausedAt;
      this.timerHandle = window.setInterval(() => {
        this.elapsedMs = performance.now() - this.startTs;
        this.emit("tick", { elapsed: this.elapsedMs });
      }, 200);
      this.setState("recording");
      this.setStatus("▶ 继续录制");
    }
  }

  stopRecording() {
    if (!this.recorder) return;
    this.elapsedMs = performance.now() - this.startTs;
    this.recordedDuration = this.elapsedMs;
    if (this.recorder.state === "recording" || this.recorder.state === "paused") {
      this.recorder.stop();
    }
    if (this.timerHandle) { clearInterval(this.timerHandle); this.timerHandle = null; }
    this.audio?.stopEnergySampling();
    this.setState("recorded");
    this.setStatus("✅ 录制完成 — 可导出或使用 AI 智能剪辑");
  }

  private onRecordingStopped() {
    const type = this.recorder?.mimeType || "video/webm";
    this.recordedBlob = new Blob(this.chunks, { type });
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
    this.recordedUrl = URL.createObjectURL(this.recordedBlob);
    this.emit("recorded", { blob: this.recordedBlob, url: this.recordedUrl, duration: this.recordedDuration });
  }

  reset() {
    if (this.recorder) {
      try { this.recorder.stop(); } catch { /* noop */ }
      this.recorder = null;
    }
    if (this.timerHandle) { clearInterval(this.timerHandle); this.timerHandle = null; }
    this.elapsedMs = 0;
    this.recordedBlob = null;
    if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
    this.recordedUrl = null;
    this.recordedDuration = 0;
    this.setState("preview");
    this.setStatus("就绪 — 选择屏幕 / 摄像头开始创作");
  }

  stopAllTracks() {
    [this.screenStream, this.cam1Stream, this.cam2Stream, this.micStream, this.systemAudioStream]
      .filter(Boolean)
      .forEach((s) => s!.getTracks().forEach((t) => t.stop()));
    this.screenStream = this.cam1Stream = this.cam2Stream = this.micStream = this.systemAudioStream = null;
    this.compositor?.setScreen(null);
    this.compositor?.setCamera1(null);
    this.compositor?.setCamera2(null);
    this.emit("sources", undefined);
  }
}

export const studio = new Studio();
