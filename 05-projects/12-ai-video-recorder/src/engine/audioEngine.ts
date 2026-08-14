import { synthesizeBgm, BGM_TRACKS } from "./bgm";

// ============ 音频引擎：麦克风 + 系统声音 + BGM 混合，支持自动闪避与能量分析 ============
export class AudioEngine {
  ctx: AudioContext;
  private micNode: MediaStreamAudioSourceNode | null = null;
  private sysNode: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode;
  private sysGain: GainNode;
  private bgmGain: GainNode;
  private analyser: AnalyserNode;
  private destination: MediaStreamAudioDestinationNode;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmBuffer: AudioBuffer | null = null;
  private duckTarget = 1;
  private _currentBgmId: string | null = null;
  private _bgmVolume = 0.5;

  /** 用于 AI 剪辑的能量历史（每 250ms 一帧 RMS） */
  energyHistory: { t: number; rms: number }[] = [];
  private energyTimer: number | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = 1;
    this.sysGain = this.ctx.createGain();
    this.sysGain.gain.value = 1;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this._bgmVolume;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.destination = this.ctx.createMediaStreamDestination();
    // 信号链：mic/sys/bgm -> analyser(mic) -> destination
    this.micGain.connect(this.destination);
    this.sysGain.connect(this.destination);
    this.bgmGain.connect(this.destination);
    this.micGain.connect(this.analyser);
  }

  get currentBgmId(): string | null { return this._currentBgmId; }

  get stream(): MediaStream {
    return this.destination.stream;
  }

  get currentTime(): number {
    return this.ctx.currentTime;
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  setMic(stream: MediaStream | null) {
    if (this.micNode) { this.micNode.disconnect(); this.micNode = null; }
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        this.micNode = this.ctx.createMediaStreamSource(new MediaStream([track]));
        this.micNode.connect(this.micGain);
      }
    }
  }

  setMicVolume(v: number) {
    this.micGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  setSystem(stream: MediaStream | null) {
    if (this.sysNode) { this.sysNode.disconnect(); this.sysNode = null; }
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        this.sysNode = this.ctx.createMediaStreamSource(new MediaStream([track]));
        this.sysNode.connect(this.sysGain);
      }
    }
  }

  setSystemVolume(v: number) {
    this.sysGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  /** 设置背景音乐：trackId 为 null 则停止 */
  setBgm(trackId: string | null, volume = this._bgmVolume) {
    this._bgmVolume = volume;
    this.stopBgm();
    if (!trackId) return;
    const track = BGM_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    const buf = synthesizeBgm(this.ctx, track, 16);
    this.bgmBuffer = buf;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.bgmGain);
    src.start();
    this.bgmSource = src;
    this._currentBgmId = trackId;
    this.bgmGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  setBgmVolume(v: number) {
    this._bgmVolume = v;
    this.bgmGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  /** 说话时自动压低 BGM（闪避） */
  setDucking(enabled: boolean) {
    if (!enabled) {
      this.bgmGain.gain.setTargetAtTime(this._bgmVolume, this.ctx.currentTime, 0.1);
      return;
    }
    const buf = new Float32Array(this.analyser.fftSize);
    const level = () => {
      this.analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      const target = rms > 0.02 ? this._bgmVolume * 0.25 : this._bgmVolume;
      this.bgmGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
    };
    const timer = window.setInterval(level, 120);
    (this as unknown as { _duckTimer: number })._duckTimer = timer;
  }

  private stopBgm() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch { /* noop */ }
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
    this._currentBgmId = null;
  }

  startEnergySampling() {
    this.energyHistory = [];
    const buf = new Float32Array(this.analyser.fftSize);
    this.energyTimer = window.setInterval(() => {
      this.analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      this.energyHistory.push({ t: this.ctx.currentTime, rms });
    }, 250);
  }

  stopEnergySampling() {
    if (this.energyTimer) { clearInterval(this.energyTimer); this.energyTimer = null; }
  }

  dispose() {
    this.stopEnergySampling();
    this.stopBgm();
    try { this.ctx.close(); } catch { /* noop */ }
  }
}
