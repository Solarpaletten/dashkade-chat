// features/translator/types.ts
// v1.3 — German-only edition (Dashka для ВНЖ в Германии)
// Для английской версии — отдельный fork с RU_EN / EN_RU

export type Direction = "RU_DE" | "DE_RU";

export const DIRECTION_CONFIG: Record<Direction, {
  source: string;
  target: string;
  label: string;
  sourceLang: string;  // BCP-47 for SpeechRecognition
  targetLang: string;  // for /api/translate target_language
  flagFrom: string;
  flagTo: string;
  placeholder: string;
}> = {
  RU_DE: {
    source: "Русский",
    target: "Немецкий",
    label: "RU → DE",
    sourceLang: "ru-RU",
    targetLang: "DE",
    flagFrom: "🇷🇺",
    flagTo: "🇩🇪",
    placeholder: "Говорите или пишите по-русски…",
  },
  DE_RU: {
    source: "Немецкий",
    target: "Русский",
    label: "DE → RU",
    sourceLang: "de-DE",
    targetLang: "RU",
    flagFrom: "🇩🇪",
    flagTo: "🇷🇺",
    placeholder: "Sprich oder schreibe auf Deutsch…",
  },
};

export const SWAP_MAP: Record<Direction, Direction> = {
  RU_DE: "DE_RU",
  DE_RU: "RU_DE",
};

export type MicState = "Idle" | "Recording" | "Processing";
export type Theme = "dark" | "light";

export interface TranslatorState {
  inputText: string;
  translatedText: string;
  isTranslating: boolean;
  backendAwake: boolean;
  error: string | null;
  direction: Direction;
  micState: MicState;
  conversationMode: boolean;
}

export interface TranslateResponse {
  status: "success" | "error";
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  confidence: number;
  processing_time: number;
  from_cache: boolean;
  message?: string;
}

/* --- SpeechRecognition ambient types --- */
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
  }
}
