package com.chroniclecryptogram.data

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class StandingsTest {

    private fun entry(
        uid: String,
        time: Int,
        hints: Int = 0,
        postedAt: Long = 0,
        checks: Int = 0,
    ) = LeaderboardEntry(
        uid = uid,
        codename = uid.uppercase(),
        timeSeconds = time,
        accuracy = 100,
        hintsUsed = hints,
        postedAt = postedAt,
        checksUsed = checks,
    )

    @Test
    fun `a clean solve outranks a quicker one that took help`() {
        val ranked = Standings.rank(
            listOf(entry("quick-hint", 30, hints = 1), entry("quick-check", 40, checks = 1), entry("clean", 600)),
            uid = null,
        )
        assertEquals(listOf("clean", "quick-hint", "quick-check"), ranked.entries.map { it.uid })
    }

    @Test
    fun `a slower clean filing is not replaced by a faster one that took help`() {
        val clean = entry("a", 600)
        assertEquals(false, Standings.isBetter(entry("a", 30, hints = 1), clean))
        assertEquals(true, Standings.isBetter(entry("a", 500), clean))
    }

    @Test
    fun `fastest first`() {
        val ranked = Standings.rank(
            listOf(entry("c", 300), entry("a", 100), entry("b", 200)),
            uid = null,
        )
        assertEquals(listOf("a", "b", "c"), ranked.entries.map { it.uid })
    }

    @Test
    fun `equal times are broken by fewer hints`() {
        val ranked = Standings.rank(
            listOf(entry("used-two", 100, hints = 2), entry("used-none", 100, hints = 0)),
            uid = null,
        )
        assertEquals(listOf("used-none", "used-two"), ranked.entries.map { it.uid })
    }

    /** Without a final tiebreak the order would depend on fetch order. */
    @Test
    fun `equal times and hints are broken by who posted first`() {
        val ranked = Standings.rank(
            listOf(entry("later", 100, postedAt = 2000), entry("earlier", 100, postedAt = 1000)),
            uid = null,
        )
        assertEquals(listOf("earlier", "later"), ranked.entries.map { it.uid })
    }

    /** A player improving their time must not appear on the board twice. */
    @Test
    fun `only a player's best time is listed`() {
        val ranked = Standings.rank(
            listOf(entry("a", 300, postedAt = 1), entry("a", 120, postedAt = 2), entry("b", 200)),
            uid = "a",
        )
        assertEquals(listOf("a", "b"), ranked.entries.map { it.uid })
        assertEquals(120, ranked.entries.first().timeSeconds)
        assertEquals(1, ranked.playerRank)
    }

    @Test
    fun `the player's rank is one-based`() {
        val ranked = Standings.rank(
            listOf(entry("a", 100), entry("me", 200), entry("c", 300)),
            uid = "me",
        )
        assertEquals(2, ranked.playerRank)
    }

    @Test
    fun `a player who has not posted has no rank`() {
        val ranked = Standings.rank(listOf(entry("a", 100)), uid = "me")
        assertNull(ranked.playerRank)
    }

    @Test
    fun `an empty board is empty rather than an error`() {
        val ranked = Standings.rank(emptyList(), uid = "me")
        assertEquals(emptyList<LeaderboardEntry>(), ranked.entries)
        assertNull(ranked.playerRank)
    }
}
