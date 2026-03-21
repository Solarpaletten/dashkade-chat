// DashkadeApp.swift
// Entry point

import SwiftUI

@main
struct DashkadeApp: App {
    var body: some Scene {
        WindowGroup {
            TranslatorScreen()
                .preferredColorScheme(.dark)
        }
    }
}
