package com.chroniclecryptogram.data

/**
 * The public counters for one puzzle, as stored in `puzzleStats/{puzzleId}`.
 *
 * Everything here is aggregated from what clients reported about themselves.
 * `firestore.rules` constrains *how* the counters may move -- one increment per
 * player, tied to a receipt written in the same transaction -- but it cannot
 * verify that a reported time is honest. So this may be described as what
 * solvers filed, never as verified.
 */
data class PuzzleLiveStats(
    val puzzleId: String,
    val startedCount: Int = 0,
    val completeCount: Int = 0,
    val totalTimeSeconds: Int = 0,
    val fastestTime: Int? = null,
    val fastestSolverName: String? = null,
)

/**
 * The figures the bulletin shows, derived exactly as `derivePublicStats` does on
 * the web so the two apps never quote different numbers for the same puzzle.
 */
data class PublicStats(
    val quickestSolveTime: Int,
    val totalSolvers: Int,
    /** Percentage to one decimal, matching the web's `round(x * 1000) / 10`. */
    val solveRatePercentage: Double,
    val averageTimeSeconds: Double,
    val fastestSolverName: String?,
) {
    val hasSolves: Boolean get() = totalSolvers > 0
}

fun PuzzleLiveStats?.derivePublicStats(): PublicStats {
    val started = this?.startedCount ?: 0
    val complete = this?.completeCount ?: 0
    return PublicStats(
        quickestSolveTime = this?.fastestTime ?: 0,
        totalSolvers = complete,
        solveRatePercentage = if (started > 0) {
            Math.round(complete.toDouble() / started * 1000) / 10.0
        } else {
            0.0
        },
        averageTimeSeconds = if (complete > 0) {
            (this?.totalTimeSeconds ?: 0).toDouble() / complete
        } else {
            0.0
        },
        fastestSolverName = this?.fastestSolverName,
    )
}

/**
 * The public counters, behind an interface so the bulletin can be driven by a
 * fake and so a build with no credentials still renders.
 *
 * Both writes are transactional by necessity, not by preference: the rules gate
 * each counter increment on a receipt document (`starts/{uid}_{puzzleId}`,
 * `solves/{uid}_{puzzleId}`) existing *after* the same write, which is what
 * stops one player incrementing a counter twice. A non-transactional write is
 * rejected.
 */
interface PuzzleStatsRepository {

    suspend fun stats(puzzleId: String): PuzzleLiveStats

    /** Counted once per player per puzzle; a repeat is a no-op by rule. */
    suspend fun recordStart(uid: String, puzzleId: String): Result<Unit>

    suspend fun recordSolve(
        uid: String,
        puzzleId: String,
        timeSeconds: Int,
        hintsUsed: Int,
        accuracy: Int,
        solverName: String,
    ): Result<Unit>
}

/** No credentials: the bulletin says it has nothing rather than showing zeroes. */
object NoPuzzleStats : PuzzleStatsRepository {
    override suspend fun stats(puzzleId: String) = PuzzleLiveStats(puzzleId)
    override suspend fun recordStart(uid: String, puzzleId: String) = Result.success(Unit)
    override suspend fun recordSolve(
        uid: String,
        puzzleId: String,
        timeSeconds: Int,
        hintsUsed: Int,
        accuracy: Int,
        solverName: String,
    ) = Result.success(Unit)
}

/** The same bounds `isValidSolve` enforces. A time outside them is not filed. */
object SolveReceipt {
    const val MIN_SECONDS = 5
    const val MAX_SECONDS = 86_400

    fun isFileable(timeSeconds: Int): Boolean = timeSeconds in MIN_SECONDS..MAX_SECONDS
}
