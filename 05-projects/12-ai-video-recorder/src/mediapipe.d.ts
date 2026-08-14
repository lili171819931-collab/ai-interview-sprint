// @mediapipe/selfie_segmentation (legacy UMD global) 类型声明
interface SelfieSegmentationResults {
  image: HTMLCanvasElement;
  segmentationMask: HTMLCanvasElement;
}

interface SelfieSegmentationOptions {
  locateFile?: (file: string) => string;
}

interface SelfieSegmentationInstance {
  setOptions(opts: { modelSelection: 0 | 1; selfieMode?: boolean }): void;
  onResults: ((results: SelfieSegmentationResults) => void) | null;
  initialize(): Promise<void>;
  send(input: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
}

interface SelfieSegmentationConstructor {
  new (opts: SelfieSegmentationOptions): SelfieSegmentationInstance;
}

interface Window {
  SelfieSegmentation?: SelfieSegmentationConstructor;
}
