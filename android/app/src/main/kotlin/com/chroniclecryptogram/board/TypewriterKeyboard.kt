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
import androidx.compose.foundation.layout.wrapContentWidth
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
import com.chroniclecryptogram.designsystem.theme.LocalReduceMotion
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val Rows = listOf("QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM")

/** The web keeps a key visibly depressed for at least this long so a fast tap still reads. */
private const val PressMillis = 150L

/** How far a key travels when struck. `translateY(7px)` in the CSS. */
private val KeyTravel = 7.dp

/* The bank is near-black rather than paper: these keys are machine, not page. */
internal val BankInk = Color(0xFF1A1816)
internal val BankEdge = Color(0xFF0A0908)
private val KeyTop = Color(0xFF3A342C)
private val KeyBottom = Color(0xFF141210)
private val KeyPressedTop = Color(0xFF1C1814)
private val KeyPressedBottom = Color(0xFF070605)
internal val KeyShadow = Color(0xFF5C4A28)

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
    /**
     * The most vertical room the bank may take.
     *
     * Sizing keys from width alone is fine on a phone held upright and wrong the
     * moment it is turned: in landscape the widest row licenses 52dp keys, three
     * rows of which swallowed the whole window and left the cipher clipped to
     * nothing. Unspecified keeps the width-only behaviour.
     */
    maxHeight: Dp = Dp.Unspecified,
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
        val byWidth = available / 10

        // Three rows, their two gaps, and the bed's own padding.
        val byHeight = if (maxHeight == Dp.Unspecified) {
            byWidth
        } else {
            (maxHeight - (gap * 2) - 18.dp) / 3
        }

        // The tighter of the two dimensions wins, then the floor keeps the keys
        // touchable rather than letting a very short window shrink them away.
        val key = minOf(byWidth, byHeight).coerceIn(28.dp, 52.dp)

        Column(
            Modifier
                .fillMaxWidth()
                .background(BankInk)
                .padding(horizontal = 4.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(gap),
            // Centred, not left-aligned. When the keys are capped -- a wide
            // window, or a short one that forced them small -- the bank was
            // left sitting against one edge with a slab of empty bed beside it.
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Rows.forEachIndexed { index, row ->
                Row(
                    Modifier
                        // Width from the keys themselves, so the row can be
                        // centred as a unit and keep its stagger.
                        .wrapContentWidth()
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

    // "Still keys" is half of what the reduce-motion setting promises, and it
    // was promising it without doing anything: the key travel and the squash
    // animated regardless. The press still registers and the key still darkens,
    // so the control stays legible -- it just does not move.
    val still = LocalReduceMotion.current
    val target = pressed && !still

    val travel by animateDpAsState(if (target) KeyTravel else 0.dp, label = "keyTravel")
    val scale by animateFloatAsState(if (target) 0.92f else 1f, label = "keyScale")
    // The key sits on a brass plinth; struck, it drops onto it.
    val plinth by animateDpAsState(if (target) 0.dp else KeyTravel, label = "keyPlinth")

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
                // One stop per key. Unmerged, the letter drawn on the keycap
                // came through as a second node, so every key was announced
                // twice.
                .semantics(mergeDescendants = true) { contentDescription = description }
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
