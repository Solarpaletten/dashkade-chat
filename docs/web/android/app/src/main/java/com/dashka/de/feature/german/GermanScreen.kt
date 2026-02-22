// feature/german/GermanScreen.kt
// Jetpack Compose — DE-only
// DashkaDE v0.1.1-android-skeleton-clean

package com.dashka.de.feature.german

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

// ── Colors ──────────────────────────────────────────────────────

private val DarkBg1 = Color(0xFF1a1a2e)
private val DarkBg2 = Color(0xFF16213e)
private val DarkBg3 = Color(0xFF0f3460)
private val CardBg = Color(0x0DFFFFFF)
private val CardBorder = Color(0x1AFFFFFF)
private val BlueStart = Color(0xFF3b82f6)
private val BlueEnd = Color(0xFF6366f1)

// ── Screen ──────────────────────────────────────────────────────

@Composable
fun GermanScreen(vm: GermanViewModel = viewModel()) {
    val state by vm.state.collectAsState()
    val clipboard = LocalClipboardManager.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(colors = listOf(DarkBg1, DarkBg2, DarkBg3))
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 16.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {

            // ── HEADER ──
            Header(backendAwake = state.backendAwake)

            // ── WAKE UP BANNER ──
            if (!state.backendAwake) {
                WakeUpBanner(onWakeUp = { vm.wakeUp() })
            }

            // ── INPUT CARD ──
            InputCard(
                text = state.inputText,
                onTextChange = { vm.setInputText(it) },
                onClear = { vm.clear() },
                charCount = state.inputText.length
            )

            // ── ACTION BUTTONS ──
            ActionButtons(
                isTranslating = state.isTranslating,
                isRecording = state.isRecording,
                inputEmpty = state.inputText.isBlank(),
                onTranslate = { vm.translate() },
                onToggleRecording = { vm.toggleRecording() }
            )

            // ── ERROR ──
            state.error?.let { ErrorCard(message = it) }

            // ── RESULT CARD ──
            ResultCard(
                text = state.translatedText,
                onCopy = { clipboard.setText(AnnotatedString(state.translatedText)) }
            )

            // ── FOOTER ──
            Text(
                text = "Dashka DE • v0.1.1 • target: DE",
                color = Color.White.copy(alpha = 0.15f),
                fontSize = 11.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
        }
    }
}

// ── Header ──────────────────────────────────────────────────────

@Composable
private fun Header(backendAwake: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("🇩🇪 Dashka", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("German Translator • DE-only", color = Color.White.copy(0.4f), fontSize = 12.sp)
        }

        Row(
            modifier = Modifier
                .background(Color.White.copy(0.1f), shape = RoundedCornerShape(50))
                .padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            val pulse by rememberInfiniteTransition(label = "pulse").animateFloat(
                initialValue = 0.5f, targetValue = 1f,
                animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
                label = "alpha"
            )
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(
                        if (backendAwake) Color(0xFF4ade80)
                        else Color(0xFFfbbf24).copy(alpha = pulse),
                        shape = RoundedCornerShape(50)
                    )
            )
            Text(
                text = if (backendAwake) "Online" else "Sleeping...",
                color = Color.White.copy(0.6f),
                fontSize = 12.sp
            )
        }
    }
}

// ── Wake Up Banner ───────────────────────────────────────────────

@Composable
private fun WakeUpBanner(onWakeUp: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFfbbf24).copy(0.1f), RoundedCornerShape(16.dp))
            .border(1.dp, Color(0xFFfbbf24).copy(0.3f), RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text("Backend на Render засыпает", color = Color(0xFFfde68a), fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text("Первый запрос ~30 сек", color = Color(0xFFfde68a).copy(0.5f), fontSize = 12.sp)
        }
        Button(
            onClick = onWakeUp,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFfbbf24)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("⏰ Wake Up", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}

// ── Input Card ───────────────────────────────────────────────────

@Composable
private fun InputCard(text: String, onTextChange: (String) -> Unit, onClear: () -> Unit, charCount: Int) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(CardBg, RoundedCornerShape(20.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("ВАШ ТЕКСТ", color = Color.White.copy(0.4f), fontSize = 11.sp, fontWeight = FontWeight.Medium, letterSpacing = 1.sp)
            TextButton(onClick = onClear, contentPadding = PaddingValues(0.dp)) {
                Text("Очистить ✕", color = Color.White.copy(0.3f), fontSize = 12.sp)
            }
        }

        TextField(
            value = text,
            onValueChange = onTextChange,
            placeholder = { Text("Введите текст для перевода на немецкий...", color = Color.White.copy(0.2f), fontSize = 15.sp) },
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                cursorColor = Color(0xFF3b82f6),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            minLines = 3,
            maxLines = 6
        )

        Text(
            text = if (charCount > 0) "$charCount симв." else "Enter — перевести",
            color = Color.White.copy(0.2f),
            fontSize = 11.sp
        )
    }
}

// ── Action Buttons ───────────────────────────────────────────────

@Composable
private fun ActionButtons(
    isTranslating: Boolean,
    isRecording: Boolean,
    inputEmpty: Boolean,
    onTranslate: () -> Unit,
    onToggleRecording: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // TRANSLATE
        Button(
            onClick = onTranslate,
            enabled = !isTranslating && !inputEmpty,
            modifier = Modifier
                .weight(1f)
                .height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.Transparent,
                disabledContainerColor = Color.White.copy(0.08f)
            ),
            contentPadding = PaddingValues(0.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        if (!isTranslating && !inputEmpty)
                            Brush.horizontalGradient(listOf(BlueStart, BlueEnd))
                        else Brush.horizontalGradient(listOf(Color.White.copy(0.08f), Color.White.copy(0.08f))),
                        RoundedCornerShape(14.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isTranslating) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CircularProgressIndicator(color = Color.White.copy(0.4f), modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        Text("Перевод...", color = Color.White.copy(0.4f), fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Text(
                        "🔄 → Deutsch",
                        color = if (!inputEmpty) Color.White else Color.White.copy(0.2f),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    )
                }
            }
        }

        // VOICE
        val pulse by rememberInfiniteTransition(label = "rec").animateFloat(
            initialValue = 0.6f, targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse),
            label = "recAlpha"
        )
        IconButton(
            onClick = onToggleRecording,
            enabled = !isTranslating,
            modifier = Modifier
                .size(50.dp)
                .background(
                    if (isRecording) Color(0xFFef4444).copy(alpha = pulse)
                    else Color.White.copy(0.1f),
                    RoundedCornerShape(14.dp)
                )
                .clip(RoundedCornerShape(14.dp))
        ) {
            Text(if (isRecording) "⏹️" else "🎤", fontSize = 20.sp)
        }
    }
}

// ── Error Card ───────────────────────────────────────────────────

@Composable
private fun ErrorCard(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Red.copy(0.1f), RoundedCornerShape(14.dp))
            .border(1.dp, Color.Red.copy(0.3f), RoundedCornerShape(14.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text("⚠️")
        Text(message, color = Color(0xFFfca5a5), fontSize = 14.sp)
    }
}

// ── Result Card ──────────────────────────────────────────────────

@Composable
private fun ResultCard(text: String, onCopy: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 120.dp)
            .background(CardBg, RoundedCornerShape(20.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("🇩🇪 НЕМЕЦКИЙ", color = Color.White.copy(0.4f), fontSize = 11.sp, fontWeight = FontWeight.Medium, letterSpacing = 1.sp)
            if (text.isNotEmpty()) {
                TextButton(onClick = onCopy, contentPadding = PaddingValues(0.dp)) {
                    Text("📋 Копировать", color = Color.White.copy(0.4f), fontSize = 12.sp)
                }
            }
        }

        if (text.isEmpty()) {
            Text("Перевод появится здесь...", color = Color.White.copy(0.15f), fontStyle = FontStyle.Italic, fontSize = 15.sp)
        } else {
            SelectionContainer {
                Text(text, color = Color.White, fontSize = 15.sp, lineHeight = 22.sp)
            }
        }
    }
}
