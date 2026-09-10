package com.chroniclecryptogram.cloud

import com.chroniclecryptogram.data.NoPuzzleStats
import com.chroniclecryptogram.data.PuzzleLiveStats
import com.chroniclecryptogram.data.PuzzleStatsRepository
import com.chroniclecryptogram.data.SolveReceipt
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

/**
 * The public per-puzzle counters.
 *
 * Both writes are transactions, and they have to be: `firestore.rules` gates
 * each counter increment on `existsAfter(...)` of a receipt document written in
 * the *same* transaction, and on `!exists(...)` of that receipt beforehand. That
 * pairing is what stops one player incrementing a public counter twice, and it
 * means a plain `set` or `FieldValue.increment` is refused. The shapes below are
 * ported from `recordPuzzleStart` and `recordPuzzleSolve` in the web's
 * `firebaseStore.ts` and must keep matching the rules exactly.
 *
 * Not exercised by an automated test: that needs real credentials. The
 * derivation the UI shows is pure and tested in `PuzzleStatsTest`.
 */
class FirestorePuzzleStats(private val db: FirebaseFirestore) : PuzzleStatsRepository {

    override suspend fun stats(puzzleId: String): PuzzleLiveStats {
        if (puzzleId.isEmpty()) return PuzzleLiveStats(puzzleId)
        val snapshot = db.collection(STATS).document(puzzleId).get().await()
        if (!snapshot.exists()) return PuzzleLiveStats(puzzleId)
        return PuzzleLiveStats(
            puzzleId = puzzleId,
            startedCount = snapshot.getLong("startedCount")?.toInt() ?: 0,
            completeCount = snapshot.getLong("completeCount")?.toInt() ?: 0,
            totalTimeSeconds = snapshot.getLong("totalTimeSeconds")?.toInt() ?: 0,
            fastestTime = snapshot.getLong("fastestTime")?.toInt(),
            fastestSolverName = snapshot.getString("fastestSolverName"),
        )
    }

    override suspend fun recordStart(uid: String, puzzleId: String): Result<Unit> = runCatching {
        val startRef = db.collection(STARTS).document(receiptId(uid, puzzleId))
        val statsRef = db.collection(STATS).document(puzzleId)

        db.runTransaction<Unit> { tx ->
            // Already counted for this player: the rules would refuse a second
            // increment anyway, so stopping here saves a rejected write.
            if (tx.get(startRef).exists()) return@runTransaction
            val stats = tx.get(statsRef)

            tx.set(
                startRef,
                mapOf(
                    "uid" to uid,
                    "puzzleId" to puzzleId,
                    "createdAt" to FieldValue.serverTimestamp(),
                ),
            )

            if (stats.exists()) {
                tx.update(
                    statsRef,
                    mapOf(
                        "startedCount" to (stats.getLong("startedCount") ?: 0L) + 1,
                        "updatedAt" to FieldValue.serverTimestamp(),
                    ),
                )
            } else {
                // The create shape is pinned by isValidStartCreate: these exact
                // values, and nulls rather than absent fields.
                tx.set(
                    statsRef,
                    mapOf(
                        "puzzleId" to puzzleId,
                        "startedCount" to 1,
                        "completeCount" to 0,
                        "totalTimeSeconds" to 0,
                        "fastestTime" to null,
                        "fastestSolverName" to null,
                        "updatedAt" to FieldValue.serverTimestamp(),
                    ),
                )
            }
        }.await()
    }

    override suspend fun recordSolve(
        uid: String,
        puzzleId: String,
        timeSeconds: Int,
        hintsUsed: Int,
        accuracy: Int,
        solverName: String,
    ): Result<Unit> = runCatching {
        // Outside the rules' bounds the write is refused, so it is not attempted.
        if (!SolveReceipt.isFileable(timeSeconds)) return@runCatching

        // A solve implies a start. isValidSolveCreate allows startedCount to be
        // 1 or 2 precisely because this may be the first write of either.
        recordStart(uid, puzzleId).getOrThrow()

        val solveRef = db.collection(SOLVES).document(receiptId(uid, puzzleId))
        val statsRef = db.collection(STATS).document(puzzleId)
        val name = solverName.ifBlank { "Anonymous" }.take(80)

        db.runTransaction<Unit> { tx ->
            if (tx.get(solveRef).exists()) return@runTransaction
            val stats = tx.get(statsRef)

            tx.set(
                solveRef,
                mapOf(
                    "uid" to uid,
                    "puzzleId" to puzzleId,
                    "timeSeconds" to timeSeconds,
                    "hintsUsed" to hintsUsed,
                    "accuracy" to accuracy,
                    "createdAt" to FieldValue.serverTimestamp(),
                ),
            )

            if (stats.exists()) {
                val previousFastest = stats.getLong("fastestTime")?.toInt()
                val isFastest = previousFastest == null || timeSeconds < previousFastest
                tx.update(
                    statsRef,
                    mapOf(
                        "completeCount" to (stats.getLong("completeCount") ?: 0L) + 1,
                        "totalTimeSeconds" to
                            (stats.getLong("totalTimeSeconds") ?: 0L) + timeSeconds,
                        "fastestTime" to if (isFastest) timeSeconds else previousFastest,
                        // The rules require the name to be unchanged when the
                        // time is not a new best, so it is carried over rather
                        // than rewritten.
                        "fastestSolverName" to if (isFastest) {
                            name
                        } else {
                            stats.getString("fastestSolverName")
                        },
                        "updatedAt" to FieldValue.serverTimestamp(),
                    ),
                )
            } else {
                tx.set(
                    statsRef,
                    mapOf(
                        "puzzleId" to puzzleId,
                        "startedCount" to 1,
                        "completeCount" to 1,
                        "totalTimeSeconds" to timeSeconds,
                        "fastestTime" to timeSeconds,
                        "fastestSolverName" to name,
                        "updatedAt" to FieldValue.serverTimestamp(),
                    ),
                )
            }
        }.await()
    }

    /** `{uid}_{puzzleId}`, the document id the rules reconstruct and compare. */
    private fun receiptId(uid: String, puzzleId: String) = "${uid}_$puzzleId"

    private companion object {
        const val STATS = "puzzleStats"
        const val STARTS = "starts"
        const val SOLVES = "solves"
    }
}

/** Builds the counters, or the no-op ones when Firebase is absent. */
fun createPuzzleStats(configured: Boolean): PuzzleStatsRepository =
    firebaseOrElse(configured, NoPuzzleStats) { FirestorePuzzleStats(FirebaseFirestore.getInstance()) }
