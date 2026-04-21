// features/translator/useTranslator.ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  type TranslatorState,
  type Direction,
  type TranslateResponse,
  DIRECTION_CONFIG,
  SWAP_MAP,
} from "./types";

const INITIAL: TranslatorState = {
  inputText: "",
  translatedText: "",
  isTranslating: false,
  backendAwake: false,
  error: null,
  direction: "RU_DE",
  micState: "Idle",
  conversationMode: false,
};

function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}

export function useTranslator() {
  const [state, setState] = useState<TranslatorState>(INITIAL);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const set = useCallback(
    (partial: Partial<TranslatorState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    []
  );

  // Restore direction from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("dashka-direction") as Direction | null;
    if (saved && DIRECTION_CONFIG[saved]) {
      setState((prev) => ({ ...prev, direction: saved }));
    }
  }, []);

  // Health ping
  const wakeUp = useCallback(async () => {
    set({ error: null });
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      set({ backendAwake: res.ok });
    } catch {
      set({ backendAwake: false, error: "Backend недоступен" });
    }
  }, [set]);

  useEffect(() => {
    wakeUp();
    const id = window.setInterval(wakeUp, 30_000);
    return () => window.clearInterval(id);
  }, [wakeUp]);

  // Text translate
  const translate = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? state.inputText).trim();
      if (!text) return;
      const cfg = DIRECTION_CONFIG[state.direction];
      set({ isTranslating: true, error: null });
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            source_language: cfg.targetLang === "RU" ? undefined : undefined, // auto-detect
            target_language: cfg.targetLang,
          }),
        });
        const data = (await res.json()) as TranslateResponse;
        if (!res.ok || data.status !== "success") {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        set({
          translatedText: data.translated_text,
          backendAwake: true,
        });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "Ошибка перевода",
        });
      } finally {
        set({ isTranslating: false });
      }
    },
    [state.inputText, state.direction, set]
  );

  // Debounced partial (for live translation during recording)
  const translatePartial = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const cfg = DIRECTION_CONFIG[state.direction];
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, target_language: cfg.targetLang }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as TranslateResponse;
        if (data.status === "success") {
          set({ translatedText: data.translated_text });
        }
      } catch {
        /* silent */
      }
    },
    [state.direction, set]
  );
  const debouncedPartial = useDebounce(translatePartial, 500);

  // Swap direction
  const toggleDirection = useCallback(() => {
    setState((prev) => {
      const next = SWAP_MAP[prev.direction];
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dashka-direction", next);
      }
      return {
        ...prev,
        direction: next,
        inputText: prev.translatedText,
        translatedText: prev.inputText,
        error: null,
      };
    });
  }, []);

  // Cycle through all 4 directions (optional feature for long-press / submenu)
  const setDirection = useCallback(
    (d: Direction) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dashka-direction", d);
      }
      set({ direction: d, inputText: "", translatedText: "", error: null });
    },
    [set]
  );

  // Mic
  const toggleMic = useCallback(() => {
    if (state.micState === "Recording") {
      recognitionRef.current?.stop();
      set({ micState: "Processing" });
      return;
    }
    if (state.micState === "Processing") return;

    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;

    if (!Ctor) {
      set({ error: "Распознавание речи не поддерживается в этом браузере" });
      return;
    }

    const cfg = DIRECTION_CONFIG[state.direction];
    const rec = new Ctor();
    rec.lang = cfg.sourceLang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0].transcript;
        if (res.isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      const display = (finalText + interim).trim();
      set({ inputText: display });
      debouncedPartial(display);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech") return;
      set({ micState: "Idle", error: `Ошибка микрофона: ${e.error}` });
    };

    rec.onend = () => {
      setState((prev) => {
        if (prev.micState === "Processing") {
          // finalize translation
          void translate(prev.inputText).finally(() =>
            set({ micState: "Idle" })
          );
          return prev;
        }
        return { ...prev, micState: "Idle" };
      });
    };

    recognitionRef.current = rec;
    rec.start();
    set({ micState: "Recording", error: null });
  }, [state.direction, state.micState, set, debouncedPartial, translate]);

  const toggleConversationMode = useCallback(() => {
    set({ conversationMode: !state.conversationMode });
  }, [state.conversationMode, set]);

  const clear = useCallback(() => {
    set({ inputText: "", translatedText: "", error: null });
  }, [set]);

  const setInputText = useCallback(
    (text: string) => set({ inputText: text }),
    [set]
  );

  const copyResult = useCallback(() => {
    if (state.translatedText && typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(state.translatedText).catch(() => {});
    }
  }, [state.translatedText]);

  return {
    ...state,
    directionConfig: DIRECTION_CONFIG[state.direction],
    isRecording: state.micState === "Recording",
    isProcessing: state.micState === "Processing",
    wakeUp,
    translate: () => translate(),
    toggleMic,
    toggleDirection,
    setDirection,
    toggleConversationMode,
    clear,
    setInputText,
    copyResult,
  };
}
