export interface TranslateRequest {
  text: string
  target_language: 'DE'
  source_language?: string
}

export interface TranslateResponse {
  status: 'success' | 'error'
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  confidence: number
  processing_time: number
  from_cache: boolean
}

export interface HealthResponse {
  status: string
  uptime?: number
}

export interface GermanTranslatorState {
  inputText: string
  translatedText: string
  isTranslating: boolean
  isRecording: boolean
  backendAwake: boolean
  error: string | null
}
