package com.chroniclecryptogram.cipher.model

import kotlinx.serialization.Serializable

/**
 * Per-puzzle save state, ported from `PuzzleProgress` in `src/types.ts`.
 *
 * [mappings] is symbol id -> guessed letter and must preserve insertion order:
 * `normalizeProgress` keeps only the first 80 keys, so a different order would
 * clip a different set.
 */
@Serializable
data class PuzzleProgress(
    val mappings: Map<String, String> = emptyMap(),
    val timerSeconds: Int = 0,
    val hintsUsed: Int = 0,
    val hintsRemaining: Int = Wallets.DAILY_HINTS,
    val hintedSymbolIds: List<String> = emptyList(),
    val checksUsed: Int = 0,
    val checksRemaining: Int = Wallets.DAILY_CHECKS,
    val verifiedSymbolIds: List<String> = emptyList(),
    val flaggedSymbolIds: List<String> = emptyList(),
    val selectedSymbolId: String? = null,
    val isSolved: Boolean = false,
    val updatedAt: Long? = null,
)

/** Ported from `GameStats` in `src/types.ts`. There is no streak field, by design. */
@Serializable
data class GameStats(
    val puzzlesPlayed: Int = 0,
    val puzzlesSolved: Int = 0,
    val fastestTime: Int? = null,
    val totalTimePlayed: Int = 0,
    val averageAccuracy: Int = 100,
    val leaderboardSubmissions: Int = 0,
)

/**
 * A hint or check allowance, ported from `DailyHintWallet`.
 *
 * Despite the "daily" name these are keyed by edition number, not by date: a
 * player can finish the whole season in one evening, so real-day keying would
 * hand out three hints for thirty editions.
 */
@Serializable
data class DailyHintWallet(
    val edition: Int,
    val used: Int,
    val remaining: Int,
)

object Wallets {
    const val DAILY_HINTS = 3
    const val DAILY_CHECKS = 3

    val defaultGameStats = GameStats()
}
