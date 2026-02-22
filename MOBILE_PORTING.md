# MOBILE PORTING GUIDE — v1.2

## State additions

direction:        "RU_DE" | "DE_RU"
micState:         "Idle" | "Recording" | "Processing"
conversationMode: Boolean

---

## Direction Toggle

### Swift
enum Direction { case ruDe, deRu }
var direction: Direction = .ruDe

var targetLanguage: String {
    direction == .ruDe ? "DE" : "RU"
}
var sourceLang: String {
    direction == .ruDe ? "ru-RU" : "de-DE"
}

func toggleDirection() {
    direction = direction == .ruDe ? .deRu : .ruDe
    inputText = ""; translatedText = ""
}

### Kotlin
enum class Direction { RU_DE, DE_RU }
var direction = Direction.RU_DE

val targetLanguage get() = if (direction == Direction.RU_DE) "DE" else "RU"
val sourceLang     get() = if (direction == Direction.RU_DE) "ru-RU" else "de-DE"

fun toggleDirection() {
    direction = if (direction == Direction.RU_DE) Direction.DE_RU else Direction.RU_DE
    _state.update { it.copy(inputText = "", translatedText = "") }
}

---

## MicState Machine

### Swift
enum MicState { case idle, recording, processing }
@Published var micState: MicState = .idle

func toggleMic() {
    switch micState {
    case .idle:
        startRecording()
        micState = .recording
    case .recording:
        stopRecording()
        micState = .processing
        Task { await sendVoice() }
    case .processing:
        break
    }
}

### Kotlin
enum class MicState { IDLE, RECORDING, PROCESSING }

fun toggleMic() = when (_state.value.micState) {
    MicState.IDLE -> {
        startAudioRecord()
        _state.update { it.copy(micState = MicState.RECORDING) }
    }
    MicState.RECORDING -> {
        stopAudioRecord()
        _state.update { it.copy(micState = MicState.PROCESSING) }
        viewModelScope.launch { sendVoice() }
    }
    MicState.PROCESSING -> Unit
}

---

## Partial / Debounced Translation

### Swift
private var debounceTask: Task<Void, Never>?

func onPartialTranscript(_ text: String) {
    inputText = text
    debounceTask?.cancel()
    debounceTask = Task {
        try? await Task.sleep(nanoseconds: 1_500_000_000)
        if !Task.isCancelled { await translatePartial(text) }
    }
}

### Kotlin
private var debounceJob: Job? = null

fun onPartialTranscript(text: String) {
    _state.update { it.copy(inputText = text) }
    debounceJob?.cancel()
    debounceJob = viewModelScope.launch {
        delay(1500)
        translatePartial(text)
    }
}

---

## No Auto-Stop

### iOS
recognitionRequest.shouldReportPartialResults = true

### Android
intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 999_999L)
intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 999_999L)
recognizer.stopListening()

---

## Conversation Mode

Split layout: source zone top / translation zone bottom
Font 1.6x–2x of normal
Only mic + direction controls visible
Auto-scroll to bottom on text change
Back button exits to normal mode
```

---

**9. COMMIT_MESSAGE.txt**
```
feat: v1.2 Conversation Mode Upgrade

Direction Toggle (RU⇄DE)
  - state.direction = 'RU_DE' | 'DE_RU'
  - target_language driven by direction, backend unchanged
  - DirectionToggle.tsx component with animated arrow

MicState Machine (Idle → Recording → Processing)
  - No auto-stop, no silence detection, no timeout
  - Stop ONLY on manual press
  - continuous=true on SpeechRecognition

Real-Time Partial Translation
  - interimResults=true on SpeechRecognition
  - debounced 1500ms → /translate on every partial
  - translated_text updates while speaking

Conversation Mode
  - Full-screen split: source top / translation bottom
  - Font clamp(1.4rem, 3.5vw, 2rem)
  - Auto-scroll on text update
  - Minimal UI: mic + direction + close only

UX
  - Pulsing red mic with ping animation during recording
  - Direction displayed large in toggle
  - apiClient.translate() now accepts targetLang param
  - No breaking change to API contract
  - No console.log

Mobile-ready
  - MOBILE_PORTING.md: Swift + Kotlin mapping for all v1.2 features