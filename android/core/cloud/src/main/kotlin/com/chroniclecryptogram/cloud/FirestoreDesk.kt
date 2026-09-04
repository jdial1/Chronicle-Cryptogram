package com.chroniclecryptogram.cloud

import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import com.chroniclecryptogram.data.CloudDesk
import com.chroniclecryptogram.data.CloudSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.tasks.await

/**
 * The Firestore-backed desk.
 *
 * **Document paths are fixed by `firestore.rules`**, which is shared with the
 * web app and deliberately unchanged by this port. Every path below was checked
 * against that file; changing one here means changing the rules, which means
 * changing the web too.
 *
 * Rules also enforce per-collection field allowlists and range checks, so a
 * write with an unexpected field is rejected server-side rather than stored.
 * That is why the maps below are built explicitly instead of serialising the
 * model objects wholesale.
 *
 * Not exercised by an automated test: doing so needs real credentials and a
 * device. The reconciliation rules it feeds are tested against fakes in
 * `CloudDeskTest`, and the merge itself is fixture-pinned against the web.
 */
class FirestoreDesk(private val db: FirebaseFirestore) : CloudDesk {

    override suspend fun fetch(uid: String): CloudSnapshot? {
        val user = db.collection(USERS).document(uid).get().await()
        if (!user.exists()) return null

        val progress = db.collection(USERS).document(uid).collection(PROGRESS)
            .get().await()
            .documents
            .mapNotNull { doc -> doc.toProgress()?.let { doc.id to it } }
            .toMap()

        val hints = db.collection(USERS).document(uid).collection(DAILY_HINTS)
            .get().await()
            .documents
            .mapNotNull { doc -> doc.toWallet()?.let { doc.id to it } }
            .toMap()

        val checks = db.collection(USERS).document(uid).collection(DAILY_CHECKS)
            .get().await()
            .documents
            .mapNotNull { doc -> doc.toWallet()?.let { doc.id to it } }
            .toMap()

        @Suppress("UNCHECKED_CAST")
        val solved = (user.get("solvedPuzzleIds") as? List<String>).orEmpty()

        return CloudSnapshot(
            progress = progress,
            hints = hints,
            checks = checks,
            solvedPuzzleIds = solved,
            stats = user.toStats(),
            updatedAt = user.getLong("updatedAt") ?: 0L,
        )
    }

    override suspend fun pushProgress(uid: String, puzzleId: String, progress: PuzzleProgress) {
        db.collection(USERS).document(uid).collection(PROGRESS).document(puzzleId)
            .set(progress.toMap(), SetOptions.merge())
            .await()
    }

    override suspend fun pushWallets(
        uid: String,
        edition: Int,
        hints: DailyHintWallet,
        checks: DailyHintWallet,
    ) {
        val user = db.collection(USERS).document(uid)
        // The rules validate the document id as ^[0-9]{1,3}$ -- edition numbers,
        // never the date keys an earlier design used.
        user.collection(DAILY_HINTS).document(edition.toString())
            .set(hints.toMap(), SetOptions.merge()).await()
        user.collection(DAILY_CHECKS).document(edition.toString())
            .set(checks.toMap(), SetOptions.merge()).await()
    }

    override suspend fun pushStats(uid: String, stats: GameStats, solvedPuzzleIds: List<String>) {
        db.collection(USERS).document(uid)
            .set(
                mapOf(
                    "puzzlesPlayed" to stats.puzzlesPlayed,
                    "puzzlesSolved" to stats.puzzlesSolved,
                    "fastestTime" to stats.fastestTime,
                    "totalTimePlayed" to stats.totalTimePlayed,
                    "averageAccuracy" to stats.averageAccuracy,
                    "leaderboardSubmissions" to stats.leaderboardSubmissions,
                    "solvedPuzzleIds" to solvedPuzzleIds,
                    "updatedAt" to System.currentTimeMillis(),
                ),
                SetOptions.merge(),
            )
            .await()
    }

    /**
     * Removes the account's own documents.
     *
     * `starts/` and `solves/` receipts stay: the rules make them non-deletable so
     * a client cannot delete a receipt and re-run the increment to pump the
     * public counters. They hold no personal data, only a uid-scoped id.
     */
    override suspend fun deleteAccountData(uid: String) {
        val user = db.collection(USERS).document(uid)
        for (collection in listOf(PROGRESS, DAILY_HINTS, DAILY_CHECKS)) {
            user.collection(collection).get().await().documents.forEach { it.reference.delete().await() }
        }
        user.delete().await()
    }

    private companion object {
        const val USERS = "users"
        const val PROGRESS = "progress"
        const val DAILY_HINTS = "dailyHints"
        const val DAILY_CHECKS = "dailyChecks"
    }
}

private fun PuzzleProgress.toMap(): Map<String, Any?> = mapOf(
    "mappings" to mappings,
    "timerSeconds" to timerSeconds,
    "hintsUsed" to hintsUsed,
    "hintsRemaining" to hintsRemaining,
    "hintedSymbolIds" to hintedSymbolIds,
    "checksUsed" to checksUsed,
    "checksRemaining" to checksRemaining,
    "verifiedSymbolIds" to verifiedSymbolIds,
    "flaggedSymbolIds" to flaggedSymbolIds,
    "selectedSymbolId" to selectedSymbolId,
    "isSolved" to isSolved,
    "updatedAt" to updatedAt,
)

private fun DailyHintWallet.toMap(): Map<String, Any?> = mapOf(
    "edition" to edition,
    "used" to used,
    "remaining" to remaining,
)

@Suppress("UNCHECKED_CAST")
private fun com.google.firebase.firestore.DocumentSnapshot.toProgress(): PuzzleProgress? {
    if (!exists()) return null
    return PuzzleProgress(
        mappings = (get("mappings") as? Map<String, String>).orEmpty(),
        timerSeconds = (getLong("timerSeconds") ?: 0L).toInt(),
        hintsUsed = (getLong("hintsUsed") ?: 0L).toInt(),
        hintsRemaining = (getLong("hintsRemaining") ?: 3L).toInt(),
        hintedSymbolIds = (get("hintedSymbolIds") as? List<String>).orEmpty(),
        checksUsed = (getLong("checksUsed") ?: 0L).toInt(),
        checksRemaining = (getLong("checksRemaining") ?: 3L).toInt(),
        verifiedSymbolIds = (get("verifiedSymbolIds") as? List<String>).orEmpty(),
        flaggedSymbolIds = (get("flaggedSymbolIds") as? List<String>).orEmpty(),
        selectedSymbolId = getString("selectedSymbolId"),
        isSolved = getBoolean("isSolved") ?: false,
        updatedAt = getLong("updatedAt"),
    )
}

private fun com.google.firebase.firestore.DocumentSnapshot.toWallet(): DailyHintWallet? {
    if (!exists()) return null
    val edition = (getLong("edition") ?: id.toLongOrNull() ?: return null).toInt()
    return DailyHintWallet(
        edition = edition,
        used = (getLong("used") ?: 0L).toInt(),
        remaining = (getLong("remaining") ?: 3L).toInt(),
    )
}

private fun com.google.firebase.firestore.DocumentSnapshot.toStats() = GameStats(
    puzzlesPlayed = (getLong("puzzlesPlayed") ?: 0L).toInt(),
    puzzlesSolved = (getLong("puzzlesSolved") ?: 0L).toInt(),
    fastestTime = getLong("fastestTime")?.toInt(),
    totalTimePlayed = (getLong("totalTimePlayed") ?: 0L).toInt(),
    averageAccuracy = (getLong("averageAccuracy") ?: 100L).toInt(),
    leaderboardSubmissions = (getLong("leaderboardSubmissions") ?: 0L).toInt(),
)
