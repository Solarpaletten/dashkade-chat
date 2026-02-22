// core/network/ApiClient.kt
// Dashka DE · Android · v0.1.1
// DE-only · No WebSocket · No language lists

package com.solar.dashkade.core.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

// ── Data Models ──────────────────────────────────────────────────────────────

data class TranslateRequest(
    val text: String,
    val target_language: String = "DE"
)

data class TranslateResponse(
    val status: String,
    val original_text: String,
    val translated_text: String,
    val source_language: String,
    val target_language: String,
    val confidence: Double,
    val processing_time: Int,
    val from_cache: Boolean
)

data class HealthResponse(
    val status: String
)

// ── Retrofit Interface ────────────────────────────────────────────────────────

interface DashkaApi {

    @GET("health")
    suspend fun health(): Response<HealthResponse>

    @POST("translate")
    suspend fun translate(@Body request: TranslateRequest): Response<TranslateResponse>
}

// ── Singleton Client ──────────────────────────────────────────────────────────

object ApiClient {

    private const val BASE_URL = "https://dashka-translate.onrender.com/"

    private val okhttp = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
        )
        .build()

    val api: DashkaApi = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okhttp)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(DashkaApi::class.java)
}
