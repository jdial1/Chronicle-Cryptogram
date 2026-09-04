package com.chroniclecryptogram.cloud

import com.chroniclecryptogram.data.Leaderboard
import com.chroniclecryptogram.data.LeaderboardEntry
import com.chroniclecryptogram.data.LeaderboardStanding
import com.chroniclecryptogram.data.NoLeaderboard
import com.chroniclecryptogram.data.Posting
import com.chroniclecryptogram.data.Standings
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.tasks.await

/**
 * The Firestore-backed board.
 *
 * Paths and field names are fixed by `firestore.rules`, which is shared with the
 * web app and deliberately unchanged by this port: `leaderboard/{puzzleId}/
 * entries/{uid}`, one document per player per puzzle. The rules enforce a field
 * allowlist, so the map below is built explicitly rather than by serialising the
 * model -- an extra field is a rejected write, not a stored one.
 *
 * Reads are public by rule (`allow read: if true`), so standings render for a
 * player who has not signed in. Writing needs auth.
 *
 * Not exercised by an automated test: that needs real credentials and a device.
 * The ordering it feeds is pure and tested in `StandingsTest`.
 */
class FirestoreLeaderboard(private val db: FirebaseFirestore) : Leaderboard {

    override suspend fun standings(puzzleId: String, uid: String?): LeaderboardStanding {
        if (puzzleId.isEmpty()) return LeaderboardStanding(emptyList(), null)

        val snapshot = db.collection(LEADERBOARD)
            .document(puzzleId)
            .collection(ENTRIES)
            .orderBy("timeSeconds", Query.Direction.ASCENDING)
            .limit(BOARD_LIMIT)
            .get()
            .await()

        // Ranked locally rather than trusted from the query: the server can only
        // order by time, and ties are broken by hints and then by who posted
        // first, which is what makes the order total and stable.
        return Standings.rank(snapshot.documents.mapNotNull { it.toEntry() }, uid)
    }

    override suspend fun post(
        puzzleId: String,
        entry: LeaderboardEntry,
    ): Result<LeaderboardStanding> = runCatching {
        Posting.reject(entry)?.let { error(it) }

        val ref = db.collection(LEADERBOARD)
            .document(puzzleId)
            .collection(ENTRIES)
            .document(entry.uid)

        // A worse time never overwrites a better one. The board is a personal
        // best per player, so replaying a puzzle cannot cost someone their rank.
        val existing = ref.get().await().toEntry()
        if (existing == null || entry.timeSeconds < existing.timeSeconds) {
            ref.set(entry.toDocument(puzzleId)).await()
        }

        standings(puzzleId, entry.uid)
    }

    private fun LeaderboardEntry.toDocument(puzzleId: String): Map<String, Any> = mapOf(
        "uid" to uid,
        "puzzleId" to puzzleId,
        "codename" to codename.take(24),
        "titleBadge" to titleBadge.take(60),
        "timeSeconds" to timeSeconds,
        "timeFormatted" to timeFormatted.take(16),
        "hintsUsed" to hintsUsed,
        "accuracy" to accuracy,
        "countryCode" to countryCode.uppercase().take(2),
        // The server's clock, not the device's: the rules require a recent
        // timestamp, and a phone with a wrong clock would be rejected forever.
        "timestamp" to FieldValue.serverTimestamp(),
    )

    private fun DocumentSnapshot.toEntry(): LeaderboardEntry? {
        if (!exists()) return null
        val uid = getString("uid") ?: id
        val time = getLong("timeSeconds")?.toInt() ?: return null
        return LeaderboardEntry(
            uid = uid,
            codename = getString("codename").orEmpty(),
            timeSeconds = time,
            accuracy = getLong("accuracy")?.toInt() ?: 0,
            hintsUsed = getLong("hintsUsed")?.toInt() ?: 0,
            // A document written moments ago still has a null server timestamp
            // locally. Treating that as "now" keeps it from sorting to the front
            // of every tie-break.
            postedAt = (get("timestamp") as? Timestamp)?.toDate()?.time
                ?: System.currentTimeMillis(),
            titleBadge = getString("titleBadge").orEmpty(),
            timeFormatted = getString("timeFormatted").orEmpty(),
            countryCode = getString("countryCode").orEmpty(),
        )
    }

    private companion object {
        const val LEADERBOARD = "leaderboard"
        const val ENTRIES = "entries"

        /** The same cap the web query uses. */
        const val BOARD_LIMIT = 100L
    }
}

/**
 * Builds the board, or the no-op one when Firebase is absent or unconfigured.
 *
 * Lives here so `:app` never names a Firebase type and stays compilable in a
 * build with no credentials.
 */
fun createLeaderboard(configured: Boolean): Leaderboard = try {
    if (configured) FirestoreLeaderboard(FirebaseFirestore.getInstance()) else NoLeaderboard
} catch (error: Throwable) {
    NoLeaderboard
}
