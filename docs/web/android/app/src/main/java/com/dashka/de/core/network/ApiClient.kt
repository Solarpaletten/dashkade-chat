// core/network/ApiClient.kt
// DE-only — targetLanguage жёстко зафиксирован
// DashkaDE v0.1.1-android-skeleton-clean

package com.dashka.de.core.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.DataOutputStream
import java.net.HttpURLConnection
import java.net.URL

object ApiClient {

    private const val BASE_URL = "https://dashka-translate.onrender.com"
    private const val TARGET_LANGUAGE = "DE"

    // ── Wake Up (Render free tier) ──────────────────────────────

    suspend fun wakeUp(): Boolean = withContext(Dispatchers.IO) {
        try {
            val conn = URL("$BASE_URL/health").openConnection() as HttpURLConnection
            conn.connectTimeout = 15_000
            conn.readTimeout = 15_000
            val code = conn.responseCode
            conn.disconnect()
            code == 200
        } catch (e: Exception) {
            false
        }
    }

    // ── Text Translate → DE ─────────────────────────────────────

    suspend fun translate(text: String): String = withContext(Dispatchers.IO) {
        val url = URL("$BASE_URL/translate")
        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 30_000
            conn.readTimeout = 30_000

            val body = JSONObject().apply {
                put("text", text)
                put("target_language", TARGET_LANGUAGE)
            }.toString()

            conn.outputStream.use { it.write(body.toByteArray()) }

            if (conn.responseCode != 200) {
                throw Exception("HTTP ${conn.responseCode}")
            }

            val response = conn.inputStream.bufferedReader().readText()
            val json = JSONObject(response)

            if (json.getString("status") != "success") {
                throw Exception("Translation failed")
            }

            json.getString("translated_text")
        } finally {
            conn.disconnect()
        }
    }

    // ── Voice Translate → DE ────────────────────────────────────

    suspend fun voiceTranslate(audioBytes: ByteArray): VoiceResult = withContext(Dispatchers.IO) {
        val boundary = "----DashkaBoundary${System.currentTimeMillis()}"
        val url = URL("$BASE_URL/voice-translate")
        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
            conn.doOutput = true
            conn.connectTimeout = 30_000
            conn.readTimeout = 30_000

            DataOutputStream(conn.outputStream).use { out ->
                // audio
                out.writeBytes("--$boundary\r\n")
                out.writeBytes("Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n")
                out.writeBytes("Content-Type: audio/wav\r\n\r\n")
                out.write(audioBytes)
                out.writeBytes("\r\n")
                // target_language
                out.writeBytes("--$boundary\r\n")
                out.writeBytes("Content-Disposition: form-data; name=\"target_language\"\r\n\r\n")
                out.writeBytes("$TARGET_LANGUAGE\r\n")
                out.writeBytes("--$boundary--\r\n")
            }

            if (conn.responseCode != 200) throw Exception("HTTP ${conn.responseCode}")

            val response = conn.inputStream.bufferedReader().readText()
            val json = JSONObject(response)
            VoiceResult(
                originalText = json.optString("original_text", ""),
                translatedText = json.optString("translated_text", "")
            )
        } finally {
            conn.disconnect()
        }
    }

    data class VoiceResult(val originalText: String, val translatedText: String)
}
