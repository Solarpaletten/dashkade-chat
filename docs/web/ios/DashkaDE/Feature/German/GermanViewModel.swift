// Feature/German/GermanViewModel.swift
// Dashka DE · iOS · v0.1.1

import Foundation
import Combine

@MainActor
final class GermanViewModel: ObservableObject {

    // MARK: - State (synced with Web / Android)
    @Published var inputText: String = ""
    @Published var translatedText: String = ""
    @Published var isTranslating: Bool = false
    @Published var isRecording: Bool = false
    @Published var backendAwake: Bool = false
    @Published var error: String? = nil

    private let api = APIClient.shared
    private var speechRecorder: SpeechRecorder?

    init() {
        Task { await wakeUp() }
    }

    // MARK: - Wake Up

    func wakeUp() async {
        error = nil
        do {
            _ = try await api.wakeUp()
            backendAwake = true
        } catch {
            backendAwake = false
            self.error = "Backend недоступен. Нажмите ☀️"
        }
    }

    // MARK: - Translate

    func translate() async {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isTranslating = true
        error = nil
        defer { isTranslating = false }
        do {
            let res = try await api.translate(text: inputText)
            translatedText = res.translated_text
            backendAwake = true
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Voice (SFSpeechRecognizer — ru-RU → translate to DE)

    func toggleRecording() {
        if isRecording {
            speechRecorder?.stop()
            isRecording = false
        } else {
            speechRecorder = SpeechRecorder { [weak self] transcript in
                guard let self else { return }
                Task { @MainActor in
                    self.inputText = transcript
                    await self.translate()
                }
            }
            speechRecorder?.start()
            isRecording = true
        }
    }

    // MARK: - Helpers

    func clear() {
        inputText = ""
        translatedText = ""
        error = nil
    }

    func copyResult() {
        UIPasteboard.general.string = translatedText
    }
}
