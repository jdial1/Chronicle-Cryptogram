package com.chroniclecryptogram.splash

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import com.chroniclecryptogram.R
import com.chroniclecryptogram.designsystem.scannedPaper
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.ChronicleTypography
import kotlinx.coroutines.delay

const val SplashTag = "splash"
const val SplashEnterTag = "splash-enter"

/**
 * The front page before the desk: the masthead typing itself out, the press
 * plate turning, and a key to go in.
 *
 * A port of the web's `#splash`, which exists because the game opens on a wall
 * of cipher glyphs and needs a beat of theatre first. It is shown once per
 * launch rather than once ever, matching the web's `sessionStorage` gate --
 * [onEnter] is what actually dismisses it.
 *
 * Every animation here is skipped when the player has asked for reduced motion:
 * the title appears whole and the plate holds still.
 */
@Composable
fun SplashScreen(
    onEnter: () -> Unit,
    modifier: Modifier = Modifier,
    reduceMotion: Boolean = false,
) {
    val colors = ChronicleTheme.colors
    val title = "Chronicle"
    val subtitle = "Cryptogram"

    // The masthead is set a letter at a time, the way it would come off a
    // typewriter. Reduced motion gets the finished line immediately.
    var typed by remember { mutableIntStateOf(if (reduceMotion) title.length + subtitle.length else 0) }
    LaunchedEffect(reduceMotion) {
        if (reduceMotion) return@LaunchedEffect
        typed = 0
        repeat(title.length + subtitle.length) {
            delay(TypeIntervalMs)
            typed++
        }
    }

    Box(
        modifier
            .fillMaxSize()
            .scannedPaper(fill = colors.paper, dot = colors.paperGrain)
            .safeDrawingPadding()
            .testTag(SplashTag),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier.padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.semantics {
                    heading()
                    // The whole masthead is announced at once; a screen reader
                    // must not read it letter by letter as it is set.
                    contentDescription = "Chronicle Cryptogram"
                },
            ) {
                MastheadLine(title.take(typed.coerceAtMost(title.length)))
                MastheadLine(subtitle.take((typed - title.length).coerceIn(0, subtitle.length)))
            }

            // The masthead rules, as on the printed page.
            Box(
                Modifier
                    .width(220.dp)
                    .height(2.dp)
                    .background(colors.ink)
            )

            PressPlate(reduceMotion = reduceMotion)

            EnterKey(onEnter = onEnter)
        }
    }
}

@Composable
private fun MastheadLine(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.displayLarge,
        color = ChronicleTheme.colors.ink,
        textAlign = TextAlign.Center,
        maxLines = 1,
    )
}

/**
 * The press plate, turning on its edge.
 *
 * The web flips a two-sided coin; the same read comes from scaling the plate
 * horizontally through zero, which is what a rotation about the vertical axis
 * looks like in projection and costs nothing to draw.
 */
@Composable
private fun PressPlate(reduceMotion: Boolean) {
    val colors = ChronicleTheme.colors
    val spin = rememberInfiniteTransition(label = "plate")
    val angle by spin.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = PlateSpinMs, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "plate-angle",
    )

    Box(
        Modifier
            .size(96.dp)
            .graphicsLayer {
                if (!reduceMotion) {
                    // |cos| never fully vanishes, so the plate never disappears
                    // mid-turn on a device that drops a frame there.
                    val turn = kotlin.math.cos(Math.toRadians(angle.toDouble())).toFloat()
                    scaleX = maxOf(kotlin.math.abs(turn), 0.06f)
                }
            }
            .clip(CircleShape)
            .background(colors.paperCard)
            .border(3.dp, colors.brass, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(R.mipmap.ic_launcher_foreground),
            contentDescription = null,
            modifier = Modifier.size(80.dp),
        )
    }
}

/** The way in: one typewriter key, the same instrument the board is played on. */
@Composable
private fun EnterKey(onEnter: () -> Unit) {
    val colors = ChronicleTheme.colors
    Box(
        Modifier
            .clip(CircleShape)
            .background(colors.brass)
            .clickable(onClick = onEnter)
            .heightIn(min = 56.dp)
            .fillMaxWidth(0.8f)
            .padding(horizontal = 24.dp, vertical = 16.dp)
            .testTag(SplashEnterTag)
            .semantics { contentDescription = "Enter the edition" },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "ENTER THE EDITION",
            style = ChronicleTypography.labelLarge,
            fontSize = 13.sp,
            letterSpacing = 1.2.sp,
            fontWeight = FontWeight.Black,
            color = colors.paper,
            maxLines = 1,
        )
    }
}

private const val TypeIntervalMs = 70L
private const val PlateSpinMs = 4200
