package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.CryptogramWord

/** One selectable position on the board. Ids are `<wordId>_<indexWithinWord>`. */
data class BoardCell(
    val cellId: String,
    val symbolId: String,
)

/**
 * Cursor arithmetic, ported from the pure half of `src/game/cipherCursor.ts`
 * (lines 32-79). Pinned by the cursor fixture.
 *
 * The DOM half of that file -- `placeCipherInput`, `selectedGlyphTile`,
 * `dismissMobileKeyboard` -- has no counterpart here and never will: it existed
 * to park a hidden input over the selected tile, which the Compose board solves
 * by reporting real placement rectangles out of its own layout pass.
 */
object CipherCursor {

    /** Every non-punctuation position, in reading order. */
    fun letterCells(words: List<CryptogramWord>): List<BoardCell> {
        val cells = ArrayList<BoardCell>()
        for (word in words) {
            word.symbols.forEachIndexed { index, cell ->
                if (!cell.isPunctuation) {
                    cells += BoardCell(cellId = "${word.id}_$index", symbolId = cell.symbolId)
                }
            }
        }
        return cells
    }

    /**
     * Index of the current position. A known cell id wins over a symbol id --
     * the same glyph appears many times, and the player selected one of them.
     * Anything unrecognised falls back to the start of the board.
     */
    fun cellCursor(
        cells: List<BoardCell>,
        selectedSymbolId: String?,
        selectedCellId: String? = null,
    ): Int {
        if (selectedCellId != null) {
            val byCell = cells.indexOfFirst { it.cellId == selectedCellId }
            if (byCell >= 0) return byCell
        }
        if (selectedSymbolId == null) return 0
        val bySymbol = cells.indexOfFirst { it.symbolId == selectedSymbolId }
        return if (bySymbol < 0) 0 else bySymbol
    }

    /**
     * The next cell whose symbol has no guess yet, wrapping past the end.
     *
     * Returns null when every symbol is mapped, which is what stops the search
     * looping forever on a full board.
     */
    fun nextOpenCell(
        cells: List<BoardCell>,
        selectedSymbolId: String?,
        selectedCellId: String?,
        mappings: Map<String, String>,
    ): BoardCell? {
        if (cells.isEmpty()) return null
        val start = cellCursor(cells, selectedSymbolId, selectedCellId)
        for (step in 1..cells.size) {
            val cell = cells[(start + step) % cells.size]
            if (mappings[cell.symbolId].isNullOrEmpty()) return cell
        }
        return null
    }

    /** The previous cell, or null at the start of the board. Does not wrap. */
    fun previousCell(
        cells: List<BoardCell>,
        selectedSymbolId: String?,
        selectedCellId: String? = null,
    ): BoardCell? {
        val start = cellCursor(cells, selectedSymbolId, selectedCellId)
        if (start <= 0) return null
        return cells[start - 1]
    }
}
