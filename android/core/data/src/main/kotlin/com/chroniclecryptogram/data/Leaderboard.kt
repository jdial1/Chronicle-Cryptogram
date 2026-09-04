package com.chroniclecryptogram.data

/**
 * One posted time.
 *
 * `timeSeconds` and `accuracy` are asserted by the client. `firestore.rules`
 * range-checks them but cannot verify them, so nothing in the UI may describe an
 * entry as verified or certified -- the web copy was corrected for exactly this
 * reason and the wording must not creep back in here.
 */
data class LeaderboardEntry(
    val uid: String,
    val codename: String,
    val timeSeconds: Int,
    val accuracy: Int,
    val hintsUsed: Int,
    val postedAt: Long,
)

/** Where a posted time lands, once the board is known. */
data class LeaderboardStanding(
    val entries: List<LeaderboardEntry>,
    /** 1-based, or null when this player has not posted. */
    val playerRank: Int?,
)

interface Leaderboard {
    suspend fun standings(puzzleId: String, uid: String?): LeaderboardStanding
    suspend fun post(puzzleId: String, entry: LeaderboardEntry)
}

/** No network, no board. Keeps the screen renderable in a credential-less build. */
object NoLeaderboard : Leaderboard {
    override suspend fun standings(puzzleId: String, uid: String?) =
        LeaderboardStanding(emptyList(), null)

    override suspend fun post(puzzleId: String, entry: LeaderboardEntry) = Unit
}

object Standings {

    /**
     * Orders a board and finds the player in it.
     *
     * Fastest first; ties broken by fewer hints, then by who posted first, so
     * the order is total and stable rather than dependent on fetch order. One
     * entry per uid -- a player's own better time replaces their earlier one
     * instead of appearing twice.
     */
    fun rank(entries: List<LeaderboardEntry>, uid: String?): LeaderboardStanding {
        val best = entries
            .groupBy { it.uid }
            .values
            .map { forUid -> forUid.minWith(ordering) }

        val ordered = best.sortedWith(ordering)
        val rank = uid?.let { id ->
            ordered.indexOfFirst { it.uid == id }.takeIf { it >= 0 }?.plus(1)
        }
        return LeaderboardStanding(ordered, rank)
    }

    private val ordering = compareBy<LeaderboardEntry>(
        { it.timeSeconds },
        { it.hintsUsed },
        { it.postedAt },
    )
}
