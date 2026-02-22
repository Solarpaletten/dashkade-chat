// core/network/apiClient.ts
// DE-only — target_language жёстко зафиксирован

const BASE_URL = import.meta.env.VITE_API_URL || 'https://dashka-translate.onrender.com'
const TARGET_LANGUAGE = 'DE'

export const apiClient = {

  // Пробудить backend (Render free tier засыпает)
  wakeUp: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/health`, {
        signal: AbortSignal.timeout(15000)
      })
      return res.ok
    } catch {
      return false
    }
  },

  // Текстовый перевод — всегда → DE
  translate: async (text: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        target_language: TARGET_LANGUAGE
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()

    if (data.status !== 'success') {
      throw new Error(data.message || 'Translation failed')
    }

    return data.translated_text as string
  },

  // Голосовой перевод — всегда → DE
  voiceTranslate: async (audioBlob: Blob): Promise<{ text: string; translation: string }> => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.wav')
    form.append('target_language', TARGET_LANGUAGE)

    const res = await fetch(`${BASE_URL}/voice-translate`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return {
      text: data.original_text || '',
      translation: data.translated_text || ''
    }
  }
}
