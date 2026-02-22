// feature/german/GermanViewModel.kt
// State синхронизирован с Web и iOS
// DashkaDE v0.1.1

package com.dashka.de.feature.german

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dashka.de.core.network.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

data class TranslatorState(
    val inputText: String = "",
    val translatedText: String = "",
    val isTranslating: Boolean = false,
    val isRecording: Boolean = false,
    val backendAwake: Boolean = false,
    val error: String? = null
)

class GermanViewModel : ViewModel() {

    private val _state = MutableStateFlow(TranslatorState())
    val state: StateFlow<TranslatorState> = _state.asStateFlow()

    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private val audioBuffer = ByteArrayOutputStream()

    init {
        autoWakeUp()
    }

    // ── Wake Up ─────────────────────────────────────────────────

    private fun autoWakeUp() {
        viewModelScope.launch {
            val ok = ApiClient.wakeUp()
            _state.update { it.copy(backendAwake = ok) }
        }
    }

    fun wakeUp() {
        viewModelScope.launch {
            _state.update { it.copy(error = null) }
            val ok = ApiClient.wakeUp()
            _state.update {
                it.copy(
                    backendAwake = ok,
                    error = if (!ok) "Backend не отвечает. Повторите через 30 сек." else null
                )
            }
        }
    }

    // ── Input ───────────────────────────────────────────────────

    fun setInputText(text: String) {
        _state.update { it.copy(inputText = text, error = null) }
    }

    // ── Translate ───────────────────────────────────────────────

    fun translate() {
        val text = _state.value.inputText.trim()
        if (text.isEmpty()) return

        viewModelScope.launch {
            _state.update { it.copy(isTranslating = true, error = null) }
            try {
                val result = ApiClient.translate(text)
                _state.update { it.copy(translatedText = result, isTranslating = false, backendAwake = true) }
            } catch (e: Exception) {
                _state.update { it.copy(isTranslating = false, error = e.message ?: "Ошибка перевода") }
            }
        }
    }

    // ── Voice ───────────────────────────────────────────────────

    fun toggleRecording() {
        if (_state.value.isRecording) stopRecording() else startRecording()
    }

    private fun startRecording() {
        val sampleRate = 16000
        val bufferSize = AudioRecord.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        audioBuffer.reset()
        audioRecord?.startRecording()
        _state.update { it.copy(isRecording = true, error = null) }

        recordingThread = Thread {
            val buf = ByteArray(bufferSize)
            while (_state.value.isRecording) {
                val read = audioRecord?.read(buf, 0, bufferSize) ?: 0
                if (read > 0) audioBuffer.write(buf, 0, read)
            }
        }.also { it.start() }
    }

    private fun stopRecording() {
        _state.update { it.copy(isRecording = false) }
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        recordingThread?.join(500)

        val audioBytes = audioBuffer.toByteArray()
        if (audioBytes.isEmpty()) return

        viewModelScope.launch {
            _state.update { it.copy(isTranslating = true, error = null) }
            try {
                val result = ApiClient.voiceTranslate(addWavHeader(audioBytes))
                _state.update {
                    it.copy(
                        inputText = result.originalText,
                        translatedText = result.translatedText,
                        isTranslating = false,
                        backendAwake = true
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isTranslating = false, error = "Ошибка голосового перевода") }
            }
        }
    }

    // ── Helpers ─────────────────────────────────────────────────

    fun clear() {
        _state.update { it.copy(inputText = "", translatedText = "", error = null) }
    }

    // WAV header (16kHz, mono, 16bit PCM)
    private fun addWavHeader(pcm: ByteArray): ByteArray {
        val totalDataLen = pcm.size + 36
        val byteRate = 16000 * 1 * 16 / 8
        val header = ByteArray(44)
        header[0] = 'R'.code.toByte(); header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte(); header[3] = 'F'.code.toByte()
        writeInt(header, 4, totalDataLen)
        header[8] = 'W'.code.toByte(); header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte(); header[11] = 'E'.code.toByte()
        header[12] = 'f'.code.toByte(); header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte(); header[15] = ' '.code.toByte()
        writeInt(header, 16, 16)
        writeShort(header, 20, 1)
        writeShort(header, 22, 1)
        writeInt(header, 24, 16000)
        writeInt(header, 28, byteRate)
        writeShort(header, 32, (1 * 16 / 8).toShort())
        writeShort(header, 34, 16)
        header[36] = 'd'.code.toByte(); header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte(); header[39] = 'a'.code.toByte()
        writeInt(header, 40, pcm.size)
        return header + pcm
    }

    private fun writeInt(arr: ByteArray, offset: Int, value: Int) {
        arr[offset] = (value and 0xff).toByte()
        arr[offset + 1] = (value shr 8 and 0xff).toByte()
        arr[offset + 2] = (value shr 16 and 0xff).toByte()
        arr[offset + 3] = (value shr 24 and 0xff).toByte()
    }

    private fun writeShort(arr: ByteArray, offset: Int, value: Short) {
        arr[offset] = (value.toInt() and 0xff).toByte()
        arr[offset + 1] = (value.toInt() shr 8 and 0xff).toByte()
    }
}
