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
    /** The rank the poster chose for themselves. Decoration, not earned. */
    val titleBadge: String = TitleBadges.first(),
    /** `mm:ss.t`. Stored as posted so the board reads identically on both apps. */
    val timeFormatted: String = "",
    val countryCode: String = "US",
)

/** The ranks a poster can put beside their name, in the web build's order. */
val TitleBadges = listOf(
    "Grandmaster Cryptanalyst",
    "Senior Bureau Inspector",
    "Broadsheet Cipher Breaker",
    "Codebreaker Specialist",
    "Field Operative",
    "Cadet Decryptor",
)

/**
 * Whether a posting can be written at all.
 *
 * `firestore.rules` enforces every one of these server-side and rejects the
 * write otherwise. Checking here first turns a permission-denied crash into a
 * sentence the player can act on, and the two must agree -- if the rules change,
 * this changes with them.
 */
object Posting {

    const val MIN_SECONDS = 5
    const val MAX_SECONDS = 86_400

    fun clipCodename(raw: String): String = raw.trim().take(24)

    /** Null when the entry is postable, otherwise why it is not. */
    fun reject(entry: LeaderboardEntry): String? = when {
        entry.codename.isBlank() -> "Choose a codename before posting a time."
        entry.codename.length > 24 -> "A codename is at most 24 characters."
        entry.titleBadge.isBlank() || entry.titleBadge.length > 60 -> "Choose a title."
        entry.timeSeconds < MIN_SECONDS ->
            "The bureau does not take times under $MIN_SECONDS seconds."
        entry.timeSeconds > MAX_SECONDS -> "That time is too long to post."
        entry.accuracy !in 0..100 -> "That accuracy cannot be right."
        entry.hintsUsed !in 0..20 -> "That hint count cannot be right."
        !entry.countryCode.matches(Regex("^[A-Z]{2}$")) ->
            "A country is two letters, like US."
        entry.timeFormatted.isBlank() || entry.timeFormatted.length > 16 ->
            "That time could not be formatted."
        else -> null
    }
}

/** Where a posted time lands, once the board is known. */
data class LeaderboardStanding(
    val entries: List<LeaderboardEntry>,
    /** 1-based, or null when this player has not posted. */
    val playerRank: Int?,
)

interface Leaderboard {
    suspend fun standings(puzzleId: String, uid: String?): LeaderboardStanding

    /**
     * Posts a time, keeping the better of it and whatever this player already
     * posted. Returns where they now stand.
     */
    suspend fun post(puzzleId: String, entry: LeaderboardEntry): Result<LeaderboardStanding>
}

/** No network, no board. Keeps the screen renderable in a credential-less build. */
object NoLeaderboard : Leaderboard {
    override suspend fun standings(puzzleId: String, uid: String?) =
        LeaderboardStanding(emptyList(), null)

    override suspend fun post(puzzleId: String, entry: LeaderboardEntry) =
        Result.failure<LeaderboardStanding>(IllegalStateException("This build has no bureau credentials."))
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
