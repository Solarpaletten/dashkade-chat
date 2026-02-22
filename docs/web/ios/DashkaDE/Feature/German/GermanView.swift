// Feature/German/GermanView.swift
// Dashka DE · iOS · v0.1.1
// SwiftUI · DE-only · No WebSocket

import SwiftUI

struct GermanView: View {

    @StateObject private var vm = GermanViewModel()
    @FocusState private var inputFocused: Bool

    var body: some View {
        ZStack {
            Color(hex: "#030712").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {

                    // ── Header ──
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("🇩🇪 Dashka")
                                .font(.title2.bold())
                                .foregroundColor(.white)
                            Text("German Translator · DE-only")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Circle()
                            .fill(vm.backendAwake ? Color.green : Color.red)
                            .frame(width: 10, height: 10)
                        Text(vm.backendAwake ? "Online" : "Offline")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 8)

                    // ── Wake Up Banner ──
                    if !vm.backendAwake {
                        Button {
                            Task { await vm.wakeUp() }
                        } label: {
                            Text("☀️ Разбудить backend (Render)")
                                .font(.subheadline.bold())
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(Color.yellow)
                                .cornerRadius(16)
                        }
                    }

                    // ── Error Banner ──
                    if let err = vm.error {
                        HStack {
                            Text(err)
                                .font(.caption)
                                .foregroundColor(Color(hex: "#FCA5A5"))
                            Spacer()
                            Button("Retry") {
                                Task { await vm.wakeUp() }
                            }
                            .font(.caption.bold())
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(hex: "#7F1D1D"))
                            .cornerRadius(8)
                        }
                        .padding(12)
                        .background(Color(hex: "#1F0D0D"))
                        .cornerRadius(14)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color(hex: "#7F1D1D").opacity(0.5), lineWidth: 1)
                        )
                    }

                    // ── Input Block ──
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("ВВОД (любой язык)")
                                .font(.caption.bold())
                                .foregroundColor(.gray)
                                .tracking(0.8)
                            Spacer()
                            Button("очистить ✕") { vm.clear() }
                                .font(.caption)
                                .foregroundColor(Color(hex: "#4B5563"))
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                        .padding(.bottom, 4)

                        TextEditor(text: $vm.inputText)
                            .focused($inputFocused)
                            .foregroundColor(.white)
                            .scrollContentBackground(.hidden)
                            .background(Color.clear)
                            .font(.body)
                            .frame(minHeight: 120)
                            .padding(.horizontal, 12)

                        HStack {
                            Spacer()
                            Text("\(vm.inputText.count) / 5000")
                                .font(.caption2)
                                .foregroundColor(Color(hex: "#374151"))
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 12)
                    }
                    .background(Color(hex: "#111827"))
                    .cornerRadius(18)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(Color(hex: "#1F2937"), lineWidth: 1)
                    )

                    // ── Actions ──
                    HStack(spacing: 12) {
                        Button {
                            inputFocused = false
                            Task { await vm.translate() }
                        } label: {
                            Group {
                                if vm.isTranslating {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                        .scaleEffect(0.8)
                                } else {
                                    Text("🔄 → Deutsch")
                                        .font(.subheadline.bold())
                                }
                            }
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(
                                vm.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || vm.isTranslating
                                    ? Color.yellow.opacity(0.4)
                                    : Color.yellow
                            )
                            .cornerRadius(16)
                        }
                        .disabled(vm.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || vm.isTranslating)

                        Button {
                            vm.toggleRecording()
                        } label: {
                            Text(vm.isRecording ? "⏹" : "🎤")
                                .font(.title3)
                                .frame(width: 50, height: 50)
                                .background(
                                    vm.isRecording
                                        ? Color.red
                                        : Color(hex: "#1F2937")
                                )
                                .cornerRadius(16)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color(hex: "#374151"), lineWidth: 1)
                                )
                        }
                        .opacity(vm.isRecording ? 1.0 : 1.0)
                        .animation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true),
                                   value: vm.isRecording)
                    }

                    // ── Result Block ──
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("🇩🇪 DEUTSCH")
                                .font(.caption.bold())
                                .foregroundColor(Color.yellow)
                                .tracking(0.8)
                            Spacer()
                            if !vm.translatedText.isEmpty {
                                Button {
                                    vm.copyResult()
                                } label: {
                                    Text("📋 Копировать")
                                        .font(.caption)
                                        .foregroundColor(Color(hex: "#D1D5DB"))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(Color(hex: "#1F2937"))
                                        .cornerRadius(8)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(Color(hex: "#374151"), lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                        .padding(.bottom, 4)

                        Text(vm.translatedText.isEmpty ? "Перевод появится здесь..." : vm.translatedText)
                            .font(.body)
                            .foregroundColor(vm.translatedText.isEmpty ? Color(hex: "#4B5563") : .white)
                            .italic(vm.translatedText.isEmpty)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 16)
                            .padding(.bottom, 16)
                            .frame(minHeight: 120, alignment: .topLeading)
                    }
                    .background(Color(hex: "#111827"))
                    .cornerRadius(18)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(Color(hex: "#1F2937"), lineWidth: 1)
                    )

                    // ── Footer ──
                    Text("Dashka DE · v0.1.1 · Solar Team 🚀")
                        .font(.caption2)
                        .foregroundColor(Color(hex: "#374151"))
                        .padding(.bottom, 8)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
        }
        .navigationBarHidden(true)
    }
}

// MARK: - Color Helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int         & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Preview

#Preview {
    GermanView()
}
