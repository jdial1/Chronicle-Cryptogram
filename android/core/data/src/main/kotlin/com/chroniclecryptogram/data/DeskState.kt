package com.chroniclecryptogram.data

import com.chroniclecryptogram.cipher.Merge
import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import kotlinx.serialization.Serializable

/**
 * Everything the game remembers on this device, in one record.
 *
 * The whole desk is a single value rather than a row per puzzle because it never
 * exceeds 61 entries and is always read in full at boot. Room would cost KSP, a
 * schema directory, migration tests and DAOs for a dataset that small; see
 * [DeskStore] for the note on when that trade flips.
 *
 * Field names here are a fresh contract, not a mirror of the web's localStorage
 * keys. `storageKeys.ts` warns "do not rename -- that would reset solvers", but
 * the app has never shipped on Android so there is nothing to reset.
 */
@Serializable
data class DeskState(
    /** puzzle id -> that puzzle's board. */
    val progress: Map<String, PuzzleProgress> = emptyMap(),
    /** edition number -> wallet. Keyed by edition, never by date. */
    val hints: Map<String, DailyHintWallet> = emptyMap(),
    val checks: Map<String, DailyHintWallet> = emptyMap(),
    val solvedPuzzleIds: List<String> = emptyList(),
    val stats: GameStats = GameStats(),
    val updatedAt: Long = 0L,
)

/**
 * Pure transitions over [DeskState].
 *
 * Every rule lives here rather than in the store so it can be tested without a
 * filesystem, and so the cloud merge in a later phase can reuse it unchanged.
 */
object DeskActions {

    fun progressFor(state: DeskState, puzzleId: String): PuzzleProgress? = state.progress[puzzleId]

    /** Saves a board, clamping it on the way in. Local storage is untrusted. */
    fun saveProgress(
        state: DeskState,
        puzzleId: String,
        progress: PuzzleProgress,
        now: Long,
    ): DeskState = state.copy(
        progress = state.progress + (puzzleId to Merge.progressFields(progress)),
        updatedAt = now,
    )

    /**
     * Records a solve. Idempotent: solving the same puzzle twice must not inflate
     * the campaign count, which is what the archive and the front page derive from.
     */
    fun recordSolve(
        state: DeskState,
        puzzleId: String,
        timerSeconds: Int,
        now: Long,
    ): DeskState {
        if (puzzleId in state.solvedPuzzleIds) return state.copy(updatedAt = now)
        val stats = state.stats
        return state.copy(
            solvedPuzzleIds = state.solvedPuzzleIds + puzzleId,
            stats = stats.copy(
                puzzlesSolved = stats.puzzlesSolved + 1,
                totalTimePlayed = stats.totalTimePlayed + timerSeconds,
                fastestTime = when (val best = stats.fastestTime) {
                    null -> timerSeconds
                    else -> minOf(best, timerSeconds)
                },
            ),
            updatedAt = now,
        )
    }

    fun recordStart(state: DeskState, now: Long): DeskState = state.copy(
        stats = state.stats.copy(puzzlesPlayed = state.stats.puzzlesPlayed + 1),
        updatedAt = now,
    )

    fun hintWallet(state: DeskState, edition: Int): DailyHintWallet =
        state.hints[edition.toString()] ?: Merge.clipDailyWallet(edition, 0.0)

    fun checkWallet(state: DeskState, edition: Int): DailyHintWallet =
        state.checks[edition.toString()] ?: Merge.clipDailyWallet(edition, 0.0)

    fun saveHintWallet(state: DeskState, wallet: DailyHintWallet, now: Long): DeskState =
        state.copy(hints = state.hints + (wallet.edition.toString() to wallet), updatedAt = now)

    fun saveCheckWallet(state: DeskState, wallet: DailyHintWallet, now: Long): DeskState =
        state.copy(checks = state.checks + (wallet.edition.toString() to wallet), updatedAt = now)

    /**
     * Reconciles a wallet against what the saved boards actually consumed, which
     * is what stops a wallet drifting away from the hints a player really spent
     * if a write is lost.
     */
    fun reconcileHints(
        state: DeskState,
        edition: Int,
        puzzles: List<Pair<String, Int>>,
    ): DailyHintWallet {
        val fromBoards = Merge.usedHintsFromProgress(edition, puzzles, state.progress)
        val stored = hintWallet(state, edition).used
        return Merge.clipDailyWallet(edition, maxOf(stored, fromBoards).toDouble())
    }

    fun reconcileChecks(
        state: DeskState,
        edition: Int,
        puzzles: List<Pair<String, Int>>,
    ): DailyHintWallet {
        val fromBoards = Merge.usedChecksFromProgress(edition, puzzles, state.progress)
        val stored = checkWallet(state, edition).used
        return Merge.clipDailyWallet(edition, maxOf(stored, fromBoards).toDouble())
    }

    /**
     * Folds a cloud snapshot into the local desk, reusing the merge rules the web
     * app already has. Nothing here is new logic -- it is the same functions,
     * pinned by the same fixtures.
     */
    fun mergeCloud(local: DeskState, cloud: DeskState, now: () -> Long): DeskState {
        val puzzleIds = local.progress.keys + cloud.progress.keys
        val progress = puzzleIds.mapNotNull { id ->
            Merge.mergeProgress(local.progress[id], cloud.progress[id], now)?.let { id to it }
        }.toMap()

        val hintKeys = local.hints.keys + cloud.hints.keys
        val hints = hintKeys.mapNotNull { key ->
            val edition = key.toIntOrNull() ?: return@mapNotNull null
            key to Merge.mergeDailyHints(local.hints[key], cloud.hints[key], edition)
        }.toMap()

        val checkKeys = local.checks.keys + cloud.checks.keys
        val checks = checkKeys.mapNotNull { key ->
            val edition = key.toIntOrNull() ?: return@mapNotNull null
            key to Merge.mergeDailyHints(local.checks[key], cloud.checks[key], edition)
        }.toMap()

        return DeskState(
            progress = progress,
            hints = hints,
            checks = checks,
            solvedPuzzleIds = Merge.mergeSolvedIds(local.solvedPuzzleIds, cloud.solvedPuzzleIds),
            stats = Merge.mergeGameStats(local.stats, cloud.stats),
            updatedAt = maxOf(local.updatedAt, cloud.updatedAt),
        )
    }
}
