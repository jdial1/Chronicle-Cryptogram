package com.chroniclecryptogram.board

import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.Canvas
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * The SOLVED stamp, struck across a finished board.
 *
 * A clerk's rubber stamp: a double octagonal frame with the corners cut, the
 * word in classical caps, rolled on at an angle and never quite in the same
 * place twice. Ported from `DecodedStamp` in `src/deskIcons.tsx`, which draws
 * the same frame in SVG.
 *
 * The web's grit -- `feTurbulence` displacing the whole group, then two
 * `feColorMatrix` passes starving the ink -- has no cheap equivalent in Compose
 * and is not worth a shader here. What survives is the part that reads at a
 * glance: the shape, the angle, and ink that is thin enough to see the quote
 * through.
 *
 * Where it lands is derived from the puzzle id rather than drawn at random. The
 * web re-rolls it on every mount, which is fine for a page that unmounts; here
 * a recomposition would jump the stamp across the board mid-solve. Same reason
 * [typewriterJitter] is seeded rather than random.
 */
@Composable
fun BoxScope.DecodedStamp(puzzleId: String) {
    val colors = ChronicleTheme.colors
    val pose = stampPose(puzzleId)

    Canvas(
        Modifier
            // matchParentSize, not fillMaxSize: the folio sits inside a
            // vertical scroll, so the incoming height constraint is unbounded
            // and there is nothing for fillMaxSize to fill. This takes the
            // Box's measured size instead, and does not influence it.
            .matchParentSize()
            // A backstop. The clamp below should keep the stamp on the sheet,
            // but a stamp printed over the masthead is worse than one clipped.
            .clipToBounds()
            .semantics { contentDescription = "Solved" },
    ) {
        // The stamp is drawn in the web's 260x80 viewBox and scaled to the
        // board, so the frame's proportions survive whatever size the folio is.
        val stampWidth = size.width * 0.60f
        val unit = stampWidth / STAMP_VIEW_WIDTH
        val stampHeight = STAMP_VIEW_HEIGHT * unit

        // How much room a stamp rolled over at this angle actually needs. The
        // web places by percentage and lets the corners hang outside its board;
        // here the sheet has a visible border and the overhang printed on the
        // masthead above it.
        val radians = Math.toRadians(pose.rotation.toDouble())
        val cos = kotlin.math.abs(kotlin.math.cos(radians)).toFloat()
        val sin = kotlin.math.abs(kotlin.math.sin(radians)).toFloat()
        val halfW = (stampWidth * cos + stampHeight * sin) / 2f
        val halfH = (stampWidth * sin + stampHeight * cos) / 2f

        val cx = (size.width * pose.x).coerceIn(halfW, (size.width - halfW).coerceAtLeast(halfW))
        val cy = (size.height * pose.y).coerceIn(halfH, (size.height - halfH).coerceAtLeast(halfH))

        translate(cx - stampWidth / 2f, cy - stampHeight / 2f) {
            rotate(pose.rotation, Offset(stampWidth / 2f, stampHeight / 2f)) {
                val ink = colors.cinnabar.copy(alpha = 0.62f)

                drawPath(octagon(unit, OUTER_INSET), ink, style = Stroke(width = 3.3f * unit))
                drawPath(octagon(unit, INNER_INSET), ink, style = Stroke(width = 1.7f * unit))

                // Text has no Compose draw primitive that takes a typeface, so
                // this drops to the platform canvas -- the same place
                // Clipping.kt renders the share card.
                drawIntoCanvas { canvas ->
                    val paint = android.graphics.Paint().apply {
                        isAntiAlias = true
                        color = ink.toArgb()
                        textAlign = android.graphics.Paint.Align.CENTER
                        textSize = 26f * unit
                        letterSpacing = 0.14f
                        typeface = android.graphics.Typeface.create(
                            android.graphics.Typeface.SERIF,
                            android.graphics.Typeface.BOLD,
                        )
                    }
                    canvas.nativeCanvas.drawText(
                        "SOLVED",
                        STAMP_VIEW_WIDTH / 2f * unit,
                        48f * unit,
                        paint,
                    )
                }
            }
        }
    }
}

/** Where and how far over the stamp landed, for one puzzle. */
internal data class StampPose(val x: Float, val y: Float, val rotation: Float)

/**
 * The web rolls `24 + random*52` across and `26 + random*48` down, tilted
 * 10-24 degrees either way. Same ranges, derived from the id so the stamp
 * stays put.
 */
internal fun stampPose(puzzleId: String): StampPose {
    var seed = puzzleId.hashCode()
    seed = seed xor (seed ushr 16); seed *= 0x7FEB352D.toInt()
    seed = seed xor (seed ushr 15); seed *= 0x846CA68B.toInt()
    seed = seed xor (seed ushr 16)

    val across = ((seed ushr 4) and 0xFF) / 255f
    val down = ((seed ushr 12) and 0xFF) / 255f
    val tilt = ((seed ushr 20) and 0xFF) / 255f
    val lean = (seed and 1) == 0

    val degrees = 10f + tilt * 14f
    return StampPose(
        x = 0.24f + across * 0.52f,
        y = 0.26f + down * 0.48f,
        rotation = if (lean) -degrees else degrees,
    )
}

private const val STAMP_VIEW_WIDTH = 260f
private const val STAMP_VIEW_HEIGHT = 80f
private const val OUTER_INSET = 0f
private const val INNER_INSET = 10.4f

/**
 * The frame: a rectangle with its corners cut, which is what makes it read as a
 * stamp rather than a box. Coordinates are the web's, in viewBox units.
 */
private fun octagon(unit: Float, inset: Float): Path {
    val left = 8.8f + inset
    val right = 251.2f - inset
    val top = 9.2f + inset
    val bottom = 70.8f - inset
    val cut = 9.2f - inset * 0.18f

    return Path().apply {
        moveTo((left + cut) * unit, top * unit)
        lineTo((right - cut) * unit, top * unit)
        lineTo(right * unit, (top + cut) * unit)
        lineTo(right * unit, (bottom - cut) * unit)
        lineTo((right - cut) * unit, bottom * unit)
        lineTo((left + cut) * unit, bottom * unit)
        lineTo(left * unit, (bottom - cut) * unit)
        lineTo(left * unit, (top + cut) * unit)
        close()
    }
}
