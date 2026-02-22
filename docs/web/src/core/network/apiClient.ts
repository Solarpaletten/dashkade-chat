import type { TranslateResponse, HealthResponse } from '../types/translator.types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const TARGET_LANGUAGE = 'DE' as const

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const apiClient = {
  wakeUp: async (): Promise<HealthResponse> => {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    })
    return handleResponse<HealthResponse>(res)
  },

  translate: async (text: string): Promise<TranslateResponse> => {
    const res = await fetch(`${BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        target_language: TARGET_LANGUAGE
      }),
      signal: AbortSignal.timeout(30000)
    })
    return handleResponse<TranslateResponse>(res)
  },

  voiceTranslate: async (audioBlob: Blob): Promise<TranslateResponse> => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.wav')
    form.append('target_language', TARGET_LANGUAGE)
    const res = await fetch(`${BASE_URL}/voice-translate`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60000)
    })
    return handleResponse<TranslateResponse>(res)
  }
}
