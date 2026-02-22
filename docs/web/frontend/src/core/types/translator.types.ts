// Shared state — синхронизирован с iOS и Android
export interface TranslatorState {
  inputText: string
  translatedText: string
  isTranslating: boolean
  isRecording: boolean
  backendAwake: boolean
  error: string | null
}

export interface TranslateResponse {
  status: string
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  processing_time: number
  from_cache: boolean
}
