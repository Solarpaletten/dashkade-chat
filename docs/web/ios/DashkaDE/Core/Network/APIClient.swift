// Core/Network/APIClient.swift
// Dashka DE · iOS · v0.1.1
// DE-only · No WebSocket · No language lists

import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case networkError(Error)
    case invalidResponse(Int)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:              return "Неверный URL"
        case .networkError(let e):     return "Сеть: \(e.localizedDescription)"
        case .invalidResponse(let c):  return "HTTP \(c)"
        case .decodingError(let e):    return "Decode: \(e.localizedDescription)"
        }
    }
}

struct TranslateResponse: Decodable {
    let status: String
    let original_text: String
    let translated_text: String
    let source_language: String
    let target_language: String
    let confidence: Double
    let processing_time: Int
    let from_cache: Bool
}

struct HealthResponse: Decodable {
    let status: String
}

final class APIClient {

    static let shared = APIClient()
    private let baseURL = "https://dashka-translate.onrender.com"
    private let targetLanguage = "DE"

    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 30
        cfg.timeoutIntervalForResource = 60
        return URLSession(configuration: cfg)
    }()

    func wakeUp() async throws -> HealthResponse {
        guard let url = URL(string: "\(baseURL)/health") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.timeoutInterval = 10
        let (data, res) = try await session.data(for: req)
        try checkStatus(res)
        return try JSONDecoder().decode(HealthResponse.self, from: data)
    }

    func translate(text: String) async throws -> TranslateResponse {
        guard let url = URL(string: "\(baseURL)/translate") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: String] = [
            "text": text.trimmingCharacters(in: .whitespacesAndNewlines),
            "target_language": targetLanguage
        ]
        req.httpBody = try JSONEncoder().encode(body)
        let (data, res) = try await session.data(for: req)
        try checkStatus(res)
        return try JSONDecoder().decode(TranslateResponse.self, from: data)
    }

    private func checkStatus(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            let code = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw APIError.invalidResponse(code)
        }
    }
}
