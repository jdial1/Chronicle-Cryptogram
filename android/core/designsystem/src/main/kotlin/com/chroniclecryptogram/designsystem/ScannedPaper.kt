package com.chroniclecryptogram.designsystem

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * The web build's `.bg-scanned-doc`: a fine dot grid that reads as a document
 * put through a press scanner.
 *
 * Drawn rather than tiled from a bitmap because the dot colour is a theme token
 * and has to follow day/night; a baked tile would need two assets and would still
 * be wrong for the night-edition paper. The circle count is bounded by the folio's
 * size -- a few hundred at most -- and it is drawn behind static content, so it
 * costs one pass and never re-runs while the player types.
 */
fun Modifier.scannedPaper(fill: Color, dot: Color): Modifier = drawBehind {
    drawRect(fill)
    // The web's grid, in its units. Both call sites want the same paper, so the
    // spacing and dot size are the recipe rather than arguments.
    val step = 12.dp.toPx()
    val r = 0.9.dp.toPx()

    var y = step / 2f
    while (y < size.height) {
        var x = step / 2f
        while (x < size.width) {
            drawCircle(color = dot, radius = r, center = Offset(x, y))
            x += step
        }
        y += step
    }
}
