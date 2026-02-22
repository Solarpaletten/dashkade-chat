// backend/src/services/unifiedTranslationService.js
// v1.0.1 — P2 FIX: guard на OPENAI_API_KEY
//          P3 HYGIENE: console.log → logger, нет текстов пользователя в логах
'use strict';

const OpenAI = require('openai');
const { transcribeAudio } = require('./whisperService');
const { speakText } = require('./textToSpeechService');
const logger = require('../utils/logger');

class UnifiedTranslationService {
  constructor() {
    // ✅ P2 FIX: проверка ключа при инициализации
    if (!process.env.OPENAI_API_KEY) {
      logger.error('[UnifiedTranslationService] OPENAI_API_KEY не установлен. Сервис недоступен.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    this.supportedLanguages = {
      'EN': { name: 'English',    flag: '🇺🇸', code: 'en' },
      'RU': { name: 'Русский',    flag: '🇷🇺', code: 'ru' },
      'DE': { name: 'Deutsch',    flag: '🇩🇪', code: 'de' },
      'FR': { name: 'Français',   flag: '🇫🇷', code: 'fr' },
      'ES': { name: 'Español',    flag: '🇪🇸', code: 'es' },
      'CS': { name: 'Čeština',    flag: '🇨🇿', code: 'cs' },
      'PL': { name: 'Polski',     flag: '🇵🇱', code: 'pl' },
      'LT': { name: 'Lietuvių',   flag: '🇱🇹', code: 'lt' },
      'LV': { name: 'Latviešu',   flag: '🇱🇻', code: 'lv' },
      'NO': { name: 'Norsk',      flag: '🇳🇴', code: 'no' }
    };

    logger.info(`[UnifiedTranslationService] Инициализирован. OpenAI: ${this.openai ? 'OK' : 'DISABLED'}`);
  }

  // ✅ Внутренний guard — бросает 503-совместимую ошибку
  _requireOpenAI() {
    if (!this.openai) {
      const err = new Error('OPENAI_API_KEY not configured');
      err.statusCode = 503;
      throw err;
    }
  }

  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, cfg]) => ({
      code,
      name: cfg.name,
      flag: cfg.flag,
      nativeName: cfg.name
    }));
  }

  async translateText(text, fromLanguage, toLanguage) {
    // ✅ P2: guard
    this._requireOpenAI();

    const startTime = Date.now();

    if (!this.supportedLanguages[fromLanguage] || !this.supportedLanguages[toLanguage]) {
      throw new Error(`Unsupported language pair: ${fromLanguage} → ${toLanguage}`);
    }

    if (fromLanguage === toLanguage) {
      return {
        originalText: text,
        translatedText: text,
        fromLanguage,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: 1.0,
        provider: 'same-language'
      };
    }

    const fromLang = this.supportedLanguages[fromLanguage].name;
    const toLang   = this.supportedLanguages[toLanguage].name;

    // ✅ P3: нет текста пользователя в логах
    logger.info(`[translate] ${fromLanguage} → ${toLanguage} | chars: ${text.length}`);

    try {
      const systemPrompt =
        `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}.\n` +
        `RULES:\n- Provide ONLY the translation, no explanations\n` +
        `- Maintain the original tone and style\n- Keep formatting if any`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: Math.min(4000, text.length * 3),
        temperature: 0.3
      });

      const translatedText = response.choices[0]?.message?.content?.trim();

      if (!translatedText) throw new Error('Translation returned empty result');

      logger.info(`[translate] OK | ${fromLanguage}→${toLanguage} | ${Date.now() - startTime}ms`);

      return {
        originalText: text,
        translatedText,
        fromLanguage,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: 0.95,
        provider: 'openai-gpt4o-mini',
        usage: response.usage
      };

    } catch (error) {
      // ✅ P3: только message, не текст пользователя
      logger.error(`[translate] ERROR: ${error.message}`);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async translateVoice(audioFilePath, fromLanguage, toLanguage) {
    // ✅ P2: guard
    this._requireOpenAI();

    const startTime = Date.now();

    // ✅ P3: нет пути файла или текста в логах
    logger.info(`[voice] START ${fromLanguage} → ${toLanguage}`);

    try {
      const transcript = await transcribeAudio(
        audioFilePath,
        this.supportedLanguages[fromLanguage]?.code || 'ru'
      );
      logger.info(`[voice] Transcribed | chars: ${transcript.length}`);

      const translation = await this.translateText(transcript, fromLanguage, toLanguage);
      logger.info(`[voice] Translated | ${Date.now() - startTime}ms`);

      const audioPath = await speakText(
        translation.translatedText,
        this.supportedLanguages[toLanguage]?.code || 'de'
      );
      logger.info(`[voice] TTS done`);

      return {
        originalText: transcript,
        translatedText: translation.translatedText,
        originalAudio: audioFilePath,
        translatedAudio: audioPath,
        fromLanguage,
        toLanguage,
        processingTime: Date.now() - startTime,
        confidence: translation.confidence,
        provider: 'solar-voice-pipeline'
      };

    } catch (error) {
      logger.error(`[voice] ERROR: ${error.message}`);
      throw new Error(`Voice translation failed: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    this._requireOpenAI();

    logger.info(`[detect] chars: ${text.length}`);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `You are a language detection expert. ` +
              `Analyze the text and respond with ONLY the ISO language code from this list: ` +
              `EN, RU, DE, FR, ES, CS, PL, LT, LV, NO.\n` +
              `Examples:\n"Hello world" → EN\n"Привет мир" → RU\n"Guten Tag" → DE\n` +
              `Respond with ONLY the 2-letter code, nothing else.`
          },
          { role: 'user', content: text.substring(0, 500) }
        ],
        max_tokens: 5,
        temperature: 0.0
      });

      const detectedCode = response.choices[0]?.message?.content?.trim().toUpperCase();

      if (this.supportedLanguages[detectedCode]) {
        return { language: detectedCode, confidence: 0.95, provider: 'openai-detection' };
      }

      for (const code of Object.keys(this.supportedLanguages)) {
        if (detectedCode && detectedCode.includes(code)) {
          return { language: code, confidence: 0.8, provider: 'openai-detection-fuzzy' };
        }
      }

      return { language: 'EN', confidence: 0.5, provider: 'fallback' };

    } catch (error) {
      logger.error(`[detect] ERROR: ${error.message}`);
      return { language: 'EN', confidence: 0.3, provider: 'error-fallback' };
    }
  }

  getStats() {
    return {
      supportedLanguages: Object.keys(this.supportedLanguages).length,
      features: ['text-translation', 'voice-translation', 'language-detection'],
      provider: 'SOLAR v2.0 + OpenAI',
      openaiEnabled: !!this.openai,
      status: this.openai ? 'ready' : 'disabled'
    };
  }
}

module.exports = { UnifiedTranslationService };
