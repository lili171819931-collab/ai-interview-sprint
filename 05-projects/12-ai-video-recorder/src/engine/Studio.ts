import type { RecordState, StudioEventMap, StudioListener, TemplateDef } from "../types";
import { AudioEngine } from "./audioEngine";
import { Compositor } from "./compositor";
import { templateById } from "./templates";
import { pickMimeType } from "./aiEdit";

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

  setMicVolume(v: number) { this.audio?.setMicVolume(v); }
  setSystemVolume(v: number) { this.audio?.setSystemVolume(v); }
  setBgm(trackId: string | null, volume?: number) { this.audio?.setBgm(trackId, volume); }
  setBgmVolume(v: number) { this.audio?.setBgmVolume(v); }
  setDucking(enabled: boolean) { this.audio?.setDucking(enabled); }

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
