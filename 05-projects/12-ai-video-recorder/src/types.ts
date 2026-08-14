// ============ 核心类型定义 ============

export type SourceKind = "screen" | "camera1" | "camera2";

export interface CropRect {
  /** 相对屏幕视频的归一化裁剪区域 0..1 */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZoomState {
  /** 1 = 原大小, 可到 4x */
  scale: number;
  /** 聚焦点（归一化 0..1，相对屏幕区域） */
  focusX: number;
  focusY: number;
  /** 是否启用平滑缩放动画 */
  smooth: boolean;
}

export type AnnotationType = "pen" | "arrow" | "rect" | "ellipse" | "text" | "blur";

export interface Annotation {
  id: string;
  type: AnnotationType;
  color: string;
  size: number;
  /** 归一化坐标 0..1（相对画布） */
  points: { x: number; y: number }[];
  text?: string;
}

export interface SubtitleState {
  enabled: boolean;
  /** 每行一条，自动居中换行 */
  lines: string[];
  fontSize: number; // 相对画布高度的比例 * 1000
  color: string;
  bg: string;
  position: "bottom" | "top";
  /** AI 语音识别字幕 */
  liveCaptions: boolean;
  liveText: string;
  /** 记录带时间戳的字幕条目（用于导出 SRT） */
  timedEntries: { start: number; end: number; text: string }[];
}

export type PipShape = "rounded" | "circle" | "ellipse" | "square" | "diamond";

export type SplitMode = "pip" | "split-v" | "split-h" | "dual" | "circle";

export interface PipRect {
  x: number; // 归一化 0..1
  y: number;
  w: number; // 归一化宽度
  h: number; // 归一化高度
  radius: number; // 圆角 px
  label: string;
  mirror: boolean;
}

/** 简单美颜（CSS/canvas filter 参数，0..1） */
export interface BeautyState {
  smooth: number; // 磨皮
  bright: number; // 美白
  rosy: number;   // 红润
  sharp: number;  // 清晰度
}

export type PipBlurMode = "none" | "screen" | "soft" | "portrait";

/** OBS 风格摄像头颜色滤镜 */
export type ColorFilter = "none" | "warm" | "cool" | "bw" | "retro";

/** 文字来源（OBS Text Source） */
export interface TextOverlay {
  id: string;
  text: string;
  x: number; // 归一化 0..1
  y: number;
  size: number; // 相对画布高度百分比*1000
  color: string;
}

/** 图片来源（OBS Image Source） */
export interface ImageOverlay {
  id: string;
  src: string; // dataURL / URL
  x: number;
  y: number;
  w: number; // 归一化宽度
  h: number; // 归一化高度（0 则按图片比例）
}

/** 转场效果 */
export type TransitionKind = "cut" | "fade" | "wipe";

/** OBS 场景快照：保存整套工作区配置（不含流本身） */
export interface SceneSnapshot {
  id: string;
  name: string;
  createdAt: number;
  templateId: string;
  splitMode: SplitMode;
  pipShape: PipShape;
  beauty: BeautyState;
  blurMode: PipBlurMode;
  filter: ColorFilter;
  crop: CropRect;
  zoom: ZoomState;
  subtitle: SubtitleState;
  bgmId: string | null;
  bgmVol: number;
  watermark: string;
  enabled: { screen: boolean; camera1: boolean; camera2: boolean };
  textSources: TextOverlay[];
  imageSources: ImageOverlay[];
}

export interface ClickEffect {
  x: number; // 归一化
  y: number;
  t: number; // 起始时间 ms
}

export interface TemplateDef {
  id: string;
  name: string;
  emoji: string;
  /** 输出分辨率 */
  width: number;
  height: number;
  fps: number;
  bg: string;
  bgGradient?: [string, string];
  /** 屏幕区域（归一化，相对输出画布） */
  screen: { x: number; y: number; w: number; h: number };
  /** 摄像头 PiP 布局 */
  pips: { cam1?: PipRect; cam2?: PipRect };
  subtitle: { fontSize: number; position: "bottom" | "top"; color: string; bg: string };
  platforms: string[];
  desc: string;
}

export interface BgmTrack {
  id: string;
  name: string;
  emoji: string;
  /** 生成参数：bpm、主和弦、风格 */
  bpm: number;
  chords: string[];
  style: "lofi" | "upbeat" | "calm" | "synthwave";
}

export interface EditSegment {
  start: number;
  end: number;
  keep: boolean;
  reason: "speech" | "highlight" | "silence" | "intro" | "outro";
}

export interface EditPlan {
  segments: EditSegment[];
  totalKeep: number;
  totalTrim: number;
  highlights: number; // 高能片段数
  silenceCuts: number; // 静音剪除段数
}

export type RecordState =
  | "idle"          // 未开始
  | "preview"       // 已有源，预览中
  | "recording"     // 录制中
  | "paused"        // 暂停
  | "recorded"      // 录制完成（待导出/剪辑）
  | "exporting";    // 导出/渲染中

export interface StudioEventMap {
  state: RecordState;
  tick: { elapsed: number };
  status: string;
  sources: void;
  recorded: { blob: Blob; url: string; duration: number };
  exportProgress: { pct: number; label: string };
  exportDone: { blob: Blob; url: string; filename: string; mime: string };
  transcript: { text: string; final: boolean };
  devices: void;
  scenes: void;
}

export type StudioListener<K extends keyof StudioEventMap> = (payload: StudioEventMap[K]) => void;
