// feature/german/GermanScreen.tsx
// DE-only | v0.9.5-web-wrapper-ready
import React, { useRef } from 'react'
import { useGermanTranslator } from './useGermanTranslator'

const GermanScreen: React.FC = () => {
  const {
    inputText,
    translatedText,
    isTranslating,
    isRecording,
    backendAwake,
    error,
    setInputText,
    wakeUp,
    translate,
    toggleRecording,
    clear,
    copyResult
  } = useGermanTranslator()

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      translate()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-4 pt-6 pb-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            🇩🇪 Dashka
          </h1>
          <p className="text-white/40 text-xs mt-0.5">German Translator • DE-only</p>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
          <div className={`w-2 h-2 rounded-full ${backendAwake ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-white/70 text-xs">
            {backendAwake ? 'Online' : 'Sleeping...'}
          </span>
        </div>
      </header>

      {/* ── WAKE UP BANNER (только если спит) ── */}
      {!backendAwake && (
        <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-yellow-300 text-sm font-medium">Backend на Render засыпает</p>
            <p className="text-yellow-300/60 text-xs">Первый запрос может занять ~30 сек</p>
          </div>
          <button
            onClick={wakeUp}
            className="bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95 whitespace-nowrap"
          >
            ⏰ Wake Up
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col px-4 pb-6 gap-4 max-w-xl w-full mx-auto">

        {/* INPUT CARD */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Ваш текст</span>
            <button
              onClick={clear}
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              Очистить ✕
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите текст для перевода на немецкий..."
            rows={4}
            className="w-full bg-transparent text-white placeholder-white/20 px-4 pb-4 resize-none outline-none text-base leading-relaxed"
          />

          <div className="flex items-center gap-2 px-4 pb-3">
            <span className="text-white/20 text-xs">
              {inputText.length > 0 ? `${inputText.length} симв.` : 'Ctrl+Enter — перевести'}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          {/* TRANSLATE */}
          <button
            onClick={translate}
            disabled={isTranslating || !inputText.trim()}
            className={`flex-1 h-12 rounded-xl font-semibold text-base transition-all translate-btn
              ${isTranslating
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : inputText.trim()
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
          >
            {isTranslating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Перевод...
              </span>
            ) : (
              '🔄 → Deutsch'
            )}
          </button>

          {/* VOICE */}
          <button
            onClick={toggleRecording}
            disabled={isTranslating}
            className={`h-12 w-14 rounded-xl font-semibold text-xl transition-all active:scale-95
              ${isRecording
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/40'
                : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            title={isRecording ? 'Остановить запись' : 'Записать голос'}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* RESULT CARD */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex-1">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
              🇩🇪 Немецкий
            </span>
            {translatedText && (
              <button
                onClick={copyResult}
                className="text-white/40 hover:text-white/70 text-xs transition-colors flex items-center gap-1"
              >
                📋 Копировать
              </button>
            )}
          </div>

          <div className="px-4 pb-5 min-h-[100px]">
            {translatedText ? (
              <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                {translatedText}
              </p>
            ) : (
              <p className="text-white/15 text-base italic">
                Перевод появится здесь...
              </p>
            )}
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="text-center pb-4 px-4">
        <p className="text-white/15 text-xs">
          Dashka DE • v0.9.5 • target: <span className="text-white/30 font-mono">DE</span>
        </p>
      </footer>

    </div>
  )
}

export default GermanScreen
