// Feature/German/SpeechRecorder.swift
// Dashka DE · iOS · v0.1.1
// On-device speech recognition (ru-RU)

import Foundation
import Speech
import AVFoundation

final class SpeechRecorder {

    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine = AVAudioEngine()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "ru-RU"))
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private let onResult: (String) -> Void

    init(onResult: @escaping (String) -> Void) {
        self.onResult = onResult
    }

    func start() {
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            guard status == .authorized, let self else { return }
            DispatchQueue.main.async { self.startListening() }
        }
    }

    private func startListening() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            request = SFSpeechAudioBufferRecognitionRequest()
            guard let request else { return }
            request.shouldReportPartialResults = false

            let node = audioEngine.inputNode
            let fmt = node.outputFormat(forBus: 0)
            node.installTap(onBus: 0, bufferSize: 1024, format: fmt) { buf, _ in
                request.append(buf)
            }

            audioEngine.prepare()
            try audioEngine.start()

            recognitionTask = recognizer?.recognitionTask(with: request) { [weak self] result, error in
                guard let self else { return }
                if let result = result, result.isFinal {
                    let text = result.bestTranscription.formattedString
                    self.onResult(text)
                    self.stop()
                }
                if error != nil { self.stop() }
            }
        } catch {
            print("SpeechRecorder error: \(error)")
        }
    }

    func stop() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        request = nil
    }
}
