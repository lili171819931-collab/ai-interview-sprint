export {};

type SourceInfo = {
  id: string;
  name: string;
  display_id: string;
  thumbnailDataUrl: string;
};

type SavePayload = {
  defaultPath?: string;
  fileName?: string;
  buffer: ArrayBuffer;
  mimeType?: string;
  sidecar?: Record<string, unknown>;
};

type CaptureItem = {
  name: string;
  filePath: string;
  sizeBytes: number;
  createdAt: number;
  kind: "recording" | "screenshot";
};

type ControlBarState = {
  recState?: string;
  elapsedMs?: number;
  baseElapsedMs?: number;
  /** Date.now() when current recording segment started */
  recStartedAt?: number;
  countdown?: number | null;
  cameraEnabled?: boolean;
  camShape?: "circle" | "rect";
  mirrored?: boolean;
  zoomEnabled?: boolean;
  magnification?: number;
  error?: string | null;
};

type CursorPos = {
  x: number;
  y: number;
  displayX: number;
  displayY: number;
  displayW: number;
  displayH: number;
};

type MacRecorderApi = {
  getSources: (types?: Array<"screen" | "window">) => Promise<SourceInfo[]>;
  getMediaAccessStatus: (
    mediaType: "camera" | "microphone" | "screen",
  ) => Promise<string>;
  askMediaAccess: (mediaType: "camera" | "microphone" | "screen") => Promise<boolean>;
  openPrivacySettings: (which: "screen" | "camera" | "microphone") => Promise<void>;
  setRecordingState: (recording: boolean) => Promise<boolean>;
  saveRecording: (
    payload: SavePayload,
  ) => Promise<{
    ok: boolean;
    canceled?: boolean;
    filePath?: string;
    dir?: string;
    format?: string;
    warning?: string;
    error?: string;
  }>;
  saveScreenshot: (payload: {
    buffer: ArrayBuffer;
    fileName?: string;
    copyToClipboard?: boolean;
  }) => Promise<{ ok: boolean; filePath?: string; dir?: string }>;
  showInFolder: (filePath: string) => Promise<boolean>;
  openCapture: (filePath: string) => Promise<boolean>;
  deleteCapture: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
  copyImageFile: (filePath: string) => Promise<boolean>;
  getDefaultExportDir: () => Promise<string>;
  openExportDir: () => Promise<string>;
  listRecordings: () => Promise<{ dir: string; items: CaptureItem[] }>;
  setMainWindowVisible: (visible: boolean) => Promise<boolean>;
  setCameraPip: (payload: {
    visible: boolean;
    deviceId?: string;
  }) => Promise<boolean>;
  setControlBar: (payload: {
    visible: boolean;
    state?: ControlBarState;
  }) => Promise<boolean>;
  pushControlBarState: (state: ControlBarState) => Promise<boolean>;
  setCursorTracking: (enabled: boolean) => Promise<boolean>;
  setShellExpanded: (expanded: boolean) => Promise<boolean>;
  copyText: (text: string) => Promise<boolean>;
  onCameraPipDismissed: (cb: () => void) => () => void;
  onTrayAction: (cb: (action: string) => void) => () => void;
  onReleaseMedia: (cb: () => void) => () => void;
  onCursorPos: (cb: (pos: CursorPos) => void) => () => void;
};

declare global {
  interface Window {
    macRecorder: MacRecorderApi;
  }
}
