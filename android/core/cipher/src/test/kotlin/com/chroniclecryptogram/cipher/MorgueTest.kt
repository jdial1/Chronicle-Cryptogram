package com.chroniclecryptogram.cipher

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/** Mirrors the morgue cases in `src/game/deskTools.test.ts`. */
class MorgueTest {

    private val puzzles = Content.puzzles

    @Test
    fun `the morgue answers only from pages the agent has decoded`() {
        val every = puzzles.map { it.id }.toSet()
        val all = Morgue.search(puzzles, every, "champagne")
        assertTrue(all.isNotEmpty())
        // Nothing solved, nothing found: an open page can never confirm a guess.
        assertEquals(emptyList<Any>(), Morgue.search(puzzles, emptySet(), "champagne"))
        assertEquals(listOf(all.first()), Morgue.search(puzzles, setOf(all.first().id), "champagne"))
    }

    @Test
    fun `searches too short to mean anything find nothing`() {
        assertEquals(emptyList<Any>(), Morgue.search(puzzles, puzzles.map { it.id }.toSet(), "th"))
    }
}
