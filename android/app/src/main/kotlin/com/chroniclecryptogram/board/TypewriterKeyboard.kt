package com.chroniclecryptogram.board

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.theme.ChronicleFonts
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val Rows = listOf("QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM")

/** The web keeps a key visibly depressed for at least this long so a fast tap still reads. */
private const val PressMillis = 150L

/**
 * The brass typewriter bank, ported from `TypewriterKeyboard.tsx`.
 *
 * This is the app's only text entry. The system IME is deliberately not offered:
 * autocorrect, prediction and emoji are noise on a cipher, and supporting it is
 * the sole reason the web build needs a hidden input parked over the selected
 * tile with rect math and a re-anchor timer.
 *
 * The web version tracks press state in two WeakMaps keyed by DOM node to hold a
 * key down for a minimum duration. Compose keeps that state per key composable
 * instead, which is the same behaviour without the bookkeeping.
 */
@Composable
fun TypewriterKeyboard(
    onLetter: (String) -> Unit,
    onBackspace: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.paperDesk)
            .padding(horizontal = 6.dp, vertical = 8.dp)
            .semantics { contentDescription = "Typewriter keyboard" },
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Rows.forEachIndexed { index, row ->
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                row.forEach { letter ->
                    TypewriterKey(
                        label = letter.toString(),
                        description = letter.toString(),
                        onPress = { onLetter(letter.toString()) },
                        modifier = Modifier.weight(1f),
                    )
                }
                if (index == Rows.lastIndex) {
                    TypewriterKey(
                        label = "BKSP",
                        description = "Backspace",
                        onPress = onBackspace,
                        modifier = Modifier.weight(2f),
                    )
                }
            }
        }
    }
}

@Composable
private fun TypewriterKey(
    label: String,
    description: String,
    onPress: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val haptics = LocalHapticFeedback.current
    var pressed by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScopeForKey()

    // The physical travel the CSS does with translateY(7px) scale(0.92).
    val travel by animateFloatAsState(if (pressed) 7f else 0f, label = "keyTravel")
    val scale by animateFloatAsState(if (pressed) 0.92f else 1f, label = "keyScale")

    Box(
        modifier = modifier
            .aspectRatio(0.88f)
            .graphicsLayer {
                translationY = travel
                scaleX = scale
                scaleY = scale
            }
            .clip(RoundedCornerShape(6.dp))
            .background(if (pressed) colors.brass else colors.paperCard)
            .semantics { contentDescription = description }
            .pointerInput(label) {
                detectTapGestures(
                    onPress = {
                        pressed = true
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        val started = System.nanoTime()
                        tryAwaitRelease()
                        // Hold the depressed state for the minimum press window,
                        // so a quick tap still shows travel.
                        val elapsed = (System.nanoTime() - started) / 1_000_000
                        scope.launch {
                            delay((PressMillis - elapsed).coerceAtLeast(0))
                            pressed = false
                        }
                    },
                    onTap = { onPress() },
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge.copy(fontFamily = ChronicleFonts.Typewriter),
            color = if (pressed) colors.paper else colors.ink,
        )
    }
}

@Composable
private fun rememberCoroutineScopeForKey() = androidx.compose.runtime.rememberCoroutineScope()
