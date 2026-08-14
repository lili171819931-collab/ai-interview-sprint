import type { BgmTrack } from "../types";

// ============ 内置合成背景音乐（纯 WebAudio 生成，无需素材） ============
export const BGM_TRACKS: BgmTrack[] = [
  { id: "lofi-chill", name: "Lo-Fi 午后", emoji: "☕", bpm: 78, chords: ["Cmaj7", "Am7", "Dm7", "G7"], style: "lofi" },
  { id: "upbeat-pop", name: "轻快流行", emoji: "⚡", bpm: 118, chords: ["C", "G", "Am", "F"], style: "upbeat" },
  { id: "calm-piano", name: "治愈钢琴", emoji: "🎹", bpm: 66, chords: ["Fmaj7", "G", "Em7", "Am7"], style: "calm" },
  { id: "synthwave", name: "赛博合成波", emoji: "🌆", bpm: 100, chords: ["Am", "F", "C", "G"], style: "synthwave" },
];

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const CHORD_ROOTS: Record<string, number> = { C: 48, D: 50, E: 52, F: 53, G: 55, A: 57, B: 59 };

function chordTones(name: string): number[] {
  const root = name.replace(/[^A-G]/g, "");
  const suffix = name.replace(root, "");
  const base = CHORD_ROOTS[root] ?? 48;
  let tones: number[] = [0, 4, 7, 12];
  if (suffix.includes("m")) tones = [0, 3, 7, 12];
  if (suffix.includes("7")) tones = [0, 4, 7, 10];
  if (suffix.includes("maj7")) tones = [0, 4, 7, 11];
  return tones.map((t) => base + t);
}

/**
 * 生成一段可循环的背景音乐（合成器风格）。
 * 返回 2 声道 AudioBuffer。
 */
export function synthesizeBgm(ctx: AudioContext, track: BgmTrack, seconds = 16): AudioBuffer {
  const bpm = track.bpm;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const bars = Math.max(2, Math.ceil(seconds / bar));
  const totalSeconds = bars * bar;
  const sr = ctx.sampleRate;
  const len = Math.floor(totalSeconds * sr);
  const buf = ctx.createBuffer(2, len, sr);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);

  const chords = track.chords.map(chordTones);
  const scale = track.style === "lofi" || track.style === "calm" ? MINOR : MAJOR;

  const noise = new Float32Array(4096);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;

  // 和弦铺底 + 分解和弦
  for (let b = 0; b < bars; b++) {
    const chord = chords[b % chords.length];
    const t0 = b * bar;
    // 铺底 pad
    for (const t of chord) {
      addTone(L, R, sr, t0, bar, NOTE(t), 0.05, "pad");
      if (t + 12 <= 96) addTone(L, R, sr, t0, bar, NOTE(t + 12), 0.03, "pad");
    }
    // 分解 arp：每拍一个音
    for (let k = 0; k < 4; k++) {
      const n = chord[k % chord.length] + 12;
      const tt = t0 + k * beat;
      const dur = beat * 0.9;
      addTone(L, R, sr, tt, dur, NOTE(n), 0.06, track.style === "synthwave" ? "saw" : "pluck");
    }
    // 低音
    const bassRoot = chord[0] - 12;
    for (let k = 0; k < 2; k++) {
      const tt = t0 + k * 2 * beat;
      addTone(L, R, sr, tt, beat * 1.8, NOTE(bassRoot), 0.09, "bass");
    }
  }

  // 鼓点
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    for (let k = 0; k < 8; k++) {
      const tt = t0 + k * beat / 2;
      if (k % 4 === 0 || (track.style === "upbeat" && k % 2 === 0)) addKick(L, R, sr, tt, 0.16, k % 4 === 0 ? 0.5 : 0.3);
      if (k % 2 === 1 && (track.style === "lofi" || track.style === "upbeat" || track.style === "synthwave")) addHat(L, R, sr, tt, 0.03, noise);
    }
  }

  // 淡出结尾
  const fade = Math.floor(sr * 0.5);
  for (let i = 0; i < fade; i++) {
    const g = 1 - i / fade;
    L[len - 1 - i] *= g;
    R[len - 1 - i] *= g;
  }
  return buf;
}

function addTone(L: Float32Array, R: Float32Array, sr: number, start: number, dur: number, freq: number, amp: number, kind: string) {
  const i0 = Math.floor(start * sr);
  const n = Math.floor(dur * sr);
  const attack = Math.max(1, Math.floor(sr * 0.01));
  const release = Math.max(1, Math.floor(sr * 0.12));
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, i / attack) * Math.min(1, (n - i) / release);
    let v = 0;
    if (kind === "pad") v = Math.sin(2 * Math.PI * freq * t) * 0.6 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
    else if (kind === "pluck") v = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6) * 0.8 + Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 10) * 0.2;
    else if (kind === "saw") { v = 2 * ((freq * t) % 1) - 1; v = v * 0.6 + Math.sin(2 * Math.PI * freq * t) * 0.4; }
    else if (kind === "bass") v = Math.sin(2 * Math.PI * freq * t) * 0.9 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
    const idx = i0 + i;
    if (idx >= L.length) break;
    L[idx] += v * env * amp;
    R[idx] += v * env * amp;
  }
}

function addKick(L: Float32Array, R: Float32Array, sr: number, start: number, dur: number, amp: number) {
  const i0 = Math.floor(start * sr);
  const n = Math.floor(dur * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 18);
    const v = Math.sin(2 * Math.PI * (70 + 90 * Math.exp(-t * 30)) * t) * env;
    const idx = i0 + i;
    if (idx >= L.length) break;
    L[idx] += v * amp;
    R[idx] += v * amp;
  }
}

function addHat(L: Float32Array, R: Float32Array, sr: number, start: number, dur: number, noise: Float32Array) {
  const i0 = Math.floor(start * sr);
  const n = Math.floor(dur * sr);
  for (let i = 0; i < n; i++) {
    const env = Math.exp(-t(i, sr) * 90);
    const idx = i0 + i;
    if (idx >= L.length) break;
    const v = noise[(i0 + i * 7) % noise.length] * env * 0.12;
    L[idx] += v;
    R[idx] += v;
  }
}

function t(i: number, sr: number) { return i / sr; }
