import React from 'react'
import { useGermanTranslator } from './useGermanTranslator'

const GermanScreen: React.FC = () => {
  const {
    inputText,
    translatedText,
    isTranslating,
    isRecording,
    backendAwake,
    error,
    wakeUp,
    translate,
    toggleRecording,
    clear,
    setInputText,
    copyResult
  } = useGermanTranslator()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      translate()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-xl flex flex-col gap-4">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              🇩🇪 Dashka
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">German Translator · DE-only</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${backendAwake ? 'bg-green-400' : 'bg-red-500'}`} />
            <span className="text-gray-400 text-xs">
              {backendAwake ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        {/* ── Wake Up Banner ── */}
        {!backendAwake && (
          <button
            onClick={wakeUp}
            className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95
                       text-black font-semibold text-sm transition-all duration-150 shadow-lg"
          >
            ☀️ Разбудить backend (Render free tier)
          </button>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="w-full rounded-2xl bg-red-900/40 border border-red-700/50 px-4 py-3
                          text-red-300 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={wakeUp}
              className="shrink-0 text-xs bg-red-700 hover:bg-red-600 text-white
                         px-3 py-1.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Input Block ── */}
        <div className="w-full rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Ввод (любой язык)
            </span>
            <button
              onClick={clear}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              очистить ✕
            </button>
          </div>
          <textarea
            className="w-full bg-transparent text-white text-base px-4 pb-4 pt-1
                       resize-none focus:outline-none placeholder-gray-600
                       min-h-[120px]"
            placeholder="Введите текст для перевода на немецкий..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
          />
          <div className="px-4 pb-3 flex justify-end">
            <span className="text-gray-700 text-xs">{inputText.length} / 5000</span>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3">
          {/* Translate */}
          <button
            onClick={translate}
            disabled={isTranslating || !inputText.trim()}
            className="flex-1 h-12 rounded-2xl bg-yellow-400 hover:bg-yellow-300
                       disabled:opacity-40 disabled:cursor-not-allowed
                       text-black font-bold text-sm
                       active:scale-95 transition-all duration-150 shadow-md"
          >
            {isTranslating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Переводим...
              </span>
            ) : '🔄 → Deutsch'}
          </button>

          {/* Voice */}
          <button
            onClick={toggleRecording}
            className={`h-12 w-12 rounded-2xl font-bold text-lg
                        active:scale-95 transition-all duration-150 shadow-md
                        ${isRecording
                          ? 'bg-red-600 hover:bg-red-500 animate-pulse text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                        }`}
            title={isRecording ? 'Остановить' : 'Голосовой ввод'}
          >
            {isRecording ? '⏹' : '🎤'}
          </button>
        </div>

        {/* ── Ctrl+Enter hint ── */}
        <p className="text-center text-gray-700 text-xs">
          Ctrl + Enter — быстрый перевод
        </p>

        {/* ── Result Block ── */}
        <div className="w-full rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-yellow-400 text-xs font-medium uppercase tracking-wider">
              🇩🇪 Deutsch
            </span>
            {translatedText && (
              <button
                onClick={copyResult}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300
                           px-3 py-1 rounded-lg transition-colors border border-gray-700"
              >
                📋 Копировать
              </button>
            )}
          </div>
          <div
            className={`px-4 pb-4 pt-1 min-h-[120px] text-base whitespace-pre-wrap
                        ${translatedText ? 'text-white' : 'text-gray-600 italic'}`}
          >
            {translatedText || 'Перевод появится здесь...'}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-gray-700 text-xs pb-2">
          Dashka DE · v0.9.5 · Solar Team 🚀
        </footer>

      </div>
    </div>
  )
}

export default GermanScreen
