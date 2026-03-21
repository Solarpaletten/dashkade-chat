// Models.swift
// Dashka iOS v1.2 — Data models + Enums

import Foundation

// MARK: - Direction
enum Direction {
    case ruDe
    case deRu

    var targetLanguage: String {
        switch self {
        case .ruDe: return "DE"
        case .deRu: return "RU"
        }
    }

    var sourceLang: String {
        switch self {
        case .ruDe: return "ru-RU"
        case .deRu: return "de-DE"
        }
    }

    var sourceFlag: String {
        switch self {
        case .ruDe: return "🇷🇺"
        case .deRu: return "🇩🇪"
        }
    }

    var targetFlag: String {
        switch self {
        case .ruDe: return "🇩🇪"
        case .deRu: return "🇷🇺"
        }
    }

    var sourceName: String {
        switch self {
        case .ruDe: return "Русский"
        case .deRu: return "Deutsch"
        }
    }

    var targetName: String {
        switch self {
        case .ruDe: return "Deutsch"
        case .deRu: return "Русский"
        }
    }

    var label: String {
        switch self {
        case .ruDe: return "RU→DE"
        case .deRu: return "DE→RU"
        }
    }

    mutating func toggle() {
        self = self == .ruDe ? .deRu : .ruDe
    }
}

// MARK: - MicState
enum MicState {
    case idle
    case recording
    case processing
}

// MARK: - API Request/Response
struct TranslateRequest: Encodable {
    let text: String
    let target_language: String
}

struct TranslateResponse: Decodable {
    let status: String
    let original_text: String
    let translated_text: String
    let source_language: String?
    let target_language: String?
    let confidence: Double?
    let provider: String?
}

struct HealthResponse: Decodable {
    let status: String
}
