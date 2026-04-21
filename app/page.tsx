"use client";

import { useEffect, useRef } from "react";
import { useTranslator } from "@/features/translator/useTranslator";
import { useTheme } from "@/features/translator/useTheme";
import DirectionToggle from "@/features/translator/DirectionToggle";
import ConversationMode from "@/features/translator/ConversationMode";

export default function Home() {
  const { theme, toggle: toggleTheme, mounted } = useTheme();
  const t = useTranslator();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ctrl+Enter hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        t.translate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t]);

  // Autosize textarea (input grows with content)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 600)}px`;
  }, [t.inputText]);

  if (t.conversationMode) {
    return (
      <ConversationMode
        inputText={t.inputText}
        translatedText={t.translatedText}
        micState={t.micState}
        direction={t.direction}
        onToggleMic={t.toggleMic}
        onToggleDir={t.toggleDirection}
        onClose={t.toggleConversationMode}
      />
    );
  }

  const cfg = t.directionConfig;

  return (
    <div className="page-wrap">
      <div className="page-inner">
        {/* Header */}
        <header className="app-header">
          <div>
            <h1 className="app-title">
              {cfg.flagTo} Dashka
            </h1>
            <p className="app-subtitle">Conversation Translator · v1.3</p>
          </div>
          <div className="app-actions">
            <button
              type="button"
              onClick={t.toggleConversationMode}
              className="pill-btn"
              title="Conversation Mode"
            >
              💬 Conv
            </button>
            <button type="button" className="pill-btn" title="Subtitle mode (soon)">
              💱 Sub
            </button>
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="pill-btn"
                aria-label="Переключить тему"
                title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            )}
            <span className="status-badge">
              <span className={`status-dot ${t.backendAwake ? "status-dot-on" : "status-dot-off"}`} />
              {t.backendAwake ? "Online" : "Offline"}
            </span>
          </div>
        </header>

        {/* Error banner */}
        {t.error && (
          <div className="error-banner">
            <span>⚠ {t.error}</span>
            <button type="button" onClick={t.wakeUp} className="error-retry">
              Retry
            </button>
          </div>
        )}

        {/* Direction toggle */}
        <DirectionToggle
          direction={t.direction}
          onToggle={t.toggleDirection}
          disabled={t.isRecording || t.isProcessing}
        />

        {/* Input */}
        <section className="io-block">
          <div className="io-header">
            <span>{cfg.flagFrom} <span className="io-lang">{cfg.source}</span></span>
            {t.inputText && (
              <button type="button" onClick={t.clear} className="io-clear">
                очистить ✕
              </button>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={t.inputText}
            onChange={(e) => t.setInputText(e.target.value.slice(0, 5000))}
            placeholder={cfg.placeholder}
            className="io-input io-input-auto"
          />
          <div className="io-counter">
            {t.inputText.length} / 5000
          </div>
        </section>

        {/* Actions */}
        <div className="action-row">
          <button
            type="button"
            onClick={t.translate}
            disabled={t.isTranslating || t.isProcessing || !t.inputText.trim()}
            className="btn-translate"
          >
            {t.isTranslating || t.isProcessing ? (
              <span className="btn-spinner-wrap">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {t.isProcessing ? "Обработка…" : "Переводим…"}
              </span>
            ) : (
              `🔄 → ${cfg.target}`
            )}
          </button>
          <button
            type="button"
            onClick={t.toggleMic}
            disabled={t.isProcessing}
            className={`btn-mic ${t.isRecording ? "btn-mic-recording" : ""}`}
            aria-label={t.isRecording ? "Остановить запись" : "Начать запись"}
          >
            {t.isProcessing ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : t.isRecording ? (
              "⏹"
            ) : (
              "🎤"
            )}
            {t.isRecording && <span className="mic-pulse" />}
          </button>
        </div>

        {t.isRecording ? (
          <p className="hint hint-rec">🔴 Запись идёт — нажмите ⏹ чтобы остановить</p>
        ) : (
          <p className="hint">Ctrl + Enter — быстрый перевод</p>
        )}

        {/* Output */}
        <section className="io-block">
          <div className="io-header">
            <span className="io-header-accent">
              {cfg.flagTo} <span className="io-lang">{cfg.target}</span>
            </span>
            {t.translatedText && (
              <button type="button" onClick={t.copyResult} className="io-copy">
                📋 Копировать
              </button>
            )}
          </div>
          <div className={`io-output ${t.translatedText ? "" : "io-output-empty"}`}>
            {t.translatedText || "Translation will appear here…"}
          </div>
        </section>

        {/* Footer */}
        <footer className="app-footer">
          Dashka · v1.3 · Solar Team 🚀
        </footer>
      </div>
    </div>
  );
}
