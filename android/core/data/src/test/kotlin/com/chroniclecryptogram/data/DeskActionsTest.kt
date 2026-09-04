package com.chroniclecryptogram.data

import com.chroniclecryptogram.cipher.Merge
import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import com.chroniclecryptogram.cipher.model.Wallets
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class DeskActionsTest {

    private val now = 1_700_000_000_000L

    @Test
    fun `saving a board clamps hostile values on the way in`() {
        val hostile = PuzzleProgress(
            mappings = (0 until 200).associate { "s$it" to "A" },
            timerSeconds = 1_000_000_000,
            hintsUsed = 999,
            hintsRemaining = -4,
            hintedSymbolIds = (0 until 40).map { "id$it" },
        )

        val saved = DeskActions.saveProgress(DeskState(), "day_1_easy", hostile, now)
        val stored = saved.progress.getValue("day_1_easy")

        assertEquals(80, stored.mappings.size, "mappings should clip to 80")
        assertEquals(86_400, stored.timerSeconds, "timer should clamp to a day")
        assertEquals(20, stored.hintsUsed)
        assertEquals(0, stored.hintsRemaining)
        assertEquals(26, stored.hintedSymbolIds.size, "symbol ids should clip to 26")
    }

    @Test
    fun `recording a solve is idempotent`() {
        var state = DeskActions.recordSolve(DeskState(), "day_1_easy", 120, now)
        assertEquals(listOf("day_1_easy"), state.solvedPuzzleIds)
        assertEquals(1, state.stats.puzzlesSolved)

        state = DeskActions.recordSolve(state, "day_1_easy", 90, now)
        assertEquals(1, state.solvedPuzzleIds.size, "a repeat solve must not duplicate")
        assertEquals(1, state.stats.puzzlesSolved, "a repeat solve must not inflate the count")
        assertEquals(120, state.stats.fastestTime, "a repeat solve must not improve the record")
    }

    @Test
    fun `the fastest time only improves`() {
        var state = DeskActions.recordSolve(DeskState(), "a", 120, now)
        state = DeskActions.recordSolve(state, "b", 300, now)
        assertEquals(120, state.stats.fastestTime)
        state = DeskActions.recordSolve(state, "c", 60, now)
        assertEquals(60, state.stats.fastestTime)
        assertEquals(480, state.stats.totalTimePlayed)
    }

    @Test
    fun `wallets default to a full allowance and are keyed by edition`() {
        val state = DeskState()
        assertEquals(Wallets.DAILY_HINTS, DeskActions.hintWallet(state, 4).remaining)
        assertEquals(Wallets.DAILY_CHECKS, DeskActions.checkWallet(state, 4).remaining)

        val spent = DeskActions.saveHintWallet(state, Merge.clipDailyWallet(4, 2.0), now)
        assertEquals(1, DeskActions.hintWallet(spent, 4).remaining)
        // A different edition has its own allowance -- that is the whole point of
        // keying by edition rather than by date.
        assertEquals(Wallets.DAILY_HINTS, DeskActions.hintWallet(spent, 5).remaining)
    }

    @Test
    fun `reconciling takes the larger of the stored wallet and what boards consumed`() {
        val puzzles = listOf("day_1_easy" to 1, "day_1_hard" to 1)
        val state = DeskState(
            progress = mapOf(
                "day_1_easy" to PuzzleProgress(hintsUsed = 2, hintedSymbolIds = listOf("a", "b")),
            ),
            // The stored wallet claims nothing was spent; the board disagrees.
            hints = mapOf("1" to DailyHintWallet(edition = 1, used = 0, remaining = 3)),
        )

        val reconciled = DeskActions.reconcileHints(state, 1, puzzles)
        assertEquals(2, reconciled.used, "the board's evidence should win")
        assertEquals(1, reconciled.remaining)
    }

    @Test
    fun `merging a cloud desk reuses the shared merge rules`() {
        val local = DeskState(
            progress = mapOf("a" to PuzzleProgress(timerSeconds = 30, updatedAt = 2000)),
            solvedPuzzleIds = listOf("a"),
            stats = GameStats(puzzlesSolved = 1, fastestTime = 30),
        )
        val cloud = DeskState(
            progress = mapOf(
                "a" to PuzzleProgress(timerSeconds = 90, updatedAt = 1000),
                "b" to PuzzleProgress(timerSeconds = 45),
            ),
            solvedPuzzleIds = listOf("b"),
            stats = GameStats(puzzlesSolved = 2, fastestTime = 45),
        )

        val merged = DeskActions.mergeCloud(local, cloud) { now }

        assertEquals(setOf("a", "b"), merged.progress.keys)
        assertEquals(30, merged.progress.getValue("a").timerSeconds, "newer stamp should win")
        assertEquals(listOf("a", "b"), merged.solvedPuzzleIds)
        assertEquals(2, merged.stats.puzzlesSolved, "cloud is further along")
        assertEquals(30, merged.stats.fastestTime, "the better record survives either side")
    }

    @Test
    fun `an empty desk round-trips through the serializer`() {
        val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
        val state = DeskState()
        assertEquals(state, json.decodeFromString<DeskState>(json.encodeToString(state)))
    }

    @Test
    fun `a populated desk round-trips through the serializer`() {
        val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
        val state = DeskActions.recordSolve(
            DeskActions.saveProgress(
                DeskState(),
                "day_1_easy",
                PuzzleProgress(mappings = mapOf("s1" to "E"), timerSeconds = 42),
                now,
            ),
            "day_1_easy",
            42,
            now,
        )
        val restored = json.decodeFromString<DeskState>(json.encodeToString(state))
        assertEquals(state, restored)
        assertEquals("E", restored.progress.getValue("day_1_easy").mappings["s1"])
    }

    @Test
    fun `an unknown field in a stored desk is ignored rather than fatal`() {
        // A save written by a newer build must not brick an older one.
        val json = Json { ignoreUnknownKeys = true }
        val fromFuture = """{"progress":{},"somethingNew":42,"solvedPuzzleIds":["a"]}"""
        val restored = json.decodeFromString<DeskState>(fromFuture)
        assertEquals(listOf("a"), restored.solvedPuzzleIds)
    }

    @Test
    fun `progress for an unknown puzzle is absent, not empty`() {
        assertNull(DeskActions.progressFor(DeskState(), "nope"))
    }

    @Test
    fun `starts are counted separately from solves`() {
        var state = DeskActions.recordStart(DeskState(), now)
        state = DeskActions.recordStart(state, now)
        assertEquals(2, state.stats.puzzlesPlayed)
        assertEquals(0, state.stats.puzzlesSolved)
        assertTrue(state.solvedPuzzleIds.isEmpty())
    }
}
