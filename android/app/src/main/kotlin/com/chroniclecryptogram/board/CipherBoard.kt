package com.chroniclecryptogram.board

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.model.CipherCell
import com.chroniclecryptogram.cipher.model.CryptogramWord
import com.chroniclecryptogram.designsystem.theme.BoardTextStyles
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlin.math.max

/**
 * Tile geometry for one board, chosen from the space actually available.
 *
 * [height] is derived from *measured* text rather than picked as a constant.
 * That is the whole point: the web board sets `--tile-h: 4rem`, which ignores
 * Android's font-scale setting entirely, so a player at fontScale 2.0 gets
 * clipped letters and reaches for an in-app zoom control to compensate.
 */
data class TileSize(
    val width: Dp,
    val height: Dp,
    val letterStyle: TextStyle,
    val glyphStyle: TextStyle,
)

/** Widths tried largest-first until the longest word fits. */
private val TileWidthLadder = listOf(56.dp, 48.dp, 44.dp, 40.dp, 36.dp, 32.dp)

private val WordGap = 20.dp
private val LineGap = 28.dp
private val CellGap = 6.dp

/**
 * Chooses a tile size that fits [maxWidth] and always contains its own text.
 *
 * Text is measured at the current density *and* font scale, so larger system
 * type produces larger tiles instead of clipped ones.
 */
@Composable
fun rememberTileSize(words: List<CryptogramWord>, maxWidth: Dp): TileSize {
    val measurer = rememberTextMeasurer()
    val density = LocalDensity.current
    val letterStyle = BoardTextStyles.tileLetter
    val glyphStyle = BoardTextStyles.tileGlyph

    return remember(words, maxWidth, density.density, density.fontScale) {
        val letterHeight = measurer.measure("W", letterStyle).size.height
        val glyphHeight = measurer.measure("⦿", glyphStyle).size.height
        val letterWidth = measurer.measure("W", letterStyle).size.width
        val glyphWidth = measurer.measure("⦿", glyphStyle).size.width

        with(density) {
            val contentHeight = (letterHeight + glyphHeight).toDp() + 14.dp
            val minWidth = max(letterWidth, glyphWidth).toDp() + 8.dp
            val longestWord = words.maxOfOrNull { it.symbols.size } ?: 1

            // Largest width that still fits the longest word on one line; the
            // smallest rung is a floor, and long words wrap inside themselves.
            val width = TileWidthLadder.firstOrNull { candidate ->
                candidate >= minWidth &&
                    (candidate * longestWord) + (CellGap * (longestWord - 1)) <= maxWidth
            } ?: maxOf(TileWidthLadder.last(), minWidth)

            TileSize(
                width = width,
                height = contentHeight,
                letterStyle = letterStyle,
                glyphStyle = glyphStyle,
            )
        }
    }
}

/**
 * The cryptogram board.
 *
 * A custom [Layout] rather than nested `FlowRow`s, because the layout pass has
 * to report where each tile actually landed. That single fact deletes the entire
 * hidden-input apparatus the web version needs -- `placeCipherInput`,
 * `getBoundingClientRect`, the scroll and visualViewport listeners and the 380ms
 * re-anchor timer -- because scrolling a tile into view becomes arithmetic
 * against a known rectangle.
 *
 * Words never break across lines unless a single word is wider than the board.
 */
@Composable
fun CipherBoard(
    words: List<CryptogramWord>,
    mappings: Map<String, String>,
    selectedCellId: String?,
    lockedSymbolIds: Set<String>,
    flaggedSymbolIds: Set<String>,
    onCellClick: (cellId: String, symbolId: String) -> Unit,
    modifier: Modifier = Modifier,
    onTilePlaced: (cellId: String, bounds: Rect) -> Unit = { _, _ -> },
) {
    BoxWithConstraints(modifier) {
        val tile = rememberTileSize(words, maxWidth)
        val density = LocalDensity.current

        val cells = remember(words) {
            words.flatMap { word ->
                word.symbols.mapIndexed { index, cell -> Triple(word.id, index, cell) }
            }
        }

        Layout(
            content = {
                cells.forEach { (wordId, index, cell) ->
                    val cellId = "${wordId}_$index"
                    CipherTile(
                        cell = cell,
                        guess = mappings[cell.symbolId],
                        tile = tile,
                        selected = cellId == selectedCellId,
                        locked = cell.symbolId in lockedSymbolIds,
                        flagged = cell.symbolId in flaggedSymbolIds,
                        onClick = { onCellClick(cellId, cell.symbolId) },
                        modifier = Modifier.layoutId(cellId),
                    )
                }
            },
        ) { measurables, constraints ->
            val cellGap = with(density) { CellGap.roundToPx() }
            val wordGap = with(density) { WordGap.roundToPx() }
            val lineGap = with(density) { LineGap.roundToPx() }
            val tileHeight = with(density) { tile.height.roundToPx() }

            val placeables = measurables.map { it.measure(Constraints()) }

            // Group by word so a word wraps as a unit.
            val wordSpans = ArrayList<IntRange>()
            var cursor = 0
            for (word in words) {
                wordSpans += cursor until (cursor + word.symbols.size)
                cursor += word.symbols.size
            }

            var x = 0
            var y = 0
            var lineHeight = tileHeight
            val positions = arrayOfNulls<Pair<Int, Int>>(placeables.size)

            for (span in wordSpans) {
                val wordWidth = span.sumOf { placeables[it].width } +
                    cellGap * (span.count() - 1).coerceAtLeast(0)

                if (x > 0 && x + wordWidth > constraints.maxWidth) {
                    x = 0
                    y += lineHeight + lineGap
                    lineHeight = tileHeight
                }

                for (index in span) {
                    val placeable = placeables[index]
                    if (x > 0 && x + placeable.width > constraints.maxWidth) {
                        // Only reached when one word is wider than the board.
                        x = 0
                        y += lineHeight + lineGap
                    }
                    positions[index] = x to y
                    lineHeight = maxOf(lineHeight, placeable.height)
                    x += placeable.width + cellGap
                }
                x += wordGap - cellGap
            }

            val height = y + lineHeight
            layout(constraints.maxWidth, height) {
                placeables.forEachIndexed { index, placeable ->
                    val (px, py) = positions[index] ?: (0 to 0)
                    placeable.place(px, py)
                    val (wordId, cellIndex, _) = cells[index]
                    onTilePlaced(
                        "${wordId}_$cellIndex",
                        Rect(
                            px.toFloat(),
                            py.toFloat(),
                            (px + placeable.width).toFloat(),
                            (py + placeable.height).toFloat(),
                        ),
                    )
                }
            }
        }
    }
}

@Composable
private fun CipherTile(
    cell: CipherCell,
    guess: String?,
    tile: TileSize,
    selected: Boolean,
    locked: Boolean,
    flagged: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors

    if (cell.isPunctuation) {
        Box(
            modifier = modifier.size(width = tile.width / 2, height = tile.height),
            contentAlignment = Alignment.BottomCenter,
        ) {
            BoardText(cell.char.orEmpty(), BoardTextStyles.tilePunctuation, colors.ink)
        }
        return
    }

    // The same aria-label wording the web board uses, so the accessibility
    // contract survives the port and UI tests get stable selectors for free.
    val description = buildString {
        append("Cipher glyph ")
        append(cell.char.orEmpty())
        when {
            flagged -> append(", marked wrong")
            locked && guess != null -> append(", locked as $guess")
            guess != null -> append(", mapped to $guess")
            else -> append(", unassigned")
        }
    }

    Box(
        modifier = modifier
            .size(tile.width, tile.height)
            .clip(RoundedCornerShape(4.dp))
            .background(if (selected) colors.selected else colors.paperCard)
            .clickable(onClick = onClick)
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        TileContents(
            glyph = cell.char.orEmpty(),
            guess = guess,
            tile = tile,
            inkColor = when {
                flagged -> colors.cinnabar
                locked -> colors.brass
                selected -> colors.selectedInk
                else -> colors.ink
            },
        )
    }
}

@Composable
private fun TileContents(glyph: String, guess: String?, tile: TileSize, inkColor: androidx.compose.ui.graphics.Color) {
    Box(Modifier.padding(2.dp), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.layout.Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            BoardText(guess.orEmpty().ifEmpty { " " }, tile.letterStyle, inkColor)
            BoardText(glyph, tile.glyphStyle, inkColor)
        }
    }
}

@Composable
private fun BoardText(text: String, style: TextStyle, color: androidx.compose.ui.graphics.Color) {
    androidx.compose.material3.Text(text = text, style = style, color = color, maxLines = 1)
}
