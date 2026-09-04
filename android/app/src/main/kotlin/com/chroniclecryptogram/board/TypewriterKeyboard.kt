package com.chroniclecryptogram.board

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chroniclecryptogram.designsystem.theme.ChronicleFonts
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val Rows = listOf("QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM")

/** The web keeps a key visibly depressed for at least this long so a fast tap still reads. */
private const val PressMillis = 150L

/** How far a key travels when struck. `translateY(7px)` in the CSS. */
private val KeyTravel = 7.dp

/* The bank is near-black rather than paper: these keys are machine, not page. */
private val BankInk = Color(0xFF1A1816)
private val BankEdge = Color(0xFF0A0908)
private val KeyTop = Color(0xFF3A342C)
private val KeyBottom = Color(0xFF141210)
private val KeyPressedTop = Color(0xFF1C1814)
private val KeyPressedBottom = Color(0xFF070605)
private val KeyShadow = Color(0xFF5C4A28)

/**
 * The brass typewriter bank, ported from `TypewriterKeyboard.tsx` and
 * `board.css`.
 *
 * Round brass-rimmed keys on a dark machine bed, not flat tiles on paper. The
 * keys are a fixed size derived from the available width -- as the CSS
 * `clamp(2.75rem, 8vw, 3.25rem)` does -- rather than stretched to fill, and the
 * lower two rows are inset the way a real keyboard staggers.
 *
 * This is the app's only text entry. The system IME is deliberately not offered:
 * autocorrect, prediction and emoji are noise on a cipher, and supporting it is
 * the sole reason the web build needs a hidden input parked over the selected
 * tile with rect math and a re-anchor timer.
 */
@Composable
fun TypewriterKeyboard(
    onLetter: (String) -> Unit,
    onBackspace: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(
        modifier
            .fillMaxWidth()
            .background(BankEdge)
            .padding(top = 2.dp)
            .semantics { contentDescription = "Typewriter keyboard" }
    ) {
        val gap = 4.dp
        // Ten keys plus their gaps have to fit the widest row.
        val available = maxWidth - (gap * 9) - 8.dp
        val key = (available / 10).coerceIn(28.dp, 52.dp)

        Column(
            Modifier
                .fillMaxWidth()
                .background(BankInk)
                .padding(horizontal = 4.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(gap),
        ) {
            Rows.forEachIndexed { index, row ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        // The stagger: 0.48 and 0.28 of a key, per board.css.
                        .padding(
                            start = when (index) {
                                1 -> key * 0.48f
                                2 -> key * 0.28f
                                else -> 0.dp
                            }
                        ),
                    horizontalArrangement = Arrangement.spacedBy(gap),
                ) {
                    row.forEach { letter ->
                        TypewriterKey(
                            label = letter.toString(),
                            description = letter.toString(),
                            width = key,
                            height = key,
                            shape = CircleShape,
                            fontSize = (key.value * 0.36f).sp,
                            onPress = { onLetter(letter.toString()) },
                        )
                    }
                    if (index == Rows.lastIndex) {
                        TypewriterKey(
                            label = "BKSP",
                            description = "Backspace",
                            width = key * 1.65f,
                            height = key,
                            shape = RoundedCornerShape(key / 2),
                            fontSize = maxOf(11f, key.value * 0.22f).sp,
                            onPress = onBackspace,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TypewriterKey(
    label: String,
    description: String,
    width: Dp,
    height: Dp,
    shape: Shape,
    fontSize: androidx.compose.ui.unit.TextUnit,
    onPress: () -> Unit,
) {
    val colors = ChronicleTheme.colors
    val haptics = LocalHapticFeedback.current
    var pressed by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val travel by animateDpAsState(if (pressed) KeyTravel else 0.dp, label = "keyTravel")
    val scale by animateFloatAsState(if (pressed) 0.92f else 1f, label = "keyScale")
    // The key sits on a brass plinth; struck, it drops onto it.
    val plinth by animateDpAsState(if (pressed) 0.dp else KeyTravel, label = "keyPlinth")

    Box(
        Modifier
            .width(width)
            .height(height + KeyTravel),
        contentAlignment = Alignment.TopStart,
    ) {
        // The plinth the key falls onto -- `0 7px 0 #5c4a28` in the CSS.
        Box(
            Modifier
                .padding(top = travel + plinth)
                .size(width, height)
                .clip(shape)
                .background(KeyShadow)
        )

        Box(
            modifier = Modifier
                .padding(top = travel)
                .size(width * scale, height * scale)
                .clip(shape)
                .background(
                    Brush.radialGradient(
                        colors = if (pressed) {
                            listOf(KeyPressedTop, KeyPressedBottom)
                        } else {
                            listOf(KeyTop, KeyBottom)
                        },
                        center = Offset(0.5f, if (pressed) 0.78f else 0.24f),
                    )
                )
                .border(BorderStroke(3.dp, colors.brass), shape)
                .semantics { contentDescription = description }
                .pointerInput(label) {
                    detectTapGestures(
                        onPress = {
                            pressed = true
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            val started = System.nanoTime()
                            tryAwaitRelease()
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
                fontFamily = ChronicleFonts.Typewriter,
                fontSize = fontSize,
                color = colors.inkCream,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
        }
    }
}
