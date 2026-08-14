interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: { length: number; item(i: number): SpeechRecognitionResultLike } & ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  item(i: number): SpeechRecognitionAlternativeLike;
  [i: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}
interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
