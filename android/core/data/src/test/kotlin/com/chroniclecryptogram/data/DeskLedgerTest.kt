package com.chroniclecryptogram.data

import com.chroniclecryptogram.cipher.model.PuzzleProgress
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/** Mirrors `src/utils/deskLedger.test.ts`, so both desks keep the same books. */
class DeskLedgerTest {

    private fun board(hints: Int = 0, checks: Int = 0, solved: Boolean = true) =
        PuzzleProgress(hintsUsed = hints, checksUsed = checks, isSolved = solved)

    @Test
    fun `a page is clean only when solved with no hint and no check`() {
        assertTrue(DeskLedger.isClean(board()))
        assertFalse(DeskLedger.isClean(board(checks = 1)))
        assertFalse(DeskLedger.isClean(board(hints = 1)))
        assertFalse(DeskLedger.isClean(board(solved = false)))
        assertFalse(DeskLedger.isClean(null))
    }

    @Test
    fun `the ledger keeps books on help taken across solved pages`() {
        val state = DeskState(
            progress = mapOf("a" to board(), "b" to board(hints = 2), "c" to board(checks = 1)),
            solvedPuzzleIds = listOf("a", "b", "c", "a"),
        )
        assertEquals(
            DeskLedger(decoded = 3, clean = 1, hintsTaken = 2, checksTaken = 1, cleanPuzzleIds = setOf("a")),
            DeskLedger.of(state),
        )
    }
}
