// feature/german/GermanViewModel.kt
// Dashka DE · Android · v0.1.1

package com.solar.dashkade.feature.german

import android.app.Application
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.solar.dashkade.core.network.ApiClient
import com.solar.dashkade.core.network.TranslateRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

// State — синхронизировано с Web и iOS
data class GermanUiState(
    val inputText: String = "",
    val translatedText: String = "",
    val isTranslating: Boolean = false,
    val isRecording: Boolean = false,
    val backendAwake: Boolean = false,
    val error: String? = null
)

class GermanViewModel(application: Application) : AndroidViewModel(application) {

    private val _state = MutableStateFlow(GermanUiState())
    val state: StateFlow<GermanUiState> = _state.asStateFlow()

    private val api = ApiClient.api
    private var speechRecognizer: SpeechRecognizer? = null

    init {
        wakeUp()
    }

    // ── Wake Up ──────────────────────────────────────────────────────────────

    fun wakeUp() {
        viewModelScope.launch {
            _state.update { it.copy(error = null) }
            try {
                val res = api.health()
                _state.update { it.copy(backendAwake = res.isSuccessful) }
            } catch (e: Exception) {
                _state.update { it.copy(backendAwake = false, error = "Backend недоступен. Нажмите ☀️") }
            }
        }
    }

    // ── Translate ────────────────────────────────────────────────────────────

    fun translate() {
        val text = _state.value.inputText.trim()
        if (text.isEmpty()) return

        viewModelScope.launch {
            _state.update { it.copy(isTranslating = true, error = null) }
            try {
                val res = api.translate(TranslateRequest(text = text))
                if (res.isSuccessful && res.body() != null) {
                    _state.update {
                        it.copy(
                            translatedText = res.body()!!.translated_text,
                            backendAwake = true
                        )
                    }
                } else {
                    _state.update { it.copy(error = "Ошибка: HTTP ${res.code()}") }
                }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.message ?: "Ошибка перевода") }
            } finally {
                _state.update { it.copy(isTranslating = false) }
            }
        }
    }

    // ── Voice ────────────────────────────────────────────────────────────────

    fun toggleRecording() {
        if (_state.value.isRecording) {
            speechRecognizer?.stopListening()
            _state.update { it.copy(isRecording = false) }
        } else {
            startSpeechRecognition()
        }
    }

    private fun startSpeechRecognition() {
        val ctx = getApplication<Application>()

        if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
            _state.update { it.copy(error = "Распознавание речи недоступно") }
            return
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(ctx)
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val transcript = matches?.firstOrNull() ?: return
                _state.update { it.copy(inputText = transcript, isRecording = false) }
                translate()
            }
            override fun onError(error: Int) {
                _state.update { it.copy(isRecording = false, error = "Ошибка микрофона: $error") }
            }
            override fun onReadyForSpeech(p: Bundle?) { }
            override fun onBeginningOfSpeech() { }
            override fun onRmsChanged(v: Float) { }
            override fun onBufferReceived(b: ByteArray?) { }
            override fun onEndOfSpeech() { }
            override fun onPartialResults(r: Bundle?) { }
            override fun onEvent(t: Int, p: Bundle?) { }
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ru-RU")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        speechRecognizer?.startListening(intent)
        _state.update { it.copy(isRecording = true) }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    fun setInputText(text: String) = _state.update { it.copy(inputText = text) }

    fun clear() = _state.update { it.copy(inputText = "", translatedText = "", error = null) }

    override fun onCleared() {
        super.onCleared()
        speechRecognizer?.destroy()
    }
}
