package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleProgress
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Test

/**
 * A known, deliberate divergence from the web, pinned here so it stays known.
 *
 * The desk clock counts in tenths and the bulletin prints them: `14:08.2`.
 * [PuzzleProgress.timerSeconds] is an `Int`, so the tenth is dropped the moment
 * the board is saved, and reopening a solved puzzle shows `14:08.0`.
 *
 * The web stores the same field as a JS `number` and its `normalizeProgress`
 * only clamps -- `Math.min(86400, Math.max(0, timerSeconds))` -- so it keeps the
 * fraction. A save written there and read here loses it.
 *
 * The golden fixtures did not catch this because every timer value in them is a
 * whole number, which is worth knowing about the harness as much as about the
 * bug.
 *
 * Left as it is on purpose: widening the field runs through `Merge`, `DeskState`
 * and `FirestoreDesk`, which is the most parity-sensitive code in the project,
 * and the visible cost is one tenth of a second on a reloaded solve. It should
 * be a decision, not a side effect of a polish pass.
 */
class TimerPrecisionTest {

    @Test
    fun `the stored timer keeps whole seconds only`() {
        val displayed = 848.2
        val stored = PuzzleProgress(timerSeconds = displayed.toInt())

        assertEquals(848, stored.timerSeconds)
        assertEquals("14:08.2", Solve.formatTime(displayed))
        // What the player sees after reopening the puzzle.
        assertEquals("14:08.0", Solve.formatTime(stored.timerSeconds.toDouble()))
        assertNotEquals(
            Solve.formatTime(displayed),
            Solve.formatTime(stored.timerSeconds.toDouble()),
            "if these ever match, the field was widened and this test is obsolete",
        )
    }

    @Test
    fun `a posted time is unaffected, because the board posts whole seconds`() {
        // The leaderboard and the public counters both take an Int, so nothing
        // about ranking or the solve rate changes -- this is display only.
        assertEquals(848, 848.2.toInt())
        assertEquals(848, 848.9.toInt())
    }
}
