D=>C

Claude, выполняем **v1.0.1 STABILIZATION PATCH** для репозитория `Solarpaletten/dashka-chat` (текущий релиз: `v1.0.0-de-production`). Цель: **закрыть P0 bug + привести прод к “чистому” состоянию**, без рефакторинга архитектуры.

---

# ✅ ЦЕЛЬ РЕЛИЗА

**Версия:** `v1.0.1`
**Тег:** `v1.0.1-de-stable`
**Результат:** Web/iOS/Android voice path возвращает корректные поля; GitHub push protection не ругается; CORS безопасен; логи безопасны; health лёгкий.

---

# P0 — FIX: VOICE RESPONSE CONTRACT (КРИТИЧЕСКИ)

## 1) Backend: `/voice-translate` вернуть snake_case

**Файл:** `backend/src/routes/voice.js` (или актуальный путь routes/voice.js)

**Сейчас:** backend отдаёт `originalText/translatedText` (camelCase).
**Нужно:** всегда отдавать **snake_case**, как `/translate`.

✅ **Ожидаемый JSON:**

```json
{
  "status": "success",
  "original_text": "...",
  "translated_text": "...",
  "source_language": "...",
  "target_language": "DE"
}
```

📌 Требование: **не ломать обратную совместимость** — добавь оба варианта полей, если хочешь максимально безопасно:

* `original_text`, `translated_text` (основные)
* `originalText`, `translatedText` (опционально, как alias)

Но минимум для v1.0.1: **snake_case обязателен**.

---

# P1 — SECURITY: CORS не должен быть `*` в проде

## 2) Backend: запретить `origin: '*'` в production

**Файл:** `backend/src/config/cors.js`

Сделай поведение:

* если `NODE_ENV === "production"` и `CORS_ORIGIN` пуст → **не использовать `*`**, а:

  * либо **фейлить старт** с понятной ошибкой
  * либо ставить дефолт `https://dashka-chat.onrender.com`

Выбери безопасный вариант для прод:
✅ предпочтение: **default = [https://dashka-chat.onrender.com](https://dashka-chat.onrender.com)** + лог warning.

---

# P2 — RELIABILITY: guard на OPENAI_API_KEY

## 3) UnifiedTranslationService: понятная ошибка если нет ключа

**Файлы:**

* `backend/src/services/unifiedTranslationService.js` (или соответствующий)
* возможно `backend/src/services/index.js`

Если `OPENAI_API_KEY` отсутствует:

* не создавать OpenAI client без ключа
* возвращать понятную ошибку типа:

  * HTTP 503 / 500 с сообщением `OPENAI_API_KEY not configured`

---

# P3 — HYGIENE: убрать console.log, только logger

## 4) whisperService + unifiedTranslationService — заменить console.log на winston logger

**Файлы:**

* `backend/src/services/whisperService.js`
* `backend/src/services/unifiedTranslationService.js`

Требование:

* никаких transcript/текстов пользователя в info-логах
* максимум: длина текста, request id, время, статус

---

# P4 — OPTIMIZATION: health endpoint лёгкий

## 5) /health: минимальный ответ для Render

**Файл:** `backend/src/routes/health.js`

Ответ сделать компактным:

```json
{ "status": "ok", "timestamp": "ISO", "version": "1.0.1" }
```

Если хочешь расширенный health — сделай отдельный `/health/details` под защитой, но в v1.0.1 минимум — **лёгкий /health**.

---

# P5 — DEPLOYMENT DOCS: Render env + (опционально) Static Site entry

## 6) Документация

Обновить `README.md` и/или `ИНСТРУКЦИЯ.md`:

* Render Backend env:

  * `OPENAI_API_KEY` (secret)
  * `CORS_ORIGIN=https://dashka-chat.onrender.com`
* Web env:

  * `VITE_API_URL=https://api-dashka-chat.onrender.com`

Если в `render.yaml` сейчас только backend — допиши заметку: фронт деплоится как Static Site отдельно (если так и есть).
Опционально: добавить второй сервис в `render.yaml` для `web/` как static.

---

# GIT / RELEASE REQUIREMENTS

## 7) Секреты: исключить любые ключи из репо

Проверить:

* `backend/.env.example` **не должен содержать** реальный ключ.
* только:

  ```
  OPENAI_API_KEY=REPLACE_ME
  ```

или пусто.

## 8) Версия и тег

* обновить версии где требуется (README/version)
* commit message:

  * `fix: v1.0.1 stabilization (voice contract + prod hardening)`
* tag:

  * `v1.0.1-de-stable`

---

# ACCEPTANCE CRITERIA (что я проверяю перед “готово”)

1. `curl https://api-dashka-chat.onrender.com/health` → `status ok` + версия 1.0.1
2. Web: voice translate возвращает **перевод**, не `undefined`
3. iOS/Android: декодят voice response без правок (snake_case присутствует)
4. backend не стартует с `CORS='*'` в production (или дефолт домен)
5. Никаких OpenAI ключей в репозитории → GitHub push protection не срабатывает
6. Логи: нет `console.log`, нет текста пользователя

---

C=>D (формат ответа)

1. список изменённых файлов
2. diff/патчи (или полный код файлов)
3. команды для локальной проверки
4. команда релиза (commit/tag/push)

---

D=>L

Leanid, ТЗ отправлено Клауди по твоему сигналу. Это “v1.0.1 стабилизация” — коротко, жёстко, в прод. Если Claude сделает ровно по списку — у нас будет чистый релиз без сюрпризов.
