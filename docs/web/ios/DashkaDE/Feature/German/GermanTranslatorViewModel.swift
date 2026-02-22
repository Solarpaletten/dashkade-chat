// Feature/German/GermanTranslatorViewModel.swift
// State синхронизирован с Web и Android
// DashkaDE v0.1.1

import Foundation
import AVFoundation
import Combine

@MainActor
final class GermanTranslatorViewModel: ObservableObject {

    // MARK: - State (синхронизировано с Web и Android)
    @Published var inputText: String = ""
    @Published var translatedText: String = ""
    @Published var isTranslating: Bool = false
    @Published var isRecording: Bool = false
    @Published var backendAwake: Bool = false
    @Published var error: String? = nil

    private let api = APIClient.shared
    private var audioRecorder: AVAudioRecorder?
    private var recordingURL: URL?

    // MARK: - Init — auto wake up
    init() {
        Task { await autoWakeUp() }
    }

    // MARK: - Wake Up

    func autoWakeUp() async {
        let ok = await api.wakeUp()
        backendAwake = ok
    }

    func wakeUp() async {
        error = nil
        let ok = await api.wakeUp()
        backendAwake = ok
        if !ok {
            error = "Backend не отвечает. Повторите через 30 сек."
        }
    }

    // MARK: - Translate

    func translate() async {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        isTranslating = true
        error = nil

        do {
            let result = try await api.translate(text: text)
            translatedText = result
            backendAwake = true
        } catch {
            self.error = error.localizedDescription
        }

        isTranslating = false
    }

    // MARK: - Voice Recording

    func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }

    private func startRecording() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.record, mode: .default)
            try session.setActive(true)

            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("dashka_recording_\(UUID().uuidString).wav")
            recordingURL = url

            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatLinearPCM),
                AVSampleRateKey: 16000,
                AVNumberOfChannelsKey: 1,
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsFloatKey: false
            ]

            audioRecorder = try AVAudioRecorder(url: url, settings: settings)
            audioRecorder?.record()
            isRecording = true
            error = nil

        } catch {
            self.error = "Нет доступа к микрофону"
        }
    }

    private func stopRecording() {
        audioRecorder?.stop()
        isRecording = false

        guard let url = recordingURL else { return }

        Task {
            isTranslating = true
            do {
                let audioData = try Data(contentsOf: url)
                let result = try await api.voiceTranslate(audioData: audioData)
                inputText = result.originalText
                translatedText = result.translatedText
                backendAwake = true
            } catch {
                self.error = "Ошибка голосового перевода"
            }
            isTranslating = false
            try? FileManager.default.removeItem(at: url)
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
