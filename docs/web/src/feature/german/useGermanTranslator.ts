import { useState, useCallback, useEffect, useRef } from 'react'
import { apiClient } from '../../core/network/apiClient'
import type { GermanTranslatorState } from '../../core/types/translator.types'

export function useGermanTranslator() {
  const [state, setState] = useState<GermanTranslatorState>({
    inputText: '',
    translatedText: '',
    isTranslating: false,
    isRecording: false,
    backendAwake: false,
    error: null
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto wake-up on mount
  useEffect(() => {
    wakeUp()
  }, [])

  const set = (partial: Partial<GermanTranslatorState>) =>
    setState(prev => ({ ...prev, ...partial }))

  const wakeUp = useCallback(async () => {
    set({ error: null })
    try {
      await apiClient.wakeUp()
      set({ backendAwake: true })
    } catch {
      set({ backendAwake: false, error: 'Backend недоступен. Нажмите ☀️ для повтора.' })
    }
  }, [])

  const translate = useCallback(async () => {
    if (!state.inputText.trim()) return
    set({ isTranslating: true, error: null })
    try {
      const res = await apiClient.translate(state.inputText)
      set({ translatedText: res.translated_text, backendAwake: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка перевода'
      set({ error: msg })
    } finally {
      set({ isTranslating: false })
    }
  }, [state.inputText])

  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      set({ isRecording: false })
    } else {
      // Try Web Speech API first (Chrome/Safari)
      const SpeechRecognition =
        (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
        (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'ru-RU'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          set({ inputText: transcript, isRecording: false })
          // Auto-translate after voice input
          set({ isTranslating: true, error: null })
          try {
            const res = await apiClient.translate(transcript)
            set({ translatedText: res.translated_text })
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Ошибка перевода'
            set({ error: msg })
          } finally {
            set({ isTranslating: false })
          }
        }

        recognition.onerror = () => set({ isRecording: false, error: 'Ошибка микрофона' })
        recognition.onend = () => set({ isRecording: false })

        recognitionRef.current = recognition
        recognition.start()
        set({ isRecording: true })
      } else {
        // Fallback: MediaRecorder → Whisper
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          audioChunksRef.current = []
          const recorder = new MediaRecorder(stream)

          recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
          recorder.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
            stream.getTracks().forEach(t => t.stop())
            set({ isRecording: false, isTranslating: true, error: null })
            try {
              const res = await apiClient.voiceTranslate(blob)
              set({ inputText: res.original_text, translatedText: res.translated_text })
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Ошибка голосового перевода'
              set({ error: msg })
            } finally {
              set({ isTranslating: false })
            }
          }

          mediaRecorderRef.current = recorder
          recorder.start()
          set({ isRecording: true })
        } catch {
          set({ error: 'Нет доступа к микрофону' })
        }
      }
    }
  }, [state.isRecording])

  const clear = useCallback(() => {
    set({ inputText: '', translatedText: '', error: null })
  }, [])

  const setInputText = useCallback((text: string) => {
    set({ inputText: text })
  }, [])

  const copyResult = useCallback(() => {
    if (state.translatedText) {
      navigator.clipboard.writeText(state.translatedText).catch(() => {})
    }
  }, [state.translatedText])

  return {
    ...state,
    wakeUp,
    translate,
    toggleRecording,
    clear,
    setInputText,
    copyResult
  }
}
