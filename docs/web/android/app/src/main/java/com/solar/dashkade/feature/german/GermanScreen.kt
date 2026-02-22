// feature/german/GermanScreen.kt
// Dashka DE · Android · v0.1.1
// Jetpack Compose · DE-only · No WebSocket

package com.solar.dashkade.feature.german

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

// ── Colors ───────────────────────────────────────────────────────────────────
private val BgDeep     = Color(0xFF030712)
private val BgCard     = Color(0xFF111827)
private val BgCardBorder = Color(0xFF1F2937)
private val TextPrimary = Color.White
private val TextMuted  = Color(0xFF9CA3AF)
private val TextGhost  = Color(0xFF4B5563)
private val Accent     = Color(0xFFFFCC00)
private val ErrorBg    = Color(0xFF1F0D0D)
private val ErrorText  = Color(0xFFFCA5A5)
private val ErrorBorder = Color(0xFF7F1D1D)

@Composable
fun GermanScreen(vm: GermanViewModel = viewModel()) {

    val state by vm.state.collectAsStateWithLifecycle()
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDeep)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {

        // ── Header ──────────────────────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("🇩🇪 Dashka", color = TextPrimary,
                    fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("German Translator · DE-only", color = TextMuted, fontSize = 12.sp)
            }
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(
                        if (state.backendAwake) Color(0xFF4ADE80) else Color(0xFFEF4444),
                        shape = RoundedCornerShape(50)
                    )
            )
            Spacer(Modifier.width(6.dp))
            Text(
                if (state.backendAwake) "Online" else "Offline",
                color = TextMuted, fontSize = 12.sp
            )
        }

        // ── Wake Up Banner ───────────────────────────────────────────────────
        if (!state.backendAwake) {
            Button(
                onClick = { vm.wakeUp() },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
            ) {
                Text("☀️ Разбудить backend (Render)",
                    color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }

        // ── Error Banner ─────────────────────────────────────────────────────
        state.error?.let { err ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(ErrorBg, RoundedCornerShape(14.dp))
                    .border(1.dp, ErrorBorder.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(err, color = ErrorText, fontSize = 13.sp, modifier = Modifier.weight(1f))
                Spacer(Modifier.width(8.dp))
                TextButton(
                    onClick = { vm.wakeUp() },
                    colors = ButtonDefaults.textButtonColors(contentColor = TextPrimary),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                ) { Text("Retry", fontSize = 12.sp) }
            }
        }

        // ── Input Block ──────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(BgCard, RoundedCornerShape(18.dp))
                .border(1.dp, BgCardBorder, RoundedCornerShape(18.dp))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("ВВОД (любой язык)", color = TextGhost,
                    fontSize = 11.sp, fontWeight = FontWeight.Bold,
                    letterSpacing = 0.8.sp, modifier = Modifier.weight(1f))
                TextButton(
                    onClick = { vm.clear() },
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.textButtonColors(contentColor = TextGhost)
                ) { Text("очистить ✕", fontSize = 12.sp) }
            }

            BasicTextField(
                value = state.inputText,
                onValueChange = { vm.setInputText(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = 120.dp)
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                textStyle = TextStyle(color = TextPrimary, fontSize = 16.sp),
                cursorBrush = SolidColor(Accent),
                decorationBox = { inner ->
                    if (state.inputText.isEmpty()) {
                        Text("Введите текст для перевода на немецкий...",
                            color = TextGhost, fontSize = 16.sp)
                    }
                    inner()
                }
            )

            Text(
                "${state.inputText.length} / 5000",
                color = TextGhost, fontSize = 11.sp,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                textAlign = TextAlign.End
            )
        }

        // ── Actions ──────────────────────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Translate button
            Button(
                onClick = { vm.translate() },
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(16.dp),
                enabled = state.inputText.isNotBlank() && !state.isTranslating,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Accent,
                    disabledContainerColor = Accent.copy(alpha = 0.4f)
                )
            ) {
                if (state.isTranslating) {
                    CircularProgressIndicator(
                        color = Color.Black,
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("🔄 → Deutsch", color = Color.Black,
                        fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }

            // Voice button
            val pulse = rememberInfiniteTransition(label = "pulse")
            val alpha by pulse.animateFloat(
                initialValue = 1f, targetValue = 0.5f,
                animationSpec = infiniteRepeatable(
                    tween(600), RepeatMode.Reverse
                ), label = "alpha"
            )

            Button(
                onClick = { vm.toggleRecording() },
                modifier = Modifier.size(50.dp),
                shape = RoundedCornerShape(16.dp),
                contentPadding = PaddingValues(0.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (state.isRecording)
                        Color(0xFFDC2626).copy(alpha = alpha)
                    else BgCard
                )
            ) {
                Text(if (state.isRecording) "⏹" else "🎤", fontSize = 20.sp)
            }
        }

        // Hint
        Text(
            "tap mic → говори по-русски → авто-перевод на DE",
            color = TextGhost, fontSize = 11.sp,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )

        // ── Result Block ─────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(BgCard, RoundedCornerShape(18.dp))
                .border(1.dp, BgCardBorder, RoundedCornerShape(18.dp))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🇩🇪 DEUTSCH", color = Accent,
                    fontSize = 11.sp, fontWeight = FontWeight.Bold,
                    letterSpacing = 0.8.sp, modifier = Modifier.weight(1f))

                if (state.translatedText.isNotEmpty()) {
                    TextButton(
                        onClick = {
                            clipboard.setText(AnnotatedString(state.translatedText))
                            Toast.makeText(context, "Скопировано", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = TextMuted),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) { Text("📋 Копировать", fontSize = 12.sp) }
                }
            }

            Text(
                text = if (state.translatedText.isEmpty()) "Перевод появится здесь..."
                       else state.translatedText,
                color = if (state.translatedText.isEmpty()) TextGhost else TextPrimary,
                fontSize = 16.sp,
                modifier = Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = 120.dp)
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .padding(bottom = 12.dp),
                lineHeight = 24.sp
            )
        }

        // ── Footer ───────────────────────────────────────────────────────────
        Text(
            "Dashka DE · v0.1.1 · Solar Team 🚀",
            color = TextGhost, fontSize = 11.sp,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )
    }
}
