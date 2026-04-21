// features/translator/ConversationMode.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Direction, MicState } from "./types";
import { DIRECTION_CONFIG } from "./types";

interface Props {
  inputText: string;
  translatedText: string;
  micState: MicState;
  direction: Direction;
  onToggleMic: () => void;
  onToggleDir: () => void;
  onClose: () => void;
}

export default function ConversationMode({
  inputText,
  translatedText,
  micState,
  direction,
  onToggleMic,
  onToggleDir,
  onClose,
}: Props) {
  const cfg = DIRECTION_CONFIG[direction];
  const isRecording = micState === "Recording";
  const isProcessing = micState === "Processing";

  const inputScrollRef = useRef<HTMLDivElement>(null);
  const transScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputScrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [inputText]);

  useEffect(() => {
    transScrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [translatedText]);

  return (
    <div className="conv-overlay">
      {/* Top bar */}
      <div className="conv-topbar">
        <button type="button" onClick={onClose} className="conv-close">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Выход
        </button>
        <span className="conv-title">Conversation Mode</span>
        <button
          type="button"
          onClick={onToggleDir}
          disabled={isRecording || isProcessing}
          className="conv-dir-btn"
        >
          {cfg.flagFrom} ⇄ {cfg.flagTo}
        </button>
      </div>

      {/* Speaker A */}
      <div className="conv-zone conv-zone-source">
        <div className="conv-zone-header">
          <span className="conv-flag">{cfg.flagFrom}</span>
          <span className="conv-lang-label">{cfg.source}</span>
          {isRecording && (
            <span className="conv-status conv-status-rec">
              <span className="rec-dot" />
              Запись…
            </span>
          )}
          {isProcessing && <span className="conv-status conv-status-proc">Обработка…</span>}
        </div>
        <div ref={inputScrollRef} className="conv-scroll">
          <p className={`conv-text ${inputText ? "" : "conv-text-placeholder"}`}>
            {inputText || `Говорите на «${cfg.source}»…`}
          </p>
        </div>
      </div>

      {/* Speaker B */}
      <div className="conv-zone conv-zone-target">
        <div className="conv-zone-header">
          <span className="conv-flag">{cfg.flagTo}</span>
          <span className="conv-lang-label">{cfg.target}</span>
        </div>
        <div ref={transScrollRef} className="conv-scroll">
          <p className={`conv-text conv-text-translated ${translatedText ? "" : "conv-text-placeholder"}`}>
            {translatedText || "…"}
          </p>
        </div>
      </div>

      {/* Bottom mic */}
      <div className="conv-bottom">
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isProcessing}
          aria-label={isRecording ? "Остановить запись" : "Начать запись"}
          className={`conv-mic ${isRecording ? "conv-mic-recording" : ""}`}
        >
          {isProcessing ? (
            <svg width="32" height="32" className="animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : isRecording ? (
            "⏹"
          ) : (
            "🎤"
          )}
        </button>
      </div>
    </div>
  );
}
