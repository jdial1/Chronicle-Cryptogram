package com.chroniclecryptogram.cipher

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/** Mirrors `src/hooks/useDeskTimer.test.ts`, plus the drift case over a full minute. */
class DeskTimerTest {

    @Test
    fun `stays on one decimal without float drift`() {
        var seconds = 0.0
        repeat(10) { seconds = DeskTimer.advanceDeskClock(seconds) }
        assertEquals(1.0, seconds)
        assertEquals(13.0, DeskTimer.advanceDeskClock(12.9))
    }

    @Test
    fun `six hundred ticks land exactly on sixty seconds`() {
        var seconds = 0.0
        repeat(600) { seconds = DeskTimer.advanceDeskClock(seconds) }
        // Naive Double addition drifts to 59.99999999999873 here.
        assertEquals(60.0, seconds)
    }
}
