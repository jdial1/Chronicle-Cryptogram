package com.chroniclecryptogram.data

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The public figures, derived exactly as the web's `derivePublicStats` does.
 *
 * Both apps quote these numbers for the same puzzle, so a rounding difference
 * would have two clients disagreeing about the same document.
 */
class PuzzleStatsTest {

    @Test
    fun `an unplayed puzzle reports nothing rather than zeroes it cannot justify`() {
        val stats = PuzzleLiveStats("p").derivePublicStats()

        assertEquals(0, stats.totalSolvers)
        assertEquals(0.0, stats.solveRatePercentage)
        assertEquals(0.0, stats.averageTimeSeconds)
        assertFalse(stats.hasSolves)
    }

    @Test
    fun `a null stats document derives the same as an empty one`() {
        assertEquals(
            PuzzleLiveStats("p").derivePublicStats(),
            (null as PuzzleLiveStats?).derivePublicStats(),
        )
    }

    @Test
    fun `the solve rate keeps one decimal, as the web rounds it`() {
        // 1 of 3 is 33.333...%, and the web rounds to one decimal.
        val stats = PuzzleLiveStats("p", startedCount = 3, completeCount = 1).derivePublicStats()
        assertEquals(33.3, stats.solveRatePercentage)
    }

    @Test
    fun `the average is the total over the completions`() {
        val stats = PuzzleLiveStats(
            "p",
            startedCount = 4,
            completeCount = 4,
            totalTimeSeconds = 250,
        ).derivePublicStats()

        assertEquals(62.5, stats.averageTimeSeconds)
        assertEquals(100.0, stats.solveRatePercentage)
        assertTrue(stats.hasSolves)
    }

    @Test
    fun `a started-but-never-solved puzzle does not divide by zero`() {
        val stats = PuzzleLiveStats("p", startedCount = 9, completeCount = 0).derivePublicStats()
        assertEquals(0.0, stats.averageTimeSeconds)
        assertEquals(0.0, stats.solveRatePercentage)
    }

    @Test
    fun `only times the rules would accept are filed`() {
        // Mirrors isValidSolve: a write outside these bounds is refused, so it
        // is never attempted.
        assertFalse(SolveReceipt.isFileable(SolveReceipt.MIN_SECONDS - 1))
        assertTrue(SolveReceipt.isFileable(SolveReceipt.MIN_SECONDS))
        assertTrue(SolveReceipt.isFileable(SolveReceipt.MAX_SECONDS))
        assertFalse(SolveReceipt.isFileable(SolveReceipt.MAX_SECONDS + 1))
    }
}
