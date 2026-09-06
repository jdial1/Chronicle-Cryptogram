package com.chroniclecryptogram.board

import com.chroniclecryptogram.cipher.PuzzleState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The full stop that ends nearly every quote is not laid out.
 *
 * It carries nothing to decode, and as a cell like any other it wrapped onto a
 * line of its own on a narrow board, leaving a single dot floating under the
 * last word and a whole tile row of dead paper with it.
 *
 * Display only: the parse in `:core:cipher` is fixture-pinned against the
 * TypeScript and is untouched, and `originalText` still carries the stop
 * wherever the quote is printed as prose.
 */
class TrailingStopTest {

    private val puzzles = TestPuzzles.all

    @Test
    fun `no board ends on a full stop`() {
        for (puzzle in puzzles) {
            val board = BoardState.forPuzzle(puzzle)
            val last = board.words.last().symbols.last()
            assertFalse(
                "${puzzle.id} still lays out a trailing stop",
                last.isPunctuation && last.char == ".",
            )
        }
    }

    @Test
    fun `the quote itself is untouched`() {
        // The share text, the clipping and the article reader all print
        // originalText, and a sentence with no full stop reads as truncated.
        val ending = puzzles.count { it.originalText.trimEnd().endsWith(".") }
        assertTrue("expected quotes that end in a stop", ending > 0)
    }

    @Test
    fun `dropping the stop costs no letters`() {
        for (puzzle in puzzles) {
            val cipher = PuzzleState.cipherForPuzzle(puzzle)
            val board = BoardState.forPuzzle(puzzle)
            // Only punctuation goes. Every letter cell the cipher produced is
            // still on the board, or the puzzle would be unsolvable.
            assertEquals(
                puzzle.id,
                cipher.words.sumOf { word -> word.symbols.count { !it.isPunctuation } },
                board.words.sumOf { word -> word.symbols.count { !it.isPunctuation } },
            )
        }
    }

    @Test
    fun `mid-sentence punctuation stays`() {
        // Apostrophes and interior commas are one of the five tells the Primer
        // teaches, so they are load-bearing, not decoration.
        val withApostrophe = puzzles.first { it.originalText.contains("'") }
        val board = BoardState.forPuzzle(withApostrophe)
        assertTrue(
            "an apostrophe must survive",
            board.words.any { word -> word.symbols.any { it.char == "'" } },
        )
    }
}
