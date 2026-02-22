// feature/german/useGermanTranslator.ts
// v1.2 — Conversation Mode Upgrade
//
// Changes vs v1.1:
//   + Direction toggle (RU_DE | DE_RU)
//   + MicState machine (Idle → Recording → Processing)
//   + Debounced partial translation (1500ms)
//   + No auto-stop (silence / timeout removed)
//   + conversationMode toggle
//   - No console.log

import { useState, useCallback, useEffect, useRef } from 'react'
import { apiClient } from '../../core/network/apiClient'
import {
  type TranslatorState,
  type Direction,
  type MicState,
  DIRECTION_CONFIG,
} from '../../core/types/translator.types'

// ── Debounce helper ───────────────────────────────────────────

function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as T
}

// ── Initial state ─────────────────────────────────────────────

const INITIAL: TranslatorState = {
  inputText:        '',
  translatedText:   '',
  isTranslating:    false,
  backendAwake:     false,
  error:            null,
  direction:        'RU_DE',
  micState:         'Idle',
  conversationMode: false,
}

// ── Hook ──────────────────────────────────────────────────────

export function useGermanTranslator() {
  const [state, setState] = useState<TranslatorState>(INITIAL)

  const recognitionRef  = useRef<SpeechRecognition | null>(null)
  const mediaRecRef     = useRef<MediaRecorder | null>(null)
  const audioChunksRef  = useRef<Blob[]>([])

  const set = useCallback((partial: Partial<TranslatorState>) =>
    setState(prev => ({ ...prev, ...partial })), [])

  // ── Auto wake-up ──────────────────────────────────────────
  useEffect(() => { wakeUp() }, [])

  // ── Wake Up ───────────────────────────────────────────────

  const wakeUp = useCallback(async () => {
    set({ error: null })
    try {
      await apiClient.wakeUp()
      set({ backendAwake: true })
    } catch {
      set({ backendAwake: false, error: 'Backend недоступен. Нажмите ☀️' })
    }
  }, [])

  // ── Translate (text) ──────────────────────────────────────

  const translate = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? state.inputText).trim()
    if (!text) return

    const { targetLang } = DIRECTION_CONFIG[state.direction]

    set({ isTranslating: true, error: null })
    try {
      const res = await apiClient.translate(text, targetLang)
      set({ translatedText: res.translated_text, backendAwake: true })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка перевода' })
    } finally {
      set({ isTranslating: false })
    }
  }, [state.inputText, state.direction])

  // ── Partial translate (debounced 1500ms) ──────────────────
  // Called on every interim SpeechRecognition result

  const translatePartial = useCallback(async (text: string) => {
    if (!text.trim()) return
    const { targetLang } = DIRECTION_CONFIG[state.direction]
    try {
      const res = await apiClient.translate(text, targetLang)
      set({ translatedText: res.translated_text })
    } catch {
      // Silently ignore partial errors — final translate will retry
    }
  }, [state.direction])

  const debouncedPartial = useDebounce(translatePartial, 1500)

  // ── Direction Toggle ──────────────────────────────────────

  const toggleDirection = useCallback(() => {
    set({
      direction:      state.direction === 'RU_DE' ? 'DE_RU' : 'RU_DE',
      inputText:      '',
      translatedText: '',
      error:          null,
    })
  }, [state.direction])

  // ── MicState Machine ──────────────────────────────────────
  //
  //  Idle → [toggleMic] → Recording → [toggleMic] → Processing → Idle
  //
  //  NO auto-stop. NO silence detection. NO timeout.
  //  Stop ONLY on manual press.

  const toggleMic = useCallback(async () => {
    const { micState } = state

    // Recording → Processing
    if (micState === 'Recording') {
      recognitionRef.current?.stop()
      mediaRecRef.current?.stop()
      set({ micState: 'Processing' })
      return
    }

    // Processing — ignore double-tap
    if (micState === 'Processing') return

    // Idle → Recording
    const { sourceLang } = DIRECTION_CONFIG[state.direction]

    // Try Web Speech API (Chrome / Safari)
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.lang             = sourceLang
      recognition.continuous       = true   // ← NO auto-stop
      recognition.interimResults   = true   // ← partial results for streaming

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcript + ' '
          } else {
            interim += transcript
          }
        }

        const current = (finalText || interim).trim()
        if (!current) return

        // Update input immediately (streaming feel)
        const newInput = state.inputText
          ? state.inputText + ' ' + current
          : current
        set({ inputText: newInput.trim() })

        // Debounced partial translate
        debouncedPartial(newInput.trim())
      }

      // NO onend handler — continuous mode doesn't auto-stop
      recognition.onerror = (e: Event) => {
        const err = (e as SpeechRecognitionErrorEvent).error
        // 'no-speech' is not fatal in continuous mode
        if (err === 'no-speech') return
        set({ micState: 'Idle', error: `Ошибка микрофона: ${err}` })
      }

      recognitionRef.current = recognition
      recognition.start()
      set({ micState: 'Recording', error: null })

    } else {
      // Fallback: MediaRecorder → Whisper (mobile browsers)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioChunksRef.current = []

        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)

        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          stream.getTracks().forEach(t => t.stop())

          set({ micState: 'Processing' })
          try {
            const res = await apiClient.voiceTranslate(blob)
            set({
              inputText:      res.original_text,
              translatedText: res.translated_text,
              micState:       'Idle',
            })
          } catch (e) {
            set({
              error:    e instanceof Error ? e.message : 'Ошибка голосового перевода',
              micState: 'Idle',
            })
          }
        }

        mediaRecRef.current = recorder
        recorder.start()
        set({ micState: 'Recording', error: null })

      } catch {
        set({ error: 'Нет доступа к микрофону', micState: 'Idle' })
      }
    }
  }, [state, debouncedPartial])

  // Reset Processing → Idle after voice (WebSpeech path)
  useEffect(() => {
    if (state.micState === 'Processing' && recognitionRef.current) {
      // Trigger final translate on full text, then go Idle
      translate(state.inputText).finally(() => set({ micState: 'Idle' }))
    }
  }, [state.micState])

  // ── Conversation Mode ─────────────────────────────────────

  const toggleConversationMode = useCallback(() => {
    set({ conversationMode: !state.conversationMode })
  }, [state.conversationMode])

  // ── Helpers ───────────────────────────────────────────────

  const clear = useCallback(() => {
    set({ inputText: '', translatedText: '', error: null })
  }, [])

  const setInputText = useCallback((text: string) => {
    set({ inputText: text })
  }, [])

  const copyResult = useCallback(() => {
    if (state.translatedText)
      navigator.clipboard.writeText(state.translatedText).catch(() => {})
  }, [state.translatedText])

  return {
    ...state,
    // legacy compat
    isRecording: state.micState === 'Recording',
    // actions
    wakeUp,
    translate: () => translate(),
    toggleMic,
    toggleDirection,
    toggleConversationMode,
    clear,
    setInputText,
    copyResult,
    directionConfig: DIRECTION_CONFIG[state.direction],
  }
}
