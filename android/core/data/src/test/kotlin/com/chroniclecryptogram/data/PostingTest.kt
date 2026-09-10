package com.chroniclecryptogram.data

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * The client-side half of the posting contract.
 *
 * Every rule here is also enforced by `firestore.rules`, which is shared with
 * the web app. Checking first turns a permission-denied crash into a sentence
 * the player can act on -- but the two must agree, so if the rules move, these
 * move with them. The bounds below are quoted from `isValidLeaderboard`.
 */
class PostingTest {

    private fun entry(
        codename: String = "Nightdesk",
        timeSeconds: Int = 120,
        accuracy: Int = 100,
        hintsUsed: Int = 0,
        titleBadge: String = TitleBadges.first(),
        timeFormatted: String = "02:00.0",
        countryCode: String = "US",
    ) = LeaderboardEntry(
        uid = "uid-1",
        codename = codename,
        timeSeconds = timeSeconds,
        accuracy = accuracy,
        hintsUsed = hintsUsed,
        postedAt = 0L,
        titleBadge = titleBadge,
        timeFormatted = timeFormatted,
        countryCode = countryCode,
    )

    @Test
    fun `a complete entry is postable`() {
        assertNull(Posting.reject(entry()))
    }

    @Test
    fun `a time must have a name on it`() {
        // Posting is publishing. An unnamed entry is refused here rather than
        // being given a placeholder, because the player never chose one.
        assertNotNull(Posting.reject(entry(codename = "   ")))
    }

    @Test
    fun `the rules' time bounds are enforced before the write`() {
        assertNotNull(Posting.reject(entry(timeSeconds = Posting.MIN_SECONDS - 1)))
        assertNull(Posting.reject(entry(timeSeconds = Posting.MIN_SECONDS)))
        assertNull(Posting.reject(entry(timeSeconds = Posting.MAX_SECONDS)))
        assertNotNull(Posting.reject(entry(timeSeconds = Posting.MAX_SECONDS + 1)))
    }

    @Test
    fun `a country code is exactly two capitals`() {
        assertNotNull(Posting.reject(entry(countryCode = "usa")))
        assertNotNull(Posting.reject(entry(countryCode = "u")))
        assertNotNull(Posting.reject(entry(countryCode = "us")))
        assertNull(Posting.reject(entry(countryCode = "GB")))
    }

    @Test
    fun `out-of-range figures are refused`() {
        assertNotNull(Posting.reject(entry(accuracy = 101)))
        assertNotNull(Posting.reject(entry(accuracy = -1)))
        assertNotNull(Posting.reject(entry(hintsUsed = 21)))
    }

    @Test
    fun `a codename is trimmed and clipped to the rules' limit`() {
        assertEquals("Nightdesk", Posting.clipCodename("  Nightdesk  "))
        val long = Posting.clipCodename("x".repeat(80))
        assertEquals(24, long.length)
        assertNull(Posting.reject(entry(codename = long)))
    }

    @Test
    fun `a codename over the limit is refused rather than silently truncated`() {
        // Truncation is the store's job on the way in. By the time an entry is
        // built, an over-long name means something upstream skipped that step.
        assertNotNull(Posting.reject(entry(codename = "x".repeat(25))))
    }
}
