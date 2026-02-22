// feature/german/useGermanTranslator.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { apiClient } from '../../core/network/apiClient'
import type { TranslatorState } from '../../core/types/translator.types'

export function useGermanTranslator() {
  const [state, setState] = useState<TranslatorState>({
    inputText: '',
    translatedText: '',
    isTranslating: false,
    isRecording: false,
    backendAwake: false,
    error: null
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const wakeUpAttempted = useRef(false)

  // Пробудить backend при загрузке
  useEffect(() => {
    if (wakeUpAttempted.current) return
    wakeUpAttempted.current = true

    const autoWake = async () => {
      const ok = await apiClient.wakeUp()
      setState(s => ({ ...s, backendAwake: ok }))
    }
    autoWake()
  }, [])

  const setInputText = useCallback((text: string) => {
    setState(s => ({ ...s, inputText: text, error: null }))
  }, [])

  const wakeUp = useCallback(async () => {
    setState(s => ({ ...s, error: null }))
    const ok = await apiClient.wakeUp()
    setState(s => ({ ...s, backendAwake: ok, error: ok ? null : 'Backend не отвечает. Повторите через 30 сек.' }))
  }, [])

  const translate = useCallback(async () => {
    const text = state.inputText.trim()
    if (!text) return

    setState(s => ({ ...s, isTranslating: true, error: null }))

    try {
      const result = await apiClient.translate(text)
      setState(s => ({ ...s, translatedText: result, isTranslating: false, backendAwake: true }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка перевода'
      setState(s => ({
        ...s,
        isTranslating: false,
        error: msg.includes('504') || msg.includes('502')
          ? 'Backend спит — нажмите Wake Up'
          : `Ошибка: ${msg}`
      }))
    }
  }, [state.inputText])

  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      // Стоп
      mediaRecorderRef.current?.stop()
      setState(s => ({ ...s, isRecording: false }))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = e => chunksRef.current.push(e.data)

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

        setState(s => ({ ...s, isTranslating: true, error: null }))
        try {
          const result = await apiClient.voiceTranslate(blob)
          setState(s => ({
            ...s,
            inputText: result.text,
            translatedText: result.translation,
            isTranslating: false,
            backendAwake: true
          }))
        } catch (err) {
          setState(s => ({
            ...s,
            isTranslating: false,
            error: 'Ошибка голосового перевода'
          }))
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setState(s => ({ ...s, isRecording: true, error: null }))

    } catch {
      setState(s => ({ ...s, error: 'Нет доступа к микрофону' }))
    }
  }, [state.isRecording])

  const clear = useCallback(() => {
    setState(s => ({ ...s, inputText: '', translatedText: '', error: null }))
  }, [])

  const copyResult = useCallback(async () => {
    if (state.translatedText) {
      await navigator.clipboard.writeText(state.translatedText)
    }
  }, [state.translatedText])

  return {
    ...state,
    setInputText,
    wakeUp,
    translate,
    toggleRecording,
    clear,
    copyResult
  }
}
