// Feature/German/GermanScreen.swift
// SwiftUI — DE-only
// DashkaDE v0.1.1-ios-skeleton-clean

import SwiftUI

struct GermanScreen: View {
    @StateObject private var vm = GermanTranslatorViewModel()
    @FocusState private var inputFocused: Bool

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color(hex: "1a1a2e"), Color(hex: "16213e"), Color(hex: "0f3460")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {

                    // ── HEADER ──
                    headerView

                    // ── WAKE UP ──
                    if !vm.backendAwake {
                        wakeUpBanner
                    }

                    // ── INPUT ──
                    inputCard

                    // ── BUTTONS ──
                    actionButtons

                    // ── ERROR ──
                    if let error = vm.error {
                        errorView(error)
                    }

                    // ── RESULT ──
                    resultCard

                    // ── FOOTER ──
                    footerView

                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Header

    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("🇩🇪 Dashka")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                Text("German Translator • DE-only")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.4))
            }
            Spacer()
            // Status pill
            HStack(spacing: 6) {
                Circle()
                    .fill(vm.backendAwake ? Color.green : Color.yellow)
                    .frame(width: 8, height: 8)
                    .opacity(vm.backendAwake ? 1 : 0.8)
                Text(vm.backendAwake ? "Online" : "Sleeping...")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.1))
            .clipShape(Capsule())
        }
        .padding(.top, 8)
    }

    // MARK: - Wake Up Banner

    private var wakeUpBanner: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Backend на Render засыпает")
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(Color.yellow.opacity(0.9))
                Text("Первый запрос ~30 сек")
                    .font(.caption)
                    .foregroundColor(Color.yellow.opacity(0.5))
            }
            Spacer()
            Button {
                Task { await vm.wakeUp() }
            } label: {
                Text("⏰ Wake Up")
                    .font(.subheadline.bold())
                    .foregroundColor(.black)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.yellow)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(12)
        .background(Color.yellow.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(Color.yellow.opacity(0.3), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Input Card

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("ВАШ ТЕКСТ")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white.opacity(0.4))
                    .tracking(1)
                Spacer()
                Button("Очистить ✕") { vm.clear() }
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.3))
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)

            TextEditor(text: $vm.inputText)
                .focused($inputFocused)
                .scrollContentBackground(.hidden)
                .background(Color.clear)
                .foregroundColor(.white)
                .font(.body)
                .frame(minHeight: 100)
                .padding(.horizontal, 12)

            Text(vm.inputText.isEmpty ? "Ctrl+Return — перевести" : "\(vm.inputText.count) симв.")
                .font(.caption)
                .foregroundColor(.white.opacity(0.2))
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
        }
        .background(Color.white.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        HStack(spacing: 12) {
            // TRANSLATE
            Button {
                inputFocused = false
                Task { await vm.translate() }
            } label: {
                HStack(spacing: 8) {
                    if vm.isTranslating {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white.opacity(0.5)))
                            .scaleEffect(0.8)
                        Text("Перевод...")
                    } else {
                        Text("🔄 → Deutsch")
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .foregroundColor(vm.isTranslating || vm.inputText.isEmpty ? .white.opacity(0.3) : .white)
                .background(
                    vm.isTranslating || vm.inputText.isEmpty
                    ? Color.white.opacity(0.08)
                    : LinearGradient(colors: [Color(hex: "3b82f6"), Color(hex: "6366f1")],
                                     startPoint: .leading, endPoint: .trailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(vm.isTranslating || vm.inputText.isEmpty)

            // VOICE
            Button {
                inputFocused = false
                vm.toggleRecording()
            } label: {
                Text(vm.isRecording ? "⏹️" : "🎤")
                    .font(.title3)
                    .frame(width: 50, height: 50)
                    .background(
                        vm.isRecording
                        ? Color.red.opacity(0.8)
                        : Color.white.opacity(0.1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(vm.isTranslating)
        }
    }

    // MARK: - Error

    private func errorView(_ message: String) -> some View {
        HStack(spacing: 8) {
            Text("⚠️")
            Text(message)
                .font(.subheadline)
                .foregroundColor(Color(hex: "fca5a5"))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.red.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color.red.opacity(0.3), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Result Card

    private var resultCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("🇩🇪 НЕМЕЦКИЙ")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white.opacity(0.4))
                    .tracking(1)
                Spacer()
                if !vm.translatedText.isEmpty {
                    Button {
                        vm.copyResult()
                    } label: {
                        Label("Копировать", systemImage: "doc.on.doc")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.4))
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)

            Group {
                if vm.translatedText.isEmpty {
                    Text("Перевод появится здесь...")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.15))
                        .italic()
                } else {
                    Text(vm.translatedText)
                        .font(.body)
                        .foregroundColor(.white)
                        .textSelection(.enabled)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 80, alignment: .topLeading)
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(Color.white.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Footer

    private var footerView: some View {
        Text("Dashka DE • v0.1.1 • target: DE")
            .font(.caption2)
            .foregroundColor(.white.opacity(0.15))
    }
}

// MARK: - Color Hex Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

#Preview {
    GermanScreen()
}
