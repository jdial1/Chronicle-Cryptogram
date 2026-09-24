package com.chroniclecryptogram.board

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The Primer's tells confirm in sets, and the tally's worksheet counts, both pinned
 * against the same cases as `src/game/deskTools.test.ts`.
 */
class PrimerSetsTest {

    private val primer = BoardState.forPuzzle(TestPuzzles.all.first { it.id == "day_0_primer" })

    private fun only(letters: List<String>) = primer.answer.filterValues { it in letters }

    @Test
    fun `one letter of a set says nothing on its own`() {
        assertFalse(lettersSolved(primer.words, only(listOf("I")), listOf("I", "A")))
        assertTrue(lettersSolved(primer.words, only(listOf("I", "A")), listOf("I", "A")))
    }

    @Test
    fun `the worksheet counts word starts and doubles by glyph`() {
        // I CAN'T SEE THE WORD THE AND LOOK AT A DOUBLE LETTER TOO. The tally lists
        // only glyphs that repeat, which all four of these letters do.
        fun row(letter: String): Pair<Int, Int> {
            val id = primer.answer.entries.first { it.value == letter }.key
            val item = primer.tally.first { it.symbolId == id }
            return item.starts to item.doubled
        }
        assertEquals(3 to 1, row("T"))
        assertEquals(3 to 0, row("A"))
        assertEquals(0 to 2, row("O"))
        assertEquals(0 to 1, row("E"))
    }
}
